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
    "0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5",
  v2LensAddress:
    "0x2ee2526b8035890ebf30510aae8891d41116d83d2b5b7d774a3bc73d2b751d61",
  multirouterAddress:
    "0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26",
  v2RouterAddress: 
    "0xc36ceb6d7b137cea4897d4bc82d8e4d8be5f964c4217dbc96b0ba03cc64070f4",
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
