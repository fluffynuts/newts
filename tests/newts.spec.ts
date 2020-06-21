import * as spawnModule from "../src/spawn";

jest.doMock("../src/spawn", () => spawnModule);
import "expect-even-more-jest";
import "./matchers";
import { newts, NpmPackage, sanitizeOptions, BootstrapOptions } from "../src/newts";
import * as faker from "faker";
import { Sandbox } from "filesystem-sandbox";
import * as path from "path";
import { promises as fs } from "fs";

const { readFile, writeFile } = fs;

describe(`bootstrap-ts-project`, () => {
    describe(`validating options`, () => {
        describe(`when no options`, () => {
            it(`should throw`, async () => {
                // Arrange
                // Act
                // @ts-ignore
                await expect(newts())
                    .rejects.toThrow("No options provided");
                // Assert
            });
        });
        describe(`when no project name`, () => {
            it(`should throw`, async () => {
                // Arrange
                // Act
                // @ts-ignore
                await expect(newts({}))
                    .rejects.toThrow("No project name provided");
                // Assert
            });
        });
        describe(`when where not set`, () => {
            it(`should set project path from name`, async () => {
                // Arrange
                const options = { name: faker.random.alphaNumeric() };
                // Act
                const result = sanitizeOptions(options);
                // Assert
                expect(result)
                    .toEqual(
                        expect.objectContaining(
                            { name: options.name, where: options.name }
                        ));
            });
        });
    });

    describe(`when folder doesn't exist`, () => {
        it(`should create the folder`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(5),
                sandbox = await Sandbox.create(),
                where = sandbox.fullPathFor("projects");
            // Act
            await runTsBoot({ name, where });
            // Assert
            expect(path.join(where, name))
                .toBeFolder();
        });
    });

    describe(`in folder`, () => {
        describe(`when initializeGit is true (default)`, () => {
            // running `git init` twice is safe, so no need to protect against it
            it(`should initialize git`, async () => {
                // Arrange
                fakeGit = false;
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    projectDir = sandbox.fullPathFor(name),
                    gitDir = path.join(projectDir, ".git");
                // Act
                await runTsBoot(
                    {
                        name,
                        where
                    });
                // Assert
                expect(gitDir)
                    .toBeFolder();
            });

            it(`should generate the .gitignore file`, async () => {
                // Arrange
                const
                    { name, where, gitignorePath } = await init();
                // Act
                await runTsBoot({ where, name });
                // Assert
                expect(gitignorePath)
                    .toBeFile();
            });
        });
        describe("when initializeGit is false", () => {
            it(`should not initialize git`, async () => {
                // Arrange
                fakeGit = false;
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    projectDir = sandbox.fullPathFor(name),
                    gitDir = path.join(projectDir, ".git");
                // Act
                await runTsBoot(
                    {
                        name,
                        where,
                        initializeGit: false
                    });
                // Assert
                expect(gitDir)
                    .not.toBeFolder();
            });

        });
        describe(`initializing package.json`, () => {
            it(`should npm init when no package.json`, async () => {
                // Arrange
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    packageJsonRelative = path.join(name, "package.json"),
                    packageJsonFullPath = path.join(where, packageJsonRelative);
                expect(packageJsonFullPath)
                    .not.toBeFile();
                // Act
                await runTsBoot({
                    name,
                    where
                });
                // Assert
                expect(packageJsonFullPath)
                    .toBeFile();
                const pkg = JSON.parse(
                    await sandbox.readTextFile(packageJsonRelative)) as NpmPackage;
                expect(pkg.name)
                    .toEqual(name);
                expect(pkg.version)
                    .toEqual("0.0.1");
                expect(pkg.main)
                    .toEqual("dist/index.js");
                expect(pkg.files)
                    .toEqual(["dist/**/*"]);
            });

            it(`should not destroy an existing package.json`, async () => {
                // Arrange
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    packageJson = "package.json",
                    pkg = {
                        name: faker.random.alphaNumeric(10),
                        version: "1.2.3",
                        description: faker.random.words(),
                        main: "foo.js",
                        scripts: {
                            test: "moo cakes",
                            thing: "wat"
                        },
                        repository: {
                            type: "git",
                            url: "foo.bar.com/whatever"
                        },
                        keywords: faker.random.words().split(" "),
                        author: `${ faker.name.firstName() } ${ faker.name.lastName() }`,
                        license: faker.random.alphaNumeric(),
                        devDependencies: {
                            foo: "^1.2.3"
                        },
                        dependencies: {
                            bar: "3.4.5"
                        }
                    };
                await sandbox.writeFile(
                    packageJson,
                    JSON.stringify(pkg)
                );
                // Act
                await runTsBoot({
                    name,
                    where
                });
                // Assert
                const contents = JSON.parse(await sandbox.readTextFile(packageJson));
                expect(contents)
                    .toEqual(pkg);
            });
        });

        describe("installing required packages", () => {
            describe(`assuming npm runs...`, () => {
                describe(`tslint`, () => {
                    it(`should install tslint by default`, async () => {
                        // Arrange

                        const
                            name = faker.random.alphaNumeric(5),
                            sandbox = await Sandbox.create(),
                            where = sandbox.path;
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("tslint");
                    });

                    it(`should skip tslint on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name,
                            where,
                            includeLinter: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("tslint");
                    });
                });

                it(`should install typescript`, async () => {
                    // Arrange
                    const
                        name = faker.random.alphaNumeric(5),
                        sandbox = await Sandbox.create(),
                        where = sandbox.path;
                    // Act
                    await runTsBoot({
                        name,
                        where
                    });
                    // Assert
                    expect(spawnModule)
                        .toHaveInstalledDevDependency("typescript");
                });

                describe(`@node/types`, () => {
                    it(`should install @types/node by default`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("@types/node");
                    });

                    it(`should skip @types/node on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where, includeNodeTypes: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("@types/node");
                    });
                });
                // faker
                describe(`faker`, () => {
                    it(`should install faker and @types/faker by default`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("faker");
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("@types/faker");
                    });
                    it(`should skip faker on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where, includeFaker: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("faker");
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("@types/faker");
                    });
                });
                describe(`jest`, () => {
                    it(`should install jest by default`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("jest");
                    });
                    it(`should skip jest on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where, includeJest: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("jest");
                    });
                });
                describe(`expect-even-more-jest`, () => {
                    it(`should install expect-even-more-jest by default`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("expect-even-more-jest");
                    });
                    it(`should skip expect-even-more-jest on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where, includeExpectEvenMoreJest: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("expect-even-more-jest");
                    });
                });

                describe(`zarro`, () => {
                    it(`should install zarro by default`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        })
                        // Assert
                        expect(spawnModule)
                            .toHaveInstalledDevDependency("zarro");
                    });
                    it(`should skip zarro on request`, async () => {
                        // Arrange
                        const { name, where } = await init();
                        // Act
                        await runTsBoot({
                            name, where, includeZarro: false
                        })
                        // Assert
                        expect(spawnModule)
                            .not.toHaveInstalledDevDependency("zarro");
                    });
                });

                it(`should install cross-env`, async () => {
                    // Arrange
                    const { name, where } = await init();
                    // Act
                    await runTsBoot({
                        name, where, includeZarro: faker.random.boolean()
                    });
                    // Assert
                    expect(spawnModule)
                        .toHaveInstalledDevDependency("cross-env");
                });
                it(`should install npm-run-all`, async () => {
                    // Arrange
                    const { name, where } = await init();
                    // Act
                    await runTsBoot({
                        name, where, includeZarro: faker.random.boolean()
                    });
                    // Assert
                    expect(spawnModule)
                        .toHaveInstalledDevDependency("npm-run-all");
                });
            });
        });

        describe(`establish baseline configurations`, () => {
            describe(`tslint`, () => {
                it(`should not generate tslint.json when tslint not installed`, async () => {
                    // Arrange
                    const
                        { name, where, tslintPath } = await init();
                    // Act
                    await runTsBoot({
                        name, where,
                        includeLinter: false
                    });
                    // Assert
                    expect(tslintPath)
                        .not.toBeFile();
                });
                it(`should generate tslint.json when tslint installed (default)`, async () => {
                    // Arrange
                    const
                        { name, where, tslintPath } = await init();
                    // Act
                    await runTsBoot({
                        name, where
                    });
                    // Assert
                    expect(tslintPath)
                        .toBeFile();
                });

                describe(`rules`, () => {
                    it(`should extend tslint:recommended`, async () => {
                        // Arrange
                        const {
                            name,
                            where,
                            tslintPath
                        } = await init();
                        // Act
                        await runTsBoot({
                            name, where
                        });
                        const result = JSON.parse(await readTextFile(tslintPath));
                        // Assert
                        expect(result.extends)
                            .toBeArray();
                        expect(result.extends)
                            .toContain("tslint:recommended");
                    });
                    it(`should default to error`, async () => {
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.defaultSeverity)
                            .toEqual("error");
                    });
                    it(`should have empty jsRules`, async () => {
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.jsRules)
                            .toExist();
                        expect(Object.keys(result.jsRules))
                            .toBeEmptyArray();
                    });
                    // double-quotes won a long time ago. Let those single-quotes
                    // go!
                    it(`should require double-quotes`, async () => {
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.rules.quotemark)
                            .toEqual([true, "double"]);
                    });
                    it(`should allow multi-line declarations`, async () => {
                        // this is a personal style choice, but it can make
                        //  declaration blocks easier (imo) to understand
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.rules["one-variable-per-declaration"])
                            .toBeFalse();
                    });
                    it(`should not enforce ordered imports`, async () => {
                        // because ordered imports can interfere with jest mocks
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.rules["ordered-imports"])
                            .toBeFalse();
                    });
                    it(`should not enforce no-console`, async () => {
                        // -> console.{error|log} (at least) are valid for cli apps
                        // -> zen debugging!
                        // Arrange
                        // Act
                        const result = await bootDefaultLinter();
                        // Assert
                        expect(result.rules["no-console"])
                            .toBeFalse();
                    });
                });

                async function bootDefaultLinter() {
                    const { name, where, tslintPath } = await init();
                    await runTsBoot({ name, where });
                    return JSON.parse(await readTextFile(tslintPath));
                }
            });

            describe(`jest.config.js`, () => {
                it(`should clear mocks`, async () => {
                    // Arrange
                    // Act
                    const jestConfig = await bootDefaultJestConfig();
                    // Assert
                    expect(jestConfig.clearMocks)
                        .toBeTrue();
                });

                it(`should have the ts-jest preset`, async () => {
                    // Arrange
                    // Act
                    const jestConfig = await bootDefaultJestConfig();
                    // Assert
                    expect(jestConfig.preset)
                        .toEqual("ts-jest");
                });

                it(`should set node test environment`, async () => {
                    // Arrange
                    // Act
                    const jestConfig = await bootDefaultJestConfig();
                    // Assert
                    expect(jestConfig.testEnvironment)
                        .toEqual("node");
                });

                async function bootDefaultJestConfig() {
                    const { name, where, jestConfigPath } = await init();
                    await newts({ name, where, skipTsConfig: true });
                    return require(jestConfigPath);
                }
            });
            describe(`tsconfig.json`, () => {
                let tsconfig: any;
                beforeAll(async () => {
                    jest.setTimeout(60000);
                    mockSpawn();
                    // override install to get actual tsc so we can use the result from tsc --init
                    npmInstallModifier = () => ["install", "--save-dev", "--no-progress", "typescript"];
                    tsconfig = await bootDefaultTsConfig();
                    jest.setTimeout(5000);
                });
                afterAll(() => {
                    npmInstallModifier = undefined;
                });

                it(`should target ES2018`, async () => {
                    // provides cleaner output than es5 and works on modern things
                    // Arrange
                    // Act
                    // Assert
                    expect(tsconfig)
                        .toExist();
                    expect(tsconfig.compilerOptions)
                        .toExist();
                    expect(tsconfig.compilerOptions.target)
                        .toEqual("ES2018");
                });
                it(`should emit declarations`, async () => {
                    // Arrange
                    // Act
                    // Assert
                    expect(tsconfig.compilerOptions.declaration)
                        .toBeTrue();
                });

                it(`should set the outDir to ./dist`, async () => {
                    // Arrange
                    // Act
                    // Assert
                    expect(tsconfig.compilerOptions.outDir)
                        .toEqual("./dist");
                });
                it(`should exclude test and dist from compilation`, async () => {
                    // Arrange
                    // Act
                    // Assert
                    expect(tsconfig.exclude)
                        .toBeEquivalentTo(["tests", "dist"]);
                });

                async function bootDefaultTsConfig() {
                    const { name, where, tsconfigPath } = await init();
                    await newts({ name, where });
                    let withoutComments: string;
                    const contents = await readTextFile(tsconfigPath);
                    withoutComments = contents.replace(
                        /\/\*.*\*\//g, ""
                    ).replace(
                        /\/\/.*/g, ""
                    );
                    try {
                        return JSON.parse(withoutComments);
                    } catch (e) {
                        console.log({
                            e,
                            withoutComments
                        });
                        throw e;
                    }
                }
            });
        });
    });

    describe(`npm scripts`, () => {
        it(`should add build script pointing to tsc`, async () => {
            // Arrange
            // Act
            const result = await bootDefaultPackageJson();
            // Assert
            expect(result)
                .toExist();
            expect(result.scripts)
                .toExist();
            expect(result.scripts.build)
                .toEqual("tsc");
        });

        it(`should add test script`, async () => {
            // Arrange
            const result = await bootDefaultPackageJson();
            // Act
            expect(result.scripts.test)
                .toEqual("jest");
            // Assert
        });

        it(`should add lint script`, async () => {
            // Arrange
            const result = await bootDefaultPackageJson();
            // Act
            expect(result.scripts.lint)
                .toEqual("tslint -p .");
            // Assert
        });

        describe(`when zarro enabled`, () => {
            it(`should add the zarro script`, async () => {
                // Arrange
                const result = await bootDefaultPackageJson();
                // Act
                expect(result.scripts.zarro)
                    .toEqual("zarro");
                // Assert
            });
            it(`should add beta release script`, async () => {
                // Arrange
                const result = await bootDefaultPackageJson();
                // Act
                expect(result.scripts["prerelease-beta"])
                    .toEqual("run-s build lint test");
                expect(result.scripts["release-beta"])
                    .toEqual("cross-env BETA=1 VERSION_INCREMENT_STRATEGY=patch run-s \"zarro release-npm\"");
                // Assert
            });

            it(`should add release script`, async () => {
                // Arrange
                const result = await bootDefaultPackageJson();
                // Act
                expect(result.scripts.prerelease)
                    .toEqual("run-s build lint test");
                expect(result.scripts.release)
                    .toEqual("cross-env VERSION_INCREMENT_STRATEGY=minor run-s \"zarro release-npm\"");
                // Assert
            });
        });

        async function bootDefaultPackageJson() {
            const { name, where, packageJsonPath } = await init();
            await runTsBoot({ name, where });
            try {
                return JSON.parse(await readTextFile(packageJsonPath));
            } catch (e) {
                return undefined;
            }
        }
    });

    function readTextFile(at: string): Promise<string> {
        return readFile(at, { encoding: "utf8" });
    }

    async function init() {
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

    let fakeGit = true;
    let npmInstallModifier: undefined | ((args: string[]) => string[]);

    beforeEach(() => {
        mockSpawn();
    });

    function mockSpawn() {
        try {
            fakeGit = true;
            npmInstallModifier = undefined;
            const original = spawnModule.spawn;
            spyOn(spawnModule, "spawn").and.callFake((cmd, args, opts) => {
                const
                    basename = path.basename(cmd),
                    extname = path.extname(basename),
                    command = basename.substr(0, basename.length - extname.length).toLowerCase();
                if (!npmInstallModifier &&
                    command === "npm" &&
                    args[0] === "install") {
                    // suppress
                    return;
                }
                const cmdIsNpm = isNpm(cmd);
                if (npmInstallModifier &&
                    cmdIsNpm &&
                    args[0] === "install") {
                    args = npmInstallModifier(args);
                }
                if (fakeGit && command === "git") {
                    // suppress
                    return;
                }
                return original.call(null, cmd, args, opts);
            });
        } catch (e) {
            if (e.message && e.message.match(/spawn has already been spied upon/)) {
                return;
            }
            throw e;
        }
    }

    function runTsBoot(options: BootstrapOptions) {
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
    beforeAll(async () => {
        await Sandbox.destroyAny();
    });
});

