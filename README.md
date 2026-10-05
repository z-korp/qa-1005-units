# qa-1005-units
QA 2026-10-05: a tiny unit converter CLI built by agents

## Usage

Requires Node.js 18 or newer; no dependencies or installation needed.

```sh
node convert.mjs 10 km mi       # 6.2137 mi
node convert.mjs 500 g kg       # 0.5 kg
node convert.mjs -40 C F        # -40 F
```

Supply exactly three arguments: a finite decimal value, a source unit and a
case-sensitive target unit. Decimal fractions and scientific notation are accepted
(e.g. `0.5`, `.5`, `1e3`); hexadecimal numbers and whitespace are rejected.

- Length: `mm`, `cm`, `m`, `km`, `in`, `ft`, `mi`.
- Mass: `g`, `kg`, `oz`, `lb`.
- Temperature: `C`, `F`, `K`.

The CLI prints the converted value rounded to four decimal places, without trailing
zeros or negative zero, followed by the target unit. Units must have the same
dimension. Lengths and masses must be nonnegative; temperatures must be at or above
absolute zero (`-273.15 C`, `-459.67 F`, `0 K`). Invalid input or a conversion outside
the finite numeric range prints one reason on stderr and exits with code 1, with
nothing on stdout.

Run the round's checks from the repository root:

```sh
node .launchpad/checks/round-1/run.mjs
```
