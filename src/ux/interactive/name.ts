import inquirer from "inquirer";
import { required } from "./validators/required";
import { nameIsValid } from "../../name-is-valid";
import { HasValue } from "./types";

export function askName(): Promise<HasValue<string>> {
    return inquirer.prompt({
        message: "Please enter a name for the new project:",
        name: "value",
        validate: async (value) => {
            if (!required(value)) {
                return false;
            }
            return await nameIsValid(value)
        }
    });
}

