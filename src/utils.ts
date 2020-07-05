import { AsyncAction, AsyncFunc } from "./types";
import _which from "which";
import path from "path";

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

export async function runInFolder<T>(
    where: string,
    action: AsyncAction | AsyncFunc<T>): Promise<void | T> {
    const
        start = process.cwd(),
        resolvedWhere = path.resolve(where),
        shouldSwitch = resolvedWhere !== start;
    try {
        if (shouldSwitch) {
            process.chdir(where);
        }
        return await action();
    } finally {
        if (shouldSwitch) {
            process.chdir(start);
        }
    }
}

export function which(program: string): Promise<string | undefined> {
    return new Promise<string>(resolve => {
        _which(program, (err, data) => resolve(err ? undefined : data));
    })
}

