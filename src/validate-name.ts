import bent from "bent";
import validate from "validate-npm-package-name";
import chalk from "chalk";
import { Feedback, Dictionary } from "./types";

const json = bent("json");

export async function validateName(name: string, feedback: Feedback): Promise<boolean> {
    const nameTest = validate(name);
    if (!nameTest.validForNewPackages) {
        warn(`${ name } is not a valid package name`);
        (nameTest.warnings || []).forEach(warning => {
            warn(warning);
        });
        return false;
    }
    await feedback.run(
        `check availability of package name: ${ name }`,
        () => checkIfNameExists(name)
    );
    return true;
}

function warn(str: string) {
    console.error(chalk.red(str));
}

interface StatusError {
    statusCode: number;
    headers: Dictionary<string>
}

async function checkIfNameExists(name: string): Promise<void> {
    const url = `https://api.npms.io/v2/package/${ name }`;
    try {
        await json(url);
    } catch (e) {
        const err = e as StatusError;
        if (err.statusCode === 404) {
            return;
        }
        throw e;
    }
    throw new Error(`package '${ name }' is already registered`);
}
