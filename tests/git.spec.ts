import "expect-even-more-jest";
import { isPartOfGitRepo } from "../src/git";
import { Sandbox } from "filesystem-sandbox";
import * as faker from "faker";
import { init } from "../src/git";
import * as path from "path";

describe(`git`, () => {
    it(`should export isPartOfGitRepo function`, async () => {
        // Arrange
        // Act
        expect(isPartOfGitRepo)
            .toBeAsyncFunction();
        // Assert
    });

    describe(`behavior`, () => {
        it(`should return false when not part of git repo`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                dir = faker.random.alphaNumeric(10),
                fullPath = sandbox.fullPathFor(dir);
            await sandbox.mkdir(dir);
            // Act
            const result = await isPartOfGitRepo(fullPath);
            // Assert
            expect(result)
                .toBeFalse();
        });

        it(`should return true in the base of a git repo`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create();
            await init(sandbox.path);
            expect(sandbox.fullPathFor(".git"))
                .toBeFolder();
            // Act
            const result = await isPartOfGitRepo(sandbox.path);
            // Assert
            expect(result).toBeTrue();
        });

        it(`should return true in some folder in the repo`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                f1 = faker.random.alphaNumeric(10),
                f2 = faker.random.alphaNumeric(10),
                relPath = path.join(f1, f2),
                fullPath = sandbox.fullPathFor(relPath);
            await sandbox.mkdir(relPath);
            await init(sandbox.path);
            // Act
            const result = await isPartOfGitRepo(fullPath);
            // Assert
            expect(result)
                .toBeTrue();
        });
    });
});
