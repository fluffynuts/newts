import "expect-even-more-jest";
import { runValidators, Validator } from "../../src/ux/interactive/run-validators";
import * as faker from "faker";
import { required } from "../../src/ux/interactive/validators/required";
import { nameIsAvailableAtNpmJs } from "../../src/ux/interactive/validators/name-is-available-at-npm-js";
import { isValidPackageName } from "../../src/ux/interactive/validators/is-valid-package-name";

describe(`interactive validators`, () => {
    describe(`runValidators`, () => {
        it(`should return true for one sync passing validator`, async () => {
            // Arrange
            const validator: Validator<string> = () => true;
            // Act
            const result = await runValidators("foo", validator);
            // Assert
            expect(result)
                .toBeTrue();
        });

        it(`should return true for one async passing validator`, async () => {
            // Arrange
            const validator: Validator<string> = () => Promise.resolve(true);
            // Act
            const result = await runValidators("foo", validator);
            // Assert
            expect(result)
                .toBeTrue();
        });

        it(`should return error from one sync failing validator`, async () => {
            // Arrange
            const
                expected = faker.random.alphaNumeric(10),
                validator = () => expected;
            // Act
            const result = await runValidators(faker.random.alphaNumeric(10), validator);
            // Assert
            expect(result)
                .toEqual(expected);
        });

        it(`should return error from one async failing validator`, async () => {
            // Arrange
            const
                expected = faker.random.alphaNumeric(10),
                validator = () => Promise.resolve(expected);
            // Act
            const result = await runValidators(faker.random.alphaNumeric(10), validator);
            // Assert
            expect(result)
                .toEqual(expected);
        });

        it(`should return first failure`, async () => {
            // Arrange
            const
                expected = faker.random.alphaNumeric(10),
                v1 = () => Promise.resolve(true),
                v2 = () => expected,
                v3 = () => true;
            // Act
            const result = await runValidators(faker.random.alphaNumeric(10), v1, v2, v3);
            // Assert
            expect(result)
                .toEqual(expected);
        });
    });

    describe(`required`, () => {
        [
            null,
            undefined,
            "",
            "  ",
            "\n",
            "\t  \r"
        ].forEach(value => {
            it(`should return error for ${ value }`, async () => {
                // Arrange
                // Act
                const result = await required(value as string);
                // Assert
                expect(result)
                    .toEqual("value is required");

            });
        });

        it(`should return true for non-empty string`, async () => {
            // Arrange
            // Act
            const result = await required(faker.random.alphaNumeric(1));
            // Assert
            expect(result)
                .toBeTrue();
        });
    });

    describe(`isValidPackageName`, () => {
        [
            null,
            undefined,
            1,
            "",
            ".",
            "  foobar",
            "foo  ",
            "http",
            "Capitals"
        ].forEach(value => {
            it(`should return error for ${ value }`, async () => {
                // Arrange
                // Act
                const result = await isValidPackageName(value as string);
                // Assert
                expect(result)
                    .toBeString();
            });
        });
        it(`should return true for valid package name`, async () => {
            // Arrange
            // Act
            const result = await isValidPackageName("lodash");
            // Assert
            expect(result)
                .toBeTrue();
        });
    });

    describe(`nameIsAvailableAtNpmJs`, () => {
        it(`should return error for known package`, async () => {
            // Arrange
            // Act
            const result = await nameIsAvailableAtNpmJs("lodash");
            // Assert
            expect(result)
                .toEqual(`package 'lodash' is already registered at npmjs.com`);
        });

        it(`should return true for unknown package`, async () => {
            // Arrange
            const test = faker.random.alphaNumeric(50);
            // Act
            const result = await nameIsAvailableAtNpmJs(test);
            // Assert
            expect(result)
                .toBeTrue();
        });
    });

});
