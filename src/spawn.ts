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
      result.stderr.push(d.toString());
    })
    child.stdout?.on("data", d => {
      result.stdout.push(d.toString());
    });
    child.on("close", code => {
      if (code === null) {
        return reject(makeSpawnErrorFor(
            result, command, args, options
          )
        )
      }
      result.code = code;
      return code
        ? reject(makeSpawnErrorFor(result, command, args, options))
        : resolve(result);
    });
  });
}

function makeSpawnErrorFor(
  result: ProcessData,
  command: string,
  args: string[] | undefined,
  options: SpawnOptions | undefined
): SpawnError {
  const e = new Error(`Error exit code ${ result.code } for: ${ command } ${ (args || []).join(" ") }`);
  return {
    ...e,
    result,
    command,
    args,
    options
  };
}

export interface SpawnError
  extends Error {
  command: string;
  args: string[] | undefined;
  options: SpawnOptions | undefined,
  result: ProcessData;
}

export interface ProcessData {
  stdout: string[];
  stderr: string[];
  code: number;
}

