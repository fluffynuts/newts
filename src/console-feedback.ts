import { AsyncFunc, Feedback } from "./newts";
import chalk from "chalk";

const
    start = chalk.yellow(`[ WAIT ]`),
    ok = chalk.green(`[  OK  ]`),
    fail = chalk.red(`[ FAIL ]`);

export class ConsoleFeedback implements Feedback {
    async run<T>(label: string, action: AsyncFunc<T>): Promise<T> {
        try {
            process.stdout.write(`${start} ${ label }`);
            const result = await action();
            console.log(`\r${ok} ${ label }`);
            return result;
        } catch (e) {
            console.log(`\r${fail} ${ label }`);
            throw e;
        }
    }
}

