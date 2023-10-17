import "expect-even-more-jest";
import { Sandbox } from "filesystem-sandbox";
import { spawn } from "../src/spawn";
import * as path from "path";

describe(`generate-index`, () => {
    it(`should generate the index.ts from the src folder of the current working folder`, async () => {
        // Arrange
        const
            sandbox = await Sandbox.create(),
            script = path.resolve("generate-index.js"),
            expected = "src/index.ts";
        await sandbox.mkdir("src");
        await sandbox.writeFile("src/main.ts", "export function main() { };");
        await sandbox.writeFile("src/second.ts", "export function second() { };");
        await sandbox.writeFile("src/third.ts", "export function third() { };");
        await sandbox.writeFile("src/another.ts", "export function another() { };");

        // Act
        await sandbox.run(async () =>
            spawn(
                "node",
                [script]
            )
        );
        // Assert
        expect(sandbox.fullPathFor(expected))
            .toBeFile();
        const
            contents = await sandbox.readTextFile(expected),
            lines = contents.split("\n").map(l => l.trim());
        // files should be in alpha-order
        expect(lines[0])
            .toEqual("// this is a generated file: do not edit");
        expect(lines[1])
            .toEqual(`export * from "./another";`);
        expect(lines[2])
            .toEqual(`export * from "./main";`);
        expect(lines[3])
            .toEqual(`export * from "./second";`);
        expect(lines[4])
            .toEqual(`export * from "./third";`);
    });

    it(`should not include a file with a hash-bang in the list as it probably executes`, async () => {
        // Arrange
        const
            sandbox = await Sandbox.create(),
            script = path.resolve("generate-index.js"),
            expected = "src/index.ts";
        await sandbox.mkdir("src");
        await sandbox.writeFile("src/main.ts", "export function main() { };");
        await sandbox.writeFile("src/main-cli.ts", "#!/usr/bin/env node\nconsole.log('foo!');");
        // Act
        await sandbox.run(async () =>
            spawn(
                "node",
                [script]
            )
        );
        // Assert
        const
            contents = await sandbox.readTextFile(expected),
            lines = contents.split("\n").map(l => l.trim());
        expect(lines)
            .toContain(`export * from "./main";`);
        expect(lines)
            .not.toContain(`export * from "./main-cli";`);
    });
});
