import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 由 src/index.ts 生成非打包的 ESM 入口 dist/index.esm.js。
//
// 为什么不直接让 tsup 打包入口：Taro H5 的 babel-plugin-transform-taroapi
// 会在 `Program.exit` 中只保留第一条 `@tarojs/taro` import 声明，其余 remove()，
// 而引用重命名是按模块作用域做的。打包成一个文件后，各组件各自的 taro 导入
// 会变成同一文件里的多条声明，于是出现「保留 Taro11、代码里还在用 Taro9」
// 的悬空标识符，H5 下报 `TaroN is not defined`。
//
// 改成 re-export barrel 后，webpack 会把每个组件当作独立模块交给 babel，
// 每个文件只有一条 taro 导入，上述问题不再出现。

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcEntry = path.join(root, 'src/index.ts')
const outFile = path.join(root, 'dist/index.esm.js')

const source = fs.readFileSync(srcEntry, 'utf8')

const lines = []

// 把导入说明符解析成 dist 里真实存在的文件路径。
// 注意 common/component 这类是单文件，不能一律补 /index.js。
function resolveDistTarget(specifier) {
  if (!specifier.startsWith('.')) return specifier
  const srcBase = path.resolve(root, 'src', specifier)
  const distBase = path.join('dist', specifier)

  const candidates = [
    [`${specifier}/index.js`, `${srcBase}/index.ts`, `${srcBase}/index.tsx`],
    [`${specifier}.js`, `${srcBase}.ts`, `${srcBase}.tsx`]
  ]
  for (const [out, ...srcCandidates] of candidates) {
    if (srcCandidates.some(p => fs.existsSync(p))) return out
  }
  throw new Error(`无法定位导出目标：${specifier}（dist 期望路径 ${distBase}）`)
}

const exportRe = /^export\s+\{\s*default\s+as\s+(\w+)\s*\}\s+from\s+'(.+?)'\s*$/gm

for (const match of source.matchAll(exportRe)) {
  const [, exported, specifier] = match
  lines.push(`export { default as ${exported} } from '${resolveDistTarget(specifier)}'`)
}

// 具名导出（locale）
for (const match of source.matchAll(/^export\s+\{\s*([^}]+)\}\s+from\s+'(.+?)'\s*$/gm)) {
  const [, names, specifier] = match
  if (names.includes('default as')) continue
  lines.push(`export { ${names.trim()} } from '${resolveDistTarget(specifier)}'`)
}

if (lines.length === 0) {
  throw new Error('未能从 src/index.ts 解析出任何导出，请检查文件格式')
}

const banner = `// 该文件由 config/build-esm-entry.mjs 自动生成，请勿手动修改。
// 各组件保持独立模块，避免 Taro H5 的 babel 插件在多条 taro 导入时产生悬空引用。
`

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, `${banner}\n${lines.join('\n')}\n`)

console.log(`[build-esm-entry] 已生成 ${path.relative(root, outFile)}（${lines.length} 个导出）`)
