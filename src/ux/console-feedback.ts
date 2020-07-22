import chalk from "ansi-colors";
import { AsyncFunc, Feedback } from "../types";

const
    ok = chalk.green(`[  OK  ]`),
    fail = chalk.red(`[ FAIL ]`),
    spinChars = ["|", "/", "-", "\\"];

function makeSpaces(howMany: number) {
    const spaces = [];
    for (let i = 0; i < howMany; i++) {
        spaces.push(" ");
    }
    return spaces.join("");
}

export class ConsoleFeedback implements Feedback {
    private spinChar: string = spinChars[0];

    public async run<T>(label: string, action: AsyncFunc<T>): Promise<T> {
        let timeout;
        try {
            return await this.time(async () => {
                timeout = this.wait(label);
                const result = await action();
                this.stopWait(timeout);
                this.rewrite(label, ok);
                return result;
            });
        } catch (e) {
            if (timeout) {
                this.stopWait(timeout);
            }
            this.rewrite(label, fail);
            throw e;
        } finally {
            process.stdout.write("\n");
        }
    }

    private _started: number = 0;

    private startTimer() {
        if (!process.env.TIME_OPERATIONS) {
            return;
        }
        this._started = Date.now();
    }

    private reportTime() {
        if (!process.env.TIME_OPERATIONS) {
            return;
        }
        const taken = Date.now() - this._started;
        process.stdout.write(` (${ (taken / 1000).toFixed(2) }s)`);
        this._started = 0;
    }

    async time<T>(fn: AsyncFunc<T>) {
        this.startTimer();
        const result = await fn();
        this.reportTime();
        return result;
    }

    private wait(label: string): NodeJS.Timeout {
        this.spinChar = spinChars[0]
        return setInterval(() => this.spin(label), 500);
    }

    private spin(label: string) {
        this.rewrite(label, `${ this.nextSpinChar() }`, 2);
    }

    private stopWait(timeout: NodeJS.Timeout) {
        clearInterval(timeout);
    }

    private nextSpinChar(): string {
        const idx = spinChars.indexOf(this.spinChar) + 1;
        this.spinChar = idx >= spinChars.length
            ? spinChars[0]
            : spinChars[idx];
        return this.spinChar;
    }

    public rewrite(pre: string, post: string, padSize?: number, cols?: number) {
        cols = cols ?? 80;
        padSize = padSize ?? cols - pre.length - post.length;
        const
            padding = makeSpaces(padSize),
            clear = makeSpaces(cols);
        const finalLine = `\r${ clear }\r${ pre }${ padding }${ post }`;
        process.stdout.write(finalLine);
    }

    public log(text: string): void {
        console.log(text);
    }

    public warn(text: string): void {
        console.warn(text);
    }

    public error(text: string): void {
        console.error(chalk.red(text));
    }
}

