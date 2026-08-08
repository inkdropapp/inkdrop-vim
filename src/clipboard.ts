import { EditorView } from '@codemirror/view'
import { Vim } from '@replit/codemirror-vim'

import { getEnv } from './env'

const isSystemClipboardEnabled = () => getEnv().config.get('vim.useSystemClipboard', true)

const origResetVimGlobalState = Vim.resetVimGlobalState_
Vim.resetVimGlobalState_ = () => {
  const previousRegisters = Vim.getVimGlobalState_().registerController
  const previousUnnamedRegister = previousRegisters.unnamedRegister
  const previousYankRegister = previousRegisters.registers['0']

  origResetVimGlobalState.call(Vim)
  const state = Vim.getVimGlobalState_()

  state.registerController.unnamedRegister.setText(
    previousUnnamedRegister.toString(),
    previousUnnamedRegister.linewise,
    previousUnnamedRegister.blockwise
  )
  if (previousYankRegister) {
    state.registerController.registers['0'] = previousYankRegister
  }

  const origPushText = state.registerController.pushText
  state.registerController.pushText = (registerName, operator, text, linewise, blockwise) => {
    if (!registerName && isSystemClipboardEnabled()) {
      const { clipboard } = getEnv()
      const currentText = clipboard.readText()
      if (currentText !== text) {
        clipboard.writeText(text)
      }
    }
    origPushText.call(state.registerController, registerName, operator, text, linewise, blockwise)
  }
}

Vim.resetVimGlobalState_()

export const registerClipboardText = () => {
  if (!isSystemClipboardEnabled()) {
    return
  }
  const text = getEnv().clipboard.readText()
  if (text) {
    const isLinewise = text.indexOf('\n') >= 0
    Vim.getRegisterController().pushText('', 'yank', text, isLinewise)
  }
}

export const registerClipboardTextOnFocus = () => {
  return EditorView.updateListener.of(update => {
    if (update.focusChanged) {
      if (update.view.hasFocus) {
        registerClipboardText()
      }
    }
  })
}
