import { CliOptions } from "../cli-options";

export interface HasValue<T> {
    value: T;
}
export type Fetcher<T> = ((input: CliOptions) => Promise<T>);
