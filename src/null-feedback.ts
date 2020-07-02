import { AsyncFunc, Feedback } from "./newts";

export class NullFeedback implements Feedback {
    run<T>(label: string, action: AsyncFunc<T>): Promise<T> {
        return action();
    }
}

