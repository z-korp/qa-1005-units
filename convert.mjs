#!/usr/bin/env node
// convert.mjs: converts a value between units of length, mass or temperature.
//   node convert.mjs <value> <from> <to>
// The arithmetic is exact: values are fractions of BigInts, so the only rounding is the final one
// (to 4 decimals, halves away from zero).

// A fraction [numerator, denominator], denominator > 0.
const frac = (n, d = 1n) => [BigInt(n), BigInt(d)];
const add = ([a, b], [c, d]) => [a * d + c * b, b * d];
const sub = (x, [c, d]) => add(x, [-c, d]);
const mul = ([a, b], [c, d]) => [a * c, b * d];
const div = ([a, b], [c, d]) => (c < 0n ? [-a * d, -b * c] : [a * d, b * c]);
const isNegative = ([n]) => n < 0n;

// "12", "-0.5", "+3.", ".25": a plain decimal, no exponent, no spaces.
function parseDecimal(text) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!m || (m[2] + (m[3] ?? "")) === "") return null;
  const digits = m[2] + (m[3] ?? "");
  return frac(`${m[1]}${digits}`, 10n ** BigInt((m[3] ?? "").length));
}

// Lengths in metres, masses in kilograms.
const FACTORS = {
  length: { mm: frac(1, 1000), cm: frac(1, 100), m: frac(1), km: frac(1000), in: frac(254, 10000), ft: frac(3048, 10000), mi: frac(1609344, 1000) },
  mass: { g: frac(1, 1000), kg: frac(1), oz: frac(28349523125n, 10n ** 12n), lb: frac(45359237, 10n ** 8n) },
};

// Temperatures go through kelvin.
const C0 = frac(27315, 100), F0 = frac(45967, 100), NINE_FIFTHS = frac(9, 5);
const TO_KELVIN = { K: (v) => v, C: (v) => add(v, C0), F: (v) => div(add(v, F0), NINE_FIFTHS) };
const FROM_KELVIN = { K: (k) => k, C: (k) => sub(k, C0), F: (k) => sub(mul(k, NINE_FIFTHS), F0) };

function dimensionOf(unit) {
  if (Object.hasOwn(TO_KELVIN, unit)) return "temperature";
  return Object.keys(FACTORS).find((dim) => Object.hasOwn(FACTORS[dim], unit));
}

function convert(value, from, to, text) {
  const dim = dimensionOf(from);
  if (dim === "temperature") {
    const kelvin = TO_KELVIN[from](value);
    if (isNegative(kelvin)) throw new Error(`${text} ${from} is below absolute zero`);
    return FROM_KELVIN[to](kelvin);
  }
  if (isNegative(value)) throw new Error(`a ${dim} cannot be negative: ${text} ${from}`);
  return div(mul(value, FACTORS[dim][from]), FACTORS[dim][to]);
}

// Rounds to 4 decimals (halves away from zero) and drops trailing zeros; never "-0".
function format([n, d]) {
  const scaled = (2n * (n < 0n ? -n : n) * 10000n + d) / (2n * d);
  const whole = (scaled / 10000n).toString();
  const decimals = (scaled % 10000n).toString().padStart(4, "0").replace(/0+$/, "");
  const sign = n < 0n && scaled !== 0n ? "-" : "";
  return sign + whole + (decimals ? `.${decimals}` : "");
}

function main(args) {
  if (args.length !== 3) throw new Error(`expected 3 arguments, got ${args.length}: usage: node convert.mjs <value> <from> <to>`);
  const [text, from, to] = args;
  const value = parseDecimal(text);
  if (!value) throw new Error(`not a decimal number: ${JSON.stringify(text)}`);
  for (const unit of [from, to]) {
    if (!dimensionOf(unit)) throw new Error(`unknown unit: ${JSON.stringify(unit)} (units are case-sensitive)`);
  }
  if (dimensionOf(from) !== dimensionOf(to)) {
    throw new Error(`cannot convert ${from} (${dimensionOf(from)}) to ${to} (${dimensionOf(to)})`);
  }
  return `${format(convert(value, from, to, text))} ${to}`;
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`);
} catch (e) {
  process.stderr.write(`convert: ${e.message}\n`);
  process.exitCode = 1;
}
