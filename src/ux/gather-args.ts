import yargs = require("yargs");
import { CliOptions } from "./cli-options";

const defaultLicense = "BSD-3-Clause";

export function gatherArgs(
    defaults: CliOptions
): CliOptions {
    return yargs
        .usage(`Usage: $0 [options]
  negate any boolean option by prepending --no
  eg to skip git init, run with --no-init-git
    - options marked with * are defaulted ON
    - options marked with ** are required
`)
        .option("author-email", {
            description: "sets the authorName email for the package.json",
            default: defaults["author-email"]
        })
        .option("author-name", {
            description: "sets the authorName name for the package.json",
            default: defaults["author-name"]
        })
        .option("build-script", {
            description: "set up a 'build' npm script *",
            boolean: true
        })
        .option("cli", {
            description: "set up as a CLI script",
            boolean: true,
        })
        .option("init-git", {
            description: "initialize git *",
            boolean: true
        })
        .option("init-readme", {
            description: "generate README.md *",
            boolean: true
        })
        .option("install-faker", {
            description: "install fakerjs for awesome testing *",
            boolean: true
        })
        .option("install-jest", {
            description: "install jest and @types/jest *",
            boolean: true
        })
        .option("install-linter", {
            description: "install a linter *",
            boolean: true
        })
        .option("install-matchers", {
            description: "install expect-even-more-jest for more jest matchers *",
            boolean: true
        })
        .option("install-node-types", {
            description: "install @types/node as a dev-dep *",
            boolean: true
        })
        .option("install-yargs", {
            description: "install yargs (only applies if --cli specified) *",
            boolean: true
        })
        .option("install-zarro", {
            description: "install zarro (required to set up publish scripts) *",
            boolean: true
        })
        .option("list-licenses", {
            description: "show a list of known SPDX license identifiers",
            boolean: true
        })
        .option("show-license", {
            description: "print out the specified license",
            type: "string"
        })
        .option("license", {
            description: `select license (provide SPDX identifier, try --list-licenses for a list or 'none' / 'unlicensed' for no license), defaults to ${defaultLicense}`,
            type: "string"
        })
        .option("name", {
            alias: "n",
            type: "string",
            description: "name of the module to create **"
        })
        .option("output", {
            alias: "o",
            type: "string",
            description: "where to create this module folder (defaults to the current folder) **"
        })
        .option("release-scripts", {
            description: "set up 'release' and 'release-beta' scripts (only applies if zarro is installed) *",
            boolean: true
        })
        .option("start-script", {
            description: "set up a 'start' npm script against your cli entry point (only applies if --cli specified) *",
            boolean: true
        })
        .option("test-script", {
            description: "set up a 'test' script (only applies if jest is installed) *",
            boolean: true
        })
        .option("defaults", {
            alias: "d",
            description: "run with defaults",
            boolean: true
        }).argv;
}
