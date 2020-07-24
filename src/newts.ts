import path from "path";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import { NullFeedback } from "./ux/null-feedback";
import { platform } from "os";
import chalk from "ansi-colors";
import { createFolderIfNotExists, fileExists } from "./fs";
import {
    NpmPackage,
    readLines,
    readPackageJson,
    readTextFile,
    writeLines,
    writePackageJson,
    writeTextFile
} from "./io";
import { NewtsOptions, Dictionary, Feedback, Func } from "./types";
import { listLicenses } from "./ux/licenses";
import { init } from "./git";
import { runInFolder } from "./utils";
import { checkNpm, runNpm } from "./npm";

validateNodeVersionAtLeast(10, 12);

export const defaultOptions: Partial<NewtsOptions> = {
    includeLinter: true,
    includeNodeTypes: true,
    includeFaker: true,
    includeJest: true,
    includeExpectEvenMoreJest: true,
    includeZarro: true,
    setupTestScript: true,
    setupBuildScript: true,
    setupReleaseScripts: true,
    initializeGit: true,
    testEnvironment: "node",
    // TODO: add cli options for these
    setupGitHubRepo: false,
    setupGitHubRepoPrivate: false,

    installPackagesOneAtATime: false,
    verifyNameAvailable: true
};

interface InternalBootstrapOptions extends NewtsOptions {
    fullPath: string;
    feedback: Feedback;
}

const licenseReplacements = {
    "author": [/<copyright holder>/i, /<copyright holders>/i],
    "year": [/<year>/i, /\[year]/i]
}

export async function newts(rawOptions: NewtsOptions) {
    await checkNpm();
    const opts = await sanitizeOptions(rawOptions);
    const run = opts.feedback.run.bind(opts.feedback);

    await createModuleFolder(opts);
    await runInFolder(opts.fullPath, async () => {
        await initGit(opts)

        const isNew = await run(
            `initialise package ${ opts.name }`,
            () => initPackage(opts)
        );

        await run(`set up package.json defaults`,
            () => setupPackageJsonDefaults(opts, isNew)
        );

        if (!skipLicense(opts.license)) {
            await run(
                `install license: ${ opts.license }`,
                () => installLicense(opts)
            );
        } else {
            await alterPackageJson(pkg => {
                return { ...pkg, license: "UNLICENSED" };
            });
        }
        await run(
            `install README.md`,
            () => createReadme(opts)
        );

        await setAuthorInfo(opts)

        await installDevPackages(opts)
        await installReleasePackages(opts)

        // some npm scripts are required for config generation: particularly the build script (tsc)
        await run(
            `add npm scripts`,
            () => addNpmScripts(opts)
        );

        await run(
            `generate configurations`,
            () => generateConfigurations(opts)
        );

        await run(
            `seed project files`,
            () => seedProjectFiles(opts)
        );

        await run(
            `perform initial build`,
            () => runNpm("run", "build")
        );


        printComplete(opts);
    });
}

async function setAuthorInfo(options: InternalBootstrapOptions) {
    const authorInfo = {} as Dictionary<string>
    if (options.authorName) {
        authorInfo.name = options.authorName
    }
    if (options.authorEmail) {
        authorInfo.email = options.authorEmail;
    }
    const keys = Object.keys(authorInfo);
    if (keys.length === 0) {
        return;
    }
    await options.feedback.run(
        `set author information`,
        () => alterPackageJson(pkg => {
            const result = { ...pkg };
            if (typeof result.author === "string") {
                result.author = {};
            }
            result.author = result.author || {} as Dictionary<string>;
            keys.forEach(k => (result.author as Dictionary<string>)[k] = authorInfo[k]);
            return result;
        })
    );
}

function printComplete(options: InternalBootstrapOptions) {
    options.feedback.log(`\n--- Congratulations! ---`);
    options.feedback.log(`${ options.name } bootstrapped at ${ options.fullPath }`);
    if (options.license) {
        options.feedback.warn(
            chalk.yellow(
                `Please check ${
                    path.join(options.fullPath, "LICENSE")
                } for any text you may need to replace, eg author information`)
        );
    }
}

