/*
 * Captures the `Environment` instance handed to `activate()` so the plugin's
 * other modules can reach it without touching the (discouraged) global
 * `inkdrop` variable.
 */
let captured

const setEnv = env => {
  captured = env
}

const getEnv = () => {
  if (!captured) {
    throw new Error('env accessed before activate()')
  }
  return captured
}

module.exports = {
  setEnv,
  getEnv
}
