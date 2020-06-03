import "expect-even-more-jest";
import { bootstrapTsProject, sanitizeOptions } from "../src/bootstrap-ts-project";
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
            await bootstrapTsProject({ name, where });
            // Assert
            expect(path.join(where, name))
                .toBeFolder();
        });
    });

    describe(`in folder`, () => {
        describe(`when initializeGit is true (default)`, () => {
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
    });

    afterEach(async () => {
        await Sandbox.destroyAll();
    });
});
