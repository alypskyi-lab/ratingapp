module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    moduleFileExtensions: ['ts', 'js', 'json'],
    testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/app/$1',
        '^@common/(.*)$': '<rootDir>/src/common/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@cache/(.*)$': '<rootDir>/src/common/services/cache/$1',
    },
    moduleDirectories: ['node_modules', '<rootDir>/src'],
};

