import './scroll-guide.css'

export default function ScrollGuide() {
  return <div className="pro-scroll-guide">
    <a href="#about" aria-label="向下瀏覽關於我">
      <span className="pro-scroll-guide-line" aria-hidden="true"/>
    </a>
  </div>
}
