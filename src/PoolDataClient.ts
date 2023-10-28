import axios from "axios";
import { Coin, RawPool, PoolData } from "./types";

class PoolDataClient {
  private poolData: PoolData | null = null;
  private lastUpdated: number = 0;
  private expiry = 10000; // 10 seconds
  private URL = "";

  constructor(dataURL: string) {
    this.URL = dataURL;
  }

  async getPoolData(): Promise<PoolData> {
    const currentTime = Date.now();
    if (!this.poolData || currentTime - this.lastUpdated > this.expiry) {
      const response = await axios.get(this.URL);

      // Convert the indices in the pools to the actual coin addresses
      const coins = response.data.coins as Coin[];
      const pools = response.data.pools.map((pool: RawPool) => {
        return {
          ...pool,
          asset0: coins[pool.asset0],
          asset1: coins[pool.asset1],
          asset2: pool.asset2 ? coins[pool.asset2] : undefined,
          asset3: pool.asset3 ? coins[pool.asset3] : undefined,
        };
      });

      this.poolData = {
        pools,
        coins,
      };
      this.lastUpdated = currentTime;
    }
    return this.poolData!;
  }
}

export { PoolDataClient };
