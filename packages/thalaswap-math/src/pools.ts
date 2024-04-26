/// Reference "All-Asset Deposit/Withdrawal" section in Balancer whitepaper https://docs.balancer.fi/v/v1/core-concepts/protocol/index
/// ********************************************************************************************
/// computeAssetAmountToReturn                                                                    //
/// Ak = tokenKReturned                                                                           //
/// Pissued = poolTokenIssued                                                                     //
/// Predeemed = poolTokenRedeemed                                                                 //
/// Bk = balanceTokenK            /       Psupply - Predeemed      \                              //
///                       Ak =   |  1 - ------------------------    |  * Bk                       //
///                               \           Psupply              /                              //
///                                                                                               //
/// Simplified, Ak: Ak = Predeemed * Bk / Psupply                                                 //
/// ********************************************************************************************
export function computeAssetAmountToReturn(
  balance: number,
  p_redeemed: number,
  p_supply: number,
): number {
  return (balance / p_supply) * p_redeemed;
}
