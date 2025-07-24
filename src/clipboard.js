const { vim, Vim } = require('@replit/codemirror-vim')
const { clipboard } = require('electron')
const { EditorView } = require('@codemirror/view')

/** @arg {Pos} cur1  @arg {Pos} cur2 @return {boolean}*/
function cursorIsBefore(cur1, cur2) {
  if (cur1.line < cur2.line) {
    return true
  }
  if (cur1.line == cur2.line && cur1.ch < cur2.ch) {
    return true
  }
  return false
}
/** @arg {Pos} cur1 @arg {Pos} cur2  @return {Pos}*/
function cursorMin(cur1, cur2) {
  if (arguments.length > 2) {
    // @ts-ignore
    cur2 = cursorMin.apply(undefined, Array.prototype.slice.call(arguments, 1))
  }
  return cursorIsBefore(cur1, cur2) ? cur1 : cur2
}

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
  console.log('Yanked text:', text)
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
