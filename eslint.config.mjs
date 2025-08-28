import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    // Ignore generated and large directories
    {
        ignores: ["node_modules", "dist", "build", ".wasp", "public", "tmp", ".husky", "migrations", "docker"],
    },

    // Base language/global options applied to everything
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },

    // Recommended JS rules
    js.configs.recommended,

  // React Hooks best practices on JSX/TSX only
  {
    files: ["**/*.{jsx,tsx}"],
    settings: { react: { version: "detect" } },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "warn",
    },
  },

  // Recommended TS rules (apply only to TS/TSX)
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.{ts,tsx}"],
  })),

  // Type-aware TS rules for TS/TSX files
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...(c.languageOptions ?? {}),
      parserOptions: {
        ...((c.languageOptions && c.languageOptions.parserOptions) || {}),
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  })),

  // Disable rules that conflict with Prettier formatting
  eslintConfigPrettier,

  // Global unused vars handling: allow names starting with _ for intent/signatures
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // TS-specific unused vars configuration
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Relax unsafe-any related rules in server code to align with Wasp context types
  {
    files: ["src/server/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];
