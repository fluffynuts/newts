# NEWTS

literally: `"new ts"`

Bootstraps a TypeScript npm module project

## Why?

Because I'm making enough of them that:
1. I see a pattern
2. I'm tired of manually repeating that pattern


## Status

- try `npx newts --help` for all options
- easiest use: `npx newts`
    - will run interactive
- specify some options and add `--interactive`, 
    - eg `npx newts --output /path/to/code --interactive` 
        - sets output and prompts for other config
- also simple: `npx newts --defaults`
    - will ask for a project name
    - may ask for an output folder (if the current one is under git control)
    - will run with defaults:
        - initialize git
            - with relevant .gitignore
        - dev-packages
            - typescript
            - jest
            - faker
            - npm-run-all
            - tslint (for now, until eslint behaves as expected)
            - zarro (for build)
            - relevant @types packages
        - tsconfig.json
            - outputs to dist
            - includes types
        - tslint.json
        - license: BSD-3-Clause
        - skeleton README.md
        - package.json
            - scripts
                - build
                - release
                - release-beta
                - lint
            - author info (according to git)
            - set up files from dist folder
            - set version to 0.0.1

## Show me!
![interactive demo](newts-interactive.gif)
