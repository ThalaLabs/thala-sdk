export function calcOutGivenInStable(
  amountIn: number,
  indexIn: number,
  indexOut: number,
  balances: number[],
  amp: number,
  fee: number,
): number {
  amountIn = amountIn * (1 - fee);
  const newX = balances[indexIn] + amountIn; // x is input
  const newY = getY(balances, newX, amp, indexIn, indexOut);
  return balances[indexOut] - newY;
}

export function calcInGivenOutStable(
  amountOut: number,
  indexIn: number,
  indexOut: number,
  balances: number[],
  amp: number,
  fee: number,
): number {
  const newX = balances[indexOut] - amountOut; // x is output
  const newY = getY(balances, newX, amp, indexOut, indexIn);
  return (newY - balances[indexIn]) / (1 - fee);
}

// get relative price of coin j to i
// formula: https://linear.app/thala-labs/issue/THA-434/calculate-swap-price-impact
export function getPriceStable(
  i: number,
  j: number,
  balances: number[],
  amp: number,
): number {
  const d = getD(balances, amp);
  const n = balances.length;
  let b = Math.pow(d, n + 1) / Math.pow(n, n);
  balances.forEach((x: number, index: number) => {
    if (index != i && index != j) {
      b = b / x;
    }
  });
  let naxx = n * amp * balances[i] * balances[i] * balances[j] * balances[j];
  return (balances[i] * b + naxx) / (balances[j] * b + naxx);
}

export function calcPriceImpactPercentageStable(
  exactAmountIn: number,
  exactAmountOut: number,
  indexIn: number,
  indexOut: number,
  balances: number[],
  amp: number,
): number {
  if (balances[indexOut] - exactAmountOut < 0.000001) {
    // to avoid loss of accuracy, we just return 100%
    return 100;
  }
  const oldPrice = getPriceStable(indexIn, indexOut, balances, amp);

  // update new balance
  balances[indexIn] = balances[indexIn] + exactAmountIn;
  balances[indexOut] = balances[indexOut] - exactAmountOut;
  const newPrice = getPriceStable(indexIn, indexOut, balances, amp);
  return (Math.abs(newPrice - oldPrice) / oldPrice) * 100;
}

/*
Why is there a slippage loss?
Example: an extreme case of stable pool D = sqrt(xy)
Before adding LP, the pool is 100 X + 100 Y, fair price of Y (relative to X) is 1
After adding 300 X + 0 Y, the pool is 400 X + 100 Y, user's share of the pool is 50%
Because liquidity is added not evenly, the pool will be arbed to 200 X + 200 Y (fair price of Y to X should stay 1)
When the user removes LP, the funds become 100 X + 100Y, therefore the users suffers a slippage loss of 33.3% (100/300)
*/
export function getStableSwapSlippageLoss(
  inputAmounts: number[],
  poolBalances: number[],
  amp: number,
): number {
  const d = getD(poolBalances, amp);
  const relativePrices = Array(poolBalances.length)
    .fill(0)
    .map((_, i) =>
      i == 0 ? 1 : getPriceStableWithKnownD(0, i, poolBalances, amp, d),
    );
  const prevWorth = inputAmounts.reduce(
    (acc, cur, i) => acc + cur * relativePrices[i],
    0,
  );
  const newBalances = poolBalances.map(
    (balance, i) => balance + inputAmounts[i],
  );
  const newD = getD(newBalances, amp);
  const newWorth =
    (poolBalances.reduce((acc, cur, i) => acc + cur * relativePrices[i], 0) *
      (newD - d)) /
    d;
  return (prevWorth - newWorth) / prevWorth;
}

export function getLpTokenToIssueStable(
  inputAmounts: number[],
  poolBalances: number[],
  amp: number,
  lpSupply: number,
): number {
  const d = getD(poolBalances, amp);
  const newPoolBalances = poolBalances.map(
    (balance, i) => balance + inputAmounts[i],
  );
  const newD = getD(newPoolBalances, amp);
  return (lpSupply * (newD - d)) / d;
}

// same as getPriceStable, but with known D (invariant)
function getPriceStableWithKnownD(
  i: number,
  j: number,
  balances: number[],
  amp: number,
  d: number,
): number {
  const n = balances.length;
  let b = Math.pow(d, n + 1) / Math.pow(n, n);
  balances.forEach((x: number, index: number) => {
    if (index != i && index != j) {
      b = b / x;
    }
  });
  let naxx = n * amp * balances[i] * balances[i] * balances[j] * balances[j];
  return (balances[i] * b + naxx) / (balances[j] * b + naxx);
}

const EPSILON = 0.000001; // 1e-6, for detecting convergence in stableswap math
const MAX_LOOP_LIMIT = 100;

// see `get_Y` in https://github.com/ThalaLabs/thala-modules/blob/main/thalaswap_math/sources/stable_math.move
function getY(
  xp: number[],
  x: number,
  a: number,
  i: number,
  j: number,
): number {
  const d = getD(xp, a);

  const n = xp.length;
  const ann = a * n;

  let c = d;
  let s = 0;

  let k = 0;
  while (k < n) {
    if (k == j) {
      k = k + 1;
      continue;
    }

    let x_k = k == i ? x : xp[k];

    s = s + x_k;
    c = (c * d) / (x_k * n);

    k = k + 1;
  }

  // in the above loop, there's only (n - 1) iterations
  // therefore we add the last iteration that times (d / n), then divided by ann
  c = (c * d) / (ann * n);
  let b = s + d / ann;

  let y = d;
  k = 0;
  while (k < MAX_LOOP_LIMIT) {
    let prev_y = y;
    y = (y * y + c) / (2 * y + b - d);
    if (Math.abs(y - prev_y) < EPSILON) {
      return y;
    }

    k = k + 1;
  }

  throw new Error(
    `not converged in getY, xp: ${xp}, x: ${x}, a: ${a}, i: ${i}, j: ${j}`,
  );
}

// see `compute_invarient` in https://github.com/ThalaLabs/thala-modules/blob/main/thalaswap_math/sources/stable_math.move
function getD(xp: number[], a: number): number {
  const n = xp.length;

  // sum
  const s = xp.reduce((partialSum, a) => partialSum + a, 0);

  if (s == 0) {
    return 0;
  }

  let prev_d: number;
  let d = s;
  const ann = a * n;

  let i = 0;
  while (i < MAX_LOOP_LIMIT) {
    let dp = d;

    let j = 0;
    while (j < n) {
      dp = (dp * d) / (xp[j] * n);
      j = j + 1;
    }

    prev_d = d;
    d = ((ann * s + n * dp) * d) / ((ann - 1) * d + (n + 1) * dp);
    if (Math.abs(prev_d - d) < EPSILON) {
      return d;
    }

    i = i + 1;
  }

  throw new Error(`not converged in getD, xp: ${xp}, a: ${a}`);
}
