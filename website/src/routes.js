// 主站與小島共用正式網站根路徑。
const base = new URL(import.meta.env.BASE_URL, window.location.href)
export const sitePath = path => path === 'island/' && import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8795/island/`
  : new URL(path, base).pathname
