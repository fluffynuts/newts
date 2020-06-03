import _which from "which";
import path from "path";
import { promises as fs } from "fs";
import { spawn } from "./spawn";

validateNodeVersionAtLeast(10, 12);

export interface BootstrapOptions {
    name: string;
    where?: string;
    includeLinter?: boolean;
    includeNodeTypes?: boolean;
    includeFaker?: boolean;
    includeJest?: boolean;
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
    includeJest: true,
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
    const npm = await which("npm");
    if (!npm) {
        throw new Error("no npm in path?");
    }
    const sanitizedOptions = sanitizeOptions(options);
    await createFolderIfNotExists(sanitizedOptions);
    await runInFolder(sanitizedOptions.fullPath, async () => {
        await initGit(sanitizedOptions);
        const isNew = await initPackage();
        await setupPackageJsonDefaults(sanitizedOptions, isNew);
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
    const result = {...defaultOptions, ...options} as InternalBootstrapOptions;
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
        await spawn(git, ["init"]);
    } catch (e) {
        throw new Error(`git init fails: ${e}`);
    }

    await setupGitIgnore();
}

async function setupGitIgnore() {
}

async function createFolderIfNotExists(options: InternalBootstrapOptions) {
    await fs.mkdir(options.fullPath, {recursive: true});
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

async function setupPackageJsonDefaults(
    options: InternalBootstrapOptions,
    isNew: boolean
) {
    const pkg = await readPackageJson();
    if (isNew) {
        pkg.version = "0.0.1";
    }
    pkg.main = "dist/index.js";
    pkg.files = [
        "dist/**/*"
    ];
    await writePackageJson(pkg);
}

async function initPackage(): Promise<boolean> {
    const alreadyExists = await fileExists("package.json");
    if (alreadyExists) {
        return !alreadyExists;
    }
    await spawn("npm", ["init", "-y"]);
    return true;
}


async function installPackages(options: InternalBootstrapOptions) {
    const devDeps = [];
    if (options.includeLinter) {
        devDeps.push("tslint");
    }

    const args = ["install", "--save-dev", "--no-progress"].concat(devDeps);
    await spawn("npm", args);
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
    const [major, minor] = process.version.replace(/^v/, "")
        .split(".")
        .map(s => parseInt(s))
        .map(i => isNaN(i) ? 0 : i);
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

async function fileExists(at: string): Promise<boolean> {
    try {
        const st = await fs.stat(at);
        return st && st.isFile();
    } catch (e) {
        return false;
    }
}

async function readTextFile(at: string): Promise<string> {
    try {
        return await fs.readFile(at, {encoding: "utf8"});
    } catch (e) {
        throw new Error(`can't read file at ${path.resolve(at)}`);
    }
}

function writeTextFile(at: string, contents: string): Promise<void> {
    return fs.writeFile(at, contents, {encoding: "utf8"});
}

async function readPackageJson(): Promise<NpmPackage> {
    return JSON.parse(
        await readTextFile(
            "package.json"
        )
    );
}

async function writePackageJson(pkg: NpmPackage): Promise<void> {
    await writeTextFile(
        "package.json",
        JSON.stringify(
            pkg, null, 2
        )
    );
}

export interface Dictionary<T> {
    [key: string]: T;
}

export interface NpmPackage {
    name: string;
    version: string;
    files: string[];
    description: string;
    main: string;
    scripts: Dictionary<string>;
    repository: Dictionary<string>;
    keywords: string[];
    author: Dictionary<string>;
    license: string;
    devDependencies: Dictionary<string>;
    dependencies: Dictionary<string>;
}


