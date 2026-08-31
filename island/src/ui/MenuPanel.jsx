import { useEffect, useState } from 'react'
import { useGame } from '../game/store.js'
import { sound } from '../game/sound.js'

// 畫面左側的快速選單：不用走路也能到各區塊。
// section＝進「關於我」整頁空間並捲到該錨點；popup＝開島上的對話彈窗。
// 學員推薦（#voices）刻意不列進來：那區沒有標題，也不當作導覽目的地
const MENU = [
  { key: 'p-about', label: '關於我', section: 'about' },
  { key: 'p-process', label: '服務流程', section: 'process' },
  { key: 'p-offers', label: '課程與服務', section: 'offers' },
  { key: 'p-partners', label: '合作夥伴', section: 'partners' },
  { key: 'p-connect', label: '找我聊聊', section: 'connect' },
  { key: 'i-board', label: '佈告欄', popup: 'about', icon: 'board', divided: true },
  { key: 'i-mail', label: '信箱', popup: 'contact', icon: 'mail' },
]

// 在「關於我」頁面時，選單最下方多一個回程入口
const BACK_ITEM = { key: 'back', label: '回到小島', icon: 'island', action: 'leave', divided: true }

export function MenuPanel() {
  const [active, setActive] = useState(false)   // 滑鼠在面板上＝鍵盤交給選單
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)       // 窄螢幕的收合狀態（寬螢幕由 CSS 一律展開）
  const openPopup = useGame((s) => s.openPopup)
  const room = useGame((s) => s.room)
  const setAboutSection = useGame((s) => s.setAboutSection)
  // 佈告欄與信箱是島上的物件，人在「關於我」頁面時點了也沒有意義（角色不在島上），
  // 那兩項在頁面裡整個收起來，改成只留頁面區塊＋回程入口
  const items = room === 'about'
    ? [...MENU.filter((m) => !m.popup), { ...BACK_ITEM, divided: true }]
    : MENU

  const choose = (i) => {
    const item = items[i]
    if (!item) return
    // 彈窗開著時也能直接切到別的項目：先收掉舊的，再執行新動作
    if (useGame.getState().activePopup) useGame.getState().closePopup()
    sound.play('pop')
    if (item.action === 'leave') window.dispatchEvent(new Event('leave-about'))
    else if (item.section) {
      // 已經在頁面裡就直接換錨點捲過去，不必再跑一次轉場
      if (room === 'about') setAboutSection(item.section)
      else window.dispatchEvent(new CustomEvent('enter-about', { detail: { section: item.section } }))
    } else {
      // 島上的物件：先讓角色走到它面前，走到了 World2D 才開彈窗
      window.dispatchEvent(new CustomEvent('walk-to', { detail: { id: item.popup } }))
    }
  }

  // 鍵盤只在滑鼠停在面板上時接管（capture 階段攔下，World2D 的移動就收不到）
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (useGame.getState().activePopup) return   // 彈窗開著時鍵盤讓給它（任意鍵關閉）
      const step = (d) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i + d + items.length) % items.length) }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') step(-1)
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') step(1)
      else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault(); e.stopPropagation(); choose(idx)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, idx, items.length])

  // 「關於我」頁面捲動時自動收合行動版選單（AboutRoom 轉發 iframe 的捲動訊息）
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('about-scroll', close)
    return () => window.removeEventListener('about-scroll', close)
  }, [])

  // 刻意不碰 store 的 movementLocked——那把鎖屬於彈窗，兩邊搶著開關會互相解掉對方的鎖。
  // 這裡只要攔下鍵盤即可（World2D 收不到方向鍵，角色自然不動）；
  // 進場先送一個 blur 讓 World2D 清掉按住中的方向，滑進選單時角色立刻停步。
  const enter = () => { setActive(true); window.dispatchEvent(new Event('blur')) }
  const leave = () => setActive(false)

  return (
    <>
      {/* 漢堡鈕：只在窄螢幕出現（CSS 控制），面板收合時用它叫出來 */}
      <button
        className={`menu-burger${open ? ' is-open' : ''}`}
        aria-label={open ? '收合選單' : '展開選單'}
        aria-expanded={open}
        onClick={() => { sound.play('pop'); setOpen((v) => !v) }}
      >
        {/* 三條線包在 span 裡排版：Safari 的 <button> 當 flex 容器時
            子元素不會 stretch 也常排不正，flex 一律交給內層 span */}
        <span className="burger-lines"><i /><i /><i /></span>
      </button>
      <div
        className={`menu-panel${active ? ' is-active' : ''}${open ? ' is-open' : ''}`}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        <div className="menu-head">
          <span className="menu-title">快速前往</span>
          {/* 操作說明講的是島上的走路與互動，人在「關於我」頁面時沒有意義，收起來 */}
          {room !== 'about' && (
            <button
              className="menu-help"
              aria-label="操作說明"
              onClick={() => { sound.play('pop'); openPopup('help') }}
            >
              i
            </button>
          )}
        </div>
        <ul className="menu-list">
          {items.map((m, i) => (
            <li
              key={m.key}
              className={`menu-item${i === idx ? ' is-sel' : ''}${m.divided ? ' is-divided' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { choose(i); setOpen(false) }}   // 窄螢幕選完就收起來，別擋住畫面
            >
              <span className="menu-cursor">▶</span>
              {m.icon && <span className={`menu-icon menu-icon--${m.icon}`} />}
              {m.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
