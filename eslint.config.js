import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.playwright-mcp/**',
      'test-results/**',
      'playwright-report/**'
    ]
  },
  {
    files: ['app/**/*.js'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Node.js globals for bundled code
        require: 'readonly',
        module: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      prettier
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      // ES5-friendly rules
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-arrow-callback': 'off',
      'object-shorthand': 'off',
      // Catch common errors
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn'
    }
  },
  {
    files: ['gulpfile.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      prettier
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      // ES5-friendly rules
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-arrow-callback': 'off',
      'object-shorthand': 'off',
      // Catch common errors
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn'
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      prettier
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
];
