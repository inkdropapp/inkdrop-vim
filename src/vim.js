const { vim, Vim } = require('@replit/codemirror-vim')
const { actions } = require('inkdrop')
const {
  registerClipboardTextOnFocus,
  registerClipboardText
} = require('./clipboard')
const { editorInitHandler, vimModeClass } = require('./utils')
const { bindPreviewVimCommands } = require('./preview')
const { relativeLineNumbers } = require('./relative-line-numbers')
require('./ex')
require('./keymaps')

class Plugin {
  config = {
    relativeLineNumbers: {
      title: 'Relative line numbers',
      type: 'boolean',
      description:
        'Show relative line numbers. When disabled, absolute line numbers are shown instead.',
      default: false
    },
    useSystemClipboard: {
      title: 'Use system clipboard',
      type: 'boolean',
      description:
        'Sync vim yank/delete with the system clipboard. When disabled, vim operations use an internal register only (like standard vim without clipboard=unnamed).',
      default: true
    }
  }

  activate() {
    this.Vim = Vim
    this.extension = [vim(), registerClipboardTextOnFocus(), editorInitHandler, vimModeClass]
    this.sub = inkdrop.window.onFocus(this.handleAppFocus)
    this.unbindPreviewViewCommands = bindPreviewVimCommands()
    this.configSub = inkdrop.config.observe(
      'vim.relativeLineNumbers',
      this.handleRelativeLineNumbersChange
    )
    this.lineNumbersConfigSub = inkdrop.config.observe(
      'editor.lineNumbers',
      this.handleRelativeLineNumbersChange
    )
    inkdrop.onEditorLoad(this.extendEditor)
  }

  deactivate() {
    this.unextendEditor()
    this.extension = null
    this.sub.dispose()

    this.unbindPreviewViewCommands()
    this.unbindPreviewViewCommands = null

    if (this.configSub) {
      this.configSub.dispose()
      this.configSub = null
    }
    if (this.lineNumbersConfigSub) {
      this.lineNumbersConfigSub.dispose()
      this.lineNumbersConfigSub = null
    }
  }

  extendEditor = () => {
    inkdrop.commands.dispatch(document.body, 'editor:add-extension', {
      extension: this.extension
    })
    this.handleRelativeLineNumbersChange()
  }

  unextendEditor = () => {
    inkdrop.commands.dispatch(document.body, 'editor:remove-extension', {
      extension: this.extension
    })
    this.toggleRelativeLineNumbers(false)
  }

  isRelativeLineNumbersEnabled() {
    return (
      inkdrop.config.get('vim.relativeLineNumbers') &&
      inkdrop.config.get('editor.lineNumbers')
    )
  }

  toggleRelativeLineNumbers(enabled) {
    if (enabled) {
      inkdrop.commands.dispatch(document.body, 'editor:add-extension', {
        extension: relativeLineNumbers
      })
    } else {
      inkdrop.commands.dispatch(document.body, 'editor:remove-extension', {
        extension: relativeLineNumbers
      })
    }
  }

  handleAppFocus() {
    registerClipboardText()
  }

  handleRelativeLineNumbersChange = () => {
    const enabled = this.isRelativeLineNumbersEnabled()
    this.toggleRelativeLineNumbers(enabled)
  }
}

module.exports = new Plugin()
