const { vim, CodeMirror, getCM } = require('@replit/codemirror-vim')

function disableScrollIntoView(view) {
  const cm = getCM(view)
  cm.scrollIntoView = () => {
    // Do nothing to disable the vim's scrollIntoView behavior
    // because it conflicts with Inkdrop's scroll behavior with scroll margin support
  }
}

module.exports = {
  disableScrollIntoView
}