async function createReadme(options: InternalBootstrapOptions) {
    if (options.skipReadme) {
        return;
    }
    await writeTextFile("README.md", `${ options.name }\n---\n${options.description}`)
}

function skipLicense(license: string | undefined) {
    return !license || [
        "none",
        "unlicensed"
    ].indexOf(license.toLowerCase()) > -1;
}

async function installLicense(options: InternalBootstrapOptions) {
    if (!options.license) {
        return;
    }
    const {
        license,
        authorName,
        authorEmail
    } = options;
    await copyBundledFile("LICENSE", `licenses/${ license }`);
    if (authorName || authorEmail) {
        let licenseText = await readTextFile("LICENSE");
        if (authorName) {
            licenseReplacements.author.forEach(re => {
                licenseText = licenseText.replace(re, authorName);
            });
            const thisYear = (new Date()).getFullYear().toString();
            licenseReplacements.year.forEach(re => {
                licenseText = licenseText.replace(re, thisYear);
            });
        }
        await writeTextFile("LICENSE", licenseText);
    }
    await alterPackageJson(pkg => {
        return { ...pkg, license };
    })
}

async function seedProjectFiles(options: InternalBootstrapOptions) {
    await generateSrcIndexFile(options);
    await generateCliEntryPoint(options);
    await generateTestIndexSpecFile(options);
    await generateTestSetupFile(options);
}

const newline = platform() === "win32"
    ? "\r\n"
    : "\n";

async function generateTestSetupFile(options: InternalBootstrapOptions) {
    await writeTextFile(
        path.join(options.fullPath, "tests", "setup.ts"),
        "// include any test setup here"
    )
}

async function generateTestIndexSpecFile(options: InternalBootstrapOptions) {
    if (!options.includeJest) {
        return;
    }
    const headers = [];
    if (options.includeExpectEvenMoreJest) {
        headers.push(`import "expect-even-more-jest";`);
    }
    if (options.includeFaker) {
        headers.push(`import * as faker from "faker";`);
    }
    await writeTextFile(
        path.join(options.fullPath, "tests", "index.spec.ts"),
        `${ headers.join(newline) }
describe(\`${ options.name }\`, () => {
    it(\`should pass the example test\`, async () => {
        // Arrange
        // Act
        await expect(Promise.resolve(1))
            .resolves.toBeGreaterThan(0);
        // Assert
    });
});
`
    );
}

async function generateCliEntryPoint(options: InternalBootstrapOptions) {
    if (!options.isCommandline) {
        return;
    }
    const yargsImport = options.includeYargs
        ? `import yargs = require("yargs");`
        : ""
    await writeTextFile(
        path.join(options.fullPath, "src", `${ options.name }-cli.ts`),
        `#!/usr/bin/env node
import { example } from "./index";
${ yargsImport }

(async function main() {
    const args = yargs.argv;
    example();
})();`
    )
}

async function generateSrcIndexFile(options: InternalBootstrapOptions) {
    await writeTextFile(
        path.join(options.fullPath, "src", "index.ts"),
        `// ${ options.name } module entry point
export function example() {
  console.log("hello, world");
}
`);
    await addBinScript(options);
}

async function addBinScript(options: InternalBootstrapOptions) {
    if (!options.isCommandline) {
        return;
    }

    await alterPackageJson(pkg => {
        const result = { ...pkg };
        result.bin = result.bin || {} as Dictionary<string>;
        result.bin[options.name] = `./dist/${ options.name }-cli.js`;
        return result;
    });
}

async function alterPackageJson(transformer: Func<NpmPackage, NpmPackage>) {
    const
        pkg = await readPackageJson(),
        transformed = transformer(pkg);
    await writePackageJson(transformed);
}

async function generateConfigurations(options: InternalBootstrapOptions) {
    await generateTsLintConfig(options);
    await generateTsConfig(options);
    await generateJestConfig(options);
}

