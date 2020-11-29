import { logger } from 'inkdrop'
import vimKeymap from './keymap'
import { CompositeDisposable, Disposable } from 'event-kit'
import CodeMirror from 'codemirror'
import { clipboard } from 'electron'

class Plugin {
  activate() {
    this.vim = vimKeymap(CodeMirror)
    if (inkdrop.isEditorActive()) {
      this.activateMode(inkdrop.getActiveEditor())
    }
    inkdrop.onEditorLoad(this.handleEditorLoad)
  }

  deactivate() {
    if (this.disposables) {
      this.disposables.dispose()
    }
    if (inkdrop.isEditorActive()) {
      this.deactivateMode(inkdrop.getActiveEditor())
    }
  }

  activateMode(editor) {
    const { cm } = editor
    this.originalKeyMap = cm.getOption('keyMap')
    cm.setOption('keyMap', 'vim')
    cm.on('vim-mode-change', this.handleVimModeChange)
    cm.on('focus', this.handleFocusEditor)

    const el = cm.getWrapperElement()
    el.classList.add('vim-mode', 'normal-mode')

    this.registerCommands()
    this.registerExCommands()
  }

  deactivateMode(editor) {
    const { cm } = editor
    if (cm && this.originalKeyMap) {
      cm.setOption('keyMap', this.originalKeyMap)
      cm.off('vim-mode-change', this.handleVimModeChange)
      const el = cm.getWrapperElement()
      el.classList.remove('vim-mode')
    }
  }

  startBufferingKey(command, customBufferingModeClass) {
    const wrapper = this.getCodeMirror().getWrapperElement()
    logger.debug('Start key buffering')
    wrapper.classList.add('key-buffering')
    if (customBufferingModeClass) {
      wrapper.classList.add('key-buffering-' + customBufferingModeClass)
    }
    this.pendingCommand = command
  }

  stopBufferingKey() {
    logger.debug('Stop key buffering')
    const wrapper = this.getCodeMirror().getWrapperElement()
    const classes = Array.prototype.slice.apply(wrapper.classList)
    for (const i of classes) {
      if (i.startsWith('key-buffering')) {
        wrapper.classList.remove(i)
      }
    }
    this.pendingCommand = undefined
  }

  isBufferingKey() {
    const wrapper = this.getCodeMirror().getWrapperElement()
    return wrapper.classList.contains('key-buffering')
  }

  bufferKey(key) {
    const cm = this.getCodeMirror()
    const vim = this.vim.maybeInitVimState(cm)
    const vimKey = this.vim.cmKeyToVimKey("'" + key + "'")
    vim.inputState.keyBuffer = vim.inputState.keyBuffer + vimKey
    logger.debug('keyBuffer:', vim.inputState.keyBuffer, vim.inputState)
  }

  isInsertMode() {
    const wrapper = this.getCodeMirror().getWrapperElement()
    return wrapper.classList.contains('insert-mode')
  }

