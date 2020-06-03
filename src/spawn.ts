import { spawn as _spawn, SpawnOptions } from "child_process";

export function spawn(
    command: string,
    args?: string[],
    options?: SpawnOptions
): Promise<ProcessData> {
    const
        spawnArgs = args || [] as string[],
        spawnOptions = options || {} as SpawnOptions;
    return new Promise<ProcessData>((resolve, reject) => {
        const
            child = _spawn(command, spawnArgs, spawnOptions),
            result: ProcessData = {
                stdout: [],
                stderr: [],
                code: -1
            };
        child.stderr?.on("data", d => {
            result.stdout.push(d.toString());
        })
        child.stdout?.on("data", d => {
            result.stderr.push(d.toString());
        });
        child.on("close", code => {
            result.code = code;
            return code
                ? reject(result)
                : resolve(result);
        });
    });
}

export interface ProcessData {
    stdout: string[];
    stderr: string[];
    code: number;
}

