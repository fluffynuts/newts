import inquirer from "inquirer";
import { required } from "./validators/required";
import { nameIsAvailableAtNpmJs } from "./validators/name-is-available-at-npm-js";
import { HasValue } from "./types";
import { runValidators } from "./run-validators";
import { isValidPackageName } from "./validators/is-valid-package-name";

export function askName(): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter a name for the new project:",
        name: "value",
        validate: (value) => {
            return runValidators(
                value,
                required,
                isValidPackageName,
                nameIsAvailableAtNpmJs
            );
        }
    });
}

