import axios from "axios";

interface Coin {
  address: string;
  decimals: number;
}

interface Pool {
  name: string;
  asset0: number;
  asset1: number;
  asset2?: number;
  asset3?: number;
  balance0: number;
  balance1: number;
  balance2?: number;
  balance3?: number;
  amp?: number;
}

interface PoolData {
  pools: Pool[];
  coins: Coin[];
}

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
      this.poolData = {
        pools: response.data.pools,
        coins: response.data.coins,
      };
      this.lastUpdated = currentTime;
    }
    return this.poolData!;
  }
}

export { PoolDataClient };
