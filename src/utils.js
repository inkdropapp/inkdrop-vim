const { Vim } = require('@replit/codemirror-vim')
const { ViewPlugin } = require('@codemirror/view')

const editorInitHandler = ViewPlugin.define(_view => {
  /*
   * NOTE: Reset the Vim global state when opening another note
   */
  Vim.resetVimGlobalState_()
  return {}
})

module.exports = {
  editorInitHandler
}
