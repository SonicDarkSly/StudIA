import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import tseslint from 'typescript-eslint';

const TRIPLE_SLASH_DIRECTIVE = /^\/\s*<reference /;

const noComments = {
  meta: {
    type: 'suggestion',
    messages: {
      comment: 'Commentaire interdit : le code doit se suffire (noms explicites, constantes nommées).',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === 'Line' && TRIPLE_SLASH_DIRECTIVE.test(comment.value)) continue;
          context.report({ loc: comment.loc, messageId: 'comment' });
        }
      },
    };
  },
};

const NULL_TYPE = {
  selector: 'TSNullKeyword',
  message: 'Type null interdit : utiliser undefined (champ ?: ou T | undefined).',
};

const NO_ENUM = {
  selector: 'TSEnumDeclaration',
  message:
    "enum interdit (manuel TypeScript) : utiliser une union de chaînes ('a' | 'b') ou un objet as const.",
};

const nullLiteral = (allowed) => ({
  selector: `Literal[raw='null']${allowed.map((context) => `:not(${context})`).join('')}`,
  message: 'null interdit : utiliser undefined, sauf si une API impose null.',
});

const NULL_ALLOWED = [
  "CallExpression[callee.object.name='JSON'][callee.property.name='stringify'] > Literal",
  'BinaryExpression > Literal',
];

const NULL_ALLOWED_REACT = [
  ...NULL_ALLOWED,
  "CallExpression[callee.name='useRef'] > Literal",
  'JSXExpressionContainer > Literal',
  'JSXExpressionContainer ConditionalExpression > Literal',
  'ReturnStatement > Literal',
];

const INLINE_STYLE_VALUE = {
  selector:
    "JSXAttribute[name.name='style'] Property > :matches(Literal, TemplateLiteral[expressions.length=0])",
  message:
    'Style en dur interdit : déplacer la valeur dans une classe CSS (Composant.css ou styles/), thèmes et contraste au même endroit.',
};

const JSX_MAGIC_NUMBER = {
  selector: 'JSXAttribute Literal[raw=/^(?!-?[01]$)-?\\.?\\d/]',
  message: 'Nombre magique dans un attribut JSX : utiliser une constante nommée.',
};

const RELATIVE_IMPORT_WITH_JS = {
  selector: 'ImportDeclaration[source.value=/^\\.\\.?\\//]:not([source.value=/\\.js$/])',
  message: 'Import relatif côté serveur : ajouter le suffixe .js (sortie CommonJS).',
};

const NODE_LLAMA_CPP = {
  name: 'node-llama-cpp',
  allowTypeImports: true,
  message:
    'Charger node-llama-cpp par llamaCpp() (shared/config/esm.ts) ; seuls les imports de types sont permis.',
};

const MODE_REGISTRY_ONLY = {
  regex: '/catalog/(?!index\\.js$)',
  message: 'Un mode ne se charge que par son registre (modes/catalog/index.js).',
};

const NESTJS_IN_DOMAIN = [
  { name: '@nestjs/common', message: 'Le domaine ne dépend pas de NestJS (hors AggregateRoot).' },
  { name: '@nestjs/core', message: 'Le domaine ne dépend pas de NestJS (hors AggregateRoot).' },
];

const layerImports = (forbidden, message, extraPatterns = []) => [
  'error',
  {
    paths: [NODE_LLAMA_CPP, ...forbidden.paths],
    patterns: [
      MODE_REGISTRY_ONLY,
      ...(forbidden.layers ? [{ regex: `/(${forbidden.layers.join('|')})/`, message }] : []),
      ...extraPatterns,
    ],
  },
];

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', 'server/data/**', 'server/logs/**', 'docs/**']),
  js.configs.recommended,
  {
    files: ['scripts/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    plugins: { studia: { rules: { 'no-comments': noComments } } },
    rules: {
      'studia/no-comments': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['client/vite.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
          enforceConst: true,
        },
      ],
    },
  },
  {
    files: ['server/src/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_ENUM,
        NULL_TYPE,
        nullLiteral(NULL_ALLOWED),
        RELATIVE_IMPORT_WITH_JS,
      ],
      '@typescript-eslint/no-restricted-imports': layerImports({ paths: [] }),
    },
  },
  {
    files: ['server/src/modules/*/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports(
        { paths: NESTJS_IN_DOMAIN, layers: ['application', 'infrastructure', 'api'] },
        'Le domaine ne dépend que du domaine.',
      ),
    },
  },
  {
    files: ['server/src/modules/modes/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports(
        { paths: NESTJS_IN_DOMAIN, layers: ['application', 'infrastructure', 'api', 'catalog', 'utils'] },
        'Le contrat commun des modes ne connaît ni les modes ni leurs utilitaires.',
      ),
    },
  },
  {
    files: ['server/src/modules/modes/catalog/*/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports({ paths: [] }, '', [
        {
          regex: '^\\.\\./(?!\\.\\./(domain|utils)/)',
          message:
            "Un mode est indépendant : il n'importe que ses propres fichiers, modes/domain et modes/utils (jamais un autre mode ni le registre).",
        },
      ]),
    },
  },
  {
    files: ['server/src/modules/modes/utils/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports({ paths: [] }, '', [
        {
          regex: '^\\.\\./(?!domain/)',
          message: 'Les utilitaires partagés entre modes ne dépendent que de modes/domain.',
        },
      ]),
    },
  },
  {
    files: ['server/src/modules/*/application/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports(
        { paths: [], layers: ['infrastructure', 'api'] },
        "L'application passe par les ports du domaine, jamais par l'infrastructure ou l'api.",
      ),
    },
  },
  {
    files: ['server/src/modules/*/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': layerImports(
        { paths: [], layers: ['infrastructure'] },
        "Un contrôleur passe par le CommandBus ou le QueryBus, jamais par l'infrastructure.",
      ),
    },
  },
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.configs.strict,
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_ENUM,
        NULL_TYPE,
        nullLiteral(NULL_ALLOWED_REACT),
        INLINE_STYLE_VALUE,
        JSX_MAGIC_NUMBER,
      ],
      'jsx-a11y-x/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/modes/',
              message: 'Les règles des modes ne se chargent que par leur registre (@/modes).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['client/src/modes/*/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(@/modes(/(?!utils/)|$)|\\.\\./)',
              message:
                "Un mode est indépendant : il n'importe que ses propres fichiers, @/modes/utils et les utilitaires généraux (jamais un autre mode ni le registre).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['client/src/App.tsx', 'client/src/components/**/*.tsx', 'client/src/hooks/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  prettier,
]);
