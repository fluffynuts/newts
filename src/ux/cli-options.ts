import { queryGitConfig } from "./query-git-config";
import path from "path";
import { folderExists } from "../fs";
import { isPartOfGitRepo } from "../git";

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
}

async function suggestDefaultOutput(): Promise<string | undefined> {
    const test = process.cwd();
    return await isPartOfGitRepo(test)
        ? undefined
        : test
}

export async function generateDefaults(): Promise<CliOptions> {
    return {
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
    };
}
