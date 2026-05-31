const { vim, Vim } = require('@replit/codemirror-vim')
const { EditorView } = require('@codemirror/view')
const { getEnv } = require('./env')

const isSystemClipboardEnabled = () =>
  getEnv().config.get('vim.useSystemClipboard', true)

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
    if (!registerName && isSystemClipboardEnabled()) {
      const { clipboard } = getEnv()
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
  if (!isSystemClipboardEnabled()) {
    return
  }
  const text = getEnv().clipboard.readText()
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
