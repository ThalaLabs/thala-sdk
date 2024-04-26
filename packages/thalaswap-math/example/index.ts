import {
  calcInGivenOutStable,
  calcInGivenOutWeighted,
  calcOutGivenInStable,
  calcOutGivenInWeighted,
} from "@thalalabs/thalaswap-math";

// Calculate amount out given amount in:
// A stable pool with three tokens having balances of [100, 200, 300],
// The pool's amplification coefficient is 1.
// And the swap fee is 0.01.
// We use the second token as input and the third token as output.
// And the input token amount is 10.
console.log(calcOutGivenInStable(10, 1, 2, [100, 200, 300], 1, 0.01));

// Calculate amount in given amount out:
// A stable pool with three tokens having balances of [100, 200, 300],
// The pool's amplification coefficient is 1.
// And the swap fee is 0.01.
// We use the second token as input and the third token as output.
// And the output token amount is 10.
console.log(calcInGivenOutStable(10, 1, 2, [100, 200, 300], 1, 0.01));

// Calculate amount out given amount in:
// A weighted pool has a token whose balance is 100 and weight is 20,
// and the pool also has another token whose balance is 200 and weight is 30.
// The swap fee is 0.01.
// Use the first token as input and the second token as output.
// And the input token amount is 10.
console.log(calcOutGivenInWeighted(100, 20, 200, 30, 10, 0.01));

// Calculate amount out given amount out:
// A weighted pool has a token whose balance is 100 and weight is 20,
// and the pool also has another token whose balance is 200 and weight is 30.
// The swap fee is 0.01.
// Use the first token as input and the second token as output.
// And the output token amount is 10.
console.log(calcInGivenOutWeighted(100, 20, 200, 30, 10, 0.01));

// Output:
// 11.73538250094282
// 8.494235701152459
// 12.198870161837627
// 8.078506335476245
