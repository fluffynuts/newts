import { CliOptions } from "../cli-options";
import { HasValue } from "./types";
import inquirer from "inquirer";
import { runValidators } from "./run-validators";
import { noneOrValidEmail } from "./validators/none-or-valid-email";

export function askForAuthorEmail(defaults: CliOptions): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter the author email for this project (type 'none' to skip):",
        name: "value",
        default: defaults["author-name"],
        validate: (value) => {
            return runValidators(
                value,
                noneOrValidEmail
            );
        }
    });
}
