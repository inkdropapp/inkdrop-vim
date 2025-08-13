const { vim, Vim } = require('@replit/codemirror-vim')
const { actions } = require('inkdrop')
const {
  registerClipboardTextOnFocus,
  registerClipboardText
} = require('./clipboard')
const { bindPreviewVimCommands } = require('./preview')
const { disableScrollIntoView } = require('./scroll')
require('./ex')

class Plugin {
  config = {
    seamlessJumpToTitle: {
      title: 'Seamlessly jump to note title',
      type: 'boolean',
      description:
        'Focus jumps from the editor to the note title bar by `vim:move-up` command',
      default: false
    }
  }

  activate() {
    this.Vim = Vim
    this.extension = [vim(), registerClipboardTextOnFocus()]
    inkdrop.store.dispatch(actions.mde.addExtension(this.extension))
    inkdrop.window.on('focus', this.handleAppFocus)
    this.unbindPreviewViewCommands = bindPreviewVimCommands()

    this.sub = inkdrop.onEditorLoad(this.handleEditorLoaded.bind(this))
    setTimeout(() => {
      const editorView = inkdrop.getActiveEditor()
      if (editorView) this.handleEditorLoaded(editorView)
    }, 100)
  }

  deactivate() {
    inkdrop.store.dispatch(actions.mde.removeExtension(this.extension))
    this.extension = null
    inkdrop.window.off('focus', this.handleAppFocus)

    this.unbindPreviewViewCommands()
    this.unbindPreviewViewCommands = null
    this.sub.dispose()
  }

  handleAppFocus() {
    registerClipboardText()
  }

  handleEditorLoaded(view) {
    disableScrollIntoView(view)
  }
}

module.exports = new Plugin()
