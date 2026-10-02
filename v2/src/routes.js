// v2 的圖片使用本地副本；小島連結回到原本的 Codex 網站。
const base = new URL(import.meta.env.BASE_URL, window.location.href)
export const sitePath = path => path === 'island/'
  ? new URL('../Codex/island/', base).pathname
  : new URL(path, base).pathname
