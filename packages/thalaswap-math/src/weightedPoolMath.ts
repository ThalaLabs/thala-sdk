/// Reference "Out-Given-In" section in Balancer whitepaper https://docs.balancer.fi/whitepaper.pdf
/// ********************************************************************************************
/// calcOutGivenIn                                                                            //
/// aO = tokenAmountOut                                                                       //
/// bO = tokenBalanceOut                                                                      //
/// bI = tokenBalanceIn              /      /            bI             \    (wI / wO) \      //
/// aI = tokenAmountIn    aO = bO * |  1 - | --------------------------  | ^            |     //
/// wI = tokenWeightIn               \      \ ( bI + ( aI * ( 1 - sF )) /              /      //
/// wO = tokenWeightOut                                                                       //
/// sF = swapFee                                                                              //
/// ********************************************************************************************
export function calcOutGivenInWeighted(
  bI: number,
  wI: number,
  bO: number,
  wO: number,
  aI: number,
  sF: number,
): number {
  const denom = bI + aI * (1 - sF);
  return bO * (1 - Math.pow(bI / denom, wI / wO));
}

/// Reference "In-Given-Out" section in Balancer whitepaper https://docs.balancer.fi/whitepaper.pdf
/// ********************************************************************************************
/// calcInGivenOut                                                                            //
/// aI = tokenAmountIn                                                                        //
/// bO = tokenBalanceOut               /  /     bO      \    (wO / wI)      \                 //
/// bI = tokenBalanceIn          bI * |  | ------------  | ^            - 1  |                //
/// aO = tokenAmountOut    aI =        \  \ ( bO - aO ) /                   /                 //
/// wI = tokenWeightIn           --------------------------------------------                 //
/// wO = tokenWeightOut                          ( 1 - sF )                                   //
/// sF = swapFee                                                                              //
/// ********************************************************************************************
export function calcInGivenOutWeighted(
  bI: number,
  wI: number,
  bO: number,
  wO: number,
  aO: number,
  sF: number,
): number {
  return (bI * (Math.pow(bO / (bO - aO), wO / wI) - 1)) / (1 - sF);
}

export function calcPriceImpactPercentageWeighted(
  exactAmountIn: number,
  exactAmountOut: number,
  balanceIn: number,
  balanceOut: number,
  weightIn: number,
  weightOut: number,
): number {
  if (balanceOut - exactAmountOut < 0.000001) {
    // to avoid loss of accuracy, we just return 100%
    return 100;
  }

  // https://docs.balancer.fi/v/v1/core-concepts/protocol/index#spot-price
  // price1To0 = (balance0 / balance1) * (weight1 / weight0)
  const oldPrice = ((balanceIn / balanceOut) * weightOut) / weightIn;

  // update new balance
  balanceIn = balanceIn + exactAmountIn;
  balanceOut = balanceOut - exactAmountOut;
  const newPrice = ((balanceIn / balanceOut) * weightOut) / weightIn;

  return (Math.abs(newPrice - oldPrice) / oldPrice) * 100;
}
