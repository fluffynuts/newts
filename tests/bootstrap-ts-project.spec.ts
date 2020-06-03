import * as spawnModule from "../src/spawn";
jest.doMock("../src/spawn", () => spawnModule);
import "expect-even-more-jest";
import { bootstrapTsProject, NpmPackage, sanitizeOptions } from "../src/bootstrap-ts-project";
import * as faker from "faker";
import { Sandbox } from "filesystem-sandbox";
import * as path from "path";

describe(`bootstrap-ts-project`, () => {
    describe(`validating options`, () => {
        describe(`when no options`, () => {
            it(`should throw`, async () => {
                // Arrange
                // Act
                // @ts-ignore
                await expect(bootstrapTsProject())
                    .rejects.toThrow("No options provided");
                // Assert
            });
        });
        describe(`when no project name`, () => {
            it(`should throw`, async () => {
                // Arrange
                // Act
                // @ts-ignore
                await expect(bootstrapTsProject({}))
                    .rejects.toThrow("No project name provided");
                // Assert
            });
        });
        describe(`when where not set`, () => {
            it(`should set project path from name`, async () => {
                // Arrange
                const options = {name: faker.random.alphaNumeric()};
                // Act
                const result = sanitizeOptions(options);
                // Assert
                expect(result)
                    .toEqual(
                        expect.objectContaining(
                            {name: options.name, where: options.name}
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
            await bootstrapTsProject({name, where});
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
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    projectDir = sandbox.fullPathFor(name),
                    gitDir = path.join(projectDir, ".git");
                // Act
                await bootstrapTsProject(
                    {
                        name,
                        where
                    });
                // Assert
                expect(gitDir)
                    .toBeFolder();
            });
        });
        describe('when initializeGit is false', function () {
            it(`should not initialize git`, async () => {
                // Arrange
                const
                    name = faker.random.alphaNumeric(5),
                    sandbox = await Sandbox.create(),
                    where = sandbox.path,
                    projectDir = sandbox.fullPathFor(name),
                    gitDir = path.join(projectDir, ".git");
                // Act
                await bootstrapTsProject(
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
                await bootstrapTsProject({
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
                        author: `${faker.name.firstName()} ${faker.name.lastName()}`,
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
                await bootstrapTsProject({
                    name,
                    where
                });
                // Assert
                const contents = JSON.parse(await sandbox.readTextFile(packageJson));
                expect(contents)
                    .toEqual(pkg);
            });
        });

        describe('installing required packages', function () {
            describe('when includeLinter is true', function () {
                it(`should install tslint`, async () => {
                    // this test is the only one which should to a real install
                    // -> give it some time
                    jest.setTimeout(20000);
                    // Arrange
                    const spy = spyOn(spawnModule, "spawn").and.callThrough();

                    const
                        name = faker.random.alphaNumeric(5),
                        sandbox = await Sandbox.create(),
                        where = sandbox.path,
                        packageJson = path.join(name, "package.json");
                    // Act
                    await bootstrapTsProject({
                        name, where
                    })
                    // Assert
                    expect(spawnModule.spawn)
                        .toHaveBeenCalled();
                    const devInstall = spy.calls.all().find(ci => ci.args[1].indexOf("--save-dev") > -1);
                    if (devInstall === undefined) {
                        throw new Error(`No dev install cmd found`);
                    }
                    expect(devInstall.args[0])
                        .toEqual("npm");
                    expect(devInstall.args[1])
                        .toContain("--no-progress");
                    expect(devInstall.args[1])
                        .toContain("tslint");
                    const pkg = await readPkg(sandbox, packageJson);
                    expect(pkg.devDependencies.tslint)
                        .toExist();
                });
            });
        });
    });

    async function readPkg(sandbox: Sandbox, relPath: string): Promise<NpmPackage> {
        return JSON.parse(
            await sandbox.readTextFile(relPath)
        );
    }

    afterEach(async () => {
        await Sandbox.destroyAll();
    });
});
