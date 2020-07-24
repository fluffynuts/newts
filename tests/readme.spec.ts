import "expect-even-more-jest";
import faker from "faker";
import { Sandbox } from "filesystem-sandbox";
import path from "path";
import { runTsBoot } from "./test-helpers/shared";
import { readFile } from "yafs";

describe(`readme setup`, () => {
    it(`should create a readme with the project name`, async () => {
        // Arrange
        const
            name = faker.random.alphaNumeric(5),
            description = faker.random.words(10),
            sandbox = await Sandbox.create(),
            where = sandbox.path,
            readmeRelativePath = path.join(name, "README.md"),
            readmeFullPath = path.join(where, readmeRelativePath);
        // Act
        await runTsBoot({
            name,
            description,
            where
        });
        // Assert
        expect(readmeFullPath)
            .toBeFile();
        const contents = await readFile(readmeFullPath, { encoding: "utf8" });
        expect(contents)
            .toStartWith(`${name}`);
    });
    it(`should include the description in the readme`, async () => {
        // Arrange
        const
            name = faker.random.alphaNumeric(5),
            description = faker.random.words(10),
            sandbox = await Sandbox.create(),
            where = sandbox.path,
            readmeRelativePath = path.join(name, "README.md"),
            readmeFullPath = path.join(where, readmeRelativePath);
        // Act
        await runTsBoot({
            name,
            description,
            where
        });
        // Assert
        expect(readmeFullPath)
            .toBeFile();
        const contents = await readFile(readmeFullPath, { encoding: "utf8" });
        expect(contents)
            .toContain(description);
    });
});
