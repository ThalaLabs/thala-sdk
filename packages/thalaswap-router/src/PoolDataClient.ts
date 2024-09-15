import { Coin, Pool, PoolData } from "./types";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { uniq } from "lodash";
import { fp64ToFloat, parsePoolMetadata, scaleDown } from "./utils";

class PoolDataClient {
  public poolData: PoolData | null = null;
  private lastUpdated: number = 0;
  private expiry = 10000; // 10 seconds
  private retryLimit = 3;
  private client: Aptos;
  private coins: Coin[] = [];
  private resourceAddress: string;

  constructor(network: Network, fullnode: string, resourceAddress: string) {
    this.resourceAddress = resourceAddress;

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
          const resources = await this.client.getAccountResources({
            accountAddress: this.resourceAddress,
          });

          const poolResources = resources.filter(
            (r) =>
              r.type.startsWith(
                `${this.resourceAddress}::weighted_pool::WeightedPool<`,
              ) ||
              r.type.startsWith(
                `${this.resourceAddress}::stable_pool::StablePool<`,
              ),
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
              const metadata = parsePoolMetadata(
                resource.type,
                this.resourceAddress,
              );
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
                      typeArguments: [
                        address as `${string}::${string}::${string}`,
                      ],
                    },
                  })
                )[0] as number,
              };
              this.coins.push(coin);
            }),
          );

          const pools = poolResources.reduce((acc, resource) => {
            try {
              const metadata = parsePoolMetadata(
                resource.type,
                this.resourceAddress,
              );
              const [coin0, coin1, coin2, coin3] = metadata.coinAddresses.map(
                (addr) => this.coins.find((c) => c.address === addr),
              );

              acc.push({
                type: metadata.type,
                weights: metadata.weights.map((w) => Number(w) / 100),
                poolType: metadata.poolType,
                amp: resource.data.amp_factor
                  ? Number(resource.data.amp_factor)
                  : undefined,
                asset0: coin0!,
                asset1: coin1!,
                asset2: coin2,
                asset3: coin3,
                balance0: scaleDown(
                  resource.data.asset_0.value,
                  coin0!.decimals,
                ),
                balance1: scaleDown(
                  resource.data.asset_1.value,
                  coin1!.decimals,
                ),
                balance2: coin2
                  ? scaleDown(resource.data.asset_2.value, coin2.decimals)
                  : undefined,
                balance3: coin3
                  ? scaleDown(resource.data.asset_3.value, coin3.decimals)
                  : undefined,
                swapFee: fp64ToFloat(BigInt(resource.data.swap_fee_ratio.v)),
              });
            } catch (e) {
              console.error("failed to add pool", resource.type, e);
            }
            return acc;
          }, [] as Pool[]);

          this.poolData = {
            pools,
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
}

export { PoolDataClient };
