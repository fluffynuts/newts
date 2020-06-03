import _which from "which";
import path from "path";
import { promises as fs } from "fs";
import { spawn as _spawn, SpawnOptions } from "child_process";

validateNodeVersionAtLeast(10, 12);

export interface BootstrapOptions {
    name: string;
    where?: string;
    includeLinter?: boolean;
    includeNodeTypes?: boolean;
    includeFaker?: boolean;
    includeExpectEvenMoreJest?: boolean;
    includeZarro?: boolean;
    initializeGit?: boolean;
    setupTestScript?: boolean;
    setupBuildScript?: boolean;
    setupPublishScripts?: boolean;
}

export const defaultOptions: Partial<BootstrapOptions> = {
    includeLinter: true,
    includeNodeTypes: true,
    includeFaker: true,
    includeExpectEvenMoreJest: true,
    includeZarro: true,
    setupTestScript: true,
    setupBuildScript: true,
    setupPublishScripts: true,
    initializeGit: true,
};

interface InternalBootstrapOptions extends BootstrapOptions {
    fullPath: string;
}

export async function bootstrapTsProject(options: BootstrapOptions) {
    const sanitizedOptions = sanitizeOptions(options);
    await createFolderIfNotExists(sanitizedOptions);
    await runInFolder(sanitizedOptions.fullPath, async () => {
        await initGit(sanitizedOptions);
        await initPackage();
        await installPackages(sanitizedOptions);
        await generateTsLintConfig();
        await generateTsConfig();
        await generateJestConfig();
        await addTestNpmScript();
        await addBuildNpmScript();
        await addPublishNpmScript();
        await addPublishBetaNpmScript();
    });
}

type AsyncAction = (() => Promise<void>);

export function sanitizeOptions(options: BootstrapOptions): InternalBootstrapOptions {
    if (!options) {
        throw new Error("No options provided");
    }
    if (!options.name) {
        throw new Error("No project name provided");
    }
    const result = { ...defaultOptions, ...options } as InternalBootstrapOptions;
    if (!result.where) {
        result.where = result.name
        result.fullPath = path.resolve(path.join(process.cwd(), result.where));
    } else {
        const baseName = path.basename(result.where);
        if (baseName === result.name) {
            result.fullPath = path.resolve(result.where);
        } else {
            result.fullPath = path.join(path.resolve(result.where), result.name)
        }
    }
    return result;
}

async function initGit(options: InternalBootstrapOptions) {
    if (!options.initializeGit) {
        return;
    }
    const git = await which("git");
    if (!git) {
        throw new Error(
            `Cannot initialize git in ${options.fullPath}`
        );
    }
    try {
        await spawn(git, [ "init" ]);
    } catch (e) {
        throw new Error(`git init fails: ${e}`);
    }

    await setupGitIgnore();
}

async function setupGitIgnore() {
}

async function createFolderIfNotExists(options: InternalBootstrapOptions) {
    await fs.mkdir(options.fullPath, { recursive: true });
}

async function runInFolder(
    where: string,
    action: AsyncAction) {
    const start = process.cwd();
    try {
        process.chdir(where);
        await action();
    } finally {
        process.chdir(start);
    }
}

async function generateTsLintConfig() {
}

async function initPackage() {
}

async function installPackages(options: InternalBootstrapOptions) {
}

async function generateTsConfig() {
}

async function generateJestConfig() {
}

async function addBuildNpmScript() {
}

async function addPublishNpmScript() {
}

async function addPublishBetaNpmScript() {
}

async function addTestNpmScript() {
}

function validateNodeVersionAtLeast(requireMajor: number, requireMinor: number) {
    const [ major, minor, patch ] = process.version.replace(/^v/, "")
        .split(".")
        .map(s => parseInt(s));
    if (major < requireMajor || minor < requireMinor) {
        throw new Error(
            `this library requires at least node 10.12 as it makes use of fs.mkdir with recursive option`
        );
    }
}

function which(program: string): Promise<string | undefined> {
    return new Promise<string>(resolve => {
        _which(program, (err, data) => resolve(err ? undefined : data));
    })
}

interface ProcessData {
    stdout: string[];
    stderr: string[];
    code: number;
}

function spawn(
    command: string,
    args?: string[],
    options?: SpawnOptions
): Promise<ProcessData> {
    const
        spawnArgs = args || [] as string[],
        spawnOptions = options || {} as SpawnOptions;
    return new Promise<ProcessData>((resolve, reject) => {
        const
            child = _spawn(command, spawnArgs, spawnOptions),
            result: ProcessData = {
                stdout: [],
                stderr: [],
                code: -1
            };
        child.stderr?.on("data", d => {
            result.stdout.push(d.toString());
        })
        child.stdout?.on("data", d => {
            result.stderr.push(d.toString());
        });
        child.on("close", code => {
            result.code = code;
            return code
                ? reject(result)
                : resolve(result);
        });
    });
}
