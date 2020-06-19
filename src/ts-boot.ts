import _which from "which";
import path from "path";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import { spawn } from "./spawn";

validateNodeVersionAtLeast(10, 12);

let npmPath: string;

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

    // should only be useful from testing
    skipTsConfig?: boolean;
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

export async function tsBoot(options: BootstrapOptions) {
    await checkNpm();
    const sanitizedOptions = sanitizeOptions(options);
    await createFolderIfNotExists(sanitizedOptions);
    await runInFolder(sanitizedOptions.fullPath, async () => {
        await initGit(sanitizedOptions);
        const isNew = await initPackage();
        await setupPackageJsonDefaults(sanitizedOptions, isNew);
        await installPackages(sanitizedOptions);

        await addNpmScripts(sanitizedOptions);

        await generateConfigurations(sanitizedOptions);
    });
}

async function generateConfigurations(sanitizedOptions: InternalBootstrapOptions) {
    await generateTsLintConfig(sanitizedOptions);
    await generateTsConfig(sanitizedOptions);
    await generateJestConfig();
}

async function checkNpm() {
    const npm = await which("npm");
    if (!npm) {
        throw new Error("no npm in path?");
    }
    npmPath = npm;
}

type AsyncAction = (() => Promise<void>);
type Func<Tin, TOut> = ((arg: Tin) => TOut);

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
            `Cannot initialize git in ${ options.fullPath }`
        );
    }
    try {
        await spawn(git, ["init"]);
    } catch (e) {
        throw new Error(`git init fails: ${ e }`);
    }

    await setupGitIgnore();
}

async function setupGitIgnore() {
    await copyBundledFile(".gitignore");
}

async function copyBundledFile(withName: string) {
    const
        pkgDir = await findMyPackageDir(),
        mine = path.join(pkgDir, withName);
    await cp(mine, withName);
}

async function cp(from: string, to: string) {
    return new Promise((_resolve, _reject) => {
        let completed = false;
        const
            outStream = createWriteStream(to, { flags: "w" }),
            isComplete = () => {
                if (completed) {
                    return true;
                }
                completed = true;
                return false;
            },
            resolve = () => {
                if (isComplete()) {
                    return;
                }
                outStream.end(() => _resolve());
            },
            reject = (e: Error) => {
                if (isComplete()) {
                    return;
                }
                outStream.end(() => _reject(e));
            };
        createReadStream(from)
            .on("end", resolve)
            .on("error", reject)
            .pipe(outStream);
    });
}

