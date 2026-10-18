import nextJest from 'next/jest.js';
const createJestConfig = nextJest({ dir: './' });
export default createJestConfig({
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/*.ui.tsx'],
  moduleNameMapper: {
    '^@web/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1',
  },
});
