import { calcInGivenOutWeighted, calcOutGivenInWeighted } from "../src";

test("calcOutGivenInWeighted", () => {
  expect(
    calcOutGivenInWeighted(100, 20, 200, 30, 1, 0.01),
  ).toMatchInlineSnapshot(`1.309204970285971`);
});

test("calcInGivenOutStable", () => {
  expect(
    calcInGivenOutWeighted(100, 20, 200, 30, 1.309204970285971, 0.01),
  ).toMatchInlineSnapshot(`1.0000000000000244`);
});
