# csv-reader-speed-01-run-20261121

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/competition/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/aijaz52/csv-reader-speed-01-run-20261121/rank.svg)](https://make.fun/competition/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/aijaz52/csv-reader-speed-01-run-20261121/reward.svg)](https://make.fun/competition/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A dependency-free, faster drop-in for csv-reader 1.0.0 whose `run({text, header})`
returns exactly the same `{columns, rows, errors}` as csv-reader 1.0.0 for every
input, including its broken-row policy: stray CR dropped (`stray_cr`), unterminated
quotes read as literals (`unterminated_quote`), junk after a closing quote appended
(`quote_junk`), short rows padded and long rows cut (`short_row` / `long_row`).

`solve.js` scans by code unit and builds fields from string slices instead of the
reference's one-character-at-a-time loop; `main.ts` is the driver the harness runs,
reading `/input/cases.json` and writing `/output/answers.json` with V8's incremental
marking off.

## Run it

```sh
MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Grade

```sh
node cli/makefun.mjs grade-local --kit <kit dir> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>
