import { ViewPlugin } from '@codemirror/view'
import { getCM, Vim } from '@replit/codemirror-vim'

const VIM_MODE_CLASSES = [
  'vim-mode-normal',
  'vim-mode-insert',
  'vim-mode-visual',
  'vim-mode-replace'
]

type VimModeChangeEvent = {
  mode: string
}

const classNameForMode = (mode: string) => {
  switch (mode) {
    case 'visual':
      return 'vim-mode-visual'
    case 'insert':
      return 'vim-mode-insert'
    case 'replace':
      return 'vim-mode-replace'
    default:
      return 'vim-mode-normal'
  }
}

export const editorInitHandler = ViewPlugin.define(() => {
  /*
   * NOTE: Reset the Vim global state when opening another note
   */
  Vim.resetVimGlobalState_()
  return {}
})

export const vimModeClass = ViewPlugin.define(view => {
  const editorEl = view.dom
  const cm = getCM(view)
  if (!cm) return {}

  function updateMode(ev: VimModeChangeEvent) {
    editorEl.classList.remove(...VIM_MODE_CLASSES)
    editorEl.classList.add(classNameForMode(ev.mode))
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
