import { AsyncValidatorResult } from "../run-validators";
import { isPartOfGitRepo } from "../../../git";

export async function isNotInGitRepo(at: string): AsyncValidatorResult {
    const isInGitRepo = await isPartOfGitRepo(at);
    return isInGitRepo
        ? `${ at || process.cwd() } is part of an existing git repository`
        : true;
}
