### 2.2.0

- feat(motion): Support moitons like yG/ygg/dG/dgg (Thanks [jamalmoir](https://github.com/inkdropapp/inkdrop-vim/issues/39))

### 2.1.10

- fix(buffering): space key should be processed as a character input (Thanks [Chris](https://github.com/inkdropapp/inkdrop-vim/issues/29))

### 2.1.9

- fix(keymap): Commands should not work while buffering key in visual mode (Thanks [Kazuhiro](https://forum.inkdrop.app/t/minor-issue-in-vim-plugin/2702))

### 2.1.7

- fix(typo): Number keys not working as expected (Thanks [FORTRAN](https://forum.inkdrop.app/t/vim-plugin/2228/2))

### 2.1.6

- fix(motion): Ignore numeric keys when a modifier key is pressed (Thanks [Basyura](https://github.com/inkdropapp/inkdrop-vim/pull/25))

### 2.1.5

- fix(motion): enter/space/arrow keys not working as expected while key buffering (Thanks [rcashie](https://github.com/inkdropapp/inkdrop-vim/issues/24))

### 2.1.4

- fix(motion): text object manipulation not working for some tokens (Thanks [rcashie](https://github.com/inkdropapp/inkdrop-vim/issues/23))

### 2.1.2

- fix(keymap): remove keybindings of <kbd>s h</kbd>, <kbd>s k</kbd>, <kbd>s l</kbd> since those conflict with the default vim behavior of `s` (Thanks [oniatsu-san](https://github.com/inkdropapp/inkdrop-vim/issues/19))

### 2.1.1

- fix(keymap): change keybinding for `vim:move-to-mark` from <kbd>"</kbd> to <kbd>'</kbd> (Thanks [oniatsu-san](https://github.com/inkdropapp/inkdrop-vim/issues/18))

### 2.1.0

- feat(motion): support moving cursor up/down by display lines (<kbd>g k</kbd> / <kbd>g j</kbd>) (Thanks [jolyon129](https://github.com/inkdropapp/inkdrop-vim/issues/16))

### 2.0.1

- Fix a bug where `vim:scroll-full-screen-up` and `vim:scroll-full-screen-down` not working (Thanks [@basyura](https://github.com/inkdropapp/inkdrop-vim/issues/13#issuecomment-612326857))

### 2.0.0

- (Breaking) The command prefix has been changed from `vim-mode:` to `vim:` so that the keybindings are correctly listed in the plugin settings
- Moving focus between panes (sidebar, note list bar, editor, note title) with `s h` / `s j` / `s k` / `s l`
- Select next/prev item in note list bar (`j` / `k`)
- Scroll markdown preview pane ([Thanks @trietphm](https://github.com/inkdropapp/inkdrop-vim/issues/13))

### 1.0.12

- fix(key-buffering): replace character with "a" does not work ([Thanks seachicken](https://github.com/inkdropapp/inkdrop-vim/issues/11))

### 1.0.11

- fix(debug): typo in debug code that causes an error

### 1.0.10

- fix(operatormotion): do not start key buffering for "D" and "C" operator motions (Thanks shimizu-san)
- fix(buffering): avoid running command with 0 key while key buffering (Thanks volment)

### 1.0.8

- fix(keymap): handle keystrokes as text input which failed to match binding [#8](https://github.com/inkdropapp/inkdrop-vim/issues/8) (Thanks @rtmoranorg)

### 1.0.7

- fix(keymap): substitute keys not working [#4](https://github.com/inkdropapp/inkdrop-vim/issues/4) (Thanks @gregwebs and @giantsol)

### 1.0.6

- fix(keymap): 'X' in visual mode does not work [#7](https://github.com/inkdropapp/inkdrop-vim/issues/7) (Thanks [@usou](https://github.com/usou))

### 1.0.5

- Copy deleted text to clipboard
- Fix invalid selectors for `vim-mode:text-object-manipulation*` keymaps again

### 1.0.4

- Fix invalid selectors for `vim-mode:text-object-manipulation*` keymaps

### 1.0.3

- Support some actions for visual mode ([diff](https://github.com/inkdropapp/inkdrop-vim/commit/4536385f6d74c5e7c7247e7c65e593108925b056))

### 1.0.2

- feat(visual-mode): Support insert-at-start-of-target & insert-at-end-of-target (Thanks [Vikram](https://forum.inkdrop.app/t/vim-inserting-at-beginning-of-line-or-at-target-in-visual-block-mode-doesnt-work/1397/))

### 1.0.1

- fix(keybuffering): Avoid buffering key after processing command
- fix(keybuffering): Avoid incorrect key buffering
- fix(replace): Replacing with numeric character not working

### 1.0.0

- feat(\*): Support inkdrop 4.x

### 0.3.2

- fix(operator): Fix incorrect handling for operators

### 0.3.1

- fix(keymaps): Support key buffering for keys like 'd' and 'c'

### 0.3.0

- fix(keymaps): Support text object manipulations

### 0.2.4

- Support Inkdrop v3.17.1

### 0.2.3

- Support `ge` and `gE` (Thanks [@kiryph](https://github.com/kiryph))

### 0.1.0 - First Release

- Every feature added
- Every bug fixed
