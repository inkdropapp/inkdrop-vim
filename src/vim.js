const { vim, Vim } = require('@replit/codemirror-vim')
const { actions } = require('inkdrop')
const {
  registerClipboardTextOnFocus,
  registerClipboardText
} = require('./clipboard')
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
  }

  deactivate() {
    inkdrop.store.dispatch(actions.mde.removeExtension(this.extension))
    this.extension = null
    inkdrop.window.off('focus', this.handleAppFocus)
  }

  handleAppFocus() {
    registerClipboardText()
  }
}

module.exports = new Plugin()
