module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: "./tsconfig.json",
    sourceType: "module",
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  plugins: [
    "@typescript-eslint",
    "typescript-sort-keys"
  ],
  rules: {
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false
      }
    ],
    "@typescript-eslint/indent": [ "error", 2, {
      "ArrayExpression": "first",
      "FunctionDeclaration": {
        "parameters": "first"
      },
      "ImportDeclaration": 1,
      "ObjectExpression": 1,
      "SwitchCase": 1,
      "VariableDeclarator": "first"
    }],
    "@typescript-eslint/member-ordering": ["error"],
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-extra-parens": ["error"],
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    "@typescript-eslint/type-annotation-spacing": "error",
    "array-bracket-spacing": "error",
    "comma-spacing": [2, {"before": false, "after": true}],
    "computed-property-spacing": ["error", "never", { "enforceForClassMembers": true }],
    "import/first": "error",
    "import/no-useless-path-segments": [
      "error",
      {
        "noUselessIndex": true
      }
    ],
    "import/order": [
      "error",
      {
        "newlines-between": "always-and-inside-groups",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "pathGroups": [
          {
            "pattern": "~/**",
            "group": "external"
          }
        ]
      }
    ],
    "indent": "off",
    "key-spacing": ["error", { "align": "value" }],
    "keyword-spacing": ["error"],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "lines-between-class-members": ["error", "always"],
    "max-len": [
      "error",
      {
        "code": 120,
        "ignoreComments": true
      }
    ],
    "no-debugger": "error",
    "no-extra-parens": "off",
    "no-mixed-spaces-and-tabs": "error",
    "no-multi-spaces":["error", { exceptions: { "VariableDeclarator": true } }],
    "no-var": "error",
    "no-whitespace-before-property": "error",
    "object-curly-spacing": [
      "error",
      "always",
      {
        "arraysInObjects": true,
        "objectsInObjects": true
      }
    ],
    "padded-blocks": ["error", "never"],
    "prefer-template": "error",
    "quotes": [
      "error",
      "single",
      {
        "avoidEscape": true
      }
    ],
    "space-before-function-paren": [
      "error",
      {
        "anonymous": "always",
        "asyncArrow": "always",
        "named": "never"
      }
    ],
    "space-in-parens": ["error", "always"],
    "template-curly-spacing": ["error", "always"],
    "typescript-sort-keys/interface": "error",
    "typescript-sort-keys/string-enum": "error"
  }
};
