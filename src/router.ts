import {
  calcOutGivenInStable,
  calcOutGivenInWeighted,
  calcInGivenOutStable,
  calcInGivenOutWeighted,
  calcPriceImpactPercentageStable,
  calcPriceImpactPercentageWeighted,
} from "./swapMath";
import {
  Graph,
  Route,
  SwapPath,
  LiquidityPool,
  Distances,
  Predecessors,
  Hops,
} from "./types";

function calcOutGivenIn(
  amountIn: number,
  pool: LiquidityPool,
  fromIndex: number,
  toIndex: number,
): number {
  const { poolType, balances, swapFee, weights, amp } = pool;
  if (poolType === "stable_pool") {
    return calcOutGivenInStable(
      amountIn,
      fromIndex,
      toIndex,
      balances,
      amp as number,
      swapFee,
    );
  } else if (poolType === "weighted_pool") {
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

  if (poolType === "stable_pool") {
    return calcInGivenOutStable(
      amountOut,
      fromIndex,
      toIndex,
      balances,
      amp as number,
      swapFee,
    );
  } else if (poolType === "weighted_pool") {
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
  const { poolType, balances, swapFee, weights, amp } = pool;
  if (poolType === "stable_pool") {
    return calcPriceImpactPercentageStable(
      amountIn,
      amountOut,
      fromIndex,
      toIndex,
      balances,
      amp as number,
    );
  } else if (poolType === "weighted_pool") {
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
  maxHops = 3,
): Route | null {
  const tokens = Object.keys(graph);
  let distances: Distances = {};
  let predecessors: Predecessors = {};
  let hops: Hops = {};

  for (const token of tokens) {
    distances[token] = -Infinity;
    predecessors[token] = null;
    hops[token] = 0;
  }
  distances[startToken] = amountIn;

  for (let i = 0; i < maxHops; i++) {
    const newDistances = { ...distances };
    const newPredecessors = { ...predecessors };
    const newHops = { ...hops };

    for (const [token, edges] of Object.entries(graph)) {
      for (const edge of edges) {
        const fromToken = edge.pool.coinAddresses[edge.fromIndex];
        // Skip if fromToken is the endToken. This prevents cycles.
        if (fromToken === endToken) continue;

        const toToken = edge.pool.coinAddresses[edge.toIndex];
        if (distances[fromToken] !== -Infinity) {
          const newDistance = calcOutGivenIn(
            distances[fromToken],
            edge.pool,
            edge.fromIndex,
            edge.toIndex,
          );

          if (
            newDistance > newDistances[toToken] &&
            newHops[fromToken] + 1 <= maxHops
          ) {
            newDistances[toToken] = newDistance;
            newPredecessors[toToken] = { token: fromToken, pool: edge.pool };
            newHops[toToken] = newHops[fromToken] + 1;
          }
        }
      }
    }

    distances = newDistances;
    predecessors = newPredecessors;
    hops = newHops;
  }

  const path: SwapPath[] = [];
  let currentToken = endToken;

  while (currentToken !== startToken) {
    if (predecessors[currentToken] === null) {
      console.error("No path found");
      break;
    }

    const { token, pool } = predecessors[currentToken]!;
    path.push({ from: token, to: currentToken, pool });
    currentToken = token;
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
    amountOut: distances[endToken],
    priceImpactPercentage,
    type: "exact_input",
  };
}

export function findRouteGivenExactOutput(
  graph: Graph,
  startToken: string,
  endToken: string,
  amountOut: number,
  maxHops = 3,
): Route | null {
  const tokens = Object.keys(graph);
  let distances: Distances = {};
  let predecessors: Predecessors = {};
  let hops: Hops = {};

  for (const token of tokens) {
    distances[token] = Infinity;
    predecessors[token] = null;
    hops[token] = 0;
  }
  distances[endToken] = amountOut;

  for (let i = 0; i < maxHops; i++) {
    const newDistances = { ...distances };
    const newPredecessors = { ...predecessors };
    const newHops = { ...hops };

    for (const [token, edges] of Object.entries(graph)) {
      for (const edge of edges) {
        const fromToken = edge.pool.coinAddresses[edge.fromIndex];
        const toToken = edge.pool.coinAddresses[edge.toIndex];

        // Skip if toToken is the startToken. This prevents cycles.
        if (toToken === startToken) continue;

        if (distances[toToken] !== Infinity) {
          try {
            const newDistance = calcInGivenOut(
              distances[toToken],
              edge.pool,
              edge.fromIndex,
              edge.toIndex,
            );

            if (
              newDistance < newDistances[fromToken] &&
              newHops[toToken] + 1 <= maxHops
            ) {
              newDistances[fromToken] = newDistance;
              newPredecessors[fromToken] = { token: toToken, pool: edge.pool };
              newHops[fromToken] = newHops[toToken] + 1;
            }
          } catch (error) {
            // If expected output amount is greater than pool balance, do not update distance
          }
        }
      }
    }

    distances = newDistances;
    predecessors = newPredecessors;
    hops = newHops;
  }

  const path: SwapPath[] = [];
  let currentToken = startToken;

  while (currentToken !== endToken) {
    if (predecessors[currentToken] === null) {
      console.error("No path found");
      return null;
    }

    const { token, pool } = predecessors[currentToken]!;
    path.push({ from: currentToken, to: token, pool });
    currentToken = token;
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
    amountIn: distances[startToken],
    amountOut,
    priceImpactPercentage,
    type: "exact_output",
  };
}
