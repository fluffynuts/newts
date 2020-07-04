#!/usr/bin/env node
import { newts } from "./newts";
import { ConsoleFeedback } from "./console-feedback";
import { validateName } from "./validate-name";
import chalk from "chalk";
import { gatherArgs } from "./ux/gather-args";
import { ask } from "./ux/ask";
import { generateDefaults, isPartOfGitRepo } from "./ux/cli-options";
import { BootstrapOptions } from "./types";

function isEmpty(s: string | null | undefined): boolean {
    return (s || "").trim() === "";
}

(async () => {
    const
        feedback = new ConsoleFeedback(),
        defaults = await generateDefaults(),
        argv = gatherArgs(defaults["author-name"], defaults["author-email"]);

    if (!(argv.name || "").trim()) {
        argv.name = await ask(
            "Please give me a name for this module",
            s => !isEmpty(s)
        );
    }
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

    const opts = {
        skipTsConfig: false,
        includeZarro: argv["install-zarro"],
        includeLinter: argv["install-linter"],
        includeExpectEvenMoreJest: argv["install-matchers"],
        includeFaker: argv["install-faker"],
        includeJest: argv["install-jest"],
        initializeGit: argv["init-git"],
        name: argv.name,
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
