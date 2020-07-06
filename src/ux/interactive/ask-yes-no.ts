import { CliOptions } from "../cli-options";
import inquirer from "inquirer";
import { HasValue } from "./types";

export function askYesNo(
    message: string,
    setting: keyof CliOptions,
    defaults: CliOptions): Promise<HasValue<boolean>> {
    return confirm(
        message,
        !!defaults[setting]
    );
}

export async function confirm(
    message: string,
    defaultValue: boolean): Promise<HasValue<boolean>> {
    const result = await inquirer.prompt({
        type: "confirm",
        message,
        name: "value",
        default: defaultValue
    });
    return result;
}
