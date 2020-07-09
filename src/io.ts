import path from "path";
import { promises as fs } from "fs";
import { sleep } from "./utils";
import { createFolderIfNotExists, fileExists } from "./fs";
import { Dictionary } from "./types";

export async function readTextFile(at: string): Promise<string> {
    const fullpath = path.resolve(at);
    for (let i = 0; i < 5; i++) {
        try {
            return await fs.readFile(fullpath, { encoding: "utf8" });
        } catch (e) {
            await sleep(100);
        }
    }
    throw new Error(`can't read file at ${ fullpath }`);
}

export async function readLines(at: string): Promise<string[]> {
    const contents = await readTextFile(at);
    return (contents || "").split("\n").map(l => l.replace(/\r$/, ""));
}

export async function writeLines(at: string, lines: string[]): Promise<void> {
    const contents = lines.join("\n");
    await writeTextFile(at, contents);
}

export async function writeTextFile(at: string, contents: string): Promise<void> {
    const container = path.dirname(at);
    await createFolderIfNotExists(container);
    return fs.writeFile(at, contents, { encoding: "utf8" });
}

export async function readPackageJson(at?: string): Promise<NpmPackage> {
    const
        fname = "package.json",
        pkgPath = !!at
            ? (await fileExists(at) ? at: path.join(at, fname))
            : fname;
    return JSON.parse(
        await readTextFile(
            pkgPath
        )
    );
}

export async function writePackageJson(pkg: NpmPackage): Promise<void> {
    await writeTextFile(
        "package.json",
        JSON.stringify(
            pkg, null, 2
        )
    );
}

export interface NpmPackage {
    name: string;
    version: string;
    files: string[];
    bin: Dictionary<string>;
    description: string;
    main: string;
    scripts: Dictionary<string>;
    repository: Dictionary<string>;
    keywords: string[];
    author: Dictionary<string> | string;
    license: string;
    devDependencies: Dictionary<string>;
    dependencies: Dictionary<string>;
}

