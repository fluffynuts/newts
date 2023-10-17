import * as spawnModule from "../../src/spawn";

jest.doMock("../../src/spawn", () => spawnModule);

import { Sandbox } from "filesystem-sandbox";
import faker from "faker";
import path from "path";
import { newts } from "../../src/newts";
import { promises } from "fs";
import { NewtsOptions } from "../../src/types";
import { SpawnOptions } from "child_process";
const { spyOn } = jest;

const { readFile } = promises;

export function readTextFile(at: string): Promise<string> {
    return readFile(at, { encoding: "utf8" });
}

export async function init() {
    const
        sandbox = await Sandbox.create(),
        name = faker.random.alphaNumeric(5);
    return {
        name,
        sandbox,
        where: sandbox.path,
        tslintPath: path.join(sandbox.path, name, "tslint.json"),
        tsconfigPath: path.join(sandbox.path, name, "tsconfig.json"),
        packageJsonPath: path.join(sandbox.path, name, "package.json"),
        gitignorePath: path.join(sandbox.path, name, ".gitignore"),
        jestConfigPath: path.join(sandbox.path, name, "jest.config.js")
    }
}

export type NpmInstallModifier = undefined | ((args: string[]) => string[]);

export const shared = {
    fakeGit: true,
    allowNpmRun: false,
    npmInstallModifier: undefined as NpmInstallModifier,
    spawnModule
}

beforeEach(() => {
    mockSpawn();
});

export function mockSpawn() {
    try {
        shared.fakeGit = true;
        shared.npmInstallModifier = undefined;
        shared.allowNpmRun = false;
        const original = spawnModule.spawn;
        spyOn(spawnModule, "spawn").mockImplementation(
          (cmd: string, args?: string[], opts?: SpawnOptions) => {
            const
                basename = path.basename(cmd),
                extname = path.extname(basename),
                command = basename.substr(0, basename.length - extname.length).toLowerCase();
            if (!args) {
                args = [];
            }
            if (!shared.npmInstallModifier &&
                command === "npm" &&
                args[0] === "install") {
                // suppress
                return Promise.resolve(undefined);
            }
            const cmdIsNpm = isNpm(cmd);
            if (cmdIsNpm &&
                args[0] === "run" &&
                !shared.allowNpmRun) {
                return Promise.resolve(undefined);
            }
            if (shared.npmInstallModifier &&
                cmdIsNpm &&
                args[0] === "install") {
                args = shared.npmInstallModifier(args);
            }
            if (shared.fakeGit && command === "git") {
                // suppress
                return Promise.resolve(undefined);
            }
            return original.call(null, cmd, args, opts);
        });
    } catch (err) {
        const e = err as Error;
        if (e.message && e.message.match(/spawn has already been spied upon/)) {
            return;
        }
        throw e;
    }
}

export function runTsBoot(options: NewtsOptions) {
    return newts({
        skipTsConfig: true,
        ...options
    })
}

function isNpm(cmd: string) {
    const
        bn = path.basename(cmd),
        ext = path.extname(bn),
        c = bn.replace(ext, "");
    return c === "npm";
}

afterEach(async () => {
    await Sandbox.destroyAll();
});
