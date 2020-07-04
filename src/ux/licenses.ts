import { promises } from "fs";
const { readdir } = promises;
import path from "path";
import { folderExists } from "../fs";
import { readTextFile } from "../io";

const licenseDir = path.resolve(path.join(__dirname, "..", "..", "licenses"));

export async function listLicenses(): Promise<string[]> {
    if (!(await folderExists(licenseDir))) {
        throw new Error(`can't find licenses at: ${ licenseDir }`);
    }
    return readdir(licenseDir);
}

export async function readLicense(id: string): Promise<string> {
    const
        allLicenses = await listLicenses(),
        lowerId = (id || "").toLowerCase(),
        match = allLicenses.find(l => l.toLowerCase() === lowerId);
    if (!match) {
        throw new Error(`unknown license: ${id}`);
    }
    return await readTextFile(path.join(licenseDir, match));
}
