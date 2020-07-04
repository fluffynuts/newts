import yargs = require("yargs");
import { CliOptions } from "./cli-options";

export function gatherArgs(
    defaults: CliOptions,
): CliOptions {
    return yargs
        .usage("Usage: $0 [options]\n  negate any boolean option by prepending --no,\n  eg to skip git init, run with --no-init-git")
        .option("author-email", {
            description: "sets the authorName email for the package.json",
            default: defaults["author-email"]
        })
        .option("author-name", {
            description: "sets the authorName name for the package.json",
            default: defaults["author-name"]
        })
        .option("build-script", {
            description: "set up a 'build' npm script (recommended)",
            boolean: true,
            default: defaults["build-script"]
        })
        .option("cli", {
            description: "set up as a CLI script",
            boolean: true,
            default: defaults["cli"]
        })
        .option("init-git", {
            description: "initialize git",
            boolean: true,
            default: defaults["init-git"]
        })
        .option("init-readme", {
            description: "generate README.md",
            boolean: true,
            default: defaults["init-readme"]
        })
        .option("install-faker", {
            description: "install fakerjs for awesome testing",
            boolean: true,
            default: defaults["install-faker"]
        })
        .option("install-jest", {
            description: "install jest and @types/jest",
            boolean: true,
            default: defaults["install-jest"]
        })
        .option("install-linter", {
            description: "install a linter",
            boolean: true,
            default: defaults["install-linter"]
        })
        .option("install-matchers", {
            description: "install expect-even-more-jest for more jest matchers",
            boolean: true,
            default: defaults["install-matchers"]
        })
        .option("install-node-types", {
            description: "install @types/node as a dev-dep",
            boolean: true,
            default: defaults["install-node-types"]
        })
        .option("install-yargs", {
            description: "install yargs (only applies if --cli specified)",
            boolean: true,
            default: defaults["install-yargs"]
        })
        .option("install-zarro", {
            description: "install zarro: the zero-to-low-conf framework for build, built on gulp (required to set up publish scripts)",
            boolean: true,
            default: defaults["install-zarro"]
        })
        .option("list-licenses", {
            description: "show a list of known SPDX license identifiers",
            boolean: true,
            default: defaults["list-licenses"]
        })
        .option("show-license", {
            description: "print out the specified license",
            type: "string"
        })
        .option("license", {
            description: "select license (provide SPDX identifier, try --list-licenses for a list or 'none' / 'unlicensed' for no license)",
            default: defaults["license"]
        })
        .option("name", {
            alias: "n",
            type: "string",
            description: "name of the module to create"
        })
        .option("output", {
            alias: "o",
            type: "string",
            description: "where to create this module folder (defaults to the current folder)"
        })
        .option("release-scripts", {
            description: "set up 'release' and 'release-beta' scripts (only applies if zarro is installed)",
            boolean: true,
            default: defaults["release-scripts"]
        })
        .option("start-script", {
            description: "set up a 'start' npm script against your cli entry point (only applies if --cli specified)",
            boolean: true,
            default: defaults["start-script"]
        })
        .option("test-script", {
            description: "set up a 'test' script (only applies if jest is installed)",
            boolean: true,
            default: defaults["test-script"]
        }).argv;
}
