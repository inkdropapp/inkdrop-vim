import type { CommandCallback } from '@inkdropapp/types'

import { getEnv } from './env'

const PREVIEW_CONTAINER_SELECTOR = '.mde-preview-container'
const SCROLL_STEP_PX = 30

type Subscription = { dispose(): void }

const onScrollTarget =
  (scroll: (target: HTMLElement) => void): CommandCallback =>
  event => {
    if (event.target instanceof HTMLElement) {
      scroll(event.target)
    }
  }

export function bindPreviewVimCommands() {
  let sub: Subscription | null = null

  function bindHandlers(target: Element | null) {
    if (sub) sub.dispose()
    if (!target) return

    sub = getEnv().commands.add(target, {
      'vim:move-to-start-of-file': onScrollTarget(target => {
        target.scrollTop = 0
      }),
      'vim:scroll-up': onScrollTarget(target => {
        target.scrollTop -= SCROLL_STEP_PX
      }),
      'vim:scroll-down': onScrollTarget(target => {
        target.scrollTop += SCROLL_STEP_PX
      }),
      'vim:scroll-half-screen-up': onScrollTarget(target => {
        target.scrollTop -= target.clientHeight / 2
      }),
      'vim:scroll-half-screen-down': onScrollTarget(target => {
        target.scrollTop += target.clientHeight / 2
      }),
      'vim:scroll-full-screen-up': onScrollTarget(target => {
        target.scrollTop -= target.clientHeight
      }),
      'vim:scroll-full-screen-down': onScrollTarget(target => {
        target.scrollTop += target.clientHeight
      }),
      'vim:move-to-line': onScrollTarget(target => {
        target.scrollTop = target.scrollHeight
      })
    })
  }

  bindHandlers(document.querySelector(PREVIEW_CONTAINER_SELECTOR))

  const observer = new MutationObserver(() => {
    bindHandlers(document.querySelector(PREVIEW_CONTAINER_SELECTOR))
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
