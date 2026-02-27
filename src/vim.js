const { vim, Vim } = require('@replit/codemirror-vim')
const { actions } = require('inkdrop')
const {
  registerClipboardTextOnFocus,
  registerClipboardText
} = require('./clipboard')
const { editorInitHandler } = require('./utils')
const { bindPreviewVimCommands } = require('./preview')
require('./ex')

class Plugin {
  config = {
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
  }

  deactivate() {
    inkdrop.store.dispatch(actions.mde.removeExtension(this.extension))
    this.extension = null
    this.sub.dispose()

    this.unbindPreviewViewCommands()
    this.unbindPreviewViewCommands = null
  }

  handleAppFocus() {
    registerClipboardText()
  }
}

module.exports = new Plugin()
