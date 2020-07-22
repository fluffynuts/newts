import * as faker from "faker";

const fakeQueryGitConfig = {
    queryGitConfig: function () {
        return ""
    }
};
jest.doMock("../../src/ux/query-git-config", () => fakeQueryGitConfig);

import { applyDefaults, CliOptions, generateDefaults } from "../../src/ux/cli-options";
import { Dictionary } from "../../src/types";

describe('cli-options', function () {
    describe('applyDefaults', function () {
        it(`should fill in undefined option with default`, async () => {
            // Arrange
            const
                environmentAuthorName = faker.name.firstName(),
                environmentAuthorEmail = faker.internet.email(),
                gitConfig = {
                    "user.name": environmentAuthorName,
                    "user.email": environmentAuthorEmail
                } as Dictionary<string>;
            spyOn(fakeQueryGitConfig, "queryGitConfig")
                .and.callFake(key => gitConfig[key]);
            const
                defaults = await generateDefaults(),
                opts = {
                    "author-name": "fake author",
                    "install-zarro": !defaults["install-zarro"]
                },
                original = { ...opts };
            // Act
            const result = await applyDefaults(opts);
            // Assert
            expect(result["author-name"]).toEqual(original["author-name"]);
            expect(result["install-zarro"]).toEqual(original["install-zarro"]);
            Object.keys(defaults)
                .filter(k => ["author-name", "install-zarro"].indexOf(k) === -1)
                .forEach(k => {
                    const key = k as keyof CliOptions;
                    expect(result[key])
                        .toEqual(defaults[key])
                });
        });
    });

    describe('generateDefaults', function () {
        const testCases = {
            license: "BSD-3-Clause",
            "install-faker": true,
            "install-yargs": true,
            "install-linter": true,
            "install-node-types": true,
            "install-jest": true,
            "install-matchers": true,
            "install-zarro": true,
            "init-git": true,
            cli: false,
            "start-script": true,
            "init-readme": true,
            "build-script": true,
            "release-scripts": true,
            "test-script": true,
            "list-licenses": false,
            "interactive": false
        } as Partial<CliOptions>;
        Object.keys(testCases)
            .forEach(key => {
                const value = testCases[key as keyof CliOptions];
                it(`should set ${ key } to ${ value }`, async () => {
                    // Arrange
                    // Act
                    const defaults = await generateDefaults();
                    // Assert
                    expect(defaults[key as keyof CliOptions])
                        .toEqual(value);
                });
            });

        it(`should cache the result of the first invocation, but create a new object`, async () => {
            // Arrange
            // Act
            const r1 = await generateDefaults();
            const r2 = await generateDefaults();
            // Assert
            expect(r1)
                .toEqual(r2);
        });
    });
});
