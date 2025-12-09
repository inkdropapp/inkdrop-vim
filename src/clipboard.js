const { vim, Vim } = require('@replit/codemirror-vim')
const { clipboard } = require('electron')
const { EditorView } = require('@codemirror/view')

const origResetVimGlobalState = Vim.resetVimGlobalState_
Vim.resetVimGlobalState_ = () => {
  origResetVimGlobalState.call(Vim)
  const state = Vim.getVimGlobalState_()
  const origPushText = state.registerController.pushText
  state.registerController.pushText = (
    registerName,
    operator,
    text,
    linewise,
    blockwise
  ) => {
    // console.log('pushText', registerName, operator, text, linewise, blockwise)
    if (!registerName) {
      const currentText = clipboard.readText()
      if (currentText !== text) {
        clipboard.writeText(text)
      }
    }
    origPushText.call(
      state.registerController,
      registerName,
      operator,
      text,
      linewise,
      blockwise
    )
  }
}

Vim.resetVimGlobalState_()

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
