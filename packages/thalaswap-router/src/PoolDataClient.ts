import { Coin, Pool, PoolData } from "./types";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { uniq } from "lodash";
import {
  fp64ToFloat,
  parseLiquidityPoolType,
  parsePoolMetadata,
  scaleDown,
} from "./utils";

class PoolDataClient {
  public poolData: PoolData | null = null;
  public client: Aptos;
  private lastUpdated: number = 0;
  private expiry = 10000; // 10 seconds
  private retryLimit = 3;
  private coins: Coin[] = [];
  private resourceAddress?: string;
  private v2ResourceAddress?: string;
  private v2LensAddress?: string;
  constructor({
    network,
    fullnode,
    resourceAddress,
    v2ResourceAddress,
    v2LensAddress,
  }: {
    network: Network;
    fullnode: string;
    resourceAddress?: string;
    v2ResourceAddress?: string;
    v2LensAddress?: string;
  }) {
    this.resourceAddress = resourceAddress;
    this.v2ResourceAddress = v2ResourceAddress;
    this.v2LensAddress = v2LensAddress;
    this.client = new Aptos(
      new AptosConfig({
        network: network,
        fullnode: fullnode,
      }),
    );
  }

  async getPoolData(): Promise<PoolData> {
    const currentTime = Date.now();
    if (!this.poolData || currentTime - this.lastUpdated > this.expiry) {
      for (let i = 0; i < this.retryLimit; i++) {
        try {
          const v1pools = await this.getV1Pools();
          const v2pools = await this.getV2Pools();
          this.poolData = {
            pools: [...v1pools, ...v2pools],
            coins: this.coins,
          };
          this.lastUpdated = currentTime;
          return this.poolData;
        } catch (error) {
          console.error("Failed to get pool data:", error);
          if (i < this.retryLimit - 1) {
            console.log("Retrying...");
          } else {
            console.log("Failed after retrying.");
            throw error;
          }
        }
      }
    }
    return this.poolData!;
  }

  // fetch all v1 pools, and will update this.coins if there are new coins
  async getV1Pools(): Promise<Pool[]> {
    const resourceAddress = this.resourceAddress;
    if (!resourceAddress) {
      return [];
    }

    const resources = await this.client.getAccountResources({
      accountAddress: resourceAddress,
      options: {
        // the default limit is 999, the thala account has 1000+ resources
        limit: 10000,
      },
    });

    const poolResources = resources.filter(
      (r) =>
        r.type.startsWith(
          `${this.resourceAddress}::weighted_pool::WeightedPool<`,
        ) ||
        r.type.startsWith(`${this.resourceAddress}::stable_pool::StablePool<`),
    ) as {
      type: string;
      data: {
        asset_0: { value: string };
        asset_1: { value: string };
        asset_2: { value: string };
        asset_3: { value: string };
        amp_factor?: string;
        swap_fee_ratio: { v: string };
      };
    }[];

    const allCoinAddress = uniq(
      poolResources.reduce((acc, resource) => {
        const metadata = parsePoolMetadata(resource.type, resourceAddress);
        metadata.coinAddresses.forEach((coin) => {
          coin && acc.push(coin);
        });
        return acc;
      }, [] as string[]),
    );

    await Promise.all(
      allCoinAddress.map(async (address) => {
        if (this.coins.find((c) => c.address === address)) return;
        const coin = {
          address,
          decimals: (
            await this.client.view({
              payload: {
                function: "0x1::coin::decimals",
                functionArguments: [],
                typeArguments: [address as `${string}::${string}::${string}`],
              },
            })
          )[0] as number,
        };
        this.coins.push(coin);
      }),
    );

    const pools = poolResources.reduce((acc, resource) => {
      try {
        const metadata = parsePoolMetadata(resource.type, resourceAddress);
        const [coin0, coin1, coin2, coin3] = metadata.coinAddresses.map(
          (addr) => this.coins.find((c) => c.address === addr),
        );

        acc.push({
          type: metadata.type,
          weights: metadata.weights.map((w) => Number(w) / 100),
          poolType: metadata.poolType,
          lptAddress: this.getLpCoinType(metadata.type),
          amp: resource.data.amp_factor
            ? Number(resource.data.amp_factor)
            : undefined,
          rates: [],
          asset0: coin0!,
          asset1: coin1!,
          asset2: coin2,
          asset3: coin3,
          balance0: scaleDown(resource.data.asset_0.value, coin0!.decimals),
          balance1: scaleDown(resource.data.asset_1.value, coin1!.decimals),
          balance2: coin2
            ? scaleDown(resource.data.asset_2.value, coin2.decimals)
            : undefined,
          balance3: coin3
            ? scaleDown(resource.data.asset_3.value, coin3.decimals)
            : undefined,
          swapFee: fp64ToFloat(BigInt(resource.data.swap_fee_ratio.v)),
          isV2: false,
        });
      } catch (e) {
        console.error("failed to add pool", resource.type, e);
      }
      return acc;
    }, [] as Pool[]);

    return pools;
  }

