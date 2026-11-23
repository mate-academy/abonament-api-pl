import tseslint from "typescript-eslint";

export default [
  { ignores: ["node_modules/", "coverage/", "drizzle/", "stand/catalog-api/"] },
  ...tseslint.configs.recommended,
];
