// island/src/ui/content.jsx
// 彈窗文案（由 Vivi 本人提供）。聯絡方式的實際值待補，先留欄位。
import { isTouch } from './Joystick.jsx'

export const POPUPS = {
  about: {
    title: '關於 Vivi',
    body: (
      <>
        <p>嗨，我是 Vivi 陳盈臻，也有人叫我「大師姐」</p>
        <p>我不是寫程式出身，但我把 AI 真的用進了工作裡<br />現在專注幫不懂技術的團隊，也做到這件事</p>
      </>
    ),
  },
  services: {
    title: '服務與課程',
    body: (
      <>
        <p>三個主要服務：AI 應用顧問、導入課程、客製化課程</p>
        <p>幫非技術背景的團隊看懂並用上 AI，不只是講概念，是真的陪你動手做</p>
      </>
    ),
  },
  contact: {
    title: '聯繫 Vivi',
    body: (
      <>
        {/* TODO：待 Vivi 提供實際帳號／信箱後填入 */}
        <p>Facebook：</p>
        <p>Email：</p>
      </>
    ),
  },
  help: {
    title: '操作說明',
    body: isTouch ? (
      <>
        <p>左下角搖桿：拖動控制方向，拖到底自動用跑的。</p>
        <p>右下角 A 鍵：靠近郵筒、小屋、鴨子時按下互動。</p>
      </>
    ) : (
      <div className="help-grid">
        {/* 兩組都能走：WASD 與方向鍵，各自依鍵盤實際位置排成十字 */}
        <div className="help-cell help-cell--wide">
          <span>移動</span>
          <div className="keypad-pair">
            <div className="keypad">
              <span className="keycap keycap--key">W</span>
              <div className="keypad-row">
                <span className="keycap keycap--key">A</span>
                <span className="keycap keycap--key">S</span>
                <span className="keycap keycap--key">D</span>
              </div>
            </div>
            <span className="keypad-or">或</span>
            <div className="keypad">
              <span className="keycap keycap--key"><i className="arrow arrow--up" /></span>
              <div className="keypad-row">
                <span className="keycap keycap--key"><i className="arrow arrow--left" /></span>
                <span className="keycap keycap--key"><i className="arrow arrow--down" /></span>
                <span className="keycap keycap--key"><i className="arrow arrow--right" /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="help-cell"><span>讓 Vivi 跑起來</span><span className="keycap">Shift</span></div>
        <div className="help-cell"><span>和附近的物品互動</span><span className="keycap keycap--key">E</span></div>
      </div>
    ),
  },
}
