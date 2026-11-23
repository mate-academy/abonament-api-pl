import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";

export default [
  { ignores: ["node_modules/", "coverage/", "reports/", "drizzle/", "stand/catalog-api/"] },
  ...tseslint.configs.recommended,
  comments.recommended,
  {
    files: ["test/**/*.ts"],
    plugins: { vitest },
    rules: {
      "vitest/no-disabled-tests": "error",
      "vitest/no-commented-out-tests": "error",
      "vitest/expect-expect": "error",
    },
  },
  { rules: { "@eslint-community/eslint-comments/require-description": "error" } },
];
