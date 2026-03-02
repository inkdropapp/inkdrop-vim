const { lineNumbers } = require('@codemirror/view')

const relativeLineNumbers = lineNumbers({
  formatNumber: (lineNo, state) => {
    if (lineNo > state.doc.lines) {
      return '0'
    }
    const cursorLine = state.doc.lineAt(
      state.selection.asSingle().ranges[0].to
    ).number
    if (lineNo === cursorLine) {
      return String(cursorLine)
    }
    return String(Math.abs(cursorLine - lineNo))
  }
})

module.exports = { relativeLineNumbers }
