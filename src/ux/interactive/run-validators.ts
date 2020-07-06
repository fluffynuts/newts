export type AsyncValidatorResult = Promise<boolean | string>;
export type ValidatorResult = boolean | string | AsyncValidatorResult;
export type Validator<T> = (value: T) => ValidatorResult;

export async function runValidators<T>(
    value: T,
    ...validators: Validator<T>[]): AsyncValidatorResult {
    for (const validator of validators) {
        try {
            const thisResult = await validator(value);
            if (thisResult !== true) {
                return thisResult;
            }
        } catch (e) {
            return e.message;
        }
    }
    return true;
}
