import { assert, fetchArgs, runAssertions } from "expect-even-more-jest/dist";
import CustomMatcherResult = jest.CustomMatcherResult;
import * as path from "path";

expect.extend({
    toHaveInstalledDevDependency(actual: any, moduleName: string): CustomMatcherResult {
        return runAssertions(this, () => {
            assert(!!actual.spawn, "module is not a spawn module");
            const
                allArgs = fetchArgs(actual.spawn),
                cliOfInterest = allArgs.find(args => {
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
    export namespace jest {
        export interface Matchers<R> {
            toHaveInstalledDevDependency: (moduleName: string) => CustomMatcherResult;
        }
    }
}
