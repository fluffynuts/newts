import path from "path";
import { folderExists } from "yafs";
import { spawn } from "./spawn";
import { runInFolder, which } from "./utils";

export async function isPartOfGitRepo(folder: string): Promise<boolean> {
    let current = folder,
        last = current;
    do {
        last = current;
        if (await hasGitFolder(current)) {
            return true; // require the user to select another location
        }
        current = path.dirname(current);
    } while (current !== last);
    return false;
}

export async function init(at: string): Promise<void> {
    if (await isAlreadyInitialized(at)) {
        return;
    }
    const git = await which("git");
    if (!git) {
        throw new Error(
            `Cannot initialize git in ${ at }`
        );
    }
    try {
        await runInFolder(at,
            () => spawn(git, ["init"])
        );
    } catch (e) {
        throw new Error(`git init fails: ${ e }`);
    }
}

async function isAlreadyInitialized(at: string): Promise<boolean> {
    return folderExists(path.join(at, ".git"));
}

async function hasGitFolder(at: string): Promise<boolean> {
    const test = path.join(at, ".git");
    return folderExists(test);
}

