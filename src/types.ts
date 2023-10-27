type Edge = {
  pool: LiquidityPool;
  fromIndex: number;
  toIndex: number;
};

type SwapPath = {
  from: string;
  to: string;
  pool: LiquidityPool;
};

type Route = {
  path: SwapPath[];
  amountIn: number;
  amountOut: number;
  priceImpactPercentage: number;
  type: RouteType;
};

type LiquidityPool = {
  coinAddresses: string[];
  balances: number[];
  poolType: PoolType;
  swapFee: number;
  weights?: number[];
  amp?: number;
};

type RouteType = "exact_input" | "exact_output";
type PoolType = "stable_pool" | "weighted_pool";
type Graph = Record<string, Edge[]>;
type Distances = Record<string, number>;
type Predecessors = Record<
  string,
  { token: string; pool: LiquidityPool } | null
>;
type Hops = Record<string, number>;

type AssetIndex = "asset0" | "asset1" | "asset2" | "asset3";
type BalanceIndex = "balance0" | "balance1" | "balance2" | "balance3";

export type {
  Edge,
  SwapPath,
  Route,
  LiquidityPool,
  Graph,
  Distances,
  Predecessors,
  Hops,
  PoolType,
  AssetIndex,
  BalanceIndex,
};
