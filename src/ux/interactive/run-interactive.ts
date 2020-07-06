import { CliOptions } from "../cli-options";
import { askLicense } from "./license";
import { askName } from "./name";
import { Fetcher, HasValue } from "./types";

export async function runInteractive(
    currentOptions: CliOptions,
    defaultOptions: CliOptions
): Promise<CliOptions> {
    const result = { ...currentOptions } as CliOptions;
    await fillMissing(result, defaultOptions, "name", askName);
    await fillMissing(result, defaultOptions, "license", askLicense);
    return result;
}

async function fillMissing<T>(
    currentOptions: CliOptions,
    defaultOptions: CliOptions,
    key: keyof CliOptions,
    fetcher: Fetcher<HasValue<T>>) {
    if (currentOptions[key] !== undefined) {
        return;
    }
    currentOptions[key] = (await fetcher(defaultOptions)).value as any;
}
