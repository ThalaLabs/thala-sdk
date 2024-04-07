import { Coin, Pool, PoolData } from "./types";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { THALASWAP_RESOURCE_ACCOUNT_ADDRESS } from "./constants";
import { uniq } from "lodash";
import { parsePoolMetadata, scaleDown } from "./utils";

class PoolDataClient {
  private poolData: PoolData | null = null;
  private lastUpdated: number = 0;
  private expiry = 10000; // 10 seconds
  private retryLimit = 3;
  private client: Aptos;
  private coins: Coin[] = [];

  constructor(aptosRpc: string) {
    this.client = new Aptos(
      new AptosConfig({
        network: Network.MAINNET,
        fullnode: aptosRpc,
      }),
    );
  }

  async getPoolData(): Promise<PoolData> {
    const currentTime = Date.now();
    if (!this.poolData || currentTime - this.lastUpdated > this.expiry) {
      for (let i = 0; i < this.retryLimit; i++) {
        try {
          const resources = (
            await this.client.getAccountResources({
              accountAddress: THALASWAP_RESOURCE_ACCOUNT_ADDRESS,
            })
          ).filter(
            (r) =>
              r.type.startsWith(
                `${THALASWAP_RESOURCE_ACCOUNT_ADDRESS}::weighted_pool::WeightedPool<`,
              ) ||
              r.type.startsWith(
                `${THALASWAP_RESOURCE_ACCOUNT_ADDRESS}::stable_pool::StablePool<`,
              ),
          ) as {
            type: string;
            data: {
              asset_0: { value: string };
              asset_1: { value: string };
              asset_2: { value: string };
              asset_3: { value: string };
              amp_factor?: string;
            };
          }[];

          const allCoinAddress = uniq(
            resources.reduce((acc, resource) => {
              const metadata = parsePoolMetadata(resource.type);
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

          const pools = resources.reduce((acc, resource) => {
            const metadata = parsePoolMetadata(resource.type);
            const [coin0, coin1, coin2, coin3] = metadata.coinAddresses.map(
              (addr) => this.coins.find((c) => c.address === addr),
            );

            acc.push({
              weights: metadata.weights.map((w) => Number(w) / 100),
              poolType: metadata.poolType,
              amp: resource.data.amp_factor
                ? Number(resource.data.amp_factor)
                : undefined,
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
            });
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
