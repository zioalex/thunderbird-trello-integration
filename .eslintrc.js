module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    jest: true,
    commonjs: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  globals: {
    browser: 'readonly',
    console: 'readonly'
  },
  rules: {
    // Possible errors
    'no-console': 'off', // Allow console for debugging in extensions
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Best practices
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Style
    'indent': ['error', 4],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-trailing': 'off',
    
    // ES6+
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    
    // WebExtension specific
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true,
        node: true
      },
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterEach: 'readonly',
        afterAll: 'readonly'
      }
    },
    {
      files: ['test-runner.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
