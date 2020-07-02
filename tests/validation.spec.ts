import { newts, sanitizeOptions } from "../src/newts";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import * as faker from "faker";
import "./test-helpers/shared";

describe(`validation`, () => {
    describe(`when no options`, () => {
        it(`should throw`, async () => {
            // Arrange
            // Act
            // @ts-ignore
            await expect(newts())
                .rejects.toThrow("No options provided");
            // Assert
        });
    });
    describe(`when no project name`, () => {
        it(`should throw`, async () => {
            // Arrange
            // Act
            // @ts-ignore
            await expect(newts({}))
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
