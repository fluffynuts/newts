import bent from "bent";
import validate from "validate-npm-package-name";
import { Dictionary } from "./types";

const json = bent("json");

export async function nameIsValid(
    name: string
): Promise<string | boolean> {
    const nameTest = validate(name);
    if (!nameTest.validForNewPackages) {
        const warnings = [
            `${ name } is not a valid package name`
        ];
        (nameTest.warnings || []).forEach(warning => {
            warnings.push(warning);
        });
        return warnings.join("\n");
    }
    try {
        await checkIfNameExists(name);
        return true;
    } catch (e) {
        return e.message;
    }
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
    throw new Error(`package '${ name }' is already registered at npmjs.com`);
}
