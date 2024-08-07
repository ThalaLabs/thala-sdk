import poolData from "./test-pools.json";
import { ThalaswapRouter } from "../src";
import { Network } from "@aptos-labs/ts-sdk";

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

const router = new ThalaswapRouter(Network.MAINNET, "test", "0x123", "0x123", {
  maxAllowedSwapPercentage: 1,
});
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
  expect(route!.priceImpactPercentage).toBeCloseTo(121, 0);
  expect(route!.amountOut).toBeCloseTo(112, 0);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("weighted_pool_scripts");
  expect(payload.function).toContain("swap_exact_in");
  expect(payload.functionArguments[0]).toBe(1000000000);
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
  expect(route!.priceImpactPercentage).toBeCloseTo(227, 0);
  expect(route!.amountOut).toBeCloseTo(153, 0);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("router");
  expect(payload.function).toContain("swap_exact_in_2");
  expect(payload.functionArguments[0]).toBe(1000000);
});

test("Exact input 3 hop", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const endToken =
    "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T";
  const amountIn = 1;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(79.7, 1);
  expect(route!.amountOut).toBeCloseTo(2.35, 2);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("router");
  expect(payload.function).toContain("swap_exact_in_3");
  expect(payload.functionArguments[0]).toBe(1000000);
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
  expect(route!.priceImpactPercentage).toBeCloseTo(279, 0);
  expect(route!.amountIn).toBeCloseTo(326, 0);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("weighted_pool_scripts");
  expect(payload.function).toContain("swap_exact_out");
  expect(payload.functionArguments[1]).toBe(1000000000);
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
  expect(route!.priceImpactPercentage).toBeCloseTo(2898, 0);
  expect(route!.amountIn).toBeCloseTo(1566, 0);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("router");
  expect(payload.function).toContain("swap_exact_out_2");
  expect(payload.functionArguments[1]).toBe(1000000);
});

test("Exact output 3 hop", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const endToken =
    "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T";
  const amountOut = 1;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(20.66, 2);
  expect(route!.amountIn).toBeCloseTo(0.36, 2);

  const payload = router.encodeRoute(route!, 0);
  expect(payload.function).toContain("router");
  expect(payload.function).toContain("swap_exact_out_3");
  expect(payload.functionArguments[1]).toBe(1000000);
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
  expect(route!.priceImpactPercentage).toBeLessThan(0.002);
  expect(route!.amountOut).toBeCloseTo(1001, 0);

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
  expect(route2!.priceImpactPercentage).toBeLessThan(0.002);
  expect(route2!.amountIn).toBeCloseTo(999, 0);
});

// Below are tests for THL -> USDT
// We have 3 posible routes:
// 1. THL - USDT
// 2. THL - APT - USDT
// 3. THL - MOD - APT - USDT
// The algorithm should choose the optimal route given the limit of hops

test("THL -> USDT exact in 1 hop", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountIn = 1;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(7.8, 1);
  expect(route!.amountOut).toBeCloseTo(0.14, 2);
});

test("THL -> USDT exact in 2 hops", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
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
  expect(route!.priceImpactPercentage).toBeCloseTo(1.6, 1);
  expect(route!.amountOut).toBeCloseTo(0.75, 2);
});

test("THL -> USDT exact in 3 hops", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountIn = 1;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(54, 0);
  expect(route!.amountOut).toBeCloseTo(1.87, 2);
});

test("THL -> USDT exact out 1 hop", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountOut = 0.14;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(7.7, 1);
  expect(route!.amountIn).toBeCloseTo(1, 2);
});

test("THL -> USDT exact out 2 hops", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountOut = 0.75;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(1.6, 1);
  expect(route!.amountIn).toBeCloseTo(1, 2);
});

test("THL -> USDT exact out 3 hops", async () => {
  const startToken =
    "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
  const amountOut = 1.87;

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
  expect(route!.priceImpactPercentage).toBeCloseTo(53, 0);
  expect(route!.amountIn).toBeCloseTo(1, 2);
});

test("encodeRouter with balance input for exact-in swap", async () => {
  const startToken = "0x1::aptos_coin::AptosCoin";
  const endToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const amountIn = 1;

  const route = await router.getRouteGivenExactInput(
    startToken,
    endToken,
    amountIn,
    1,
  );

  // 1. should succeed if user has enough balance
  const payload = router.encodeRoute(route!, 0, 1000000);
  expect(payload.function).toContain("weighted_pool_scripts");
  expect(payload.function).toContain("swap_exact_in");
  expect(payload.functionArguments[0]).toBe(100000000);

  // 2. should fail if user doesn't have enough balance
  expect(() => {
    router.encodeRoute(route!, 0, 0.1);
  }).toThrow("Insufficient balance");
});

test("encodeRouter with balance input for exact-out swap", async () => {
  const startToken =
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
  const endToken = "0x1::aptos_coin::AptosCoin";
  const amountOut = 1;

  const route = await router.getRouteGivenExactOutput(
    startToken,
    endToken,
    amountOut,
    1,
  );

  // 1. should succeed if user has enough balance. Slippage percentage is 50%
  const payload = router.encodeRoute(route!, 50, 1000000);
  expect(payload.function).toContain("weighted_pool_scripts");
  expect(payload.function).toContain("swap_exact_out");
  expect(payload.functionArguments[0]).toBe(9043083);

  // 2. should set "amountIn" argument to user's balance if user's balance is smaller than expected input amount + slippage
  const payload2 = router.encodeRoute(route!, 50, 9);
  expect(payload2.function).toContain("weighted_pool_scripts");
  expect(payload2.function).toContain("swap_exact_out");
  expect(payload2.functionArguments[0]).toBe(9000000);
});
