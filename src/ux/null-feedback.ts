import { AsyncFunc, Feedback } from "../types";

export class NullFeedback implements Feedback {
    run<T>(label: string, fn: AsyncFunc<T>): Promise<T> {
        return fn();
    }

    log(text: string): void {
        // intentionally left blank
    }

    warn(text: string): void {
        // intentionally left blank
    }

    error(text: string): void {
        // intentionally left blank
    }

    time<T>(fn: AsyncFunc<T>): Promise<T> {
        return fn();
    }
}

