// Cases the round's checks leave open. Run: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../convert.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

function prints(args, expected) {
  const r = run(...args.split(" "));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `${expected}\n`);
}
function refuses(args, reason) {
  const r = run(...args);
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, reason);
  assert.equal(r.stderr.trim().split("\n").length, 1);
}

test("rounds halves away from zero, with no float noise", () => {
  prints("0.00005 m m", "0.0001 m");
  prints("-0.00005 C C", "-0.0001 C");
  prints("0.1 m mm", "100 mm");
  prints("1.005 kg kg", "1.005 kg");
});

test("accepts plain decimal forms", () => {
  prints(".25 kg g", "250 g");
  prints("3. m cm", "300 cm");
  prints("+2 km m", "2000 m");
  prints("-0 m cm", "0 cm");
  prints("123456789012345678901234567890 mm km", "123456789012345678901234.5679 km");
});

test("converts the same unit and absolute zero exactly", () => {
  prints("1 F F", "1 F");
  prints("-273.15 C K", "0 K");
  prints("0 K F", "-459.67 F");
});

test("refuses with one line on stderr", () => {
  refuses(["1e3", "m", "km"], /not a decimal number/);
  refuses([" 1", "m", "km"], /not a decimal number/);
  refuses(["-", "m", "km"], /not a decimal number/);
  refuses(["."], /expected 3 arguments/);
  refuses(["1", "Kg", "g"], /unknown unit: "Kg"/);
  refuses(["1", "toString", "m"], /unknown unit/);
  refuses(["1", "C", "kg"], /cannot convert C \(temperature\) to kg \(mass\)/);
  refuses(["-0.0001", "mm", "m"], /length cannot be negative/);
  refuses(["-273.16", "C", "K"], /below absolute zero/);
});
