import { promises as fs, StatsBase } from "fs";
import { Func } from "./types";

export async function fileExists(at: string): Promise<boolean> {
    return runStat(at, st => st.isFile());
}

export async function folderExists(at: string): Promise<boolean> {
    return runStat(at, st => st.isDirectory());
}

async function runStat(at: string, func: Func<StatsBase<any>, boolean>): Promise<boolean> {
    try {
        const st = await fs.stat(at);
        return st && func(st);
    } catch (e) {
        return false;
    }
}

export async function createFolderIfNotExists(at: string): Promise<void> {
    if (await folderExists(at)) {
        return;
    }
    await fs.mkdir(at, { recursive: true });
}


