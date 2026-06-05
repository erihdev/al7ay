import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Fast-refresh warnings are expected in context/UI files that intentionally export multiple values
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Allow `any` only as a last resort — will be fixed file by file
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
