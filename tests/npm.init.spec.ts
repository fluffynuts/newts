import { runTsBoot } from "./test-helpers/shared";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import * as faker from "faker";
import { Sandbox } from "filesystem-sandbox";
import * as path from "path";
import { readPackageJson } from "../src/io";

describe(`initialize npm`, () => {
    it(`should npm init when no package.json`, async () => {
        // Arrange
        const
            name = faker.random.alphaNumeric(5),
            description = faker.random.words(10),
            sandbox = await Sandbox.create(),
            where = sandbox.path,
            packageJsonRelative = path.join(name, "package.json"),
            packageJsonFullPath = path.join(where, packageJsonRelative);
        expect(packageJsonFullPath)
            .not.toBeFile();
        // Act
        await runTsBoot({
            name,
            description,
            where
        });
        // Assert
        expect(packageJsonFullPath)
            .toBeFile();
        const pkg = await readPackageJson(sandbox.fullPathFor(name));
        expect(pkg.name)
            .toEqual(name);
        expect(pkg.description)
            .toEqual(description);
        expect(pkg.version)
            .toEqual("0.0.1");
        expect(pkg.main)
            .toEqual("index.js");
        expect(pkg.files)
            .toEqual(["dist/**/*", "index.js", "index.d.ts"]);
    });

    describe(`initial artifacts`, () => {
        it(`should generate the base index.js`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(5),
                description = faker.random.words(10),
                sandbox = await Sandbox.create(),
                where = sandbox.path,
                relPath = path.join(name, "index.js"),
                expected = sandbox.fullPathFor(relPath);
            // Act
            await runTsBoot({
                name,
                description,
                where
            });
            // Assert
            expect(expected)
                .toBeFile();
            const contents = await sandbox.readTextFile(relPath);
            expect(contents)
                .toEqual("module.exports = require(\"./dist\");");
        });
        it(`should generate the base index.d.ts`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(5),
                description = faker.random.words(10),
                sandbox = await Sandbox.create(),
                where = sandbox.path,
                relPath = path.join(name, "index.d.ts"),
                expected = sandbox.fullPathFor(relPath);
            // Act
            await runTsBoot({
                name,
                description,
                where
            });
            // Assert
            expect(expected)
                .toBeFile();
            const contents = await sandbox.readTextFile(relPath);
            expect(contents.trim())
                .toEqual("export * from \"./dist\";");
        });

        it(`should generate the main.ts`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(5),
                description = faker.random.words(10),
                sandbox = await Sandbox.create(),
                relPath = path.join(name, "src", "main.ts"),
                where = sandbox.path,
                expected = sandbox.fullPathFor(relPath);
            // Act
            await runTsBoot({
                name,
                description,
                where
            });
            // Assert
            expect(expected)
                .toBeFile();
            const contents = await sandbox.readTextFile(relPath);
            expect(contents)
                .toContain("export function");
        });

        it(`should generate the starting index.ts`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(5),
                description = faker.random.words(10),
                sandbox = await Sandbox.create(),
                relPath = path.join(name, "src", "index.ts"),
                where = sandbox.path,
                expected = sandbox.fullPathFor(relPath);
            // Act
            await runTsBoot({
                name,
                description,
                where
            });
            // Assert
            expect(expected)
                .toBeFile();
            const contents = await sandbox.readTextFile(relPath);
            const lines = contents.trim().split("\n").map(line => line.trim());
            expect(lines[0])
                .toEqual("// this is a generated file: do not edit");
            expect(lines[1])
                .toEqual("export * from \"./main\";");
        });
    });

    describe(`when package is namespaced`, () => {
        it(`should init correctly`, async () => {
            // Arrange
            const
                name = "@namespace/package-name",
                sandbox = await Sandbox.create(),
                where = sandbox.path,
                expected = "package-name",
                packageJsonPath = sandbox.fullPathFor(`${expected}/package.json`);
            // Act
            await runTsBoot({ name, where });
            // Assert
            expect(path.join(sandbox.fullPathFor(expected)))
                .toBeFolder();
            expect(packageJsonPath)
                .toBeFile();
            const pkg = await readPackageJson(sandbox.fullPathFor(expected))
            expect(pkg.name)
                .toEqual(name);
        });
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
