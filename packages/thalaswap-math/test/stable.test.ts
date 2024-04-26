import { calcInGivenOutStable, calcOutGivenInStable } from "../src";

test("calcOutGivenInStable", () => {
  expect(
    calcOutGivenInStable(1, 1, 2, [100, 200, 300], 1, 0.01),
  ).toMatchInlineSnapshot(`1.1963435622643601`);
});

test("calcInGivenOutStable", () => {
  expect(
    calcInGivenOutStable(1.1963435622643601, 1, 2, [100, 200, 300], 1, 0.01),
  ).toMatchInlineSnapshot(`0.9999999999999231`);
});
