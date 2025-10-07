- update -cli.ts generator
  - return just the options, with `as TOptions`
  - yargs to be called as `yargs(process.argv.slice(2)).`

  generate-index.js
  - should omit src/index.ts
