import MediaCoverflow from './media-coverflow.jsx'
import { useEffect, useRef, useState } from 'react'
import reviews from '../../content/reviews.json'
import mediaCoverage from '../../content/media-coverage.json'
import mediaLogoBounds from '../../content/media-logo-bounds.json'
import { sitePath } from '../../routes.js'
import './marquee-01.css'

const categories = [
  { id: 'media', label: '媒體報導' },
  { id: 'business', label: '企業主推薦' },
  { id: 'professional', label: '專業領域推薦' },
  { id: 'students', label: '學員推薦' },
]

function ReviewText({ text, highlights = [] }) {
  if (!text || !highlights.length) return text
  const matches = highlights.flatMap(phrase => {
    const start = text.indexOf(phrase)
    return start < 0 ? [] : [{ start, end: start + phrase.length }]
  }).sort((a,b) => a.start - b.start)
  const parts = []
  let cursor = 0
  for (const { start, end } of matches) {
    if (start < cursor) continue
    parts.push(text.slice(cursor, start))
    parts.push(<mark className="review-highlight" key={start}><strong>{text.slice(start,end)}</strong></mark>)
    cursor = end
  }
  parts.push(text.slice(cursor))
  return parts
}

function ReviewBody({ review }) {
  if (review.body) return <blockquote><ReviewText text={review.body} highlights={review.highlights}/></blockquote>

  return <blockquote>
    {review.paragraphs?.map((paragraph, index) => <p key={index}><ReviewText text={paragraph} highlights={review.highlights}/></p>)}
    {review.items && <ol>
      {review.items.map((item, index) => <li key={index}><ReviewText text={item} highlights={review.highlights}/></li>)}
    </ol>}
    {review.closing && <p><ReviewText text={review.closing} highlights={review.highlights}/></p>}
  </blockquote>
}

const reviewLength = review => [review.body, ...(review.paragraphs || []), ...(review.items || []), review.closing].join('').length

function ReviewCard({ review, tailPreview = false }) {
  const long = reviewLength(review) > 150
  const [open, setOpen] = useState(false)
  return <figure className={`testimonial-card${long && !open ? ' is-clamped' : ''}`}>
    <svg className="testimonial-quote" viewBox="3 0 32 24" fill="currentColor" aria-hidden="true"><path d="M3 13C3 6.5 6.5 3 12 2v4c-3 .8-4.5 2.4-4.8 5H14v11H3V13Zm16 0C19 6.5 22.5 3 28 2v4c-3 .8-4.5 2.4-4.8 5H30v11H19V13Z"/></svg>
    {tailPreview && long && !open ? <div className="testimonial-tail-preview"><ReviewBody review={review}/></div> : <ReviewBody review={review}/>}
    {long && <button type="button" className="testimonial-more" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '收合' : '展開全文'}</button>}
    <figcaption>
      <span>{review.role}</span>
      {review.attributionType === 'organization' ? <span className="testimonial-organization">{review.name}</span> : <strong>{review.name}</strong>}
    </figcaption>
  </figure>
}

