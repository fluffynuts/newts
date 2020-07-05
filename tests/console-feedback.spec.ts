import "expect-even-more-jest";
import { ConsoleFeedback } from "../src/ux/console-feedback";

describe('console-feedback', function () {
    describe('rewrite', function () {
        it(`should rewrite the line`, async () => {
            // Arrange
            spyOn(process.stdout, "write");
            const
                sut = create(),
                pre = "123",
                post = "123";
            // Act
            sut.rewrite(pre, post, undefined, 9);
            // Assert
            expect(process.stdout.write)
                .toHaveBeenCalledOnceWith(`\r         \r123   123`);
        });
    });

    function create() {
        return new ConsoleFeedback();
    }
});
