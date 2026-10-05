// 主頁只會出現在網站根目錄的 index.html，正式版一律輸出相對路徑：
// build 時預先渲染（Node 端）與瀏覽器得到的字串完全相同，避免 hydration mismatch，
// 也不管站點放在 vivichen.ai/ 或 github.io/vivi/ 子路徑都能用。
export const sitePath = path => path === 'island/' && import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8795/island/`
  : `./${path}`