function HorizontalScroller({ children, className, label, showControls = true, intro }) {
  const scroll = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  useEffect(() => {
    if (!showControls) return
    const node = scroll.current
    const update = () => setEdges({ start: node.scrollLeft < 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 })
    const resize = new ResizeObserver(update)
    resize.observe(node)
    node.addEventListener('scroll', update, { passive: true })
    update()
    return () => { resize.disconnect(); node.removeEventListener('scroll', update) }
  }, [showControls])
  const move = direction => scroll.current.scrollBy({ left: direction * scroll.current.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return <>
    <div className={`horizontal-controls${intro ? " has-intro" : ""}`}>{intro}<span>左右瀏覽更多{label}</span>{showControls && <div><button type="button" aria-label={`上一組${label}`} disabled={edges.start} onClick={() => move(-1)}>上一組</button><button type="button" aria-label={`下一組${label}`} disabled={edges.end} onClick={() => move(1)}>下一組</button></div>}</div>
    <div ref={scroll} className={className} role="region" aria-label={`${label}，可左右滑動瀏覽`} tabIndex={0}>{children}</div>
  </>
}

function StudentMarquee() {
  return <HorizontalScroller className="testimonial-student-row" label="學員推薦" showControls={false}>
    <div className="testimonial-student-track"><div className="testimonial-student-group">
      {reviews.students.map(review => <ReviewCard review={review} key={`${review.name}-${review.role}`}/>)}
    </div></div>
  </HorizontalScroller>
}

function MediaCoverage() {
  return <MediaCoverflow items={mediaCoverage}/>
}

const partnerLogos = [
  { file: 'bnext.png', name: '數位時代' },
  { file: 'businessweekly.svg', name: '商業周刊' },
  { file: 'inside.svg', name: 'INSIDE' },
  { file: 'cheers.png', name: 'Cheers 快樂工作人' },
  { file: 'cw.svg', name: '天下雜誌' },
  { file: 'thenewslens.svg', name: '關鍵評論網' },
  { file: 'ad2iction.svg', name: '艾迪英特 Ad2iction' },
  { file: 'yanguo.svg', name: '言果學習', showName: true },
  { file: 'kvalley.png', name: '智谷網絡' },
].map(partner => ({ ...partner, artwork: mediaLogoBounds[partner.file] }))

function MediaPartners() {
  return <div className="trust-row testimonial-media-partners" id="trusted">
    <h3>Media &amp; Partners</h3>
    <div className="mq">
      <div className="mq-track">
        {[0, 1].flatMap(copy => partnerLogos.map(partner => <span
          className="mq-item"
          aria-hidden={copy === 1 ? true : undefined}
          key={`${copy}-${partner.name}`}
        >
          <span className="media-logo-artwork" style={{ '--logo-ratio': partner.artwork.cropWidth / partner.artwork.cropHeight }}>
            <img src={sitePath(`img/logos/${partner.file}`)} alt={copy === 0 ? partner.name : ''} decoding="async" style={{
              width: `${partner.artwork.width / partner.artwork.cropWidth * 100}%`,
              height: `${partner.artwork.height / partner.artwork.cropHeight * 100}%`,
              left: `${-partner.artwork.x / partner.artwork.cropWidth * 100}%`,
              top: `${-partner.artwork.y / partner.artwork.cropHeight * 100}%`,
            }}/>
          </span>
          {partner.showName && '言果學習'}
        </span>))}
      </div>
    </div>
  </div>
}

export default function TestimonialMarquee() {
  const [active, setActive] = useState(categories[0].id)
  const current = categories.find(category => category.id === active)

  const moveFocus = (event, index) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % categories.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + categories.length) % categories.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = categories.length - 1
    else return
    event.preventDefault()
    setActive(categories[next].id)
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus()
  }

  return <section id="voices" aria-labelledby="testimonial-heading" className="v2-sec band testimonial-marquee">
    <div className="section-head"><p className="eyebrow"><span>05</span>IN THEIR WORDS</p><h2 id="testimonial-heading" className="testimonial-heading">口碑推薦</h2><p className="student-keywords"><span>#用淺顯易懂的比喻教學</span><span>#觸類旁通</span><span>#回去馬上就能用</span></p></div>
    <div className="testimonial-tabs" role="tablist" aria-label="推薦類型">
      {categories.map((category, index) => <button
        key={category.id}
        id={`testimonial-tab-${category.id}`}
        type="button"
        role="tab"
        aria-selected={active === category.id}
        aria-controls={`testimonial-panel-${category.id}`}
        tabIndex={active === category.id ? 0 : -1}
        onClick={() => setActive(category.id)}
        onKeyDown={event => moveFocus(event, index)}
      >{category.label}</button>)}
    </div>
    {/* 四個 panel 都輸出到 HTML（預先渲染時爬蟲讀得到全部推薦），沒選到的用 hidden 隱藏；
        key 跟著是否選取變化，切換時重新掛載，保留原本「每次切換都是新的 panel」的行為。 */}
    {categories.map(({ id }) => <div
      key={`${id}-${active === id}`}
      id={`testimonial-panel-${id}`}
      className={`testimonial-panel testimonial-panel--${id}`}
      role="tabpanel"
      aria-labelledby={`testimonial-tab-${id}`}
      tabIndex={0}
      hidden={active !== id}
    >
      {id === 'students' && <StudentMarquee/>}
      {id === 'media' && <MediaCoverage/>}
      {id !== 'students' && id !== 'media' && reviews[id].map(review => <ReviewCard tailPreview={id === 'business'} review={review} key={`${review.name}-${review.role}`}/>)}
    </div>)}
    <MediaPartners/>
    <span className="testimonial-current" aria-live="polite">目前顯示：{current.label}</span>
  </section>
}
