const preset = require('jest-expo/jest-preset')

const [nodeModules, ...rest] = preset.transformIgnorePatterns
const babel = preset.transform['\\.[jt]sx?$']

if (!nodeModules.includes('(?!(') || babel === undefined) {
  throw new Error(
    'jest-expo changed its transform settings; re-check the Better Auth entries below',
  )
}

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  // Better Auth ships ESM only, partly as .mjs, so it joins the packages jest-expo transforms, with the same Babel.
  transform: { '\\.mjs$': babel },
  transformIgnorePatterns: [
    nodeModules.replace('(?!(', '(?!(better-auth|@better-auth|nanostores|'),
    ...rest,
  ],
}
