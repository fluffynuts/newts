#!/usr/bin/env node
import { newts } from "./newts";
import { ConsoleFeedback } from "./ux/console-feedback";
import { nameIsAvailableAtNpmJs } from "./ux/interactive/validators/name-is-available-at-npm-js";
import chalk from "ansi-colors";
import { gatherArgs } from "./ux/gather-args";
import { ask } from "./ux/ask";
import { applyDefaults, CliOptions, generateDefaults } from "./ux/cli-options";
import { NewtsOptions, Feedback } from "./types";
import { listLicenses, readLicense } from "./ux/licenses";
import { isPartOfGitRepo } from "./git";
import { runInteractive } from "./ux/interactive/run-interactive";

function isEmpty(s: string | null | undefined): boolean {
    return (s || "").trim() === "";
}

async function printLicensesIfRequired(
    argv: CliOptions,
    feedback: Feedback) {
    if (!argv["list-licenses"]) {
        return
    }
    const licenses = await listLicenses();
    licenses.forEach(feedback.log.bind(feedback));
    process.exit(0);
}

async function printLicenseIfRequired(argv: CliOptions, feedback: Feedback) {
    if (argv["show-license"] === undefined) {
        return;
    }
    try {
        const
            id = argv["show-license"],
            licenseText = await readLicense(id);
        feedback.log(licenseText);
        feedback.log(`\nfor more information, see: https://opensource.org/licenses/${ id }`);
        process.exit(0);
    } catch (err) {
        const e = err as Error;
        if ((e.message || "").startsWith("unknown license:")) {
            feedback.error(e.message);
            process.exit(1);
        }
        throw e;
    }
}

async function ensureName(argv: CliOptions) {
    if (!(argv.name || "").trim()) {
        argv.name = await ask(
            "Please give me a name for this module",
            s => !isEmpty(s)
        );
    }
}

async function ensureOutput(argv: CliOptions, feedback: Feedback) {
    if (!(argv.output || "").trim()) {
        argv.output = await ask(
            "Please specify an output folder for this module",
            async (s) => {
                if (isEmpty(s)) {
                    return false;
                }
                if (await isPartOfGitRepo(s)) {
                    feedback.warn("Please select a folder which is not already part of a git repository");
                    return false;
                }
                return true;
            }
        );
    }
}

export function convertCliOptionsToBootstrapOptions(
    argv: CliOptions,
    feedback: Feedback
): NewtsOptions {
    return {
        skipTsConfig: false,
        includeZarro: argv["install-zarro"],
        includeLinter: argv["install-linter"],
        includeExpectEvenMoreJest: argv["install-matchers"],
        includeFaker: argv["install-faker"],
        includeJest: argv["install-jest"],
        initializeGit: argv["init-git"],
        name: argv.name || "",
        description: argv.description,
        where: argv.output,
        isCommandline: argv.cli,
        includeYargs: argv["install-yargs"],
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
        verifyNameAvailable: argv["verify-name-available"]
    };
}

export function shouldRunInteractive(argv: CliOptions) {
    return argv.interactive ||
        !(argv.name || "").trim() ||
        !(argv.output || "").trim();
}

(async () => {
    if (!!global.jasmine) {
        // running in a test due to an import
        return;
    }
    const
        feedback = new ConsoleFeedback(),
        defaultOptions = await generateDefaults(),
        rawArgv = gatherArgs(defaultOptions),
        interactive = shouldRunInteractive(rawArgv),
        shouldApplyDefaults = rawArgv.defaults;
    const argv = shouldApplyDefaults
        ? await applyDefaults(rawArgv)
        : rawArgv;
    if (rawArgv["verify-name-available"] === undefined) {
        rawArgv["verify-name-available"] = defaultOptions["verify-name-available"];
    }
    await printLicensesIfRequired(argv, feedback);
    await printLicenseIfRequired(argv, feedback);

    if (argv.name && rawArgv["verify-name-available"]) {
        if (await nameIsAvailableAtNpmJs(argv.name) !== true) {
            console.error(`${argv.name} is already reserved at npmjs.com! Please pick another name.`);
            argv.name = undefined;
        }
    }
    const consoleOptions = interactive
        ? await runInteractive(argv, defaultOptions)
        : argv;

    await ensureName(consoleOptions);
    await ensureOutput(consoleOptions, feedback);

    const opts = convertCliOptionsToBootstrapOptions(consoleOptions, feedback);

    try {
        const isValid =
            !argv["verify-name-available"] ||
            await nameIsAvailableAtNpmJs(argv.name as string);
        if (!isValid) {
            feedback.warn(`package name ${argv.name} is already reserved at npmjs.com`);
            process.exit(1);
        }
        await newts(opts);
        process.exit(0);
    } catch (err) {
        const e = err as Error;
        if (typeof e.message === "string") {
            console.error(chalk.red(e.message));
            console.error(e.stack);
        } else {
            console.error(e);
        }
        process.exit(1);
    }

})();
