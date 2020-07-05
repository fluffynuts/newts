#!/usr/bin/env node
import { newts } from "./newts";
import { ConsoleFeedback } from "./ux/console-feedback";
import { validateName } from "./validate-name";
import chalk from "chalk";
import { gatherArgs } from "./ux/gather-args";
import { ask } from "./ux/ask";
import { applyDefaults, CliOptions, generateDefaults } from "./ux/cli-options";
import { BootstrapOptions, Feedback } from "./types";
import { listLicenses, readLicense } from "./ux/licenses";
import { isPartOfGitRepo } from "./git";

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
    } catch (e) {
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

function convertCliOptionsToBootstrapOptions(
    argv: CliOptions,
    feedback: Feedback
): BootstrapOptions {
    return {
        skipTsConfig: false,
        includeZarro: argv["install-zarro"],
        includeLinter: argv["install-linter"],
        includeExpectEvenMoreJest: argv["install-matchers"],
        includeFaker: argv["install-faker"],
        includeJest: argv["install-jest"],
        initializeGit: argv["init-git"],
        name: argv.name || "",
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
    };
}

(async () => {
    const
        feedback = new ConsoleFeedback(),
        defaultOptions = await generateDefaults(),
        argv = gatherArgs(defaultOptions);

    await printLicensesIfRequired(argv, feedback);
    await printLicenseIfRequired(argv, feedback);

    // should check for and perhaps do interactive mode around here

    const consoleOptions = await applyDefaults(argv)
    await ensureName(consoleOptions);
    await ensureOutput(consoleOptions, feedback);

    const opts = convertCliOptionsToBootstrapOptions(consoleOptions, feedback);

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
