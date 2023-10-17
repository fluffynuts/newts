import { assert, fetchSpyOrMockArgs, runAssertions } from "expect-even-more-jest";
import CustomMatcherResult = jest.CustomMatcherResult;
import * as path from "path";

expect.extend({
    toHaveInstalledDevDependency(actual: any, moduleName: string): CustomMatcherResult {
        return runAssertions(this, () => {
            assert(!!actual.spawn, "module is not a spawn module");
            const
                allArgs = fetchSpyOrMockArgs(actual.spawn),
                cliOfInterest = allArgs.find((args: any) => {
                    const
                        basename = path.basename(args[0]),
                        ext = path.extname(basename),
                        cmd = basename.substr(0, basename.length - ext.length).toLowerCase(),
                        spawnArgs = args[1] || [];
                    return cmd === "npm" &&
                        spawnArgs.indexOf("install") > -1 &&
                        spawnArgs.indexOf("--save-dev") > -1 &&
                        spawnArgs.indexOf(moduleName) > -1
                })
            assert(!!cliOfInterest, `no 'npm install --save-dev' cli found including module '${ moduleName }'`);
            return `Expected not to find a dev install of ${ moduleName }`;
        });
    }
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        export interface Matchers<R> {
            toHaveInstalledDevDependency: (moduleName: string) => CustomMatcherResult;
        }
    }
}
