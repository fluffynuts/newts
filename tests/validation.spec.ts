import { newts, sanitizeOptions } from "../src/newts";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import * as faker from "faker";
import "./test-helpers/shared";
import { NewtsOptions } from "../src/types";

describe(`validation`, () => {
    describe(`when no options`, () => {
        it(`should throw`, async () => {
            // Arrange
            // Act
            await expect(newts(undefined as unknown as NewtsOptions))
                .rejects.toThrow("No options provided");
            // Assert
        });
    });
    describe(`when no project name`, () => {
        it(`should throw`, async () => {
            // Arrange
            // Act
            await expect(newts({} as unknown as NewtsOptions))
                .rejects.toThrow("No project name provided");
            // Assert
        });
    });
    describe(`when where not set`, () => {
        it(`should set project path from name`, async () => {
            // Arrange
            const options = { name: faker.random.alphaNumeric() };
            // Act
            const result = await sanitizeOptions(options);
            // Assert
            expect(result)
                .toEqual(
                    expect.objectContaining(
                        { name: options.name, where: options.name }
                    ));
        });
    });
});
