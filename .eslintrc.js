module.exports = {
    env: {
        node: true
    },
    extends: [ "eslint:recommended", "plugin:@typescript-eslint/recommended" ],
    parser: "@typescript-eslint/parser",
    plugins: [ "@typescript-eslint" ],
    root: true,
    ignorePatterns: [ "dist/**/*.*" ],
    rules: {
        "@typescript-eslint/no-var-requires": "off",
        "no-extra-boolean-cast": "off",
        "no-constant-condition": "off",
        "@typescript-eslint/no-explicit-any": "off"
    }
};
