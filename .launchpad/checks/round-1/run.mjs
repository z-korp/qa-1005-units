// .launchpad/checks/round-1/run.mjs: round 1's checks. Run them yourself from the repository's root:
//   node .launchpad/checks/round-1/run.mjs
import { check, harness } from "./lib/harness.mjs";
import { entry, refuses, succeeds } from "./lib/entry.mjs";

const { test, done } = harness();
const cli = entry("node", ["convert.mjs"]);

async function prints(args, expected) {
  const r = await succeeds(cli, args);
  check(r.out === `${expected}\n`, `convert.mjs ${args.join(" ")} printed ${JSON.stringify(r.out)}, expected ${JSON.stringify(expected + "\n")}`);
}
async function table(cases) {
  for (const [args, expected] of cases) await prints(args.split(" "), expected);
}
async function refusesAll(cases, what) {
  for (const args of cases) await refuses(cli, args, `${what} (convert.mjs ${args.map((a) => JSON.stringify(a)).join(" ")})`);
}

await test("converts lengths", () => table([
  ["10 km mi", "6.2137 mi"], ["1 mi km", "1.6093 km"], ["12 in ft", "1 ft"], ["100 cm m", "1 m"],
  ["5 ft cm", "152.4 cm"], ["1 m mm", "1000 mm"], ["2.5 m in", "98.4252 in"],
]));
await test("converts masses", () => table([
  ["1 kg lb", "2.2046 lb"], ["16 oz lb", "1 lb"], ["500 g kg", "0.5 kg"], ["1 lb g", "453.5924 g"],
]));
await test("converts temperatures, negatives included", () => table([
  ["100 C F", "212 F"], ["32 F C", "0 C"], ["0 K C", "-273.15 C"], ["-40 C F", "-40 F"],
  ["300 K F", "80.33 F"], ["98.6 F K", "310.15 K"],
]));
await test("rounds to 4 decimals without trailing zeros and never prints -0", () => table([
  ["1.50000 m m", "1.5 m"], ["0.00004 km m", "0.04 m"], ["1 mm km", "0 km"], ["-0.00001 C C", "0 C"],
]));
await test("refuses a wrong number of arguments", async () => {
  await prints(["1", "m", "cm"], "100 cm");
  await refusesAll([[], ["1", "m"], ["1", "m", "cm", "extra"]], "wrong number of arguments");
});
await test("refuses a value that is not a finite number", async () => {
  await prints(["2", "kg", "g"], "2000 g");
  await refusesAll([["abc", "m", "km"], ["", "m", "km"], ["NaN", "m", "km"], ["Infinity", "m", "km"], ["1,5", "m", "km"], ["12abc", "m", "km"]], "not a number");
});
await test("refuses an unknown unit", async () => {
  await prints(["10", "km", "m"], "10000 m");
  await refusesAll([["10", "km", "parsec"], ["10", "KM", "mi"], ["10", "meters", "km"]], "unknown unit");
});
await test("refuses units that measure different things", async () => {
  await prints(["1", "lb", "oz"], "16 oz");
  await refusesAll([["1", "kg", "m"], ["1", "C", "km"], ["1", "lb", "F"]], "different dimensions");
});
await test("refuses a negative length or mass", async () => {
  await prints(["-5", "C", "K"], "268.15 K");
  await refusesAll([["-1", "m", "ft"], ["-0.5", "kg", "g"]], "negative length or mass");
});
await test("refuses a temperature below absolute zero", async () => {
  await prints(["-459.67", "F", "K"], "0 K");
  await refusesAll([["-274", "C", "F"], ["-1", "K", "C"], ["-460", "F", "C"]], "below absolute zero");
});

done();
