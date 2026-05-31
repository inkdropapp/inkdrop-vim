const { Vim } = require('@replit/codemirror-vim')
const { getEnv } = require('./env')

Vim.defineEx('write', 'w', () => {
  getEnv().commands.dispatch(document.body, 'core:save-note')
})
Vim.defineEx('next', 'n', () => {
  getEnv().commands.dispatch(document.body, 'core:open-next-note')
})
Vim.defineEx('prev', '', () => {
  getEnv().commands.dispatch(document.body, 'core:open-prev-note')
})
Vim.defineEx('preview', 'p', () => {
  getEnv().commands.dispatch(document.body, 'view:toggle-preview')
})
Vim.defineEx('side-by-side', 'side', () => {
  getEnv().commands.dispatch(document.body, 'view:toggle-side-by-side')
})
Vim.defineEx('cmd', 'cmd', (cm, params) => {
  const command = params.args?.join(' ')
  if (command) {
    getEnv().commands.dispatch(cm.getWrapperElement(), command)
  }
})
