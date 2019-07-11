# vim keybindings plugin for Inkdrop

Provides Vim modal control for Inkdrop, blending the best of Vim and Inkdrop.

## Features

 * All common motions and operators, including text objects
 * Operator motion orthogonality
 * Visual mode - characterwise, linewise, blockwise
 * Incremental highlighted search (`/`, `?`, `#`, `*`, `g#`, `g*`)
 * Search/replace with confirm (:substitute, :%s)
 * Search history
 * Sort (`:sort`)
 * Marks (`,`)
 * `:global`
 * Cross-buffer yank/paste

## Install

```sh
ipm install vim
```

## Key customizations

Default vim keymaps are defined [here](https://github.com/inkdropapp/inkdrop-vim/blob/master/keymaps/vim.json) and you can override them in your `keymap.cson` file.

CSS selectors for each mode:

 * Not insert mode: `.CodeMirror.vim-mode:not(.insert-mode):not(.key-buffering) textarea`
 * Normal mode: `.CodeMirror.vim-mode.normal-mode:not(.key-buffering) textarea`
 * Insert mode: `.CodeMirror.vim-mode.insert-mode textarea`
 * Replace mode: `.CodeMirror.vim-mode.replace-mode textarea`
 * Visual mode: `.CodeMirror.vim-mode.visual-mode:not(.key-buffering) textarea`

You can check current keybindings on the *Keybindings* pane on preferences window:

![Preferences](https://raw.githubusercontent.com/inkdropapp/inkdrop-vim/master/docs/preferences.png)

## Ex Commands

### `:w`, `:write`

Saves current note immediately to the disk.

### `:next`, `:n`

Opens next note on the note list.

### `:prev`

Opens previous note on the note list.

### `:preview`, `:p`

Toggles HMTL preview.

### `:side-by-side`, `:side`

Toggles side-by-side mode.

## Changelog

### 1.0.3

* Support some actions for visual mode ([diff](https://github.com/inkdropapp/inkdrop-vim/commit/4536385f6d74c5e7c7247e7c65e593108925b056))

### 1.0.2

* feat(visual-mode): Support insert-at-start-of-target & insert-at-end-of-target (Thanks [Vikram](https://forum.inkdrop.app/t/vim-inserting-at-beginning-of-line-or-at-target-in-visual-block-mode-doesnt-work/1397/))

### 1.0.1

* fix(keybuffering): Avoid buffering key after processing command
* fix(keybuffering): Avoid incorrect key buffering
* fix(replace): Replacing with numeric character not working

### 1.0.0

* feat(\*): Support inkdrop 4.x

### 0.3.2

* fix(operator): Fix incorrect handling for operators

### 0.3.1

* fix(keymaps): Support key buffering for keys like 'd' and 'c'

### 0.3.0

* fix(keymaps): Support text object manipulations

### 0.2.4

* Support Inkdrop v3.17.1

### 0.2.3
* Support `ge` and `gE` (Thanks [@kiryph](https://github.com/kiryph))

### 0.1.0 - First Release
* Every feature added
* Every bug fixed

