const { Vim } = require('@replit/codemirror-vim')

Vim.defineAction('completion-selection-down', cm => {
  inkdrop.commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-down')
})

Vim.defineAction('completion-selection-up', cm => {
  inkdrop.commands.dispatch(cm.getWrapperElement(), 'editor:move-completion-selection-up')
})

Vim.mapCommand('<C-n>', 'action', 'completion-selection-down', {}, { context: 'insert' })
Vim.mapCommand('<C-p>', 'action', 'completion-selection-up', {}, { context: 'insert' })
