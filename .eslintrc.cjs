module.exports = {
  root: true,
  ignorePatterns: ["**/dist/**", "**/node_modules/**", "**/artifacts/**", "**/cache/**", "**/typechain-types/**"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    es2022: true,
    node: true
  },
  overrides: [
    {
      files: ["frontend/src/**/*.{ts,tsx}", "frontend/test/**/*.ts"],
      env: {
        browser: true
      },
      plugins: ["react-hooks", "react-refresh"],
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-refresh/only-export-components": "off"
      }
    },
    {
      files: ["backend/**/*.ts", "contracts/**/*.ts"],
      env: {
        node: true
      }
    }
  ]
};
