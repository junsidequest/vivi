// 把 SSR 產物渲染出的主頁 HTML 注入 dist/index.html 的 #root，讓不執行 JS 的爬蟲也讀得到內容。
// 只替換 <div id="root"></div>，不碰 <head>；完成後刪除 SSR 暫存目錄。
import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ssrDir = `${root}dist-ssr`
const indexPath = `${root}dist/index.html`
const placeholder = '<div id="root"></div>'

try {
  const { render } = await import(pathToFileURL(`${ssrDir}/entry-server.js`).href)
  // React 19 會在輸出最前面自動加上圖片 preload <link>（約 40 個）；移除以維持原本的載入優先序，#root 只放元件本身的 DOM。
  const appHtml = render().replace(/^(?:<link rel="preload"[^>]*\/>)+/, '')
  if (!appHtml.startsWith('<div class="professional"')) throw new Error(`預先渲染結果開頭非預期：${appHtml.slice(0, 120)}`)
  const template = await readFile(indexPath, 'utf8')
  const count = template.split(placeholder).length - 1
  if (count !== 1) throw new Error(`dist/index.html 應恰有一個 ${placeholder}，實際找到 ${count} 個`)
  await writeFile(indexPath, template.replace(placeholder, () => `<div id="root">${appHtml}</div>`))
  console.log(`prerender: 已注入 ${appHtml.length} 字元到 dist/index.html #root`)
} finally {
  await rm(ssrDir, { recursive: true, force: true })
}
