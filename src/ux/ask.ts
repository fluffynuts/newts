import { Func } from "../types";

export async function ask(
    q: string,
    isValid: Func<string, Promise<boolean> | boolean>
): Promise<string> {
    let answer = "";
    do {
        process.stdout.write(`${q}: `);
        const readline = require("readline");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        answer = await new Promise(resolve => {
            rl.on("line", (line: string) => {
                resolve(line.trim());
            });
        });
    } while (!(await isValid(answer)));
    return answer;
}

