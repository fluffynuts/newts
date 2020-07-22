import "expect-even-more-jest";
import { nameIsAvailableAtNpmJs } from "../src/ux/interactive/validators/name-is-available-at-npm-js";

describe(`name-is-available-at-npm`, () => {
    it(`should fail for fs-utils`, async () => {
        // Arrange
        // Act
        const result = await nameIsAvailableAtNpmJs("fs-utils");
        // Assert
        expect(result)
            .toBeString(); // consumers use === true for :ok: and a string message otherwise
    });
});
