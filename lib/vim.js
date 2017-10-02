'use strict';

var _desc, _value, _class;

var _keymap = require('./keymap');

var _keymap2 = _interopRequireDefault(_keymap);

var _inkdrop = require('inkdrop');

var _coreDecorators = require('core-decorators');

var _electron = require('electron');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

let Plugin = (_class = class Plugin {
  activate() {
    this.vim = (0, _keymap2.default)(_inkdrop.CodeMirror);
    const editor = inkdrop.getActiveEditor();
    if (editor) {
      this.activateMode(editor);
    }
    inkdrop.on('editor:init', this.handleEditorInit);
  }

  deactivate() {
    if (this.disposables) {
      this.disposables.dispose();
    }
    const editor = inkdrop.getActiveEditor();
    if (editor) {
      this.deactivateMode(editor);
    }
  }

  activateMode(editor) {
    const cm = editor.codeMirror;
    this.originalKeyMap = cm.getOption('keyMap');
    cm.setOption('keyMap', 'vim');
    cm.on('vim-mode-change', this.handleVimModeChange);
    cm.on('focus', this.handleFocusEditor);

    const el = cm.getWrapperElement();
    el.classList.add('vim-mode', 'normal-mode');

    this.registerCommands();
    this.registerExCommands();
  }

  deactivateMode(editor) {
    const cm = editor.codeMirror;
    if (cm && this.originalKeyMap) {
      editor.codeMirror.setOption('keyMap', this.originalKeyMap);
      cm.off('vim-mode-change', this.handleVimModeChange);
      const el = cm.getWrapperElement();
      el.classList.remove('vim-mode');
    }
  }

  startBufferingKey(command) {
    const wrapper = this.getCodeMirror().getWrapperElement();
    wrapper.classList.add('key-buffering');
    this.pendingCommand = command;
  }

  stopBufferingKey() {
    const wrapper = this.getCodeMirror().getWrapperElement();
    wrapper.classList.remove('key-buffering');
    this.pendingCommand = undefined;
  }

  isBufferingKey() {
    const wrapper = this.getCodeMirror().getWrapperElement();
    return wrapper.classList.contains('key-buffering');
  }

  bufferKey(key) {
    const cm = this.getCodeMirror();
    const vim = this.vim.maybeInitVimState(cm);
    const vimKey = this.vim.cmKeyToVimKey("'" + key + "'");
    vim.inputState.keyBuffer = vim.inputState.keyBuffer + vimKey;
    debug('keyBuffer:', vim.inputState.keyBuffer);
  }

  isInsertMode() {
    const wrapper = this.getCodeMirror().getWrapperElement();
    return wrapper.classList.contains('insert-mode');
  }

  registerCommands() {
    const disposables = new _inkdrop.CompositeDisposable();
    const editor = inkdrop.getActiveEditor();
    const cm = editor.codeMirror;
    const wrapper = cm.getWrapperElement();
    // bind key to command
    const h = command => {
      return e => {
        debug('command:', command);
        e.stopPropagation();
        const vim = this.vim.maybeInitVimState(cm);
        return cm.operation(() => {
          cm.curOp.isVimOp = true;
          try {
            this.vim.commandDispatcher.processCommand(cm, vim, command);
          } catch (e) {
            // clear VIM state in case it's in a bad state.
            cm.state.vim = undefined;
            this.vim.maybeInitVimState(cm);
            if (!_inkdrop.CodeMirror.Vim.suppressErrorLogging) {
              console.error(e);
            }
            throw e;
          }
          return true;
        });
      };
    };
    // bind keystroke to command
    const b = command => {
      return e => {
        debug('buffer command:', command, e.originalEvent);
        this.startBufferingKey(h(command));
        this.bufferKey(e.originalEvent.key);
      };
    };
    const handlers = {
      'vim-mode:native!': () => {},
      'vim-mode:reset-normal-mode': e => {
        _inkdrop.CodeMirror.Vim.clearInputState(cm);
        this.stopBufferingKey();
        e.stopPropagation();
      },
      'vim-mode:exit-visual-mode': e => {
        debug('exit-visual-mode');
        _inkdrop.CodeMirror.Vim.clearInputState(cm);
        _inkdrop.CodeMirror.Vim.exitVisualMode(cm);
        this.stopBufferingKey();
        e.stopPropagation();
      },
      'vim-mode:exit-insert-mode': e => {
        debug('exit-insert-mode');
        _inkdrop.CodeMirror.Vim.clearInputState(cm);
        _inkdrop.CodeMirror.Vim.exitInsertMode(cm);
        this.stopBufferingKey();
        e.stopPropagation();
      },
      'vim-mode:move-left': h({ keys: 'h', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: false } }),
      'vim-mode:move-right': h({ keys: 'l', type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: true } }),
      'vim-mode:move-up': h({ keys: 'k', type: 'motion', motion: 'moveByLines', motionArgs: { forward: false, linewise: true } }),
      'vim-mode:move-down': h({ keys: 'j', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, linewise: true } }),

      'vim-mode:move-to-next-word': h({ keys: 'w', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false } }),
      'vim-mode:move-to-next-whole-word': h({ keys: 'W', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false, bigWord: true } }),
      'vim-mode:move-to-end-of-word': h({ keys: 'e', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, inclusive: true } }),
      'vim-mode:move-to-end-of-whole-word': h({ keys: 'E', type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, bigWord: true, inclusive: true } }),
      'vim-mode:move-to-previous-word': h({ keys: 'b', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false } }),
      'vim-mode:move-to-previous-whole-word': h({ keys: 'B', type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false, bigWord: true } }),
      'vim-mode:move-to-next-paragraph': h({ keys: '}', type: 'motion', motion: 'moveByParagraph', motionArgs: { forward: true, toJumplist: true } }),
      'vim-mode:move-to-previous-paragraph': h({ keys: '{', type: 'motion', motion: 'moveByParagraph', motionArgs: { forward: false, toJumplist: true } }),
      'vim-mode:move-to-beginning-of-line': h({ keys: '0', type: 'motion', motion: 'moveToStartOfLine' }),
      'vim-mode:move-to-first-character-of-line': h({ keys: '^', type: 'motion', motion: 'moveToFirstNonWhiteSpaceCharacter' }),
      'vim-mode:move-to-first-character-of-line-and-down': h({ keys: '_', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, toFirstChar: true, repeatOffset: -1 } }),
      'vim-mode:move-to-last-character-of-line': h({ keys: '$', type: 'motion', motion: 'moveToEol', motionArgs: { inclusive: true } }),
      'vim-mode:move-to-last-nonblank-character-of-line-and-down': () => {
        '???';
      },
      'vim-mode:move-to-first-character-of-line-up': h({ keys: '-', type: 'motion', motion: 'moveByLines', motionArgs: { forward: false, toFirstChar: true } }),
      'vim-mode:move-to-first-character-of-line-down': h({ keys: '+', type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, toFirstChar: true } }),

      'vim-mode:move-to-start-of-file': h({ keys: 'gg', type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: false, explicitRepeat: true, linewise: true, toJumplist: true } }),
      'vim-mode:scroll-half-screen-up': h({ keys: '<C-u>', type: 'motion', motion: 'moveByScroll', motionArgs: { forward: false, explicitRepeat: true } }),
      'vim-mode:scroll-full-screen-up': h({ keys: '<C-b>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: false } }),
      'vim-mode:scroll-half-screen-down': h({ keys: '<C-d>', type: 'motion', motion: 'moveByScroll', motionArgs: { forward: true, explicitRepeat: true } }),
      'vim-mode:scroll-full-screen-down': h({ keys: '<C-f>', type: 'motion', motion: 'moveByPage', motionArgs: { forward: true } }),
      'vim-mode:scroll-down': h({ keys: '<C-e>', type: 'action', action: 'scroll', actionArgs: { forward: true, linewise: true } }),
      'vim-mode:scroll-up': h({ keys: '<C-y>', type: 'action', action: 'scroll', actionArgs: { forward: false, linewise: true } }),
      'vim-mode:scroll-cursor-to-top': h({ keys: 'z<CR>', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'top' }, motion: 'moveToFirstNonWhiteSpaceCharacter' }),
      'vim-mode:scroll-cursor-to-top-leave': h({ keys: 'zt', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'top' } }),
      'vim-mode:scroll-cursor-to-middle': h({ keys: 'z.', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'center' }, motion: 'moveToFirstNonWhiteSpaceCharacter' }),
      'vim-mode:scroll-cursor-to-middle-leave': h({ keys: 'zz', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'center' } }),
      'vim-mode:scroll-cursor-to-bottom': h({ keys: 'z-', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'bottom' } }),
      'vim-mode:scroll-cursor-to-bottom-leave': h({ keys: 'zb', type: 'action', action: 'scrollToCursor', actionArgs: { position: 'bottom' }, motion: 'moveToFirstNonWhiteSpaceCharacter' }),
      'vim-mode:move-to-line': h({ keys: 'G', type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: true, explicitRepeat: true, linewise: true, toJumplist: true } }),
      'vim-mode:move-to-top-of-screen': h({ keys: 'H', type: 'motion', motion: 'moveToTopLine', motionArgs: { linewise: true, toJumplist: true } }),
      'vim-mode:move-to-bottom-of-screen': h({ keys: 'L', type: 'motion', motion: 'moveToBottomLine', motionArgs: { linewise: true, toJumplist: true } }),
      'vim-mode:move-to-middle-of-screen': h({ keys: 'M', type: 'motion', motion: 'moveToMiddleLine', motionArgs: { linewise: true, toJumplist: true } }),

      'vim-mode:delete': h({ keys: 'd', type: 'operator', operator: 'delete' }),
      'vim-mode:delete-to-last-character-of-line': h({ keys: 'D', type: 'operatorMotion', operator: 'delete', motion: 'moveToEol', motionArgs: { inclusive: true }, context: 'normal' }),
      'vim-mode:change': h({ keys: 'c', type: 'operator', operator: 'change' }),
      'vim-mode:change-to-last-character-of-line': h({ keys: 'C', type: 'operatorMotion', operator: 'change', motion: 'moveToEol', motionArgs: { inclusive: true }, context: 'normal' }),
      'vim-mode:substitute-line': h({ keys: 'S', type: 'keyToKey', toKeys: 'cc', context: 'normal' }),
      'vim-mode:replace': b({ keys: 'r<character>', type: 'action', action: 'replace', isEdit: true }),
      'vim-mode:insert-at-beginning-of-line': h({ keys: 'I', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'firstNonBlank' }, context: 'normal' }),
      'vim-mode:indent': h({ keys: '>', type: 'operator', operator: 'indent', operatorArgs: { indentRight: true } }),
      'vim-mode:outdent': h({ keys: '<', type: 'operator', operator: 'indent', operatorArgs: { indentRight: false } }),
      'vim-mode:auto-indent': () => {
        'not supported';
      },
      'vim-mode:join': h({ keys: 'J', type: 'action', action: 'joinLines', isEdit: true }),

      'vim-mode:yank': h({ keys: 'y', type: 'operator', operator: 'yank' }),
      'vim-mode:yank-line': h({ keys: 'Y', type: 'operatorMotion', operator: 'yank', motion: 'expandToLine', motionArgs: { linewise: true }, context: 'normal' }),
      'vim-mode:put-before': h({ keys: 'P', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: false, isEdit: true } }),
      'vim-mode:put-after': h({ keys: 'p', type: 'action', action: 'paste', isEdit: true, actionArgs: { after: true, isEdit: true } }),

      'vim-mode:toggle-case': h({ keys: 'g~', type: 'operator', operator: 'changeCase' }),
      'vim-mode:upper-case': h({ keys: 'gU', type: 'operator', operator: 'changeCase', operatorArgs: { toLower: false }, isEdit: true }),
      'vim-mode:lower-case': h({ keys: 'gu', type: 'operator', operator: 'changeCase', operatorArgs: { toLower: true }, isEdit: true }),
      'vim-mode:toggle-case-now': h({ keys: '~', type: 'operatorMotion', operator: 'changeCase', motion: 'moveByCharacters', motionArgs: { forward: true }, operatorArgs: { shouldMoveCursor: true }, context: 'normal' }),

      'vim-mode:mark': b({ keys: 'm<character>', type: 'action', action: 'setMark' }),
      'vim-mode:move-to-mark-literal': b({ keys: '`<character>', type: 'motion', motion: 'goToMark', motionArgs: { toJumplist: true } }),
      'vim-mode:move-to-mark': b({ keys: '\'<character>', type: 'motion', motion: 'goToMark', motionArgs: { toJumplist: true, linewise: true } }),

      'vim-mode:find': b({ keys: 'f<character>', type: 'motion', motion: 'moveToCharacter', motionArgs: { forward: true, inclusive: true } }),
      'vim-mode:find-backwards': b({ keys: 'F<character>', type: 'motion', motion: 'moveToCharacter', motionArgs: { forward: false } }),
      'vim-mode:till': b({ keys: 't<character>', type: 'motion', motion: 'moveTillCharacter', motionArgs: { forward: true, inclusive: true } }),
      'vim-mode:till-backwards': b({ keys: 'T<character>', type: 'motion', motion: 'moveTillCharacter', motionArgs: { forward: false } }),
      'vim-mode:repeat-find': h({ keys: ';', type: 'motion', motion: 'repeatLastCharacterSearch', motionArgs: { forward: true } }),
      'vim-mode:repeat-find-reverse': h({ keys: ',', type: 'motion', motion: 'repeatLastCharacterSearch', motionArgs: { forward: false } }),

      'vim-mode:search': h({ keys: '/', type: 'search', searchArgs: { forward: true, querySrc: 'prompt', toJumplist: true } }),
      'vim-mode:reverse-search': h({ keys: '?', type: 'search', searchArgs: { forward: false, querySrc: 'prompt', toJumplist: true } }),
      'vim-mode:search-current-word': h({ keys: '*', type: 'search', searchArgs: { forward: true, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true } }),
      'vim-mode:reverse-search-current-word': h({ keys: '#', type: 'search', searchArgs: { forward: false, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true } }),
      'vim-mode:repeat-search': h({ keys: 'n', type: 'motion', motion: 'findNext', motionArgs: { forward: true, toJumplist: true } }),
      'vim-mode:repeat-search-backwards': h({ keys: 'N', type: 'motion', motion: 'findNext', motionArgs: { forward: false, toJumplist: true } }),

      'vim-mode:bracket-matching-motion': h({ keys: '%', type: 'motion', motion: 'moveToMatchedSymbol', motionArgs: { inclusive: true, toJumplist: true } }),

      'vim-mode:ex-command': h({ keys: ':', type: 'ex' }),

      // normal mode
      'vim-mode:activate-insert-mode': h({ keys: 'i', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'inplace' }, context: 'normal' }),
      'vim-mode:activate-replace-mode': h({ keys: 'R', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { replace: true } }),
      'vim-mode:activate-characterwise-visual-mode': h({ keys: 'v', type: 'action', action: 'toggleVisualMode' }),
      'vim-mode:activate-linewise-visual-mode': h({ keys: 'V', type: 'action', action: 'toggleVisualMode', actionArgs: { linewise: true } }),
      'vim-mode:activate-blockwise-visual-mode': h({ keys: '<C-v>', type: 'action', action: 'toggleVisualMode', actionArgs: { blockwise: true } }),

      'vim-mode:undo': h({ keys: 'u', type: 'action', action: 'undo', context: 'normal' }),

      'vim-mode:insert-above-with-newline': h({ keys: 'O', type: 'action', action: 'newLineAndEnterInsertMode', isEdit: true, interlaceInsertRepeat: true, actionArgs: { after: false }, context: 'normal' }),
      'vim-mode:insert-below-with-newline': h({ keys: 'o', type: 'action', action: 'newLineAndEnterInsertMode', isEdit: true, interlaceInsertRepeat: true, actionArgs: { after: true }, context: 'normal' }),
      'vim-mode:insert-after': h({ keys: 'a', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'charAfter' }, context: 'normal' }),
      'vim-mode:insert-after-end-of-line': h({ keys: 'A', type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'eol' }, context: 'normal' }),
      'vim-mode:delete-right': h({ keys: 'x', type: 'operatorMotion', operator: 'delete', motion: 'moveByCharacters', motionArgs: { forward: true }, operatorMotionArgs: { visualLine: false } }),
      'vim-mode:delete-left': h({ keys: 'X', type: 'operatorMotion', operator: 'delete', motion: 'moveByCharacters', motionArgs: { forward: false }, operatorMotionArgs: { visualLine: true } }),
      'vim-mode:substitute': h({ keys: 's', type: 'keyToKey', toKeys: 'cl', context: 'normal' }),
      'vim-mode:repeat': h({ keys: '.', type: 'action', action: 'repeatLastEdit' }),

      'vim-mode:increase': h({ keys: '<C-a>', type: 'action', action: 'incrementNumberToken', isEdit: true, actionArgs: { increase: true, backtrack: false } }),
      'vim-mode:decrease': h({ keys: '<C-x>', type: 'action', action: 'incrementNumberToken', isEdit: true, actionArgs: { increase: false, backtrack: false } }),

      'vim-mode:register-prefix': b({ keys: '"<character>', type: 'action', action: 'setRegister' }),

      // insert mode
      'vim-mode:delete-to-beginning-of-word': h({ keys: '<C-w>', type: 'operatorMotion', operator: 'delete', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false }, context: 'insert' })
    };
    disposables.add(inkdrop.commands.add(editor.node, handlers));
    wrapper.addEventListener('keydown', this.handleEditorKeyDown);
    disposables.add(new _inkdrop.Disposable(() => wrapper.removeEventListener('keydown', this.handleEditorKeyDown)));

    this.disposables = disposables;
  }

  registerExCommands() {
    const el = this.getCodeMirror().getWrapperElement();
    this.vim.defineEx('write', 'w', () => {
      inkdrop.commands.dispatch(el, 'core:save-note');
    });
    this.vim.defineEx('next', 'n', () => {
      inkdrop.commands.dispatch(el, 'core:open-next-note');
    });
    this.vim.defineEx('prev', '', () => {
      inkdrop.commands.dispatch(el, 'core:open-prev-note');
    });
    this.vim.defineEx('preview', 'p', () => {
      inkdrop.commands.dispatch(el, 'view:toggle-preview');
    });
    this.vim.defineEx('side-by-side', 'side', () => {
      inkdrop.commands.dispatch(el, 'view:toggle-side-by-side');
    });
  }

  getCodeMirror() {
    return inkdrop.getActiveEditor().codeMirror;
  }

  yankClipboard() {
    const state = this.vim.getVimGlobalState();
    const text = _electron.clipboard.readText();
    const linewise = text.indexOf('\n') >= 0;
    state.registerController.pushText('0', 'yank', text, linewise, true);
  }

  handleEditorInit(editor) {
    this.activateMode(editor);
  }

  handleVimModeChange(event, opt) {
    debug('vim mode changed:', event);
    const { mode } = event;
    const cm = this.getCodeMirror();
    cm.getWrapperElement().classList.remove('insert-mode');
    cm.getWrapperElement().classList.remove('visual-mode');
    cm.getWrapperElement().classList.remove('normal-mode');
    cm.getWrapperElement().classList.remove('replace-mode');
    switch (mode) {
      case 'normal':
        cm.getWrapperElement().classList.add('normal-mode');
        break;
      case 'visual':
        cm.getWrapperElement().classList.add('visual-mode');
        break;
      case 'replace':
        cm.getWrapperElement().classList.add('replace-mode');
        break;
      case 'insert':
        cm.getWrapperElement().classList.add('insert-mode');
        break;
    }
  }

  handleEditorKeyDown(event) {
    const keyName = event.key;
    const cm = this.getCodeMirror();
    const vim = this.vim.maybeInitVimState(cm);

    if (this.isBufferingKey()) {
      debug('handle key buffering:', event);

      if (keyName.length === 1) {
        vim.inputState.selectedCharacter = event.key;

        if (typeof this.pendingCommand === 'function') {
          this.pendingCommand(event);
        }
      }
      if (keyName !== 'Ctrl' && keyName !== 'Alt' && keyName !== 'Shift' && keyName !== 'Meta') {
        this.stopBufferingKey();
      }
    } else if (!this.isInsertMode()) {
      if (/^\d$/.test(keyName)) {
        this.bufferKey(keyName);
      } else {
        // push key buffer to the repeat digit
        const keys = vim.inputState.keyBuffer;
        vim.inputState.keyBuffer = '';
        const keysMatcher = /^(\d*)(.*)$/.exec(keys);
        if (keysMatcher[1] && keysMatcher[1] !== '0') {
          vim.inputState.pushRepeatDigit(keysMatcher[1]);
        }
      }
    }
  }

  handleFocusEditor(event) {
    this.yankClipboard();
  }
}, (_applyDecoratedDescriptor(_class.prototype, 'handleEditorInit', [_coreDecorators.autobind], Object.getOwnPropertyDescriptor(_class.prototype, 'handleEditorInit'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'handleVimModeChange', [_coreDecorators.autobind], Object.getOwnPropertyDescriptor(_class.prototype, 'handleVimModeChange'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'handleEditorKeyDown', [_coreDecorators.autobind], Object.getOwnPropertyDescriptor(_class.prototype, 'handleEditorKeyDown'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'handleFocusEditor', [_coreDecorators.autobind], Object.getOwnPropertyDescriptor(_class.prototype, 'handleFocusEditor'), _class.prototype)), _class);


module.exports = new Plugin();
//# sourceMappingURL=vim.js.map