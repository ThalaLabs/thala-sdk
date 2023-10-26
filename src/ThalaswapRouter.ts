import { findRouteGivenExactInput, findRouteGivenExactOutput } from "./router";
import { PoolDataClient } from "./PoolDataClient";
import { Graph, Route, AssetIndex, BalanceIndex } from "./types";

const DEFAULT_SWAP_FEE_STABLE = 0.001;
const DEFAULT_SWAP_FEE_WEIGHTED = 0.003;

class ThalaswapRouter {
  private client: PoolDataClient;
  private graph: Graph | null = null;

  constructor(dataURL: string) {
    this.client = new PoolDataClient(dataURL);
  }

  setPoolDataClient(client: PoolDataClient) {
    this.client = client;
  }

  async refreshData() {
    const poolData = await this.client.getPoolData();
    const pools = poolData.pools;
    this.graph = await this.buildGraph(pools);
  }

  parseWeightsFromPoolName(poolName: string): number[] {
    const weights: number[] = [];

    const tokenWeightPairs = poolName.split(":");

    // Iterate over each token-weight pair except the first one (which is just 'W' or 'S')
    for (const pair of tokenWeightPairs.slice(1)) {
      const parts = pair.split("-");
      if (parts.length === 2) {
        const weight = parseInt(parts[1], 10);
        if (!isNaN(weight)) {
          weights.push(weight / 100);
        } else {
          throw new Error("Invalid weight in pool name");
        }
      } else {
        throw new Error("Invalid token-weight pair in pool name: " + poolName);
      }
    }

    return weights;
  }

  async buildGraph(pools: any[]): Promise<Graph> {
    const tokens: Set<string> = new Set();
    const graph: Graph = {};

    for (const pool of pools) {
      const assets = ["asset0", "asset1", "asset2", "asset3"]
        .map((a) => pool[a as AssetIndex])
        .filter((a) => a !== undefined);

      const balances = ["balance0", "balance1", "balance2", "balance3"]
        .filter((b, i) => assets[i])
        .map((b) => pool[b as BalanceIndex] as number);

      for (let i = 0; i < assets.length; i++) {
        tokens.add(assets[i].address);
        for (let j = 0; j < assets.length; j++) {
          if (i !== j) {
            if (!graph[assets[i].address]) graph[assets[i].address] = [];
            const poolType =
              pool.name[0] === "S" ? "stable_pool" : "weighted_pool";
            const swapFee =
              poolType === "stable_pool"
                ? DEFAULT_SWAP_FEE_STABLE
                : DEFAULT_SWAP_FEE_WEIGHTED;

            const weights =
              poolType === "weighted_pool"
                ? this.parseWeightsFromPoolName(pool.name)
                : undefined;

            graph[assets[i].address].push({
              pool: {
                coinAddresses: assets.map((a) => a.address),
                balances,
                poolType,
                swapFee,
                weights,
                amp: pool.amp,
              },
              fromIndex: i,
              toIndex: j,
            });
          }
        }
      }
    }

    return graph;
  }

  async getRouteGivenExactInput(
    startToken: string,
    endToken: string,
    amountIn: number,
    maxHops = 3,
  ): Promise<Route | null> {
    await this.refreshData();

    if (!this.graph) {
      console.error("Failed to load pools");
      return null;
    }

    return findRouteGivenExactInput(
      this.graph,
      startToken,
      endToken,
      amountIn,
      maxHops,
    );
  }

  async getRouteGivenExactOutput(
    startToken: string,
    endToken: string,
    amountOut: number,
    maxHops = 3,
  ): Promise<Route | null> {
    await this.refreshData();

    if (!this.graph) {
      console.error("Failed to load pools");
      return null;
    }

    return findRouteGivenExactOutput(
      this.graph,
      startToken,
      endToken,
      amountOut,
      maxHops,
    );
  }
}

export { ThalaswapRouter };
