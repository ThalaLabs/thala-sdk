import {
  calcOutGivenInStable,
  calcOutGivenInWeighted,
  calcInGivenOutStable,
  calcInGivenOutWeighted,
  calcPriceImpactPercentageStable,
  calcPriceImpactPercentageWeighted,
} from "@thalalabs/thalaswap-math";
import {
  Graph,
  Route,
  SwapPath,
  LiquidityPool,
  Distances,
  Predecessors,
} from "./types";

function calcOutGivenIn(
  amountIn: number,
  pool: LiquidityPool,
  fromIndex: number,
  toIndex: number,
): number {
  const { poolType, balances, swapFee, weights, amp } = pool;
  if (poolType === "Stable") {
    return calcOutGivenInStable(
      amountIn,
      fromIndex,
      toIndex,
      balances,
      amp as number,
      swapFee,
    );
  } else if (poolType === "Weighted") {
    const weightFrom = weights![fromIndex];
    const weightTo = weights![toIndex];
    return calcOutGivenInWeighted(
      balances[fromIndex],
      weightFrom,
      balances[toIndex],
      weightTo,
      amountIn,
      swapFee,
    );
  } else {
    throw new Error("Invalid pool type");
  }
}

function calcInGivenOut(
  amountOut: number,
  pool: LiquidityPool,
  fromIndex: number,
  toIndex: number,
): number {
  const { poolType, balances, swapFee, weights, amp } = pool;
  if (balances[toIndex] <= amountOut) {
    throw new Error("Insufficient balance");
  }

  if (poolType === "Stable") {
    return calcInGivenOutStable(
      amountOut,
      fromIndex,
      toIndex,
      balances,
      amp as number,
      swapFee,
    );
  } else if (poolType === "Weighted") {
    return calcInGivenOutWeighted(
      balances[fromIndex],
      weights![fromIndex],
      balances[toIndex],
      weights![toIndex],
      amountOut,
      swapFee,
    );
  } else {
    throw new Error("Invalid pool type");
  }
}

// amountIn and amountOut should not include fees
function calcPriceImpactPercentage(
  amountIn: number,
  amountOut: number,
  pool: LiquidityPool,
  fromIndex: number,
  toIndex: number,
): number {
  const { poolType, balances, weights, amp } = pool;
  if (poolType === "Stable") {
    return calcPriceImpactPercentageStable(
      amountIn,
      amountOut,
      fromIndex,
      toIndex,
      balances,
      amp as number,
    );
  } else if (poolType === "Weighted") {
    return calcPriceImpactPercentageWeighted(
      amountIn,
      amountOut,
      balances[fromIndex],
      balances[toIndex],
      weights![fromIndex],
      weights![toIndex],
    );
  } else {
    throw new Error("Invalid pool type");
  }
}

export function findRouteGivenExactInput(
  graph: Graph,
  startToken: string,
  endToken: string,
  amountIn: number,
  maxHops: number,
  maxAllowedSwapPercentage: number,
): Route | null {
  const tokens = Object.keys(graph);
  // distances[token][hop] is the maximum amount of token that can be received given hop number
  const distances: Distances = {};
  // predecessors[token][hop] is the previous hop of the optimal path
  const predecessors: Predecessors = {};

  const defaultDistance = -Infinity;
  for (const token of tokens) {
    distances[token] = {};
    predecessors[token] = {};
  }
  distances[startToken][0] = amountIn;

  for (let i = 0; i < maxHops; i++) {
    for (const [_, edges] of Object.entries(graph)) {
      for (const edge of edges) {
        const fromToken = edge.pool.coinAddresses[edge.fromIndex];
        const toToken = edge.pool.coinAddresses[edge.toIndex];
        if (fromToken === endToken || toToken === startToken) continue; // This prevents cycles

        if (distances[fromToken][i] === undefined) continue; // Skip unvisited nodes

        if (
          distances[fromToken][i] / edge.pool.balances[edge.fromIndex] >
          maxAllowedSwapPercentage
        )
          continue;

        const newDistance = calcOutGivenIn(
          distances[fromToken][i]!,
          edge.pool,
          edge.fromIndex,
          edge.toIndex,
        );

        const nextHop = i + 1;
        if (newDistance > (distances[toToken][nextHop] || defaultDistance)) {
          distances[toToken][nextHop] = newDistance;
          predecessors[toToken][nextHop] = {
            token: fromToken,
            pool: edge.pool,
          };
        }
      }
    }
  }

  // Find the best number of hops
  let maxDistance = -Infinity;
  let hops = 0;
  for (let i = 1; i <= maxHops; i++) {
    const distance = distances[endToken][i];
    if (distance && distance > maxDistance) {
      maxDistance = distance;
      hops = i;
    }
  }
  if (maxDistance === -Infinity) {
    console.error("No path found");
    return null;
  }

  // Reconstruct the path
  const path: SwapPath[] = [];
  let currentToken = endToken;
  while (hops > 0) {
    const { token, pool } = predecessors[currentToken]![hops]!;
    path.push({ from: token, to: currentToken, pool });
    currentToken = token;
    hops--;
  }

  path.reverse();

  // We use the maximum price impact of all path segments as the price impact of the entire route
  let priceImpactPercentage = 0;
  let currentAmountIn = amountIn;
  for (const pathSegment of path) {
    const fromIndex = pathSegment.pool.coinAddresses.indexOf(pathSegment.from);
    const toIndex = pathSegment.pool.coinAddresses.indexOf(pathSegment.to);
    const amoutOutNoFees = calcOutGivenIn(
      currentAmountIn,
      { ...pathSegment.pool, swapFee: 0 },
      fromIndex,
      toIndex,
    );
    const currentPriceImpact = calcPriceImpactPercentage(
      currentAmountIn,
      amoutOutNoFees,
      pathSegment.pool,
      fromIndex,
      toIndex,
    );
    if (currentPriceImpact > priceImpactPercentage) {
      priceImpactPercentage = currentPriceImpact;
    }
    currentAmountIn = amoutOutNoFees;
  }

  return {
    path,
    amountIn,
    amountOut: maxDistance,
    priceImpactPercentage,
    type: "exact_input",
  };
}

