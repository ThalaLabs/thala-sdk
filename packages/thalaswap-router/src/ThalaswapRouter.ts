import { findRouteGivenExactInput, findRouteGivenExactOutput } from "./router";
import { PoolDataClient } from "./PoolDataClient";
import {
  Coin,
  Graph,
  Route,
  AssetIndex,
  BalanceIndex,
  LiquidityPool,
  Pool,
} from "./types";
import { EntryPayload, createEntryPayload } from "@thalalabs/surf";
import { STABLE_POOL_SCRIPTS_ABI } from "./abi/stable_pool_scripts";
import { WEIGHTED_POOL_SCRIPTS_ABI } from "./abi/weighted_pool_scripts";
import { MULTIHOP_ROUTER_ABI } from "./abi/multihop_router";
import { Network } from "@aptos-labs/ts-sdk";

const encodeWeight = (weight: number): string => {
  return `${
    WEIGHTED_POOL_SCRIPTS_ABI.address
  }::weighted_pool::Weight_${Math.floor(weight * 100).toString()}`;
};

// Encode the pool type arguments for a given pool
// If extendStableArgs is true, then the stable pool type arguments will be extended to 8 arguments (filled with additional 4 nulls)
const encodePoolType = (
  pool: LiquidityPool,
  extendStableArgs: boolean,
  resourceAddress: string,
): string[] => {
  const NULL_TYPE = `${resourceAddress}::base_pool::Null`;
  const NULL_4 = Array(4).fill(NULL_TYPE);

  if (pool.poolType === "Stable") {
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

const scaleUp = (amount: number, decimals: number): number => {
  return Math.floor(amount * Math.pow(10, decimals));
};

class ThalaswapRouter {
  private client: PoolDataClient;
  private graph: Graph | null = null;
  private coins: Coin[] | null = null;
  private resourceAddress: string;
  private multirouterAddress: string;

  constructor(
    network: Network,
    fullnode: string,
    resourceAddress: string,
    multirouterAddress: string,
  ) {
    this.resourceAddress = resourceAddress;
    this.multirouterAddress = multirouterAddress;
    this.client = new PoolDataClient(network, fullnode, resourceAddress);
  }

  setPoolDataClient(client: PoolDataClient) {
    this.client = client;
  }

  async refreshData() {
    const poolData = await this.client.getPoolData();
    const pools = poolData.pools;
    this.coins = poolData.coins;
    this.graph = await this.buildGraph(pools);
  }

  async buildGraph(pools: Pool[]): Promise<Graph> {
    const tokens: Set<string> = new Set();
    const graph: Graph = {};

    for (const pool of pools) {
      // Convert pool data to LiquidityPool type
      const assets = ["asset0", "asset1", "asset2", "asset3"]
        .filter((a) => pool[a as AssetIndex])
        .map((a) => pool[a as AssetIndex]!);

      const balances = ["balance0", "balance1", "balance2", "balance3"]
        .filter((b, i) => assets[i])
        .map((b) => pool[b as BalanceIndex] as number);

      const weights = pool.poolType === "Weighted" ? pool.weights! : undefined;

      const amp = pool.poolType === "Stable" ? pool.amp! : undefined;

      const convertedPool: LiquidityPool = {
        coinAddresses: assets.map((a) => a.address),
        balances,
        poolType: pool.poolType,
        swapFee: pool.swapFee,
        weights,
        amp,
      };

      for (let i = 0; i < assets.length; i++) {
        const token = assets[i].address;
        tokens.add(token);
        for (let j = 0; j < assets.length; j++) {
          if (i !== j) {
            if (!graph[token]) graph[token] = [];

            graph[token].push({
              pool: convertedPool,
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
    maxHops: number = 3,
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
    maxHops: number = 3,
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

  // balanceCoinIn is the user's balance of input coin. If it's specified, this function will check
  // (1) for exact-in type of swap, throw an error if the user doesn't have enough balance to perform the swap.
  // (2) for exact-out type of swap, the maximum input amount is limited by the user's balance.
  encodeRoute(
    route: Route,
    slippagePercentage: number,
    balanceCoinIn?: number,
  ): EntryPayload {
    if (route.path.length === 0 || route.path.length > 3) {
      throw new Error("Invalid route");
    }

    const tokenInDecimals = this.coins!.find(
      (coin) => coin.address === route.path[0].from,
    )!.decimals;
    const tokenOutDecimals = this.coins!.find(
      (coin) => coin.address === route.path[route.path.length - 1].to,
    )!.decimals;
    let amountInArg: number;
    let amountOutArg: number;
    if (route.type === "exact_input") {
      if (balanceCoinIn !== undefined && balanceCoinIn < route.amountIn) {
        throw new Error("Insufficient balance");
      }
      amountInArg = scaleUp(route.amountIn, tokenInDecimals);
      amountOutArg = scaleUp(
        calcMinReceivedValue(route.amountOut, slippagePercentage),
        tokenOutDecimals,
      );
    } else {
      const maxSoldValueAfterSlippage = calcMaxSoldValue(
        route.amountIn,
        slippagePercentage,
      );
      amountInArg = scaleUp(
        balanceCoinIn !== undefined
          ? Math.min(balanceCoinIn, maxSoldValueAfterSlippage)
          : maxSoldValueAfterSlippage,
        tokenInDecimals,
      );
      amountOutArg = scaleUp(route.amountOut, tokenOutDecimals);
    }
    if (route.path.length == 1) {
      const path = route.path[0];
      const functionName =
        route.type === "exact_input" ? "swap_exact_in" : "swap_exact_out";
      const abi =
        path.pool.poolType === "Stable"
          ? STABLE_POOL_SCRIPTS_ABI
          : WEIGHTED_POOL_SCRIPTS_ABI;
      const typeArgs = encodePoolType(
        path.pool,
        false,
        this.resourceAddress,
      ).concat([path.from, path.to]);

      return createEntryPayload(abi, {
        function: functionName,
        typeArguments: typeArgs as any,
        functionArguments: [amountInArg, amountOutArg],
        address: this.resourceAddress as `0x${string}`,
      });
    } else if (route.path.length == 2) {
      const path0 = route.path[0];
      const path1 = route.path[1];
      const typeArgs = encodePoolType(path0.pool, true, this.resourceAddress)
        .concat(encodePoolType(path1.pool, true, this.resourceAddress))
        .concat([path0.from, path0.to, path1.to]);
      const functionName =
        route.type === "exact_input" ? "swap_exact_in_2" : "swap_exact_out_2";

      return createEntryPayload(MULTIHOP_ROUTER_ABI, {
        function: functionName,
        typeArguments: typeArgs as any,
        functionArguments: [amountInArg, amountOutArg],
        address: this.multirouterAddress as `0x${string}`,
      });
    } else {
      // route.path.length == 3
      const path0 = route.path[0];
      const path1 = route.path[1];
      const path2 = route.path[2];
      const typeArgs = encodePoolType(path0.pool, true, this.resourceAddress)
        .concat(encodePoolType(path1.pool, true, this.resourceAddress))
        .concat(encodePoolType(path2.pool, true, this.resourceAddress))
        .concat([path0.from, path0.to, path1.to, path2.to]);
      const functionName =
        route.type === "exact_input" ? "swap_exact_in_3" : "swap_exact_out_3";

      return createEntryPayload(MULTIHOP_ROUTER_ABI, {
        function: functionName,
        typeArguments: typeArgs as any,
        functionArguments: [amountInArg, amountOutArg],
        address: this.multirouterAddress as `0x${string}`,
      });
    }
  }
}

export { ThalaswapRouter };
