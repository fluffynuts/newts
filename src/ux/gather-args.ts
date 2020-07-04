import yargs = require("yargs");
import { CliOptions } from "./cli-options";

export function gatherArgs(
    defaultAuthor?: string,
    defaultEmail?: string
): CliOptions {
    return yargs
        .option("name", {
            alias: "n",
            type: "string",
            description: "name of the module to create"
        })
        .option("output", {
            alias: "o",
            type: "string",
            description: "where to create this module folder (defaults to the current folder)",
            default: process.cwd()
        })
        .option("license", {
            description: "select license (provide SPDX identifier, try --help-licenses for a list or 'none' / 'unlicensed' for no license)",
            default: "BSD-3-Clause", // my preference, for my tool (:
        })
        .option("author-name", {
            description: "sets the authorName name for the package.json",
            default: defaultAuthor
        })
        .option("author-email", {
            description: "sets the authorName email for the package.json",
            default: defaultEmail
        })
        .option("install-faker", { description: "install fakerjs for awesome testing", boolean: true })
        .option("install-yargs", { description: "install yargs (only applies if --cli specified)", boolean: true })
        .option("install-linter", { description: "install a linter", boolean: true })
        .option("install-node-types", { description: "install @types/node as a dev-dep (recommended)", boolean: true })
        .option("install-jest", { description: "install jest and @types/jest", boolean: true })
        .option("install-matchers", {
            description: "install expect-even-more-jest for more jest matchers",
            boolean: true
        })
        .option("install-zarro", {
            description: "install zarro: the zero-to-low-conf framework for build, built on gulp (required to set up publish scripts)",
            boolean: true
        })
        .option("init-git", { description: "initialize git", boolean: true })
        .option("cli", { description: "set up as a CLI script", boolean: true })
        .option("start-script", {
            description: "set up a 'start' npm script against your cli entry point (only applies if --cli specified)",
            boolean: true
        })
        .option("init-readme", { description: "generate README.md", boolean: true })
        .option("build-script", { description: "set up a 'build' npm script (recommended)", boolean: true })
        .option("release-scripts", {
            description: "set up 'release' and 'release-beta' scripts (only applies if zarro is installed)",
            boolean: true
        })
        .option("test-script", {
                description: "set up a 'test' script (only applies if jest is installed)",
                boolean: true
            }
        ).argv;
}
