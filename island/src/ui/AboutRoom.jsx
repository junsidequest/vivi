import { useEffect } from 'react'
import { useGame } from '../game/store.js'

// 「關於我」空間：走到棧道最下方或由選單進入，內容嵌 index_v1.html 的 embed 模式
// （隱藏導覽列與 Hero，「關於我」直接置頂）。
// aboutSection 有值時附上錨點，iframe 載入後直接落在該區塊。
// 回程有兩個入口：左側選單的「回到小島」，以及頁面右下角那顆浮動鈕——
// 後者在 iframe 裡，只能 postMessage 出來由這裡代為觸發。
export function AboutRoom() {
  const section = useGame((s) => s.aboutSection)

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== location.origin) return          // 只收自己這個站的訊息
      if (e.data?.type === 'leave-about') window.dispatchEvent(new Event('leave-about'))
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  return (
    <div className="about-room">
      {/* 相對路徑：小島頁掛在 /island/（本機）或 /vivi/island/（Pages），../ 都指回站台根 */}
      <iframe src={`../index_v1.html?embed=1${section ? `#${section}` : ''}`} title="關於我" />
    </div>
  )
}
