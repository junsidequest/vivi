import { World2D } from './world2d/World2D.jsx'
import { Popup } from './ui/Popup.jsx'
import { MenuPanel } from './ui/MenuPanel.jsx'
import { TouchControls, isTouch } from './ui/Joystick.jsx'
import { AboutRoom } from './ui/AboutRoom.jsx'
import { useGame } from './game/store.js'
import './styles.css'
import './ui/ui.css'

export default function App() {
  const phase = useGame((s) => s.phase)
  const activePopup = useGame((s) => s.activePopup)
  const room = useGame((s) => s.room)
  return (
    <div className={isTouch ? 'is-touch' : undefined}>
      <World2D />
      <div className="ui-layer">
        <MenuPanel />   {/* 「關於我」頁面上也留著，該頁多一個「回到小島」選項 */}
        <Popup />
        {isTouch && phase === 'playing' && !activePopup && room === 'island' && <TouchControls />}
      </div>
      {room === 'about' && <AboutRoom />}
    </div>
  )
}
