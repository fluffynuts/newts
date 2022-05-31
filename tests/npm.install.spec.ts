import { init, runTsBoot, shared } from "./test-helpers/shared";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import * as faker from "faker";
import { Sandbox } from "filesystem-sandbox";

describe(`install required packages`, () => {
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
        expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
                .not.toHaveInstalledDevDependency("@types/node");
        });
    });
    // faker
    describe(`faker`, () => {
        it(`should install @faker-js/faker by default`, async () => {
            // Arrange
            const { name, where } = await init();
            // Act
            await runTsBoot({
                name, where
            })
            // Assert
            expect(shared.spawnModule)
                .toHaveInstalledDevDependency("@faker-js/faker");
        });
        it(`should skip faker on request`, async () => {
            // Arrange
            const { name, where } = await init();
            // Act
            await runTsBoot({
                name, where, includeFaker: false
            })
            // Assert
            expect(shared.spawnModule)
                .not.toHaveInstalledDevDependency("faker");
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
                .not.toHaveInstalledDevDependency("expect-even-more-jest");
        });
    });
    describe(`rimraf`, () => {
        it(`should install rimraf by default`, async () => {
            // Arrange
            const { name, where } = await init();
            // Act
            await runTsBoot({
                name, where
            })
            // Assert
            expect(shared.spawnModule)
                .toHaveInstalledDevDependency("rimraf");
        });
        it(`should skip rimraf when no test script`, async () => {
            // Arrange
            const { name, where } = await init();
            // Act
            await runTsBoot({
                name, where, setupTestScript: false
            })
            // Assert
            expect(shared.spawnModule)
                .not.toHaveInstalledDevDependency("rimraf");
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
            expect(shared.spawnModule)
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
            expect(shared.spawnModule)
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
        expect(shared.spawnModule)
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
        expect(shared.spawnModule)
            .toHaveInstalledDevDependency("npm-run-all");
    });
});