export function findRouteGivenExactOutput(
  graph: Graph,
  startToken: string,
  endToken: string,
  amountOut: number,
  maxHops: number,
  maxAllowedSwapPercentage: number,
): Route | null {
  const tokens = Object.keys(graph);
  const distances: Distances = {};
  const predecessors: Predecessors = {};

  const defaultDistance = Infinity;
  for (const token of tokens) {
    distances[token] = {};
    predecessors[token] = {};
  }
  distances[endToken][0] = amountOut;

  for (let i = 0; i < maxHops; i++) {
    for (const [_, edges] of Object.entries(graph)) {
      for (const edge of edges) {
        const fromToken = edge.pool.coinAddresses[edge.fromIndex];
        const toToken = edge.pool.coinAddresses[edge.toIndex];
        if (fromToken === endToken || toToken === startToken) continue; // This prevents cycles

        if (distances[toToken][i] === undefined) continue; // Skip unvisited nodes

        if (
          distances[toToken][i] / edge.pool.balances[edge.toIndex] >
          maxAllowedSwapPercentage
        )
          continue;

        try {
          const newDistance = calcInGivenOut(
            distances[toToken][i]!,
            edge.pool,
            edge.fromIndex,
            edge.toIndex,
          );

          const nextHop = i + 1;
          if (
            newDistance < (distances[fromToken][nextHop] || defaultDistance)
          ) {
            distances[fromToken][nextHop] = newDistance;
            predecessors[fromToken][nextHop] = {
              token: toToken,
              pool: edge.pool,
            };
          }
        } catch (error) {
          // If expected output amount is greater than pool balance, do not update distance
        }
      }
    }
  }

  // Find the best number of hops
  let minDistance = Infinity;
  let hops = 0;
  for (let i = 1; i <= maxHops; i++) {
    const distance = distances[startToken][i];
    if (distance && distance < minDistance) {
      minDistance = distance;
      hops = i;
    }
  }
  if (minDistance === Infinity) {
    console.error("No path found");
    return null;
  }

  // Reconstruct the path
  const path: SwapPath[] = [];
  let currentToken = startToken;
  while (hops > 0) {
    const { token, pool } = predecessors[currentToken]![hops]!;
    path.push({ from: currentToken, to: token, pool });
    currentToken = token;
    hops--;
  }

  // We use the maximum price impact of all path segments as the price impact of the entire route
  let priceImpactPercentage = 0;
  let currentAmountOut = amountOut;

  // reverse in place
  path.reverse();
  for (const pathSegment of path) {
    const fromIndex = pathSegment.pool.coinAddresses.indexOf(pathSegment.from);
    const toIndex = pathSegment.pool.coinAddresses.indexOf(pathSegment.to);
    const amoutInNoFees = calcInGivenOut(
      currentAmountOut,
      { ...pathSegment.pool, swapFee: 0 },
      fromIndex,
      toIndex,
    );
    const currentPriceImpact = calcPriceImpactPercentage(
      amoutInNoFees,
      currentAmountOut,
      pathSegment.pool,
      fromIndex,
      toIndex,
    );
    if (currentPriceImpact > priceImpactPercentage) {
      priceImpactPercentage = currentPriceImpact;
    }
    currentAmountOut = amoutInNoFees;
  }

  return {
    path: path.reverse(),
    amountIn: minDistance,
    amountOut,
    priceImpactPercentage,
    type: "exact_output",
  };
}
