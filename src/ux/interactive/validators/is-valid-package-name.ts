import validate from "validate-npm-package-name";

export async function isValidPackageName(
    name: string): Promise<string | boolean> {
    const nameTest = validate(name);
    if (!nameTest.validForNewPackages) {
        const warnings = [
            `${ name } is not a valid package name`
        ];
        (nameTest.warnings || []).forEach(warning => {
            warnings.push(warning);
        });
        return warnings.join("\n");
    }
    return true;
}

