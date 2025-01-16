# Thala Router

SDK to get optimal swap routing for ThalaSwap. Currently, we support finding routes of no more than 3 hops.

## Install

```
$ npm i @thalalabs/router-sdk
```

## Examples

```
const router = new ThalaswapRouter({
  network: Network.MAINNET,
  fullnode: "https://fullnode.mainnet.aptoslabs.com/v1",
  resourceAddress:
    "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af",
  v2ResourceAddress:
    "0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26",
  v2LensAddress:
    "0xff1ac437457a839f7d07212d789b85dd77b3df00f59613fcba02388464bfcacb",
  multirouterAddress:
    "0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26",
});
const fromToken = "0x1::aptos_coin::AptosCoin";
const toToken = "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL";
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
