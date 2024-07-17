# Thala Router

SDK to get optimal swap routing for ThalaSwap. Currently, we support finding routes of no more than 3 hops.

## Install

```
$ npm i @thalalabs/router-sdk
```

## Examples

```
const router = new ThalaswapRouter(
  Network.MAINNET,
  "https://fullnode.mainnet.aptoslabs.com/v1",
  "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af",
  "0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26",
);
const fromToken = "0x1::aptos_coin::AptosCoin";
const toToken = "0xec84c05cc40950c86d8a8bed19552f1e8ebb783196bb021c916161d22dc179f7::asset::USDC";
const amountIn = 0.1;

const route = await router.getRouteGivenExactInput(
    fromToken,
    toToken,
    amountIn
);

console.log("Route:", route);
console.log("Entry function payload with 0.5% slippage:", router.encodeRoute(route!, 0.5));
```

See `examples.ts` for more details

## Development

This package uses Bun for development and package management.

```
# install dependencies
pnpm install

# test the app
pnpm run test

# build the app, available under dist
pnpm run build
```
