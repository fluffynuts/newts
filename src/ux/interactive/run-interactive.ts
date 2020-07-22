import { CliOptions } from "../cli-options";
import chalk from "ansi-colors";
import { nameIsAvailableAtNpmJs } from "./validators/name-is-available-at-npm-js";
import inquirer from "inquirer";
import { required } from "./validators/required";
import { runValidators, Validator } from "./run-validators";
import { isValidPackageName } from "./validators/is-valid-package-name";
import { isNotInGitRepo } from "./validators/is-not-in-git-repo";
import { Func } from "../../types";
import { noneOrValidEmail } from "./validators/none-or-valid-email";
import { listLicenses } from "../licenses";

inquirer.registerPrompt(
    "autocomplete",
    require("inquirer-autocomplete-prompt")
);

type AsyncFunc<TIn, TOut> = (input: TIn) => Promise<TOut>;

export async function runInteractive(
    currentOptions: CliOptions,
    defaultOptions: CliOptions,
    verifying?: boolean
): Promise<CliOptions> {
    const licenses = await listLicenses();
    licenses.push("none");
    const inquirerResult = await inquirer.prompt([
        prompt("name", undefined, required, isValidPackageName, value => {
            if (!currentOptions["verify-name-available"]) {
                return true;
            }
            return nameIsAvailableAtNpmJs(value);
        }),
        prompt("output", undefined, isNotInGitRepo),
        prompt("author-name", notRunningDefaults, required),
        prompt("author-email", notRunningDefaults, noneOrValidEmail),
        {
            type: "autocomplete",
            name: "license",
            when: () => {
                return verifying ||
                    (!currentOptions.defaults && !currentOptions.license);
            },
            message: q("license"),
            source: async (_: any, input: string) =>
                input === undefined
                    ? [defaultOptions.license]
                    : licenses.filter(l => l.match(new RegExp(input, "i")))
        },
        yesNo("cli"),
        yesNoWhen("install-yargs", a => !!a.cli),
        yesNo("install-jest"),
        listWhen("test-environment", ["node", "jsdom"], a => !!a["install-jest"]),
        yesNoWhen("test-script", a => !!a["install-jest"]),
        yesNoWhen("install-faker", a => !!a["install-jest"]),
        yesNoWhen("install-matchers", a => !!a["install-jest"]),
        yesNo("install-linter"),
        yesNo("init-git"),
        yesNo("init-readme"),
        yesNo("build-script"),
        yesNo("install-zarro"),
        yesNoWhen("release-scripts", a => !!a["install-zarro"]),
    ]);

    const result = {
        ...currentOptions,
        ...inquirerResult
    };

    setUndefinedIfIsNone(
        result,
        ...noneableOptions
    );

    const verifyResult = await verifyConfig(result);
    switch (verifyResult) {
        case "modify":
            return runInteractive(result, result, true);
        case "ok":
            return result;
        case "quit":
            process.exit(1);
    }

    function notRunningDefaults(a: CliOptions) {
        return !a.defaults;
    }

    function notSet(setting: keyof CliOptions): Func<any, boolean> {
        return a => currentOptions[setting] === undefined &&
            a[setting] === undefined
    }

    function yesNo(
        name: keyof CliOptions
    ) {
        return {
            name,
            type: "confirm",
            default: defaultOptions[name],
            message: q(name),
            when: (a: any) =>
                verifying ||
                (notRunningDefaults(a) &&
                    notSet(name)(a))
        }
    }

    function listWhen(
        name: keyof CliOptions,
        choices: string[],
        when: Func<any, boolean> | AsyncFunc<any, boolean>) {
        return {
            name,
            message: q(name),
            type: "list",
            choices,
            when: async (a: any) => {
                return verifying || await when(a)
            }
        }
    }

    function yesNoWhen(
        name: keyof CliOptions,
        when: Func<any, boolean> | AsyncFunc<any, boolean>) {
        return {
            name,
            type: "confirm",
            default: defaultOptions[name],
            message: q(name),
            when: async (a: any) => {
                if (verifying) {
                    return true;
                }
                return notRunningDefaults(a) &&
                    await notSet(name)(a) &&
                    await when(a)
            }
        }
    }

    function prompt<T>(
        name: keyof CliOptions,
        when?: Func<any, boolean> | AsyncFunc<any, boolean>,
        ...validators: Validator<T>[]
    ) {
        return {
            name,
            when: async (values: any) => {
                if (verifying) {
                    return true;
                }
                if (!when) {
                    when = () => true;
                }
                return await when(values) &&
                    notSet(name)(values);
            },
            message: q(name),
            default: defaultOptions[name],
            validate: async (value: T) => {
                return await runValidators(
                    value,
                    ...validators
                )
            }
        };
    }
}

function setUndefinedIfIsNone(
    opts: CliOptions,
    ...keys: (keyof CliOptions)[]) {
    keys.forEach(k => {
        if (opts[k] === "none") {
            opts[k] = undefined
        }
    });
}

function q(setting: keyof CliOptions): string {
    const hint = noneableOptions.indexOf(setting) > -1
        ? " (enter 'none' to skip)"
        : "";
    return !!optionLabels[setting]
        ? `${ optionLabels[setting] }${ hint } ?`
        : `[[ ${ setting } ]] ??`;
}

async function verifyConfig(config: CliOptions): Promise<"ok" | "modify" | "quit"> {
    const lines = optionOrder.map(o => {
        const label = verifyLabels[o] || optionLabels[o];
        if (stringOptions.indexOf(o) > -1) {
            return `${ label }: ${ chalk.yellow(config[o] as string) }`;
        } else {
            const marker = config[o]
                ? chalk.green("yes")
                : chalk.red("no");
            return `${ label }: ${ marker }`;
        }
    });
    lines.forEach(line => console.log(line));
    const ans = await inquirer.prompt([{
        name: "value",
        message: "Proceed with the above configuration?",
        type: "list",
        choices: [
            "ok",
            "modify",
            "quit"
        ]
    }]);
    return ans.value;
}

type OptionLabels = {
    [key in keyof CliOptions]: string;
};

const optionOrder: (keyof CliOptions)[] = [
    "name",
    "output",
    "author-name",
    "author-email",
    "license",
    "cli",
    "install-yargs",
    "install-jest",
    "test-environment",
    "test-script",
    "install-faker",
    "install-matchers",
    "install-linter",
    "build-script",
    "install-zarro",
    "release-scripts"
];

const stringOptions: (keyof CliOptions)[] = [
    "name",
    "output",
    "author-name",
    "author-email",
    "license",
    "test-environment"
];

const noneableOptions: (keyof CliOptions)[] = [
    "author-name",
    "author-email",
    "license"
];

const optionLabels: OptionLabels = {
    name: "project name",
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
    "test-environment": "test environment (select jsdom for browser-like testing)"
};

const verifyLabels: OptionLabels = {
    "test-environment": "test environment"
}
