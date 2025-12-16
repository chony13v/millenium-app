import tseslint from "typescript-eslint";

export default [
  // Ignora carpetas generadas / dependencias
  { ignores: ["lib/**", "node_modules/**"] },

  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
