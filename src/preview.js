function bindPreviewVimCommands() {
  let sub = null

  function bindHandlers(target) {
    if (sub) sub.dispose()
    if (!target) return

    sub = inkdrop.commands.add(target, {
      'vim:move-to-start-of-file': ({ target }) => {
        target.scrollTop = 0
      },
      'vim:scroll-up': ({ target }) => {
        console.log('vim:scroll-up', target)
        target.scrollTop -= 30
      },
      'vim:scroll-down': ({ target }) => {
        console.log('vim:scroll-down', target)
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
  }

  const selector = '.mde-preview-container'
  const el = document.querySelector(selector)
  bindHandlers(el)

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector)
    bindHandlers(el)
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  return () => {
    observer.disconnect()
    if (sub) sub.dispose()
  }
}

module.exports = {
  bindPreviewVimCommands
}
