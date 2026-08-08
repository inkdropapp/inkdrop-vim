import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs'],
  minify: true,
  sourcemap: true,
  clean: true,
  outExtensions: () => ({ js: '.js' }),
  treeshake: true,
  deps: {
    neverBundle: ['inkdrop', /^@codemirror\//]
  }
})
