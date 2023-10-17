import { init, mockSpawn, readTextFile, runTsBoot, shared } from "./test-helpers/shared";
import "expect-even-more-jest";
import "./test-helpers/matchers";
import { newts } from "../src/newts";
import { NewtsOptions } from "../src/types";

describe(`newts: baseline configurations`, () => {
  describe(`tslint`, () => {
    it(`should not generate tslint.json when tslint not installed`, async () => {
      // Arrange
      const
        {
          name,
          where,
          tslintPath
        } = await init();
      // Act
      await runTsBoot({
        name,
        where,
        includeLinter: false
      });
      // Assert
      expect(tslintPath)
        .not.toBeFile();
    });
    it(`should generate tslint.json when tslint installed (default)`, async () => {
      // Arrange
      const
        {
          name,
          where,
          tslintPath
        } = await init();
      // Act
      await runTsBoot({
        name,
        where
      });
      // Assert
      expect(tslintPath)
        .toBeFile();
    });

    describe(`rules`, () => {
      it(`should extend tslint:recommended`, async () => {
        // Arrange
        const {
          name,
          where,
          tslintPath
        } = await init();
        // Act
        await runTsBoot({
          name,
          where
        });
        const result = JSON.parse(await readTextFile(tslintPath));
        // Assert
        expect(result.extends)
          .toBeArray();
        expect(result.extends)
          .toContain("tslint:recommended");
      });
      it(`should default to error`, async () => {
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.defaultSeverity)
          .toEqual("error");
      });
      it(`should have empty jsRules`, async () => {
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.jsRules)
          .toExist();
        expect(Object.keys(result.jsRules))
          .toBeEmptyArray();
      });
      // double-quotes won a long time ago. Let those single-quotes
      // go!
      it(`should require double-quotes`, async () => {
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.rules.quotemark)
          .toEqual([ true, "double" ]);
      });
      it(`should allow multi-line declarations`, async () => {
        // this is a personal style choice, but it can make
        //  declaration blocks easier (imo) to understand
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.rules["one-variable-per-declaration"])
          .toBeFalse();
      });
      it(`should not enforce ordered imports`, async () => {
        // because ordered imports can interfere with jest mocks
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.rules["ordered-imports"])
          .toBeFalse();
      });
      it(`should not enforce no-console`, async () => {
        // -> console.{error|log} (at least) are valid for cli apps
        // -> zen debugging!
        // Arrange
        // Act
        const result = await bootDefaultLinter();
        // Assert
        expect(result.rules["no-console"])
          .toBeFalse();
      });
    });

    async function bootDefaultLinter() {
      const {
        name,
        where,
        tslintPath
      } = await init();
      await runTsBoot({
        name,
        where
      });
      return JSON.parse(await readTextFile(tslintPath));
    }
  });

  describe(`jest.config.js`, () => {
    it(`should clear mocks`, async () => {
      // Arrange
      // Act
      const jestConfig = await bootDefaultJestConfig();
      // Assert
      expect(jestConfig.clearMocks)
        .toBeTrue();
    });

    it(`should have the ts-jest preset`, async () => {
      // Arrange
      // Act
      const jestConfig = await bootDefaultJestConfig();
      // Assert
      expect(jestConfig.preset)
        .toEqual("ts-jest");
    });

    describe(`when testEnvironment is node`, () => {
      it(`should set node test environment by default`, async () => {
        // Arrange
        // Act
        const jestConfig = await bootDefaultJestConfig();
        // Assert
        expect(jestConfig.testEnvironment)
          .toEqual("node");
      });

      it(`should set jsdom test environment on request`, async () => {
        // Arrange
        // Act
        const jestConfig = await bootDefaultJestConfig({
          testEnvironment: "jsdom"
        });
        // Assert
        expect(jestConfig.testEnvironment)
          .toEqual("jsdom");
      });
    });

    async function bootDefaultJestConfig(opts?: Partial<NewtsOptions>) {
      const {
        name,
        where,
        jestConfigPath
      } = await init();
      const options = {
        ...opts,
        name,
        where,
        skipTsConfig: true
      } as NewtsOptions;
      await newts(options);
      return require(jestConfigPath);
    }
  });

  describe(`tsconfig.json`, () => {
    let tsconfig: any;
    beforeAll(async () => {
      mockSpawn();
      // override install to get actual tsc so we can use the result from tsc --init
      shared.npmInstallModifier = () => [ "install", "--save-dev", "--no-progress", "typescript" ];
      shared.allowNpmRun = true;
      tsconfig = await bootDefaultTsConfig();
    });
    afterAll(() => {
      shared.npmInstallModifier = undefined;
    });

    it(`should target ES2018`, async () => {
      // provides cleaner output than es5 and works on modern things
      // Arrange
      // Act
      // Assert
      expect(tsconfig)
        .toExist();
      expect(tsconfig.compilerOptions)
        .toExist();
      expect(tsconfig.compilerOptions.target)
        .toEqual("ES2018");
    });
    it(`should emit declarations`, async () => {
      // Arrange
      // Act
      // Assert
      expect(tsconfig.compilerOptions.declaration)
        .toBeTrue();
    });

    it(`should set the outDir to ./dist`, async () => {
      // Arrange
      // Act
      // Assert
      expect(tsconfig.compilerOptions.outDir)
        .toEqual("./dist");
    });
    it(`should exclude test and dist from compilation`, async () => {
      // Arrange
      // Act
      // Assert
      expect(tsconfig.exclude)
        .toBeEquivalentTo([ "tests", "dist" ]);
    });

    async function bootDefaultTsConfig() {
      const {
        name,
        where,
        tsconfigPath
      } = await init();
      await newts({
        name,
        where
      });
      const
        contents = await readTextFile(tsconfigPath),
        withoutComments = contents.replace(
          /\/\*.*\*\//g, ""
        ).replace(
          /\/\/.*/g, ""
        );
      try {
        return JSON.parse(withoutComments);
      } catch (e) {
        console.log({
          e,
          withoutComments
        });
        throw e;
      }
    }
  });
});
