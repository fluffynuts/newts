import { AsyncValidatorResult } from "../run-validators";
import { isPartOfGitRepo } from "../../../git";

export async function isNotInGitRepo(at: string): AsyncValidatorResult {
    const isInGitRepo = await isPartOfGitRepo(at);
    return isInGitRepo
        ? "please select a path which is not part of an existing git repository"
        : true;
}
