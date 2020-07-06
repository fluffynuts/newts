import inquirer from "inquirer";
import { required } from "./validators/required";
import { HasValue } from "./types";
import { runValidators } from "./run-validators";
import { isValidPackageName } from "./validators/is-valid-package-name";

export function askForName(): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter a name for the new project:",
        name: "value",
        validate: async (value) => {
            const result = await runValidators(
                value,
                required,
                isValidPackageName
            );
            return result;
        }
    });
}

