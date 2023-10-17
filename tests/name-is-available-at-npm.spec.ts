import "expect-even-more-jest";
import { nameIsAvailableAtNpmJs } from "../src/ux/interactive/validators/name-is-available-at-npm-js";

describe(`name-is-available-at-npm`, () => {
    it(`should return false for missing package: this-package-really-does-not-exist`, async () => {
        // Arrange
        // Act
        const result = await nameIsAvailableAtNpmJs("this-package-really-does-not-exist");
        // Assert
        expect(result)
            .toBeTrue(); // consumers use === true for :ok: and a string message otherwise
    });

    it(`should return false for existing package: newts`, async () => {
        // Arrange
        // Act
        const result = await nameIsAvailableAtNpmJs(
          "newts"
        );
        // Assert
        expect(result)
          .toBeString();
        expect(result)
          .toContain("already registered");
    });
});
