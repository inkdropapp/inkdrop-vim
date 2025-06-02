const { vim, Vim } = require('@replit/codemirror-vim')
const { clipboard } = require('electron')
const { EditorView } = require('@codemirror/view')

Vim.defineOperator('yank', (cm, args, ranges, oldAnchor) => {
  const vim = cm.state.vim
  const text = cm.getSelection()
  const endPos = vim.visualMode
    ? cursorMin(vim.sel.anchor, vim.sel.head, ranges[0].head, ranges[0].anchor)
    : oldAnchor
  Vim.getRegisterController().pushText(
    args.registerName,
    'yank',
    text,
    args.linewise,
    vim.visualBlock
  )
  clipboard.writeText(text)

  return endPos
})

const registerClipboardText = () => {
  const text = clipboard.readText()
  if (text) {
    const isLinewise = text.indexOf('\n') >= 0
    Vim.getRegisterController().pushText(
      '',
      'yank',
      text,
      isLinewise,
      vim.visualBlock
    )
  }
}
const registerClipboardTextOnFocus = () => {
  return EditorView.updateListener.of(update => {
    if (update.focusChanged) {
      if (update.view.hasFocus) {
        registerClipboardText()
      }
    }
  })
}

module.exports = {
  registerClipboardText,
  registerClipboardTextOnFocus
}
