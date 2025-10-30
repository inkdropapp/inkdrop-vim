const { ViewPlugin } = require('@codemirror/view')
const { vim, CodeMirror, getCM } = require('@replit/codemirror-vim')

const disableScrollIntoView = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const cm = getCM(view)
      cm.scrollIntoView = () => {
        // Do nothing to disable the vim's scrollIntoView behavior
        // because it conflicts with Inkdrop's scroll behavior with scroll margin support
      }
    }
  }
)

module.exports = {
  disableScrollIntoView
}
