import { defineConfig } from 'tsup'

const shared = {
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  target: 'es2017' as const,
  tsconfig: 'tsconfig.build.json'
}

export default defineConfig([
  // 1. Bundle：CJS 打包产物，兼容旧版 require 路径
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['cjs'],
    bundle: true,
    dts: false,
    clean: true
  },
  // 2. 非打包逐文件产物：支持按需引入 tree-shaking
  //    ESM 入口（dist/index.esm.js）随后由 config/build-esm-entry.mjs 生成为
  //    re-export barrel，原因见该脚本头部注释。
  {
    ...shared,
    entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/index.ts'],
    format: ['esm'],
    outExtension() {
      return { js: '.js' }
    },
    bundle: false,
    dts: false,
    clean: false
  }
])
