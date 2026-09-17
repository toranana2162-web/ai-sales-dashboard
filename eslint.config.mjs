import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // このプロジェクトでは、クライアントコンポーネント内でuseEffect+fetchによる
      // データ取得を行っている(Server Components/SWR等の導入はARCHITECTURE.mdで
      // 決定していない範囲のため見送り)。このルールは「effect内でのsetState」を
      // 一律エラーにしてしまい、この一般的なデータ取得パターンと相容れないため無効化する。
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
