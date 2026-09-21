// Root ESLint flat config (owner: Architect). Workspaces do not add their own configs;
// ask the Architect if a rule needs to change.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      ".worktrees/**",
      "apps/api/data/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node code: config files, scripts, API, QA harness and tools.
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
  {
    // Browser code.
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
);