  registerCommands() {
    const disposables = new CompositeDisposable()
    const editor = inkdrop.getActiveEditor()
    const { cm } = editor
    const wrapper = cm.getWrapperElement()

    const doKeyToKey = async command => {
      logger.debug('doKeyToKey:', command)
      let keys = command.toKeys
      while (keys) {
        // Pull off one command key, which is either a single character
        // or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
        const match = /<\w+-.+?>|<\w+>|./.exec(keys)
        let key = match[0]
        logger.debug('key:', key)
        keys = keys.substring(match.index + key.length)

        if (this.isBufferingKey()) {
          this.handleEditorKeyDown(new KeyboardEvent('keydown', { key }))
        } else {
          if (key.match(/^[A-Z]$/)) {
            key = 'shift-' + key
          }
          const { exactMatchCandidates } = inkdrop.keymaps.findMatchCandidates([
            key
          ])
          logger.debug('exactMatchCandidates:', exactMatchCandidates)
          const bindings = inkdrop.keymaps.findExactMatches(
            exactMatchCandidates,
            document.activeElement
          )
          const b = bindings[0]
          if (b) {
            inkdrop.commands.dispatch(document.activeElement, b.command)
          } else {
            logger.debug('command not found for key:', key)
          }
        }
      }
    }

    // bind key to command
    const h = command => {
      return e => {
        logger.debug(
          'command:',
          command,
          'state:',
          Object.assign({}, cm.state.vim.inputState)
        )
        e.stopPropagation()
        const vim = this.vim.maybeInitVimState(cm)
        return cm.operation(() => {
          cm.curOp.isVimOp = true
          try {
            if (command.type === 'keyToKey') {
              doKeyToKey(command)
            } else {
              this.vim.commandDispatcher.processCommand(cm, vim, command)
            }
          } catch (e) {
            // clear VIM state in case it's in a bad state.
            cm.state.vim = undefined
            this.vim.maybeInitVimState(cm)
            if (!CodeMirror.Vim.suppressErrorLogging) {
              console.error(e)
            }
            throw e
          }
          return true
        })
      }
    }
    // bind keystroke to command
    const b = command => {
      return e => {
        logger.debug(
          'buffer command:',
          command,
          'state:',
          Object.assign({}, cm.state.vim.inputState),
          e.originalEvent
        )
        this.startBufferingKey(h(command), 'command')
        this.bufferKey(e.originalEvent.key)
      }
    }
    // bind keystroke to operator
    const p = command => {
      return e => {
        logger.debug(
          'operator command:',
          command,
          'state:',
          Object.assign({}, cm.state.vim.inputState),
          e.originalEvent,
          e
        )
        const vim = this.vim.maybeInitVimState(cm)
        if (
          !vim.inputState.operator &&
          !this.isBufferingKey() &&
          !vim.visualMode
        ) {
          this.startBufferingKey(e => {
            const el = cm.getInputField()
            const keyBinding = inkdrop.keymaps.findKeyBindings({
              keystrokes: e.key,
              target: el
            })
            if (keyBinding.length > 0) {
              inkdrop.commands.dispatch(el, keyBinding[0].command)
            }
          }, 'operator')
          if (e.originalEvent) {
            this.bufferKey(e.originalEvent.key)
          } else {
            logger.debug('buffer key:', command.keys)
            this.bufferKey(command.keys)
          }
        }
        return h(command)(e)
      }
    }
    const handlers = {
      'vim:native!': () => {},
      'vim:reset-normal-mode': e => {
        CodeMirror.Vim.clearInputState(cm)
        this.stopBufferingKey()
        e.stopPropagation()
      },
      'vim:exit-visual-mode': e => {
        logger.debug('exit-visual-mode')
        CodeMirror.Vim.clearInputState(cm)
        CodeMirror.Vim.exitVisualMode(cm)
        this.stopBufferingKey()
        e.stopPropagation()
      },
      'vim:exit-insert-mode': e => {
        logger.debug('exit-insert-mode')
        CodeMirror.Vim.clearInputState(cm)
        CodeMirror.Vim.exitInsertMode(cm)
        this.stopBufferingKey()
        e.stopPropagation()
      },
      'vim:move-left': h({
        keys: 'h',
        type: 'motion',
        motion: 'moveByCharacters',
        motionArgs: { forward: false }
      }),
      'vim:move-right': h({
        keys: 'l',
        type: 'motion',
        motion: 'moveByCharacters',
        motionArgs: { forward: true }
      }),
      'vim:move-up': h({
        keys: 'k',
        type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: false, linewise: true }
      }),
      'vim:move-down': h({
        keys: 'j',
        type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, linewise: true }
      }),
      'vim:move-up-by-display-lines': h({
        keys: 'gk',
        type: 'motion',
        motion: 'moveByDisplayLines',
        motionArgs: { forward: false }
      }),
      'vim:move-down-by-display-lines': h({
        keys: 'gj',
        type: 'motion',
        motion: 'moveByDisplayLines',
        motionArgs: { forward: true }
      }),

