import bent from "bent";
import { Dictionary } from "../../../types";

const get = bent("buffer");

export async function nameIsAvailableAtNpmJs(
    name: string
): Promise<boolean> {
    try {
        await checkIfNameExists(name);
        return true;
    } catch (e) {
        if ((e.message || "").indexOf("already registered") > -1) {
            return e.message;
        }
        throw e;
    }
}

interface StatusError {
    statusCode: number;
    headers: Dictionary<string>
}

async function checkIfNameExists(name: string): Promise<void> {
    const url = `https://www.npmjs.com/package/${ name }`;
    try {
        await get(url);
        throw new Error(`package '${ name }' is already registered at npmjs.com`);
    } catch (e) {
        const err = e as StatusError;
        if (err.statusCode === 404) {
            return;
        }
        throw e;
    }
}
