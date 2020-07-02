import { init, readTextFile, runTsBoot } from "./test-helpers/shared";
import "expect-even-more-jest";
import "./test-helpers/matchers";

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