      'vim:move-to-next-word': h({
        keys: 'w',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: false }
      }),
      'vim:move-to-next-whole-word': h({
        keys: 'W',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: false, bigWord: true }
      }),
      'vim:move-to-end-of-word': h({
        keys: 'e',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: true, inclusive: true }
      }),
      'vim:move-to-previous-end-of-word': h({
        keys: 'ge',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: true, inclusive: true }
      }),
      'vim:move-to-end-of-whole-word': h({
        keys: 'E',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: {
          forward: true,
          wordEnd: true,
          bigWord: true,
          inclusive: true
        }
      }),
      'vim:move-to-previous-end-of-whole-word': h({
        keys: 'gE',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: {
          forward: false,
          wordEnd: true,
          bigWord: true,
          inclusive: true
        }
      }),
      'vim:move-to-previous-word': h({
        keys: 'b',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: false }
      }),
      'vim:move-to-previous-whole-word': h({
        keys: 'B',
        type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: false, bigWord: true }
      }),
      'vim:move-to-next-paragraph': h({
        keys: '}',
        type: 'motion',
        motion: 'moveByParagraph',
        motionArgs: { forward: true, toJumplist: true }
      }),
      'vim:move-to-previous-paragraph': h({
        keys: '{',
        type: 'motion',
        motion: 'moveByParagraph',
        motionArgs: { forward: false, toJumplist: true }
      }),
      'vim:move-to-beginning-of-line-with-zero': (() => {
        const handler = h({
          keys: '0',
          type: 'motion',
          motion: 'moveToStartOfLine'
        })
        return e => {
          const vim = this.vim.maybeInitVimState(cm)
          if (vim.inputState.getRepeat() > 0) {
            vim.inputState.pushRepeatDigit('0')
          } else {
            return handler(e)
          }
        }
      })(),
      'vim:move-to-beginning-of-line': h({
        keys: '0',
        type: 'motion',
        motion: 'moveToStartOfLine'
      }),
      'vim:move-to-first-character-of-line': h({
        keys: '^',
        type: 'motion',
        motion: 'moveToFirstNonWhiteSpaceCharacter'
      }),
      'vim:move-to-first-character-of-line-and-down': h({
        keys: '_',
        type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, toFirstChar: true, repeatOffset: -1 }
      }),
      'vim:move-to-last-character-of-line': h({
        keys: '$',
        type: 'motion',
        motion: 'moveToEol',
        motionArgs: { inclusive: true }
      }),
      'vim:move-to-last-nonblank-character-of-line-and-down': () => {
        '???'
      },
      'vim:move-to-first-character-of-line-up': h({
        keys: '-',
        type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: false, toFirstChar: true }
      }),
      'vim:move-to-first-character-of-line-down': h({
        keys: '+',
        type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, toFirstChar: true }
      }),

      'vim:move-to-start-of-file': h({
        keys: 'gg',
        type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: {
          forward: false,
          explicitRepeat: true,
          linewise: true,
          toJumplist: true
        }
      }),
      'vim:scroll-half-screen-up': h({
        keys: '<C-u>',
        type: 'motion',
        motion: 'moveByScroll',
        motionArgs: { forward: false, explicitRepeat: true }
      }),
      'vim:scroll-full-screen-up': h({
        keys: '<C-b>',
        type: 'motion',
        motion: 'moveByPage',
        motionArgs: { forward: false }
      }),
      'vim:scroll-half-screen-down': h({
        keys: '<C-d>',
        type: 'motion',
        motion: 'moveByScroll',
        motionArgs: { forward: true, explicitRepeat: true }
      }),
      'vim:scroll-full-screen-down': h({
        keys: '<C-f>',
        type: 'motion',
        motion: 'moveByPage',
        motionArgs: { forward: true }
      }),
      'vim:scroll-down': h({
        keys: '<C-e>',
        type: 'action',
        action: 'scroll',
        actionArgs: { forward: true, linewise: true }
      }),
      'vim:scroll-up': h({
        keys: '<C-y>',
        type: 'action',
        action: 'scroll',
        actionArgs: { forward: false, linewise: true }
      }),
      'vim:scroll-cursor-to-top': h({
        keys: 'z<CR>',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'top' },
        motion: 'moveToFirstNonWhiteSpaceCharacter'
      }),
      'vim:scroll-cursor-to-top-leave': h({
        keys: 'zt',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'top' }
      }),
      'vim:scroll-cursor-to-middle': h({
        keys: 'z.',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'center' },
        motion: 'moveToFirstNonWhiteSpaceCharacter'
      }),
      'vim:scroll-cursor-to-middle-leave': h({
        keys: 'zz',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'center' }
      }),
      'vim:scroll-cursor-to-bottom': h({
        keys: 'z-',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'bottom' }
      }),
      'vim:scroll-cursor-to-bottom-leave': h({
        keys: 'zb',
        type: 'action',
        action: 'scrollToCursor',
        actionArgs: { position: 'bottom' },
        motion: 'moveToFirstNonWhiteSpaceCharacter'
      }),
      'vim:move-to-line': h({
        keys: 'G',
        type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: {
          forward: true,
          explicitRepeat: true,
          linewise: true,
          toJumplist: true
        }
      }),
      'vim:move-to-top-of-screen': h({
        keys: 'H',
        type: 'motion',
        motion: 'moveToTopLine',
        motionArgs: { linewise: true, toJumplist: true }
      }),
      'vim:move-to-bottom-of-screen': h({
        keys: 'L',
        type: 'motion',
        motion: 'moveToBottomLine',
        motionArgs: { linewise: true, toJumplist: true }
      }),
      'vim:move-to-middle-of-screen': h({
        keys: 'M',
        type: 'motion',
        motion: 'moveToMiddleLine',
        motionArgs: { linewise: true, toJumplist: true }
      }),

      'vim:delete': p({ keys: 'd', type: 'operator', operator: 'delete' }),
      'vim:delete-to-last-character-of-line': h({
        keys: 'D',
        type: 'operatorMotion',
        operator: 'delete',
        motion: 'moveToEol',
        motionArgs: { inclusive: true },
        context: 'normal'
      }),
      'vim:change': p({ keys: 'c', type: 'operator', operator: 'change' }),
      'vim:change-to-last-character-of-line': h({
        keys: 'C',
        type: 'operatorMotion',
        operator: 'change',
        motion: 'moveToEol',
        motionArgs: { inclusive: true },
        context: 'normal'
      }),
      'vim:substitute-line': h({
        keys: 'S',
        type: 'keyToKey',
        toKeys: 'cc',
        context: 'normal'
      }),
      'vim:substitute-line-visual': h({
        keys: 'S',
        type: 'keyToKey',
        toKeys: 'VdO',
        context: 'visual'
      }),
      'vim:replace': b({
        keys: 'r<character>',
        type: 'action',
        action: 'replace',
        isEdit: true
      }),
      'vim:insert-at-beginning-of-line': h({
        keys: 'I',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'firstNonBlank' },
        context: 'normal'
      }),
      'vim:text-object-manipulation-inner': b({
        keys: 'i<character>',
        type: 'motion',
        motion: 'textObjectManipulation',
        motionArgs: { textObjectInner: true }
      }),
      'vim:text-object-manipulation': b({
        keys: 'a<character>',
        type: 'motion',
        motion: 'textObjectManipulation'
      }),
      'vim:indent': p({
        keys: '>',
        type: 'operator',
        operator: 'indent',
        operatorArgs: { indentRight: true }
      }),
      'vim:outdent': p({
        keys: '<',
        type: 'operator',
        operator: 'indent',
        operatorArgs: { indentRight: false }
      }),
      'vim:auto-indent': () => {
        'not supported'
      },
      'vim:join': h({
        keys: 'J',
        type: 'action',
        action: 'joinLines',
        isEdit: true
      }),

      'vim:yank': p({ keys: 'y', type: 'operator', operator: 'yank' }),
      'vim:yank-line': h({
        keys: 'Y',
        type: 'operatorMotion',
        operator: 'yank',
        motion: 'expandToLine',
        motionArgs: { linewise: true },
        context: 'normal'
      }),
      'vim:put-before': h({
        keys: 'P',
        type: 'action',
        action: 'paste',
        isEdit: true,
        actionArgs: { after: false, isEdit: true }
      }),
      'vim:put-after': h({
        keys: 'p',
        type: 'action',
        action: 'paste',
        isEdit: true,
        actionArgs: { after: true, isEdit: true }
      }),

      'vim:toggle-case': h({
        keys: 'g~',
        type: 'operator',
        operator: 'changeCase'
      }),
      'vim:upper-case': h({
        keys: 'gU',
        type: 'operator',
        operator: 'changeCase',
        operatorArgs: { toLower: false },
        isEdit: true
      }),
      'vim:lower-case': h({
        keys: 'gu',
        type: 'operator',
        operator: 'changeCase',
        operatorArgs: { toLower: true },
        isEdit: true
      }),
      'vim:toggle-case-now': h({
        keys: '~',
        type: 'operatorMotion',
        operator: 'changeCase',
        motion: 'moveByCharacters',
        motionArgs: { forward: true },
        operatorArgs: { shouldMoveCursor: true },
        context: 'normal'
      }),

      'vim:mark': b({
        keys: 'm<character>',
        type: 'action',
        action: 'setMark'
      }),
      'vim:move-to-mark-literal': b({
        keys: '`<character>',
        type: 'motion',
        motion: 'goToMark',
        motionArgs: { toJumplist: true }
      }),
      'vim:move-to-mark': b({
        keys: "'<character>",
        type: 'motion',
        motion: 'goToMark',
        motionArgs: { toJumplist: true, linewise: true }
      }),

      'vim:find': b({
        keys: 'f<character>',
        type: 'motion',
        motion: 'moveToCharacter',
        motionArgs: { forward: true, inclusive: true }
      }),
      'vim:find-backwards': b({
        keys: 'F<character>',
        type: 'motion',
        motion: 'moveToCharacter',
        motionArgs: { forward: false }
      }),
      'vim:till': b({
        keys: 't<character>',
        type: 'motion',
        motion: 'moveTillCharacter',
        motionArgs: { forward: true, inclusive: true }
      }),
      'vim:till-backwards': b({
        keys: 'T<character>',
        type: 'motion',
        motion: 'moveTillCharacter',
        motionArgs: { forward: false }
      }),
      'vim:repeat-find': h({
        keys: ';',
        type: 'motion',
        motion: 'repeatLastCharacterSearch',
        motionArgs: { forward: true }
      }),
      'vim:repeat-find-reverse': h({
        keys: ',',
        type: 'motion',
        motion: 'repeatLastCharacterSearch',
        motionArgs: { forward: false }
      }),

      'vim:search': h({
        keys: '/',
        type: 'search',
        searchArgs: { forward: true, querySrc: 'prompt', toJumplist: true }
      }),
      'vim:reverse-search': h({
        keys: '?',
        type: 'search',
        searchArgs: { forward: false, querySrc: 'prompt', toJumplist: true }
      }),
      'vim:search-current-word': h({
        keys: '*',
        type: 'search',
        searchArgs: {
          forward: true,
          querySrc: 'wordUnderCursor',
          wholeWordOnly: true,
          toJumplist: true
        }
      }),
      'vim:reverse-search-current-word': h({
        keys: '#',
        type: 'search',
        searchArgs: {
          forward: false,
          querySrc: 'wordUnderCursor',
          wholeWordOnly: true,
          toJumplist: true
        }
      }),
      'vim:repeat-search': h({
        keys: 'n',
        type: 'motion',
        motion: 'findNext',
        motionArgs: { forward: true, toJumplist: true }
      }),
      'vim:repeat-search-backwards': h({
        keys: 'N',
        type: 'motion',
        motion: 'findNext',
        motionArgs: { forward: false, toJumplist: true }
      }),

      'vim:bracket-matching-motion': h({
        keys: '%',
        type: 'motion',
        motion: 'moveToMatchedSymbol',
        motionArgs: { inclusive: true, toJumplist: true }
      }),

      'vim:ex-command': h({ keys: ':', type: 'ex' }),

      // normal mode
      'vim:activate-insert-mode': h({
        keys: 'i',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'inplace' },
        context: 'normal'
      }),
      'vim:activate-replace-mode': h({
        keys: 'R',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { replace: true }
      }),
      'vim:activate-characterwise-visual-mode': h({
        keys: 'v',
        type: 'action',
        action: 'toggleVisualMode'
      }),
      'vim:activate-linewise-visual-mode': h({
        keys: 'V',
        type: 'action',
        action: 'toggleVisualMode',
        actionArgs: { linewise: true }
      }),
      'vim:activate-blockwise-visual-mode': h({
        keys: '<C-v>',
        type: 'action',
        action: 'toggleVisualMode',
        actionArgs: { blockwise: true }
      }),

      'vim:undo': h({
        keys: 'u',
        type: 'action',
        action: 'undo',
        context: 'normal'
      }),

      'vim:insert-above-with-newline': h({
        keys: 'O',
        type: 'action',
        action: 'newLineAndEnterInsertMode',
        isEdit: true,
        interlaceInsertRepeat: true,
        actionArgs: { after: false },
        context: 'normal'
      }),
      'vim:insert-below-with-newline': h({
        keys: 'o',
        type: 'action',
        action: 'newLineAndEnterInsertMode',
        isEdit: true,
        interlaceInsertRepeat: true,
        actionArgs: { after: true },
        context: 'normal'
      }),
      'vim:insert-after': h({
        keys: 'a',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'charAfter' },
        context: 'normal'
      }),
      'vim:insert-after-end-of-line': h({
        keys: 'A',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'eol' },
        context: 'normal'
      }),
      'vim:delete-right': h({
        keys: 'x',
        type: 'operatorMotion',
        operator: 'delete',
        motion: 'moveByCharacters',
        motionArgs: { forward: true },
        operatorMotionArgs: { visualLine: false }
      }),
      'vim:delete-left': h({
        keys: 'X',
        type: 'operatorMotion',
        operator: 'delete',
        motion: 'moveByCharacters',
        motionArgs: { forward: false },
        operatorMotionArgs: { visualLine: true }
      }),
      'vim:substitute': h({
        keys: 's',
        type: 'keyToKey',
        toKeys: 'cl',
        context: 'normal'
      }),
      'vim:substitute-visual': h({
        keys: 's',
        type: 'keyToKey',
        toKeys: 'c',
        context: 'visual'
      }),
      'vim:repeat': h({
        keys: '.',
        type: 'action',
        action: 'repeatLastEdit'
      }),

      'vim:increase': h({
        keys: '<C-a>',
        type: 'action',
        action: 'incrementNumberToken',
        isEdit: true,
        actionArgs: { increase: true, backtrack: false }
      }),
      'vim:decrease': h({
        keys: '<C-x>',
        type: 'action',
        action: 'incrementNumberToken',
        isEdit: true,
        actionArgs: { increase: false, backtrack: false }
      }),

      'vim:register-prefix': b({
        keys: '"<character>',
        type: 'action',
        action: 'setRegister'
      }),

      // insert mode
      'vim:delete-to-beginning-of-word': h({
        keys: '<C-w>',
        type: 'operatorMotion',
        operator: 'delete',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: false },
        context: 'insert'
      }),

      // visual mode
      'vim:insert-at-start-of-target': h({
        keys: 'I',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'startOfSelectedArea' },
        context: 'visual'
      }),
      'vim:insert-at-end-of-target': h({
        keys: 'A',
        type: 'action',
        action: 'enterInsertMode',
        isEdit: true,
        actionArgs: { insertAt: 'endOfSelectedArea' },
        context: 'visual'
      }),
      'vim:reverse-selections': h({
        keys: 'o',
        type: 'motion',
        motion: 'moveToOtherHighlightedEnd',
        context: 'visual'
      }),
      'vim:reverse-selections-at-same-line': h({
        keys: 'O',
        type: 'motion',
        motion: 'moveToOtherHighlightedEnd',
        motionArgs: { sameLine: true },
        context: 'visual'
      })
    }
    disposables.add(inkdrop.commands.add(wrapper, handlers))
    disposables.add(
      inkdrop.commands.add(document.querySelector('.mde-preview'), {
        'vim:move-to-start-of-file': ({ target }) => {
          target.scrollTop = 0
        },
        'vim:scroll-up': ({ target }) => {
          target.scrollTop -= 30
        },
        'vim:scroll-down': ({ target }) => {
          target.scrollTop += 30
        },
        'vim:scroll-half-screen-up': ({ target }) => {
          target.scrollTop -= target.clientHeight / 2
        },
        'vim:scroll-half-screen-down': ({ target }) => {
          target.scrollTop += target.clientHeight / 2
        },
        'vim:scroll-full-screen-up': ({ target }) => {
          target.scrollTop -= target.clientHeight
        },
        'vim:scroll-full-screen-down': ({ target }) => {
          target.scrollTop += target.clientHeight
        },
        'vim:move-to-line': ({ target }) => {
          target.scrollTop = target.scrollHeight
        }
      })
    )
    wrapper.addEventListener('textInput', this.handleEditorTextInput)
    wrapper.addEventListener('keydown', this.handleEditorKeyDown)
    disposables.add(
      new Disposable(() =>
        wrapper.removeEventListener('keydown', this.handleEditorKeyDown)
      )
    )

    this.disposables = disposables
  }

  registerExCommands() {
    const el = this.getCodeMirror().getWrapperElement()
    this.vim.defineEx('write', 'w', () => {
      inkdrop.commands.dispatch(el, 'core:save-note')
    })
    this.vim.defineEx('next', 'n', () => {
      inkdrop.commands.dispatch(el, 'core:open-next-note')
    })
    this.vim.defineEx('prev', '', () => {
      inkdrop.commands.dispatch(el, 'core:open-prev-note')
    })
    this.vim.defineEx('preview', 'p', () => {
      inkdrop.commands.dispatch(el, 'view:toggle-preview')
    })
    this.vim.defineEx('side-by-side', 'side', () => {
      inkdrop.commands.dispatch(el, 'view:toggle-side-by-side')
    })
  }

  getCodeMirror() {
    return inkdrop.getActiveEditor().cm
  }

  yankClipboard() {
    const state = this.vim.getVimGlobalState()
    const text = clipboard.readText()
    const linewise = text.indexOf('\n') >= 0
    state.registerController.pushText('0', 'yank', text, linewise, true)
  }

  handleEditorLoad = editor => {
    this.activateMode(editor)
  }

  handleVimModeChange = (event, _opt) => {
    logger.debug('vim mode changed:', event)
    const { mode } = event
    const cm = this.getCodeMirror()
    cm.getWrapperElement().classList.remove('insert-mode')
    cm.getWrapperElement().classList.remove('visual-mode')
    cm.getWrapperElement().classList.remove('normal-mode')
    cm.getWrapperElement().classList.remove('replace-mode')
    switch (mode) {
      case 'normal':
        cm.getWrapperElement().classList.add('normal-mode')
        break
      case 'visual':
        cm.getWrapperElement().classList.add('visual-mode')
        break
      case 'replace':
        cm.getWrapperElement().classList.add('replace-mode')
        break
      case 'insert':
        cm.getWrapperElement().classList.add('insert-mode')
        break
    }
  }

  handleEditorTextInput = event => {
    // only process if the event is fired via EventTarget.dispatchEvent()
    if (this.isInsertMode() && !event.isTrusted) {
      logger.debug('handle text input:', event)
      const text = event.data
      const cm = this.getCodeMirror()
      cm.replaceSelection(text)
    }
  }

  handleEditorKeyDown = event => {
    const normalizeKeyName = key => {
      switch (key) {
        case 'Enter':
          return 'enter'
        case ' ':
          return 'space'
        case 'ArrowRight':
          return 'right'
        case 'ArrowLeft':
          return 'left'
        case 'ArrowUp':
          return 'up'
        case 'ArrowDown':
          return 'down'
        default:
          return key
      }
    }
    const keyName = normalizeKeyName(event.key)
    const cm = this.getCodeMirror()
    const vim = this.vim.maybeInitVimState(cm)
    const isNumberic =
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      !event.shiftKey &&
      keyName.match(/^\d$/);

    if (this.isBufferingKey()) {
      logger.debug('handle key buffering:', keyName, event)
      const keyBinding = inkdrop.keymaps.findKeyBindings({
        keystrokes: keyName,
        target: cm.getInputField()
      })
      const b = cm
        .getInputField()
        .webkitMatchesSelector(
          '.CodeMirror.vim-mode:not(.insert-mode) textarea'
        )
      logger.debug('keybinding check:', keyBinding, b)

      if (
        keyName !== 'Ctrl' &&
        keyName !== 'Alt' &&
        keyName !== 'Shift' &&
        keyName !== 'Meta'
      ) {
        const { inputState } = vim
        const hasOperatorOrMotion = inputState.motion || inputState.operator
        if (keyName.length === 1 && (!isNumberic || !hasOperatorOrMotion)) {
          inputState.selectedCharacter = event.key
          inputState.keyBuffer = ''

          if (keyBinding.length === 0) {
            const { pendingCommand } = this
            this.stopBufferingKey()

            if (typeof pendingCommand === 'function') {
              pendingCommand(event)
            }

            event.stopPropagation()
            event.preventDefault()
          }
        } else if (isNumberic) {
          vim.inputState.pushRepeatDigit(keyName)
        }
      }
    } else if (!this.isInsertMode()) {
      if (isNumberic) {
        vim.inputState.pushRepeatDigit(keyName)
      } else {
        // push key buffer to the repeat digit
        const keys = vim.inputState.keyBuffer
        vim.inputState.keyBuffer = ''
        const keysMatcher = /^(\d*)(.*)$/.exec(keys)
        if (keysMatcher[1] && keysMatcher[1] !== '0') {
          vim.inputState.pushRepeatDigit(keysMatcher[1])
        }
      }
    }
  }

  handleFocusEditor = _event => {
    this.yankClipboard()
  }
}

module.exports = new Plugin()
