#!/usr/bin/env node
import yargs = require("yargs");
import { BootstrapOptions, newts, Dictionary } from "./newts";
import { ConsoleFeedback } from "./console-feedback";
import { validateName } from "./validate-name";
import chalk from "chalk";
import { spawn } from "./spawn";

function flag(description: string, alias?: string, defaultValue?: boolean) {
    const result = {
        description,
        default: defaultValue ?? true,
        boolean: true
    } as Dictionary<any>;
    if (alias !== undefined) {
        result.alias = alias;
    }
    return result;
}

function gatherArgs(
    defaultAuthor: string,
    defaultEmail: string
) {
    return yargs.option("name", {
        alias: "n",
        description: "name of the module to create"
    }).option("output", {
        alias: "o",
        description: "where to create this module folder (defaults to the current folder)",
        default: process.cwd()
    }).option("license", {
        description: "select license (provide SPDX identifier, try --help-licenses for a list or 'none' / 'unlicensed' for no license)",
        default: "BSD-3-Clause", // my preference, for my tool (:
    }).option("author-name", {
        description: "sets the authorName name for the package.json",
        default: defaultAuthor
    }).option("author-email", {
        description: "sets the authorName email for the package.json",
        default: defaultEmail
    }).option("install-faker", flag("install fakerjs for awesome testing")
    ).option("install-linter", flag("install a linter")
    ).option("install-node-types", flag("install @types/node as a dev-dep")
    ).option("install-jest", flag("install jest and @types/jest")
    ).option("install-extra-matchers", flag("install expect-even-more-jest for more jest matchers")
    ).option("include-zarro", flag("install zarro: the zero-to-low-conf framework for build, built on gulp (required to set up publish scripts)")
    ).option("init-git", flag("initialize git")
    ).option("command-line", flag("set up as a CLI script", "c", false)
    ).option("start-script", flag("set up a 'start' npm script against your cli entry point (only applies if --cli specified)")
    ).option("init-readme", flag("generate README.md")
    ).option("install-node-types", flag("install @types/node (recommended)")
    ).option("build-script", flag("set up a 'build' npm script (recommended)")
    ).option("release-scripts", flag("set up 'release' and 'release-beta' scripts (only applies if zarro is installed)")
    ).option("test-script", flag("set up a 'test' script (only applies if jest is installed)")
    ).argv;
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

async function queryGitConfig(key: string): Promise<string> {
    try {
        const
            result = await spawn("git", ["config", "--get", key]),
            allLines = result.stdout.concat(result.stderr)
                .map(l => (l || "").trim())
                .filter(l => !!l);
        // git outputs config info on stderr, which _surely_ is a mistake?
        // -> just in case, let's take _all_ output and select the first non-empty line
        return (allLines[0] || "").trim();
    } catch (e) {
        return "";
    }
}

(async () => {
    const
        author = await queryGitConfig("user.name"),
        email = await queryGitConfig("user.email"),
        argv = gatherArgs(author, email);

    while (!((argv.name as string) || "").trim()) {
        argv.name = await ask("Please give me a name for this module");
    }
    const feedback = new ConsoleFeedback();

    const opts = {
        skipTsConfig: false,
        includeZarro: argv["install-zarro"],
        includeLinter: argv["install-linter"],
        includeExpectEvenMoreJest: argv["install-extra-matchers"],
        includeFaker: argv["install-faker"],
        includeJest: argv["install-jest"],
        initializeGit: argv["init-git"],
        name: argv.name,
        where: argv.output,
        isCommandline: argv["command-line"],
        addStartScript: argv["start-script"],
        license: argv.license,
        skipReadme: !argv["init-readme"],
        authorEmail: argv["author-email"],
        authorName: argv["author-name"],
        feedback,
        includeNodeTypes: argv["install-node-types"],
        setupBuildScript: argv["build-script"],
        setupReleaseScripts: argv["release-scripts"],
        setupTestScript: argv["test-script"],
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
