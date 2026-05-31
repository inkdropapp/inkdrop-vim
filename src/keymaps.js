const { Vim } = require('@replit/codemirror-vim')
const { getEnv } = require('./env')

Vim.defineAction('completion-selection-down', cm => {
  getEnv().commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-down')
})

Vim.defineAction('completion-selection-up', cm => {
  getEnv().commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-up')
})

Vim.mapCommand('<C-n>', 'action', 'completion-selection-down', {}, { context: 'insert' })
Vim.mapCommand('<C-p>', 'action', 'completion-selection-up', {}, { context: 'insert' })
