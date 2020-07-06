import { CliOptions } from "../cli-options";
import { Fetcher, HasValue } from "./types";
import { askForLicense } from "./ask-for-license";
import { askForName } from "./ask-for-name";
import { askForOutput } from "./ask-for-output";
import { askForAuthorName } from "./ask-for-author-name";
import { askForAuthorEmail } from "./ask-for-author-email";
import { askYesNo, confirm } from "./ask-yes-no";
import chalk from "chalk";
import { nameIsAvailableAtNpmJs } from "./validators/name-is-available-at-npm-js";

export async function runInteractive(
    currentOptions: CliOptions,
    defaultOptions: CliOptions
): Promise<CliOptions> {
    const result = { ...currentOptions } as CliOptions;
    await fillMissing(result, defaultOptions, "name", askForName);
    const isAvailable = await nameIsAvailableAtNpmJs(result.name as string);
    if (!isAvailable) {
        const useClashingName = (await confirm(
            chalk.red(`package name ${ result.name } is already reserved at npmjs.com -- use it anyway?`),
            false
        )).value;
        if (!useClashingName) {
            currentOptions.name = undefined;
            return runInteractive(currentOptions, defaultOptions)
        }
    }
    await fillMissing(result, defaultOptions, "output", askForOutput);
    await fillMissing(result, defaultOptions, "license", askForLicense);
    await fillMissing(result, defaultOptions, "author-name", askForAuthorName);
    await fillMissing(result, defaultOptions, "author-email", askForAuthorEmail);

    await fillYesNo("cli", `is ${ result.name } a cli app?`);
    if (result.cli) {
        await fillYesNo("install-yargs");
    }

    await fillYesNo("install-jest");
    if (result["install-jest"]) {
        await fillYesNo("test-script");
        await fillYesNo("install-faker");
        await fillYesNo("install-matchers");
    }

    await fillYesNo("install-linter");

    await fillYesNo("init-git");
    await fillYesNo("init-readme");

    await fillYesNo("build-script");
    await fillYesNo("install-zarro");
    if (result["install-zarro"]) {
        await fillYesNo("release-scripts");
    }

    // TODO: verify all-good, possibly repeat

    if (await verifyConfig(result)) {
        return result;
    }
    return runInteractive(result, defaultOptions);

    async function fillYesNo(setting: keyof CliOptions, label?: string) {
        const lbl = label ?? q(setting);
        return fillMissing(result, defaultOptions, setting,
            () => askYesNo(lbl, setting, defaultOptions)
        );
    }
}

function q(setting: keyof CliOptions): string {
    return `${ optionLabels[setting] }?`;
}

async function verifyConfig(config: CliOptions): Promise<boolean> {
    const lines = optionOrder.map(o => {
        if (typeof config[o] === "string") {
            return `${ optionLabels[o] }: ${ chalk.yellow(config[o]) }`;
        } else {
            const marker = config[o]
                ? chalk.green("yes")
                : chalk.red("no");
            return `${ optionLabels[o] }: ${ marker }`;
        }
    });
    lines.forEach(line => console.log(line));
    return (
        await confirm("Proceed with the above configuration?", true)
    ).value;
}

type OptionLabels = {
    [key in keyof CliOptions]: string;
};

const optionOrder: (keyof CliOptions)[] = [
    "name",
    "output",
    "author-name",
    "author-name",
    "license",
    "cli",
    "install-yargs",
    "install-jest",
    "test-script",
    "install-faker",
    "install-matchers",
    "install-linter",
    "build-script",
    "install-zarro",
    "release-scripts"
];

const optionLabels: OptionLabels = {
    output: "create project at",
    "author-name": "author name",
    "author-email": "author email",
    license: "project license",
    cli: "command-line app",
    "install-yargs": "install yargs",
    "init-git": "initialize git",
    "init-readme": "initialize README.md",
    "install-jest": "test with jest",
    "install-faker": "install faker.js",
    "install-matchers": "install extra jest matchers",
    "install-linter": "install linter",
    "install-zarro": "install zarro build scaffolding",
    "build-script": "setup build script",
    "test-script": "setup test script",
    "release-scripts": "setup release scripts",
};

async function fillMissing<T>(
    currentOptions: CliOptions,
    defaultOptions: CliOptions,
    key: keyof CliOptions,
    fetcher: Fetcher<HasValue<T>>) {
    if (currentOptions[key] !== undefined) {
        return;
    }
    const result = await fetcher(defaultOptions);
    currentOptions[key] = result.value as any;
}
