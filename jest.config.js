module.exports = { 
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    rootDir: ".",
    testRegex: ".spec.ts$",
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    coverageDirectory: "coverage",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
        "^@src/(.*)$": "<rootDir>/src/$1",
        "^@database/(.*)$": "<rootDir>/src/database/$1",
        "^@modules/(.*)$": "<rootDir>/src/modules/$1"
    }
};