import inquirer from "inquirer";
import { listLicenses } from "../licenses";
import { required } from "./validators/required";
import { HasValue } from "./types";
import { CliOptions } from "../cli-options";

export async function askLicense(
    defaults: CliOptions
): Promise<HasValue<string>> {
    return inquirer.prompt({
        type: "list",
        name: "value",
        message: "Please select a license:",
        choices: await listLicenses(),
        validate: required,
        default: defaults["license"]
    })
}
