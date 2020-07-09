import { init, runTsBoot, shared } from "./test-helpers/shared";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import { newts } from "../src/newts";
import * as faker from "faker";
import { Sandbox } from "filesystem-sandbox";
import * as path from "path";

describe(`newts`, () => {
    describe(`when folder doesn't exist`, () => {
        beforeEach(() => {
            jest.setTimeout(60000);
        });
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
                shared.fakeGit = false;
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
                shared.fakeGit = false;
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
    });

});
