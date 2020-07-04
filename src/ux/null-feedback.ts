import { AsyncFunc, Feedback } from "../types";

export class NullFeedback implements Feedback {
    run<T>(label: string, action: AsyncFunc<T>): Promise<T> {
        return action();
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
}

