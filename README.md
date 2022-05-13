# vim keybindings plugin for Inkdrop

Provides Vim modal control for Inkdrop, blending the best of Vim and Inkdrop.

## Features

- All common motions and operators, including text objects
- Operator motion orthogonality
- Visual mode - characterwise, linewise, blockwise
- Incremental highlighted search (`/`, `?`, `#`, `*`, `g#`, `g*`)
- Search/replace with confirm (:substitute, :%s)
- Search history
- Sort (`:sort`)
- Marks (`,`)
- Cross-buffer yank/paste
- Select next/prev item in note list bar (`j` / `k`)
- Scroll markdown preview pane

## Install

```sh
ipm install vim
```

## Key customizations

Default vim keymaps are defined [here](https://github.com/inkdropapp/inkdrop-vim/blob/master/keymaps/vim.json) and you can override them in your `keymap.cson` file.

CSS selectors for each mode:

- Not insert mode: `.CodeMirror.vim-mode:not(.insert-mode):not(.key-buffering) textarea`
- Normal mode: `.CodeMirror.vim-mode.normal-mode:not(.key-buffering) textarea`
- Insert mode: `.CodeMirror.vim-mode.insert-mode textarea`
- Replace mode: `.CodeMirror.vim-mode.replace-mode textarea`
- Visual mode: `.CodeMirror.vim-mode.visual-mode:not(.key-buffering) textarea`

You can check current keybindings on the _Keybindings_ pane on preferences window:

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

### Define custom Ex commands

You can extend Ex commands by writing [init.js](https://docs.inkdrop.app/manual/the-init-file).
The following example defines `:find` command:

```js
inkdrop.onEditorLoad(() => {
  var CodeMirror = require("codemirror");
  CodeMirror.Vim.defineEx("find", "f", (cm, event) => {
    inkdrop.commands.dispatch(document.body, "core:find-global");
    if (event.argString)
      inkdrop.commands.dispatch(document.body, "core:search-notes", {
        keyword: event.argString.trim(),
      });
  });
});
```

## Changelog

See the [GitHub releases](https://github.com/inkdropapp/inkdrop-vim/releases) for an overview of what changed in each update.
See [CHANGELOG.md](https://github.com/inkdropapp/inkdrop-vim/CHANGELOG.md) for older releases.
