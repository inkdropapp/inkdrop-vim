import type { Environment } from '@inkdropapp/types'

/*
 * Captures the `Environment` instance handed to `activate()` so the plugin's
 * other modules can reach it without touching the (discouraged) global
 * `inkdrop` variable.
 */
let captured: Environment | undefined

export const setEnv = (env: Environment | undefined) => {
  captured = env
}

export const getEnv = (): Environment => {
  if (!captured) {
    throw new Error('env accessed before activate()')
  }
  return captured
}
