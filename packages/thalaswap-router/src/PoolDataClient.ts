import { Coin, Pool, PoolData } from "./types";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { uniq } from "lodash";
import {
  fp64ToFloat,
  parseLiquidityPoolType,
  parsePoolMetadata,
  scaleDown,
} from "./utils";
import { getV2AssetDecimals, getV2PoolsOnChain } from "./getAllV2Pools";
import { createViewPayload } from "@thalalabs/surf";
import { COIN_ABI } from "./abi/coin";
import { FUNGIBLE_ASSET_ABI } from "./abi/fungible_asset";

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
  private v1CoinsInitialized = false;
  private v2CoinsInitialized = false;
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

    if (!this.v1CoinsInitialized) {
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
                payload: createViewPayload(COIN_ABI, {
                  function: "decimals",
                  functionArguments: [],
                  typeArguments: [address as `${string}::${string}::${string}`],
                }),
              })
            )[0] as number,
          };
          this.coins.push(coin);
        }),
      );

      this.v1CoinsInitialized = true;
    }

    const pools = poolResources.reduce((acc, resource) => {
      try {
        const metadata = parsePoolMetadata(resource.type, resourceAddress);
        const [coin0, coin1, coin2, coin3] = metadata.coinAddresses.map(
          (addr) => this.coins.find((c) => c.address === addr),
        );

        // if the v2 pool has invalid assets, skip it, it should not happen
        if (
          [coin0, coin1, coin2, coin3].filter(Boolean).length !==
          metadata.coinAddresses.length
        ) {
          console.error(
            "Pool asset not found in coins",
            resource.type,
            metadata.coinAddresses,
          );
          return acc;
        }

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

    const rawPools = await getV2PoolsOnChain(this.client, this.v2LensAddress);

    if (!this.v2CoinsInitialized) {
      // get coins data
      const coins = await getV2AssetDecimals(this.client, this.v2LensAddress);
      coins.forEach((coin) => {
        if (this.coins.find((c) => c.address === coin.address)) return;
        this.coins.push(coin);
      });
      this.v2CoinsInitialized = true;
    }

    const allCoinAddress = uniq(
      rawPools.reduce((acc, pool) => {
        pool.assets_metadata.forEach((o) => acc.push(o.inner));
        return acc;
      }, [] as string[]),
    );

    // some coins may still missing, even if v2 coins are initialized
    // fetch them here
    await Promise.all(
      allCoinAddress.map(async (address) => {
        if (this.coins.find((c) => c.address === address)) return;
        const coin = {
          address,
          decimals: (
            await this.client.view({
              payload: createViewPayload(FUNGIBLE_ASSET_ABI, {
                function: "decimals",
                functionArguments: [address as `0x${string}`],
                typeArguments: ["0x1::fungible_asset::Metadata"],
              }),
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

      if (
        [coin0, coin1, coin2, coin3, coin4, coin5].filter(Boolean).length !==
        pool.assets_metadata.length
      ) {
        throw new Error("Pool has invalid assets");
      }

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
