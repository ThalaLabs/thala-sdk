# @thalalabs/router-sdk

## 4.5.0

### Minor Changes

- 360aef8: Use a new router contract which compatible with both v3 and v2 pools

## 4.4.1

### Patch Changes

- 449a285: Catch the issue that calcOutGivenIn failed to compute

## 4.4.0

### Minor Changes

- 91feb3e: integrate thalaswap v3

## 4.3.3

### Patch Changes

- 7596b27: Fix the missing decimal data for some pools.

## 4.3.2

### Patch Changes

- d8ca694: fetch decimals in batch, reduce rpc calls

## 4.3.1

### Patch Changes

- f4ab867: Fix v2 router for APT

## 4.3.0

### Minor Changes

- e3fe9d8: Support multi pools routing for v2 pools

## 4.2.4

### Patch Changes

- af3deb1: Use new thala v2 lens contract to use pagination view function

## 4.2.3

### Patch Changes

- afca50a: Fix a bug that causes some pools to be missing in the router.

## 4.2.2

### Patch Changes

- 7ca5511: Fix a bug that causes some pools to be missing in the router.

## 4.2.1

### Patch Changes

- 21a31de: Fix the exception that occurs when the route token does not exist.
- 21a31de: Fix the error when the v2LensAddress is missing for ThalaswapRouter.

## 4.2.0

### Minor Changes

- 6118166: Integrate metastable pools

## 4.1.1

### Patch Changes

- e0486c4: Use 6 coins for v2 stable pool

## 4.1.0

### Minor Changes

- 54706f6: Add thalaswap v2 lends contract

## 4.0.0

### Major Changes

- 6d4a3fd: Support thalaswap v2

## 3.4.1

### Patch Changes

- 19fcc93: Add poolType in pool data struct

## 3.4.0

### Minor Changes

- 9e6b60c: Add pool filter in ThalaswapRouter Option argument. So that user can filter out some pools for the router.

## 3.3.0

### Minor Changes

- 6157e05: Add max allowed swap percentage to filter out some small pools

## 3.2.1

### Patch Changes

- a6e1e2d: fix weight address

## 3.2.0

### Minor Changes

- 5c3f156: Make multi-router configurable

## 3.1.1

### Patch Changes

- c8ae58b: fix null type address bug

## 3.1.0

### Minor Changes

- 8844775: upgrade surf

## 3.0.0

### Major Changes

- a5000e7: Support multi-chains

## 2.1.1

### Patch Changes

- Updated dependencies [9729afa]
  - @thalalabs/thalaswap-math@1.0.1

## 2.1.0

### Minor Changes

- 7ab163d: Fix coin missed issue

## 2.0.0

### Major Changes

- 952c683: Fetch data from aptos sdk directly, instead of depends on external indexer

### Patch Changes

- e2d92a0: add swap fee & fetch coin addresses from resource

## 1.2.0

### Minor Changes

- cabac03: Upgrade Surf and Change Surf to peer dependency

## 1.1.1

### Patch Changes

- 321c13d: upgrade surf to 1.0.1

## 1.1.0

### Minor Changes

- a68319a: update contract address and fix the order of swap-exact-out arguments

## 1.0.5

### Patch Changes

- 7ebe94a: fix a swap with exact out bug

## 1.0.4

### Patch Changes

- c01ef43: generate the type declaration file, and export all types.

## 1.0.3

### Patch Changes

- 2fff8a4: change pool schema

## 1.0.2

### Patch Changes

- f69a80b: change changeset as a dev dependency instead of common dependency

## 1.0.1

### Patch Changes

- 41d5f85: fix the issue caused by release the package incorrectly.
