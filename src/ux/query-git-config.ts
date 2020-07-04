import { spawn } from "../spawn";

export async function queryGitConfig(key: string): Promise<string> {
    try {
        const
            result = await spawn("git", ["config", "--get", key]),
            allLines = result.stdout.concat(result.stderr)
                .map(l => (l || "").trim())
                .filter(l => !!l);
        // git outputs config info on stderr, which _surely_ is a mistake?
        // -> just in case, let's take _all_ output and select the first non-empty line
        return (allLines[0] || "").trim();
    } catch (e) {
        return "";
    }
}
