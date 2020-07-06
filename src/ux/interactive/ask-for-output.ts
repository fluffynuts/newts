import { CliOptions } from "../cli-options";
import { HasValue } from "./types";
import inquirer from "inquirer";
import { runValidators } from "./run-validators";
import { required } from "./validators/required";
import { isNotInGitRepo } from "./validators/is-not-in-git-repo";

export function askForOutput(defaults: CliOptions): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter an output path for the new project:",
        name: "value",
        default: defaults.output,
        validate: (value) => {
            return runValidators(
                value,
                required,
                isNotInGitRepo
            );
        }
    });
}
