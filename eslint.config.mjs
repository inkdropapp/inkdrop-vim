import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: []
  },

  prettier,

  {
    languageOptions: {
      globals: {
        inkdrop: 'readonly'
      }
    },
    rules: {
      'no-useless-escape': 0,
      'prefer-const': 2,
      'no-unused-vars': 0
    }
  }
]
