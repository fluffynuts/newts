import bent from "bent";
import { Dictionary } from "../../../types";

const json = bent("json");

export async function nameIsAvailableAtNpmJs(
    name: string
): Promise<string | boolean> {
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
