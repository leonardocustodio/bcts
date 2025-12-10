import createConfig from '@bcts/eslint';

const config = createConfig('./tsconfig.json');

export default [
  ...config,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-globals': 'off',
    },
  },
];
