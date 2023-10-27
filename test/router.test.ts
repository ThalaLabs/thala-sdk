import poolData from "./test-pools.json";
import { ThalaswapRouter } from "../src";
import { expect, test, jest } from "bun:test";

const coins = poolData.coins;
const pools = poolData.pools.map((pool: any) => {
  return {
    ...pool,
    asset0: coins[pool.asset0],
    asset1: coins[pool.asset1],
    asset2: pool.asset2 ? coins[pool.asset2] : undefined,
    asset3: pool.asset3 ? coins[pool.asset3] : undefined,
  };
});

const mockPoolDataClient = {
  getPoolData: jest.fn(() => {
    return new Promise((resolve) =>
      resolve({
        pools: pools,
        coins: coins,
      }),
    );
  }),
};

const router = new ThalaswapRouter("example-url");
router.setPoolDataClient(mockPoolDataClient as any);

test("Exact input 1 hop", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const endToken = "0x1::aptos_coin::AptosCoin";
  const amountIn = 1000;

  const route = await router.getRouteGivenExactInput(
    startToken,
    endToken,
    amountIn,
    1,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountIn: ${amountIn}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(1);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[0].to === endToken).toBe(true);
});

test("Exact input 2 hop", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH";
  const endToken = "0x1::aptos_coin::AptosCoin";
  const amountIn = 1;

  const route = await router.getRouteGivenExactInput(
    startToken,
    endToken,
    amountIn,
    2,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountIn: ${amountIn}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(2);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[1].to === endToken).toBe(true);
  expect(route!.path[0].to == route!.path[1].from).toBe(true);
});

test("Exact input 3 hop", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountIn = 1000;

  const route = await router.getRouteGivenExactInput(
    startToken,
    endToken,
    amountIn,
    3,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountIn: ${amountIn}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(3);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[2].to === endToken).toBe(true);
  expect(route!.path[0].to == route!.path[1].from).toBe(true);
  expect(route!.path[1].to == route!.path[2].from).toBe(true);
});

test("Exact output 1 hop", async () => {
  const startToken = "0x1::aptos_coin::AptosCoin";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const amountOut = 1000;

  const route = await router.getRouteGivenExactOutput(
    startToken,
    endToken,
    amountOut,
    1,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountOut: ${amountOut}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(1);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[0].to === endToken).toBe(true);
});

test("Exact output 2 hop", async () => {
  const startToken = "0x1::aptos_coin::AptosCoin";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH";
  const amountOut = 1;

  const route = await router.getRouteGivenExactOutput(
    startToken,
    endToken,
    amountOut,
    2,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountOut: ${amountOut}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(2);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[1].to === endToken).toBe(true);
  expect(route!.path[0].to == route!.path[1].from).toBe(true);
});

test("Exact output 3 hop", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const endToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const amountOut = 1000;

  const route = await router.getRouteGivenExactOutput(
    startToken,
    endToken,
    amountOut,
    3,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountOut: ${amountOut}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(3);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[2].to === endToken).toBe(true);
  expect(route!.path[0].to == route!.path[1].from).toBe(true);
  expect(route!.path[1].to == route!.path[2].from).toBe(true);
});

test("Low price impact for MOD-USDC stable pool", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const endToken =
    "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD";
  const amountIn = 1000;

  const route = await router.getRouteGivenExactInput(
    startToken,
    endToken,
    amountIn,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountIn: ${amountIn}, Optimal Route:`,
    route,
  );
  expect(route!.path.length).toBe(1);
  expect(route!.path[0].from === startToken).toBe(true);
  expect(route!.path[0].to === endToken).toBe(true);
  expect(route!.priceImpactPercentage).toBeLessThan(0.1);

  const amountOut = 1000;
  const route2 = await router.getRouteGivenExactOutput(
    startToken,
    endToken,
    amountOut,
  );
  console.log(
    `From: ${startToken}, To: ${endToken}, AmountOut: ${amountOut}, Optimal Route:`,
    route2,
  );
  expect(route2!.path.length).toBe(1);
  expect(route2!.path[0].from === startToken).toBe(true);
  expect(route2!.path[0].to === endToken).toBe(true);
  expect(route2!.priceImpactPercentage).toBeLessThan(0.1);
});
