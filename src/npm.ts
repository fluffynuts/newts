import { spawn, SpawnError } from "./spawn";
import { which } from "./utils";

let npmPath: string;

export async function checkNpm() {
    const npm = await which("npm");
    if (!npm) {
        throw new Error("no npm in path?");
    }
    npmPath = npm;
}

export async function runNpm(...args: string[]) {
    if (!npmPath) {
        await checkNpm();
    }
    try {
        await spawn(npmPath, args);
    } catch (e) {
        const err = e as SpawnError;
        if (err.result) {
            const allOutput = (err.result.stderr || []).concat(
                err.result.stdout || []
            );
            if (allOutput.find(l => l.startsWith("gyp ERR!"))) {
                // suppress: gyp failed, and it normally doesn't matter
                return;
            }
        }
        throw e;
    }
}
