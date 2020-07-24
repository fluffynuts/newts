import "expect-even-more-jest";
import { CliOptions, generateDefaults } from "../src/ux/cli-options";
import { convertCliOptionsToBootstrapOptions, shouldRunInteractive } from "../src/newts-cli";
import { NullFeedback } from "../src/ux/null-feedback";
import * as faker from "faker";
import { NewtsOptions } from "../src/types";

describe(`newts-cli`, () => {
    describe(`convertCliOptionsToBootstrapOptions`, () => {
        it(`should set skipTsConfig false`, async () => {
            // Arrange
            const
                feedback = new NullFeedback(),
                argv = await generateDefaults();
            // Act
            const result = convertCliOptionsToBootstrapOptions(argv, feedback);
            // Assert
            expect(result.skipTsConfig)
                .toBeFalse();
        });
        type TestCase = [keyof CliOptions, keyof NewtsOptions, (() => string | boolean), boolean?]
        const bool = faker.random.boolean;
        const str = faker.random.alphaNumeric.bind(null, 10);
        const testCases = [
            ["install-zarro", "includeZarro", bool],
            ["install-linter", "includeLinter", bool],
            ["install-matchers", "includeExpectEvenMoreJest", bool],
            ["install-faker", "includeFaker", bool],
            ["install-jest", "includeJest", bool],
            ["init-git", "initializeGit", bool],
            ["name", "name", str],
            ["description", "description", str],
            ["output", "where", str],
            ["cli", "isCommandline", bool],
            ["install-yargs", "includeYargs", bool],
            ["start-script", "addStartScript", bool],
            ["license", "license", str],
            ["init-readme", "skipReadme", bool, true],
            ["author-email", "authorEmail", str],
            ["author-name", "authorName", str],
            ["install-node-types", "includeNodeTypes", bool],
            ["build-script", "setupBuildScript", bool],
            ["release-scripts", "setupReleaseScripts", bool],
            ["test-script", "setupTestScript", bool],
            ["verify-name-available", "verifyNameAvailable", bool]
        ] as TestCase[];
        testCases.forEach(testCase => {
            const [source, target, generator, inverted] = testCase;
            it(`should set ${ target } from '${ source }'`, async () => {
                // Arrange
                // Arrange
                const
                    feedback = new NullFeedback(),
                    argv = await generateDefaults(),
                    expected = generator();
                argv[source] = expected as any;
                // Act
                const result = convertCliOptionsToBootstrapOptions(argv, feedback);
                // Assert
                if (inverted) {
                    expect(result[target])
                        .toEqual(!expected);
                } else {
                    expect(result[target])
                        .toEqual(expected);
                }
            });
        });
    });
    describe(`shouldRunInteractive`, () => {
        it(`should return true when explicitly interactive`, async () => {
            // Arrange
            const
                args = {
                    interactive: true
                } as CliOptions;
            // Act
            const result = shouldRunInteractive(args);
            // Assert
            expect(result)
                .toBeTrue();
        });
        [
            "",
            null,
            undefined,
            " ",
            "\t"
        ].forEach(value => {
            it(`should return true when name is ${value}`, async () => {
                // Arrange
                const
                    args = {
                        interactive: false,
                        name: value
                    } as CliOptions;
                // Act
                const result = shouldRunInteractive(args);
                // Assert
                expect(result)
                    .toBeTrue();
            });
            it(`should return true when output is ${value}`, async () => {
                // Arrange
                const
                    args = {
                        interactive: false,
                        output: value
                    } as CliOptions;
                // Act
                const result = shouldRunInteractive(args);
                // Assert
                expect(result)
                    .toBeTrue();
            });
        });
    });
});
