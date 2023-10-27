import { findRouteGivenExactInput, findRouteGivenExactOutput } from "./router";
import { PoolDataClient } from "./PoolDataClient";
import { Graph, Route, AssetIndex, BalanceIndex, LiquidityPool } from "./types";
import { EntryPayload, createEntryPayload } from "@thalalabs/surf";
import { STABLE_POOL_SCRIPTS_ABI } from "./abi/stable_pool_scripts";
import { WEIGHTED_POOL_SCRIPTS_ABI } from "./abi/weighted_pool_scripts";
import { MULTIHOP_ROUTER_ABI } from "./abi/multihop_router";

const DEFAULT_SWAP_FEE_STABLE = 0.001;
const DEFAULT_SWAP_FEE_WEIGHTED = 0.003;

const NULL_TYPE = `${STABLE_POOL_SCRIPTS_ABI.address}::base_pool::Null`;
const NULL_4 = Array(4).fill(NULL_TYPE);

const encodeWeight = (weight: number): string => {
  return `${
    WEIGHTED_POOL_SCRIPTS_ABI.address
  }::weighted_pool::Weight_${Math.floor(weight * 100).toString()}`;
};

// Encode the pool type arguments for a given pool
// If extendStableArgs is true, then the stable pool type arguments will be extended to 8 arguments (filled with additional 4 nulls)
const encodePoolType = (
  pool: LiquidityPool,
  extendStableArgs?: boolean,
): string[] => {
  if (pool.poolType === "stable_pool") {
    const typeArgs = NULL_4.map((nullType, i) =>
      i < pool.coinAddresses.length ? pool.coinAddresses[i] : nullType,
    );
    return extendStableArgs ? typeArgs.concat(NULL_4) : typeArgs;
  } else {
    const typeArgsForCoins = NULL_4.map((nullType, i) =>
      i < pool.coinAddresses.length ? pool.coinAddresses[i] : nullType,
    );
    const typeArgsForWeights = NULL_4.map((nullType, i) =>
      i < pool.weights!.length ? encodeWeight(pool.weights![i]) : nullType,
    );
    return typeArgsForCoins.concat(typeArgsForWeights);
  }
};

const calcMinReceivedValue = (
  expectedAmountOut: number,
  slippage: number,
): number => expectedAmountOut * (1.0 - slippage / 100);

const calcMaxSoldValue = (expectedAmountIn: number, slippage: number): number =>
  expectedAmountIn * (1.0 + slippage / 100);

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

  encodeRoute(route: Route, slippagePercentage: number): EntryPayload {
    if (route.path.length < 1 || route.path.length > 3) {
      throw new Error("Invalid route");
    }

    const args =
      route.type === "exact_input"
        ? [
            route.amountIn,
            calcMinReceivedValue(route.amountOut, slippagePercentage),
          ]
        : [
            route.amountOut,
            calcMaxSoldValue(route.amountIn, slippagePercentage),
          ];
    if (route.path.length == 1) {
      const path = route.path[0];
      const functionName =
        route.type === "exact_input" ? "swap_exact_in" : "swap_exact_out";
      const abi =
        path.pool.poolType === "stable_pool"
          ? STABLE_POOL_SCRIPTS_ABI
          : WEIGHTED_POOL_SCRIPTS_ABI;
      const typeArgs = encodePoolType(path.pool, false).concat([
        path.from,
        path.to,
      ]);

      return createEntryPayload(abi, {
        function: functionName,
        type_arguments: typeArgs as any,
        arguments: args as [number, number],
      });
    } else if (route.path.length == 2) {
      const path0 = route.path[0];
      const path1 = route.path[1];
      const typeArgs = encodePoolType(path0.pool, true)
        .concat(encodePoolType(path1.pool, true))
        .concat([path0.from, path0.to, path1.to]);
      const functionName =
        route.type === "exact_input" ? "swap_exact_in_2" : "swap_exact_out_2";

      // TODO: remove any after ABI is ready
      return createEntryPayload(MULTIHOP_ROUTER_ABI as any, {
        function: functionName,
        type_arguments: typeArgs as any,
        arguments: args as any,
      });
    } else {
      // route.path.length == 3
      const path0 = route.path[0];
      const path1 = route.path[1];
      const path2 = route.path[2];
      const typeArgs = encodePoolType(path0.pool, true)
        .concat(encodePoolType(path1.pool, true))
        .concat(encodePoolType(path2.pool, true))
        .concat([path0.from, path0.to, path1.to, path2.to]);
      const functionName =
        route.type === "exact_input" ? "swap_exact_in_3" : "swap_exact_out_3";

      // TODO: remove any after ABI is ready
      return createEntryPayload(MULTIHOP_ROUTER_ABI as any, {
        function: functionName,
        type_arguments: typeArgs as any,
        arguments: args as any,
      });
    }
  }
}

export { ThalaswapRouter };
