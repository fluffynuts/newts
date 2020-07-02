#!/usr/bin/env node
import yargs = require("yargs");
import { BootstrapOptions, newts } from "./newts";
import { ConsoleFeedback } from "./console-feedback";
import { validateName } from "./validate-name";
import chalk from "chalk";

function gatherArgs() {
    return yargs.option("name", {
        alias: "n",
        description: "name of the module to create"
    }).option("where", {
        alias: "w",
        description: "where to create this module folder (defaults to the current folder)",
        default: process.cwd()
    }).option("no-faker", {
        type: "boolean",
        description: "don't install fakerjs for awesome testing",
        default: false
    }).option("no-linter", {
        type: "boolean",
        description: "don't install a linter",
        default: false
    }).option("no-node-types", {
        description: "don't install @types/node as a dev-dependency",
        default: false
    }).option("no-jest", {
        description: "don't install jest and @types/jest",
        default: false
    }).option("no-extra-matchers", {
        description: "don't install expect-even-more-jest for more jest matchers",
        default: false
    }).option("no-zarro", {
        description: "don't install zarro: the zero-to-low-conf framework for build, built on gulp (required to set up publish scripts)",
        default: false
    }).option("no-git", {
        alias: "g",
        description: "don't initialize git",
        default: false
    }).option("cli", {
        description: "set up as CLI script",
        default: false
    }).argv;
}

function ask(q: string): Promise<string> {
    process.stdout.write(`${ q }: `);
    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise(resolve => {
        rl.on("line", (line: string) => {
            resolve(line.trim());
        });
    });
}

(async () => {
    const argv = gatherArgs();

    while (!((argv.name as string) || "").trim()) {
        argv.name = await ask("Please give me a name for this module");
    }
    const feedback = new ConsoleFeedback();

    const opts = {
        skipTsConfig: false,
        includeZarro: !argv["no-zarro"],
        includeLinter: !argv["no-linter"],
        includeExpectEvenMoreJest: !argv["no-extra-matchers"],
        includeFaker: !argv["no-faker"],
        includeJest: !argv["no-jest"],
        initializeGit: !argv["no-git"],
        name: argv.name,
        where: argv.where,
        // TODO: make these options
        includeNodeTypes: true,
        setupBuildScript: true,
        setupPublishScripts: true,
        setupTestScript: true,
        feedback,
    } as BootstrapOptions;

    try {
        await validateName(argv.name as string, feedback);
        await newts(opts);
        process.exit(0);
    } catch (e) {
        if (typeof e.message === "string") {
            console.error(chalk.red(e.message));
        } else {
            console.error(e);
        }
        process.exit(1);
    }

})();
