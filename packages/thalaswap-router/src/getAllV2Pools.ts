import { Aptos } from "@aptos-labs/ts-sdk";
import { Coin } from "./types";

const PAGE_SIZE = 100;
const LIMIT = 1000;

type PoolOnChain = {
  amp_factor_opt: { vec: [string] | [] };
  assets_metadata: { inner: string }[];
  balances: string[];
  pool: { inner: string };
  pool_type: 100 | 101 | 102;
  swap_fee_bps: string;
  weights_opt: { vec: string[][] | [] };
  lp_token_metadata: { inner: string };
  rates_opt?: { vec: string[][] | [] };
};

type DecimalsOnChain = {
  data: {
    key: {
      inner: string;
    };
    value: number;
  }[];
};

export async function getV2PoolsOnChain(
  client: Aptos,
  v2LensAddress: string,
): Promise<PoolOnChain[]> {
  let offset = 0;
  const pools: PoolOnChain[] = [];
  while (true) {
    try {
      const result: [PoolOnChain[]] = await client.view({
        payload: {
          function: `${v2LensAddress}::lens::get_pools_paginated`,
          functionArguments: [offset, PAGE_SIZE],
          typeArguments: [],
        },
      });
      pools.push(...result[0]);
      offset += PAGE_SIZE;
      if (result[0].length < PAGE_SIZE || offset > LIMIT) {
        break;
      }
    } catch {
      // no more pools
      break;
    }
  }
  return pools;
}

export async function getV2AssetDecimals(
  client: Aptos,
  v2LensAddress: string,
): Promise<Coin[]> {
  let offset = 0;
  const decimals: Coin[] = [];
  const result: [DecimalsOnChain] = await client.view({
    payload: {
      function: `${v2LensAddress}::lens::fee_asset_decimals`,
      functionArguments: [],
      typeArguments: [],
    },
  });
  return result[0].data.map((o) => ({
    address: o.key.inner,
    decimals: o.value,
  }));
}
