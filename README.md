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

You can customize keybindings in your [init.js](https://developers.inkdrop.app/guides/the-init-file).
For example,

```js
function configureKeyBindings() {
  const Vim = inkdrop.packages.getLoadedPackage('vim').mainModule.Vim

  // Map keys
  Vim.map('jj', '<Esc>', 'insert') // in insert mode
  Vim.map('Y', 'y$') // in normal mode
  // Unmap keys
  Vim.unmap('jj', 'insert')
}

const editor = inkdrop.getActiveEditor()
if (editor) configureKeyBindings()
inkdrop.onEditorLoad(() => {
  configureKeyBindings()
})
```

## Options

### Use system clipboard

By default, vim yank/delete operations sync with the system clipboard (like `clipboard=unnamed` in vim). You can disable this in Preferences > Plugins > vim so that vim operations use an internal register only, matching standard vim behavior. Cmd+C / Cmd+V (or Ctrl+C / Ctrl+V) will still use the system clipboard as usual.

### Relative line numbers

When enabled in Preferences > Plugins > vim, the editor shows relative line numbers. The current line displays its absolute line number, while all other lines show their distance from the cursor. This is equivalent to `set relativenumber` in vim.

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
  const Vim = inkdrop.packages.getLoadedPackage('vim').mainModule.Vim
  Vim.defineEx('find', 'f', (cm, event) => {
    inkdrop.commands.dispatch(document.body, 'core:find-global')
    if (event.argString)
      inkdrop.commands.dispatch(document.body, 'core:search-notes', {
        keyword: event.argString.trim()
      })
  })
})
```

## Changelog

See the [GitHub releases](https://github.com/inkdropapp/inkdrop-vim/releases) for an overview of what changed in each update.
