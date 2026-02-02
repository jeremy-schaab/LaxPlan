const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/components/ui/**",
    "!src/app/**/page.tsx", // Page components are complex UI, tested manually
    "!src/app/layout.tsx",
    "!src/components/layout/app-layout.tsx",
    "!src/components/layout/header.tsx",
    "!src/components/providers/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    // Critical files have higher thresholds
    "./src/lib/schedule-generator.ts": {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "./src/app/api/data/route.ts": {
      branches: 90,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    "./src/store/index.ts": {
      branches: 40,
      functions: 80,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