  async getV2Pools(): Promise<Pool[]> {
    if (!this.v2ResourceAddress || !this.v2LensAddress) {
      return [];
    }

    const result = await this.client.view({
      payload: {
        function: `${this.v2LensAddress}::lens::get_all_pools_info`,
        functionArguments: [],
        typeArguments: [],
      },
    });

    const rawPools = result[0] as {
      amp_factor_opt: { vec: [string] | [] };
      assets_metadata: { inner: string }[];
      balances: string[];
      pool: { inner: string };
      pool_type: 100 | 101 | 102;
      swap_fee_bps: string;
      weights_opt: { vec: string[][] | [] };
      lp_token_metadata: { inner: string };
      rates_opt?: { vec: string[][] | [] };
    }[];

    const allCoinAddress = uniq(
      rawPools.reduce((acc, pool) => {
        pool.assets_metadata.forEach((o) => acc.push(o.inner));
        return acc;
      }, [] as string[]),
    );

    await Promise.all(
      allCoinAddress.map(async (address) => {
        if (this.coins.find((c) => c.address === address)) return;
        const coin = {
          address,
          decimals: (
            await this.client.view({
              payload: {
                function: "0x1::fungible_asset::decimals",
                functionArguments: [address],
                typeArguments: ["0x1::fungible_asset::Metadata"],
              },
            })
          )[0] as number,
        };
        this.coins.push(coin);
      }),
    );

    return rawPools.map<Pool>((pool) => {
      const [coin0, coin1, coin2, coin3, coin4, coin5] =
        pool.assets_metadata.map((o) =>
          this.coins.find((c) => c.address === o.inner),
        );
      return {
        poolType:
          pool.pool_type === 100
            ? "Stable"
            : pool.pool_type === 101
              ? "Weighted"
              : "Metastable",
        type: pool.pool.inner,
        weights: pool.weights_opt.vec[0]?.map((w) => Number(w) / 100) ?? [],
        lptAddress: pool.lp_token_metadata.inner,
        rates: pool.rates_opt?.vec[0]?.map((r) => fp64ToFloat(BigInt(r))) ?? [],
        amp:
          pool.amp_factor_opt.vec.length === 0
            ? undefined
            : Number(pool.amp_factor_opt.vec[0]),
        asset0: coin0!,
        asset1: coin1!,
        asset2: coin2,
        asset3: coin3,
        asset4: coin4,
        asset5: coin5,
        balance0: scaleDown(pool.balances[0], coin0!.decimals),
        balance1: scaleDown(pool.balances[1], coin1!.decimals),
        balance2:
          pool.balances.length > 2
            ? scaleDown(pool.balances[2], coin2!.decimals)
            : undefined,
        balance3:
          pool.balances.length > 3
            ? scaleDown(pool.balances[3], coin3!.decimals)
            : undefined,
        balance4:
          pool.balances.length > 4
            ? scaleDown(pool.balances[4], coin4!.decimals)
            : undefined,
        balance5:
          pool.balances.length > 5
            ? scaleDown(pool.balances[5], coin5!.decimals)
            : undefined,
        swapFee: Number(pool.swap_fee_bps) / 10000,
        isV2: true,
      };
    });
  }

  getLpCoinType(poolType: string): string {
    const [liquidityPoolType, typeArgs] = parseLiquidityPoolType(
      poolType,
      this.resourceAddress!,
    );
    if (liquidityPoolType === "Weighted") {
      return `${this.resourceAddress}::weighted_pool::WeightedPoolToken<${typeArgs.join(
        ", ",
      )}>`;
    }
    return `${this.resourceAddress}::stable_pool::StablePoolToken<${typeArgs.join(
      ", ",
    )}>`;
  }
}

export { PoolDataClient };