async function findMyPackageDir() {
    let current = __dirname;
    while (true) {
        const test = path.join(current, "package.json");
        if (await fileExists(test)) {
            return current;
        }
        const next = path.dirname(current);
        if (next === current) {
            throw new Error("can't find my own package dir");
        }
        current = next;
    }
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

const defaultTsLintOptions = {
    "defaultSeverity": "error",
    "extends": [
        "tslint:recommended"
    ],
    "jsRules": {},
    "rules": {
        "quotemark": [true, "double"],
        "one-variable-per-declaration": false,
        "ordered-imports": false,
        "no-console": false
    },
    "rulesDirectory": []
}

async function generateTsLintConfig(options: InternalBootstrapOptions) {
    if (!options.includeLinter) {
        return;
    }
    await writeTextFile(
        path.join(options.fullPath, "tslint.json"),
        JSON.stringify(defaultTsLintOptions)
    )
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
    await runNpm(["init", "-y"]);
    return true;
}

function runNpm(args: string[]) {
    return spawn(npmPath, args);
}

const packageMap: Dictionary<Func<InternalBootstrapOptions, boolean>> = {
    tslint: o => !!o.includeLinter,
    typescript: () => true,
    "@types/node": o => !!o.includeNodeTypes,
    faker: o => !!o.includeFaker,
    "@types/faker": o => !!o.includeFaker,
    jest: o => !!o.includeJest,
    "expect-even-more-jest": o => !!o.includeExpectEvenMoreJest,
    zarro: o => !!o.includeZarro,
    "npm-run-all": () => true,
    "cross-env": () => true
};

async function installPackages(options: InternalBootstrapOptions) {
    const devDeps = Object.keys(packageMap)
        .map(k => {
            return {
                name: k,
                install: packageMap[k](options)
            }
        })
        .filter(o => o.install)
        .map(o => o.name);

    if (devDeps.length === 0) {
        return;
    }
    const args = ["install", "--save-dev", "--no-progress"].concat(devDeps);
    await runNpm(args);
}

async function generateTsConfig(sanitizedOptions: InternalBootstrapOptions) {
    if (sanitizedOptions.skipTsConfig) {
        return;
    }
    await runNpm(["run", "build", "--", "--init"]);
    const fname = "tsconfig.json";
    if (!(await fileExists(fname))) {
        throw new Error(`tsc --init didn't produce a ${ fname }?`);
    }

    const lines = await readLines(fname);
    const updated = lines.map(setTarget)
        .map(uncommentDeclaration)
        .map(setDeclaration)
        .map(uncommentOutDir)
        .map(setOutDirToDist);
    const newLines: string[] = [
        `"exclude": [`,
        `  "tests",`,
        `  "dist"`,
        `]`
    ];

    const withComma = addCommaToCompilerOptionsBlock(updated);
    const lastBraceLine = withComma.reduce(
        (acc, cur, idx) => cur.indexOf("}") > -1 ? idx : acc, 0
    );
    withComma.splice(lastBraceLine, 0, ...newLines);
    await writeLines(fname, withComma);
}

function addCommaToCompilerOptionsBlock(updated: string[]) {
    let braceCount = 0;
    return updated.map(line => {
        const decommented = decomment(line);
        if (decommented.indexOf("{") > -1) {
            braceCount++;
            return line;
        }
        if (decommented.indexOf("}") > -1) {
            braceCount--;
            if (braceCount === 1) {
                return line + ",";
            }
        }
        return line;
    });
}

function decomment(line: string) {
    return line.replace(/\/\/.*/, "")
        .replace(/\/\*.*\*\//g, "");
}

function setOutDirToDist(line: string) {
    return setJsonProp(line, "outDir", "./dist");
}

function uncommentOutDir(line: string): string {
    return uncommentLineIfIsForProperty(line, "outDir");
}

function uncommentDeclaration(line: string): string {
    return uncommentLineIfIsForProperty(line, "declaration");
}

function uncommentLineIfIsForProperty(line: string, prop: string) {
    return line.match(new RegExp(`^\\s*//\\s"${ prop }"`))
        ? line.replace(/\/\//, "")
        : line;
}

function setDeclaration(line: string): string {
    return setJsonProp(line, "declaration", true);
}

function setTarget(line: string): string {
    return setJsonProp(line, "target", "ES2018");
}

function setJsonProp(line: string, prop: string, value: any): string {
    if (!line.match(new RegExp(`^\\s*"${ prop }"`))) {
        return line;
    }
    return replaceNthMatch(line, /("[^"]+")/, 2, JSON.stringify(value));
}

async function generateJestConfig() {
    await copyBundledFile("jest.config.js");
}

async function addBuildNpmScript() {
    await addScript("build", "tsc");
}

async function addScript(name: string, script: string) {
    const pkg = await readPackageJson();
    pkg.scripts = pkg.scripts || {};
    pkg.scripts[name] = script;
    await writePackageJson(pkg);
}

async function addReleaseScript() {
    await addScript("prerelease", "run-s build lint test");
    await addScript(
        "release",
        "cross-env VERSION_INCREMENT_STRATEGY=minor run-s \"zarro release-npm\""
    );
}

async function addBetaReleaseScript() {
    await addScript("prerelease-beta", "run-s build lint test")
    await addScript(
        "release-beta",
        "cross-env BETA=1 VERSION_INCREMENT_STRATEGY=patch run-s \"zarro release-npm\""
    );
}

function addTestNpmScript() {
    return addScript("test", "jest");
}

function addLintNpmScript() {
    return addScript("lint", "tslint -p .");
}

function addZarroNpmScript() {
    return addScript("zarro", "zarro");
}

async function addNpmScripts(sanitizedOptions: InternalBootstrapOptions) {
    await addBuildNpmScript();
    await addLintNpmScript();
    await addTestNpmScript();

    if (sanitizedOptions.includeZarro) {
        await addZarroNpmScript();
        await addReleaseScript();
        await addBetaReleaseScript();
    }
}

function validateNodeVersionAtLeast(requireMajor: number, requireMinor: number) {
    const [major, minor] = process.version.replace(/^v/, "")
        .split(".")
        .map(s => parseInt(s, 10))
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

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

async function readTextFile(at: string): Promise<string> {
    const fullpath = path.resolve(at);
    for (let i = 0; i < 5; i++) {
        try {
            return await fs.readFile(fullpath, { encoding: "utf8" });
        } catch (e) {
            await sleep(100);
        }
    }
    throw new Error(`can't read file at ${ fullpath }`);
}

async function readLines(at: string): Promise<string[]> {
    const contents = await readTextFile(at);
    return (contents || "").split("\n").map(l => l.replace(/\r$/, ""));
}

async function writeLines(at: string, lines: string[]): Promise<void> {
    const contents = lines.join("\n");
    await writeTextFile(at, contents);
}

function writeTextFile(at: string, contents: string): Promise<void> {
    return fs.writeFile(at, contents, { encoding: "utf8" });
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

// borrowed from https://stackoverflow.com/a/7958627/1697008
function replaceNthMatch(
    original: string,
    pattern: RegExp,
    n: number,
    replace: string | ((input: string) => string)) {
    let parts, tempParts;

    if (pattern.constructor === RegExp) {

        // If there's no match, bail
        if (original.search(pattern) === -1) {
            return original;
        }

        // Every other item should be a matched capture group;
        // between will be non-matching portions of the substring
        parts = original.split(pattern);

        // If there was a capture group, index 1 will be
        // an item that matches the RegExp
        if (parts[1].search(pattern) !== 0) {
            throw { name: "ArgumentError", message: "RegExp must have a capture group" };
        }
    } else if (pattern.constructor === String) {
        parts = original.split(pattern);
        // Need every other item to be the matched string
        tempParts = [];

        for (let i = 0; i < parts.length; i++) {
            tempParts.push(parts[i]);

            // Insert between, but don't tack one onto the end
            if (i < parts.length - 1) {
                tempParts.push(pattern);
            }
        }
        parts = tempParts;
    } else {
        throw { name: "ArgumentError", message: "Must provide either a RegExp or String" };
    }

    // Parens are unnecessary, but explicit. :)
    const indexOfNthMatch = (n * 2) - 1;

    if (parts[indexOfNthMatch] === undefined) {
        // There IS no Nth match
        return original;
    }

    const replaceWith = typeof (replace) === "function"
        ? replace(parts[indexOfNthMatch])
        : replace;

    // Update our parts array with the new value
    parts[indexOfNthMatch] = replaceWith;

    // Put it back together and return
    return parts.join("");

}
