# qa-1005-units
QA 2026-10-05: a tiny unit converter CLI built by agents

## Usage

`convert.mjs` converts a value between units. It needs Node 18 or later and nothing else.

```sh
node convert.mjs <value> <from> <to>
```

```console
$ node convert.mjs 10 km mi
6.2137 mi
$ node convert.mjs 98.6 F C
37 C
$ node convert.mjs 1 kg m
convert: cannot convert kg (mass) to m (length)
```

| Measure | Units (case-sensitive) |
| --- | --- |
| Length | `mm`, `cm`, `m`, `km`, `in`, `ft`, `mi` |
| Mass | `g`, `kg`, `oz`, `lb` |
| Temperature | `C`, `F`, `K` |

- The result is rounded to 4 decimals (halves away from zero) and printed without trailing zeros, never as `-0`.
- The value is a plain decimal (`12`, `-0.5`, `.25`); exponents such as `1e3` are refused.
- On bad input (wrong number of arguments, a value that is not a number, an unknown unit, units of
  different measures, a negative length or mass, a temperature below absolute zero) it prints a
  one-line reason on stderr, nothing on stdout, and exits with code 1.
- The arithmetic is exact (fractions of big integers), so `0.1 m mm` is `100 mm`, not `100.00000000000001 mm`.

Tests: `node --test`, plus the round's checks: `node .launchpad/checks/round-1/run.mjs`.
