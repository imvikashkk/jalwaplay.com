import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler false-positives on standard async data-fetch patterns
      // (fetch functions called from useEffect). Downgrade to warn.
      // (eslint-config-next 16 ships these checks under the react-hooks plugin;
      // the old 'react-compiler/react-compiler' rule name no longer exists.)
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

export default eslintConfig;
