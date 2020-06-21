import yargs = require("yargs");

(async () => {
    const
        myIndex = process.argv.indexOf(__filename),
        remainingArgs = process.argv.slice(myIndex + 1),
        argv = yargs.option("interactive", {
            alias: "i",
            type: "boolean",
            default: false,
            description: "run the interactive bootstrapper (default if no arguments passed on the cli)"
        }).option("name", {
            alias: "n",
            description: "name of the module to create"
        }).option("where", {
            alias: "w",
            description: "where to create this module folder (defaults to the current folder)",
            default: process.cwd()
        }).option("include-linter", {
            alias: "l",
            type: "boolean",
            description: "whether or not to include the linter",
            default: true
        }).option("include-node-types", {
            alias: "t",
            description: "install @types/node as a dev-dependency",
            default: true
        }).option("include-jest", {
            alias: "j",
            description: "install jest and @types/jest",
            default: true
        }).option("extra-matchers", {
            alias: "e",
            description: "install expect-even-more-jest for more jest matchers",
            default: true
        }).option("include-zarro", {
            alias: "z",
            description: "install zarro: the zero-to-low-conf framework for build, built on gulp (required to set up publish scripts)",
            default: true
        }).option("init-git", {
            alias: "g",
            description: "initialize git"
        });
})();
