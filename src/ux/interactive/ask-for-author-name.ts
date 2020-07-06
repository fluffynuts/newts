import { CliOptions } from "../cli-options";
import { HasValue } from "./types";
import inquirer from "inquirer";
import { runValidators } from "./run-validators";
import { required } from "./validators/required";

export function askForAuthorName(defaults: CliOptions): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter the author name for this project:",
        name: "value",
        default: defaults["author-name"],
        validate: (value) => {
            return runValidators(
                value,
                required
            );
        }
    });
}
