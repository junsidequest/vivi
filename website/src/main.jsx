import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Professional from './Professional.jsx'
import './professional.css'

// 品牌網站首頁。正式 build 會預先渲染 #root（scripts/prerender.mjs），此時接手 hydrate；
// 開發模式 #root 是空的，照常 client render。
const container = document.getElementById('root')
if (container.firstElementChild) hydrateRoot(container, <Professional/>)
else createRoot(container).render(<Professional/>)
