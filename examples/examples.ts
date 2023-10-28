import { ThalaswapRouter } from "../src";

// JSONKeeper returns pre-defined data containing testnet pools. The data may not be up-to-date.
const router = new ThalaswapRouter("https://jsonkeeper.com/b/PAHE");

// Example 1: Exact input. 1 hop
async function example1() {
  const fromToken = "0x1::aptos_coin::AptosCoin";
  const toToken =
    "0xec84c05cc40950c86d8a8bed19552f1e8ebb783196bb021c916161d22dc179f7::asset::USDC";
  const amountIn = 0.1;

  const route = await router.getRouteGivenExactInput(
    fromToken,
    toToken,
    amountIn,
  );

  console.log("Route:", route);
  console.log(
    "Entry function payload with 0.5% slippage:",
    router.encodeRoute(route!, 0.5).rawPayload,
  );
}

// Example 2: Exact output. Multi hop
async function example2() {
  const fromToken = "0x1::aptos_coin::AptosCoin";
  const toToken =
    "0x649d4e9fe07854c6ed5c8a70c1258981384892712ccb71022c21cb1ec38c50af::mod_coin::MOD";
  const amountOut = 1;

  const route = await router.getRouteGivenExactOutput(
    fromToken,
    toToken,
    amountOut,
  );

  console.log("Route:", route);
  console.log(
    "Entry function payload with 0.5% slippage:",
    router.encodeRoute(route!, 0.5).rawPayload,
  );
}

example1();
example2();
