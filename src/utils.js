const { Vim, getCM } = require('@replit/codemirror-vim')
const { ViewPlugin } = require('@codemirror/view')

const VIM_MODE_CLASSES = [
  'vim-mode-normal',
  'vim-mode-insert',
  'vim-mode-visual',
  'vim-mode-replace'
]

const editorInitHandler = ViewPlugin.define(_view => {
  /*
   * NOTE: Reset the Vim global state when opening another note
   */
  Vim.resetVimGlobalState_()
  return {}
})

const vimModeClass = ViewPlugin.define(view => {
  const editorEl = view.dom
  const cm = getCM(view)

  function updateMode(ev) {
    editorEl.classList.remove(...VIM_MODE_CLASSES)
    const mode =
      ev.mode === 'visual'
        ? 'vim-mode-visual'
        : ev.mode === 'insert'
          ? 'vim-mode-insert'
          : ev.mode === 'replace'
            ? 'vim-mode-replace'
            : 'vim-mode-normal'
    editorEl.classList.add(mode)
  }

  editorEl.classList.add('vim-mode-normal')
  cm.on('vim-mode-change', updateMode)

  return {
    destroy() {
      cm.off('vim-mode-change', updateMode)
      editorEl.classList.remove(...VIM_MODE_CLASSES)
    }
  }
})

module.exports = {
  editorInitHandler,
  vimModeClass
}