function determineBaseFolderFrom(name: string) {
    if (name.indexOf("/") === -1) {
        // simple case: continue
        return name;
    }
    if (name.startsWith("@")) {
        const parts = name.split("/");
        return parts.length > 1
            // possibly namespaced: just use the last part of the full name
            ? parts[parts.length - 1]
            // eh, @ is a valid fs name-char
            : name;
    } else {
        // gabba-gabba-hey! make names safe again
        return name.replace(/\//g, "__");
    }
}

export async function sanitizeOptions(options: NewtsOptions): Promise<InternalBootstrapOptions> {
    if (!options) {
        throw new Error("No options provided");
    }
    if (!options.name) {
        throw new Error("No project name provided");
    }
    if (!options.feedback) {
        options.feedback = new NullFeedback();
    }
    const result = { ...defaultOptions, ...options } as InternalBootstrapOptions;
    if (!result.where) {
        result.where = determineBaseFolderFrom(result.name)
        result.fullPath = path.resolve(path.join(process.cwd(), result.where));
    } else {
        const baseName = path.basename(result.where);
        if (baseName === result.name) {
            result.fullPath = path.resolve(result.where);
        } else {
            result.fullPath = path.join(
                path.resolve(result.where),
                determineBaseFolderFrom(result.name)
            )
        }
    }
    if (result.license) {
        const
            allLicenses = await listLicenses(),
            selected = result.license ?? "",
            match = allLicenses.find(l => l.toLowerCase() === selected.toLowerCase())
        if (!match) {
            throw new Error(`license '${ selected }' is unknown`);
        }
        result.license = match;
    }
    if (result.isCommandline &&
        result.addStartScript === undefined) {
        // default to add a start script
        result.addStartScript = true;
    }
    return result;
}

async function initGit(options: InternalBootstrapOptions) {
    if (!options.initializeGit) {
        return;
    }
    await options.feedback.run(`initialise git at ${ options.fullPath }`,
        async () => {
            await init(options.fullPath);
            await setupGitIgnore();
        });
    if (options.setupGitHubRepo) {
        // TODO
        // 1. find or download gh
        // 2. test if repo already exists with module name
        // 3. if not: gh repo create (may need to handle gh interactive mode)
        console.error("github setup not yet implemented");
    }
}

async function setupGitIgnore() {
    await copyBundledFile(".gitignore", "_gitignore");
}

async function copyBundledFile(withName: string, fromName?: string) {
    const
        pkgDir = await findMyPackageDir(),
        mine = path.join(pkgDir, fromName ?? withName);
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

function createModuleFolder(options: InternalBootstrapOptions) {
    return createFolderIfNotExists(options.fullPath);
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
        JSON.stringify(defaultTsLintOptions, null, 2)
    )
}

async function setupPackageJsonDefaults(
    options: InternalBootstrapOptions,
    isNew: boolean
) {
    await alterPackageJson(pkg => {
        const result = { ...pkg };
        if (isNew) {
            result.version = "0.0.1";
        }
        result.main = "dist/index.js";
        result.files = [
            "dist/**/*"
        ];
        return result;
    });
}

async function initPackage(opts: InternalBootstrapOptions): Promise<boolean> {
    const alreadyExists = await fileExists("package.json");
    if (alreadyExists) {
        return !alreadyExists;
    }
    await runNpm("init", "-y")
    // enforce that the correct name was used
    await alterPackageJson(pkg => {
        return {
            ...pkg,
            name: opts.name,
            description: opts.description ?? ""
        };
    })
    return true;
}

const devPackageMap: Dictionary<Func<InternalBootstrapOptions, boolean>> = {
    typescript: () => true,
    tslint: o => !!o.includeLinter,
    "@types/node": o => !!o.includeNodeTypes,
    faker: o => !!o.includeFaker,
    "@types/faker": o => !!o.includeFaker,
    jest: o => !!o.includeJest,
    "@types/jest": o => !!o.includeJest,
    "ts-jest": o => !!o.includeJest,
    "ts-node": o => !!o.isCommandline && !!o.addStartScript,
    "expect-even-more-jest": o => !!o.includeExpectEvenMoreJest,
    zarro: o => !!o.includeZarro,
    "npm-run-all": () => true,
    "@types/yargs": o => !!o.isCommandline && !!o.includeYargs,
    "cross-env": () => true,
    "rimraf": o => !!o.setupTestScript
};

const releasePackageMap: Dictionary<Func<InternalBootstrapOptions, boolean>> = {
    "yargs": o => !!o.isCommandline && !!o.includeYargs
};

async function installPackages(
    isDev: boolean,
    options: InternalBootstrapOptions,
    map: Dictionary<Func<InternalBootstrapOptions, boolean>>) {
    const packages = Object.keys(map)
        .map(k => {
            return {
                name: k,
                install: map[k](options)
            }
        })
        .filter(o => o.install)
        .map(o => o.name)
        .sort();

    if (packages.length === 0) {
        return;
    }

    const
        s = packages.length === 1 ? "" : "s",
        label = isDev ? "dev" : "release",
        save = isDev ? "--save-dev" : "--save",
        args = ["install", save, "--no-progress"],
        timeWarning = packages.length > 3
            ? "(may take a minute)"
            : "",
        operationLabel = `install ${ packages.length } ${ label } package${ s } ${ timeWarning }`;
    if (options.installPackagesOneAtATime) {
        options.feedback.log(operationLabel);
        for (const pkg of packages) {
            await options.feedback.run(
                `  ${ pkg }`,
                () => runNpm(...args.concat([pkg]))
            );
        }
    } else {
        await options.feedback.run(
            operationLabel,
            () => runNpm(...args.concat(packages))
        )
    }
}

async function installDevPackages(options: InternalBootstrapOptions) {
    return installPackages(true, options, devPackageMap);
}

async function installReleasePackages(options: InternalBootstrapOptions) {
    return installPackages(false, options, releasePackageMap);
}

async function generateTsConfig(sanitizedOptions: InternalBootstrapOptions) {
    if (sanitizedOptions.skipTsConfig) {
        return;
    }
    const fname = "tsconfig.json";
    if (await fileExists(fname)) {
        await fs.rename(fname, `${ fname }.bak`);
    }
    await runNpm("run", "build", "--", "--init");
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

async function generateJestConfig(options: InternalBootstrapOptions) {
    const cfg = "jest.config.js";
    await copyBundledFile(cfg);

    const
        currentConfig = await readTextFile(cfg),
        lines = currentConfig.split("\n"),
        newLines = lines.reduce(
            (acc, cur) => {
                const match = cur.match(/(\s*)testEnvironment:/);
                if (!!match) {
                    const prefix = match[1];
                    acc.push(`${prefix}testEnvironment: "${options.testEnvironment}",`);
                } else {
                    acc.push(cur);
                }
                return acc;
            }, [] as string[]);
    await writeLines(cfg, newLines);
}

async function addBuildNpmScript() {
    await addScript("build", "tsc");
}

async function addScript(name: string, script: string) {
    await alterPackageJson(pkg => {
        const result = { ...pkg };
        result.scripts = result.scripts || {} as Dictionary<string>;
        result.scripts[name] = script;
        return result;
    });
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

async function addTestNpmScript() {
    await addScript("test", "jest");
    await addScript("pretest", "rimraf .jest-cache");
}

function addLintNpmScript() {
    return addScript("lint", "tslint -p .");
}

function addZarroNpmScript(): Promise<void> {
    return addScript("zarro", "zarro");
}

function addStartScript(options: InternalBootstrapOptions): Promise<void> {
    return addScript("start", `ts-node src/${ options.name }-cli.ts`);
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
    if (sanitizedOptions.isCommandline) {
        await addStartScript(sanitizedOptions);
    }
}

function validateNodeVersionAtLeast(requireMajor: number, requireMinor: number) {
    const [major, minor] = process.version.replace(/^v/, "")
        .split(".")
        .map(s => parseInt(s, 10))
        .map(i => isNaN(i) ? 0 : i);
    if (major < requireMajor) {
        if (minor < requireMinor) {
            throw new Error(
                `this library requires at least node 10.12 as it makes use of fs.mkdir with recursive option`
            );
        }
    }
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

    // Update our parts array with the new value
    parts[indexOfNthMatch] = typeof (replace) === "function"
        ? replace(parts[indexOfNthMatch].toString())
        : replace;

    // Put it back together and return
    return parts.join("");

}
