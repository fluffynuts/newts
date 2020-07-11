import { queryGitConfig } from "./query-git-config";
import { isPartOfGitRepo } from "../git";
import { Dictionary } from "../types";

export interface CliOptions {
    name?: string;
    output?: string;
    license?: string;
    "author-name"?: string;
    "author-email"?: string;
    "install-faker"?: boolean;
    "install-yargs"?: boolean;
    "install-linter"?: boolean;
    "install-node-types"?: boolean;
    "install-jest"?: boolean;
    "install-matchers"?: boolean;
    "install-zarro"?: boolean;
    "init-git"?: boolean;
    cli?: boolean;
    "start-script"?: boolean;
    "init-readme"?: boolean;
    "build-script"?: boolean;
    "release-scripts"?: boolean;
    "test-script"?: boolean;
    "list-licenses"?: boolean;
    "show-license"?: string;
    interactive?: boolean;
    defaults?: boolean;
    "test-environment"?: string;
    "verify-name-available"?: boolean
}

let defaultOptions: CliOptions;

async function suggestDefaultOutput(): Promise<string | undefined> {
    const test = process.cwd();
    return await isPartOfGitRepo(test)
        ? undefined
        : test
}

export async function generateDefaults(): Promise<CliOptions> {
    if (defaultOptions) {
        return defaultOptions;
    }
    return defaultOptions = {
        name: undefined,
        output: await suggestDefaultOutput(),
        license: "BSD-3-Clause",
        "author-name": await queryGitConfig("user.name"),
        "author-email": await queryGitConfig("user.email"),
        "install-faker": true,
        "install-yargs": true,
        "install-linter": true,
        "install-node-types": true,
        "install-jest": true,
        "install-matchers": true,
        "install-zarro": true,
        "init-git": true,
        cli: false,
        "start-script": true,
        "init-readme": true,
        "build-script": true,
        "release-scripts": true,
        "test-script": true,
        "list-licenses": false,
        "interactive": false,
        defaults: false,
        "verify-name-available": true,
        "test-environment": "node"
    };
}

export async function applyDefaults(
    options: CliOptions
): Promise<CliOptions> {
    const defaults = await generateDefaults();
    return Object.keys(defaults)
        .reduce(
            (acc, cur) => {
                const k = cur as keyof CliOptions;
                if (acc[k] === undefined) {
                    acc[k] = defaults[k];
                }
                return acc;
            }, { ...options } as Dictionary<any>
        ) as CliOptions;
}
