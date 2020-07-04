import { JSDOM } from "jsdom";
import { sync as rimraf } from "rimraf";
import { ConsoleFeedback } from "../src/ux/console-feedback";
import { writeTextFile } from "../src/io";
const baseUrl = "https://opensource.org/licenses";

const ignoreLicenses = [
    "category",
    "do-not-use"
];
const ignoreLicenseText = [
    "ceased to use or recommend",
    "voluntarily deprecated"
];

async function listLicenses(): Promise<string[]> {
    const
        doc = await JSDOM.fromURL(`${baseUrl}/alphabetical`),
        result = Array.from(doc.window.document.querySelectorAll("#main a"))
            .map(a => a as HTMLAnchorElement)
            .filter(a => (a.href || "").match(/\/licenses\//i))
            .map(a => {
                const parts = a.href.split("/");
                return parts[parts.length - 1]
            }).filter(l => ignoreLicenses.indexOf(l) === -1);
    return result;
}

async function downloadLicense(name: string): Promise<string> {
    const
        dom = await JSDOM.fromURL(`${baseUrl}/${name}`),
        els = Array.from(dom.window.document.querySelectorAll("#main p"))
    return els.map(p => p.textContent)
        .map(t => t as string)
        .filter(t => !!t)
        .filter(t => !t.trim().startsWith("SPDX"))
        .filter(t => !t.trim().startsWith("Note:"))
        .join("\n")
        .trim();
}


(async () => {
    const feedback = new ConsoleFeedback();
    const licenses = await feedback.run(
        `fetching list of known licenses`,
        listLicenses
    );
    await feedback.run(
        `remove existing licenses`,
        () => Promise.resolve(rimraf("licenses"))
    );
    console.log(`found ${licenses.length} licenses`);
    for (const license of licenses) {
        await feedback.run(
            `Download: ${license}`,
            async () => {
                const text = (await downloadLicense(license) || "");
                if (!text) {
                    return;
                }
                const skip = ignoreLicenseText.reduce(
                    (acc, cur) => acc || text.toLowerCase().indexOf(cur) > -1,
                    false
                );
                if (skip) {
                    return;
                }
                await writeTextFile(`licenses/${license}`, text);
            });
    }
})();
