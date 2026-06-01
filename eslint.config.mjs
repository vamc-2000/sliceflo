import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "app/**",
      "components/**",
      "hooks/**",
      "lib/**",
      "lib/api/**",
      "lib/constants/**",
      "lib/utils/**",
      "public/**",
      "stores/**",
      "schemas/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
