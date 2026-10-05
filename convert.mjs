#!/usr/bin/env node

const units = new Map([
  ['mm', ['length', 0.001]], ['cm', ['length', 0.01]],
  ['m', ['length', 1]], ['km', ['length', 1000]],
  ['in', ['length', 0.0254]], ['ft', ['length', 0.3048]],
  ['mi', ['length', 1609.344]],
  ['g', ['mass', 0.001]], ['kg', ['mass', 1]],
  ['oz', ['mass', 0.028349523125]], ['lb', ['mass', 0.45359237]],
  ['C', ['temperature']], ['F', ['temperature']], ['K', ['temperature']],
]);
const absoluteZero = { C: -273.15, F: -459.67, K: 0 };

function fail(reason) {
  console.error(reason);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length !== 3) fail('Usage: node convert.mjs <value> <from> <to>');
const [input, from, to] = args;
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const value = Number(input);
if (!decimal.test(input) || !Number.isFinite(value)) {
  fail('Value must be a finite decimal number.');
}
if (!units.has(from)) fail(`Unknown source unit: ${from}`);
if (!units.has(to)) fail(`Unknown target unit: ${to}`);
const [dimension, fromScale] = units.get(from);
const [targetDimension, toScale] = units.get(to);
if (dimension !== targetDimension) fail('Units must measure the same dimension.');
if (dimension !== 'temperature' && value < 0) fail('Length and mass cannot be negative.');
if (dimension === 'temperature' && value < absoluteZero[from]) {
  fail('Temperature cannot be below absolute zero.');
}

let converted = value;
if (from !== to && dimension === 'temperature') {
  // Convert directly to avoid subtracting Kelvin offsets for C/F conversions.
  const formulas = {
    C: { F: v => v * (9 / 5) + 32, K: v => v + 273.15 },
    F: { C: v => (v - 32) * (5 / 9), K: v => (v + 459.67) * (5 / 9) },
    K: { C: v => v - 273.15, F: v => v * (9 / 5) - 459.67 },
  };
  converted = formulas[from][to](value);
} else if (dimension !== 'temperature') {
  converted = value * (fromScale / toScale);
}
if (!Number.isFinite(converted)) fail('Converted value exceeds the finite numeric range.');
const rounded = converted.toFixed(4);
const output = Number(rounded) === 0 ? '0' : rounded.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
console.log(`${output} ${to}`);
