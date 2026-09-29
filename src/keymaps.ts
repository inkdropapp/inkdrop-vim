import { Vim } from '@replit/codemirror-vim'

import { getEnv } from './env'

Vim.defineAction('completion-selection-down', cm => {
  getEnv().commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-down')
})

Vim.defineAction('completion-selection-up', cm => {
  getEnv().commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-up')
})

Vim.mapCommand('<C-n>', 'action', 'completion-selection-down', {}, { context: 'insert' })
Vim.mapCommand('<C-p>', 'action', 'completion-selection-up', {}, { context: 'insert' })

Vim.defineAction('toggle-inline-code', cm => {
  getEnv().commands.dispatch(cm.getWrapperElement(), 'core:toggle-inline-code')
})
Vim.mapCommand('`', 'action', 'toggle-inline-code', {}, { context: 'visual' })
