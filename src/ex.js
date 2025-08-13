const { Vim } = require('@replit/codemirror-vim')

Vim.defineEx('write', 'w', () => {
  inkdrop.commands.dispatch(document.body, 'core:save-note')
})
Vim.defineEx('next', 'n', () => {
  inkdrop.commands.dispatch(document.body, 'core:open-next-note')
})
Vim.defineEx('prev', '', () => {
  inkdrop.commands.dispatch(document.body, 'core:open-prev-note')
})
Vim.defineEx('preview', 'p', () => {
  inkdrop.commands.dispatch(document.body, 'view:toggle-preview')
})
Vim.defineEx('side-by-side', 'side', () => {
  inkdrop.commands.dispatch(document.body, 'view:toggle-side-by-side')
})
