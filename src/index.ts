import type { Extension } from '@codemirror/state'
import type { ConfigSchema, Environment, IInkdropPlugin } from '@inkdropapp/types'
import { Vim, vim } from '@replit/codemirror-vim'

import { registerClipboardText, registerClipboardTextOnFocus } from './clipboard'
import { getEnv, setEnv } from './env'
import { bindPreviewVimCommands } from './preview'
import { relativeLineNumbers } from './relative-line-numbers'
import { editorInitHandler, vimModeClass } from './utils'
import './ex'
import './keymaps'

type Subscription = { dispose(): void }

class VimPlugin implements IInkdropPlugin {
  config: Record<string, ConfigSchema> = {
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

  Vim: typeof Vim | null = null
  extension: Extension[] | null = null
  sub: Subscription | null = null
  unbindPreviewViewCommands: (() => void) | null = null
  configSub: Subscription | null = null
  lineNumbersConfigSub: Subscription | null = null

  activate(env: Environment) {
    setEnv(env)
    this.Vim = Vim
    this.extension = [vim(), registerClipboardTextOnFocus(), editorInitHandler, vimModeClass]
    this.sub = env.window.onFocus(this.handleAppFocus)
    this.unbindPreviewViewCommands = bindPreviewVimCommands()
    this.configSub = env.config.observe(
      'vim.relativeLineNumbers',
      this.handleRelativeLineNumbersChange
    )
    this.lineNumbersConfigSub = env.config.observe(
      'editor.lineNumbers',
      this.handleRelativeLineNumbersChange
    )
    env.ensureEditorLoaded(this.extendEditor)
  }

  deactivate() {
    this.unextendEditor()
    this.extension = null
    this.sub?.dispose()
    this.sub = null

    this.unbindPreviewViewCommands?.()
    this.unbindPreviewViewCommands = null

    this.configSub?.dispose()
    this.configSub = null

    this.lineNumbersConfigSub?.dispose()
    this.lineNumbersConfigSub = null

    setEnv(undefined)
  }

  extendEditor = () => {
    getEnv().commands.dispatch(document.body, 'editor:add-extension', {
      extension: this.extension
    })
    this.handleRelativeLineNumbersChange()
  }

  unextendEditor = () => {
    getEnv().commands.dispatch(document.body, 'editor:remove-extension', {
      extension: this.extension
    })
    this.toggleRelativeLineNumbers(false)
  }

  isRelativeLineNumbersEnabled() {
    const env = getEnv()
    return env.config.get('vim.relativeLineNumbers') && env.config.get('editor.lineNumbers')
  }

  toggleRelativeLineNumbers(enabled: boolean) {
    const command = enabled ? 'editor:add-extension' : 'editor:remove-extension'
    getEnv().commands.dispatch(document.body, command, {
      extension: relativeLineNumbers
    })
  }

  handleAppFocus() {
    registerClipboardText()
  }

  handleRelativeLineNumbersChange = () => {
    this.toggleRelativeLineNumbers(this.isRelativeLineNumbersEnabled())
  }
}

export default new VimPlugin()
