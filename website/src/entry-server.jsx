import { renderToString } from 'react-dom/server'
import Professional from './Professional.jsx'

// build 時在 Node 端把主頁渲染成 HTML，供 scripts/prerender.mjs 注入 #root。
export const render = () => renderToString(<Professional/>)
