import BigNumber from "bignumber.js";
import { THALASWAP_RESOURCE_ACCOUNT_ADDRESS } from "./constants";
import { LiquidityPoolMetadata } from "./types";

export const BN_TEN = new BigNumber(10);

export function scaleDown(v: number | string, decimals: number): number {
  return new BigNumber(v)
    .dividedBy(BN_TEN.exponentiatedBy(decimals))
    .toNumber();
}

export function parsePoolMetadata(poolType: string): LiquidityPoolMetadata {
  const [liquidityPoolType, poolTypeArgs] = parseLiquidityPoolType(poolType);

  // if first n coins are not dummycoin, then numCoins = n
  const nullIndex = poolTypeArgs
    .slice(0, 4)
    .findIndex((e) => NULL_PATTERN.test(e));
  const numCoins = nullIndex === -1 ? 4 : nullIndex;

  const coinAddresses = poolTypeArgs.slice(0, numCoins);
  const weights =
    liquidityPoolType === "Weighted"
      ? poolTypeArgs
          .slice(4, 4 + numCoins)
          .map((weight) => parseInt(weight.match(/.*::Weight_(\d+)/)![1]))
      : []; // stable pool has no weights, so return empty array
  return {
    type: poolType,
    poolType: liquidityPoolType,
    numCoins,
    coinAddresses,
    weights,
  };
}

export function parseLiquidityPoolType(
  poolType: string,
): ["Weighted" | "Stable", string[]] {
  const matchWeightedPool = poolType.match(WEIGHTED_POOL_PATTERN);
  if (matchWeightedPool) {
    return ["Weighted", matchWeightedPool[1].split(",").map((e) => e.trim())];
  }
  const matchStablePool = poolType.match(STABLE_POOL_PATTERN);
  if (matchStablePool) {
    return ["Stable", matchStablePool[1].split(",").map((e) => e.trim())];
  }
  throw new Error(`Invalid poolType: ${poolType}`);
}

const WEIGHTED_POOL_PATTERN = new RegExp(
  `${THALASWAP_RESOURCE_ACCOUNT_ADDRESS}::weighted_pool::WeightedPool<(.*)>`,
);
const STABLE_POOL_PATTERN = new RegExp(
  `${THALASWAP_RESOURCE_ACCOUNT_ADDRESS}::stable_pool::StablePool<(.*)>`,
);
const NULL_PATTERN = new RegExp(
  `${THALASWAP_RESOURCE_ACCOUNT_ADDRESS}::base_pool::Null`,
);

// input cannot be larger the 2^31
// this should allow at least 6 digits precision in the fractional part
// https://stackoverflow.com/questions/45929493/node-js-maximum-safe-floating-point-number

const ZERO = BigInt(0);
const ONE = BigInt(1);

export const fp64ToFloat = (a: bigint): number => {
  // avoid large number
  let mask = BigInt("0xffffffff000000000000000000000000");
  if ((a & mask) != ZERO) {
    throw new Error("too large");
  }

  // integer part
  mask = BigInt("0x10000000000000000");
  let base = 1;
  let result = 0;
  for (let i = 0; i < 32; ++i) {
    if ((a & mask) != ZERO) {
      result += base;
    }
    base *= 2;
    mask = mask << ONE;
  }

  // fractional part
  mask = BigInt("0x8000000000000000");
  base = 0.5;
  for (let i = 0; i < 32; ++i) {
    if ((a & mask) != ZERO) {
      result += base;
    }
    base /= 2;
    mask = mask >> ONE;
  }
  return result;
};
