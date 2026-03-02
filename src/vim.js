const { vim, Vim } = require('@replit/codemirror-vim')
const { actions } = require('inkdrop')
const {
  registerClipboardTextOnFocus,
  registerClipboardText
} = require('./clipboard')
const { editorInitHandler } = require('./utils')
const { bindPreviewVimCommands } = require('./preview')
const { relativeLineNumbers } = require('./relative-line-numbers')
require('./ex')

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
    this.extension = [vim(), registerClipboardTextOnFocus(), editorInitHandler]
    inkdrop.store.dispatch(actions.mde.addExtension(this.extension))
    this.sub = inkdrop.window.onFocus(this.handleAppFocus)
    this.unbindPreviewViewCommands = bindPreviewVimCommands()
    this.configSub = inkdrop.config.observe(
      'vim.relativeLineNumbers',
      this.handleRelativeLineNumbersChange
    )
  }

  deactivate() {
    inkdrop.store.dispatch(actions.mde.removeExtension(this.extension))
    inkdrop.store.dispatch(actions.mde.removeExtension(relativeLineNumbers))
    this.extension = null
    this.sub.dispose()

    this.unbindPreviewViewCommands()
    this.unbindPreviewViewCommands = null

    if (this.configSub) {
      this.configSub.dispose()
      this.configSub = null
    }
  }

  handleAppFocus() {
    registerClipboardText()
  }

  handleRelativeLineNumbersChange = enabled => {
    if (enabled) {
      inkdrop.store.dispatch(actions.mde.addExtension(relativeLineNumbers))
    } else {
      inkdrop.store.dispatch(actions.mde.removeExtension(relativeLineNumbers))
    }
  }
}

module.exports = new Plugin()
