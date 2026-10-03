import { useEffect, useRef, useState } from 'react'
import reviews from '../../content/reviews.json'
import mediaCoverage from '../../content/media-coverage.json'
import { sitePath } from '../../routes.js'
import './marquee-01.css'

const categories = [
  { id: 'business', label: '企業主推薦' },
  { id: 'professional', label: '專業領域推薦' },
  { id: 'students', label: '學員推薦' },
  { id: 'media', label: '媒體報導' },
]

function ReviewBody({ review }) {
  if (review.body) return <blockquote>{review.body}</blockquote>

  return <blockquote>
    {review.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {review.items && <ol>
      {review.items.map((item, index) => <li key={index}>{item}</li>)}
    </ol>}
    {review.closing && <p>{review.closing}</p>}
  </blockquote>
}

const reviewLength = review => [review.body, ...(review.paragraphs || []), ...(review.items || []), review.closing].join('').length

function ReviewCard({ review }) {
  const long = reviewLength(review) > 150
  const [open, setOpen] = useState(false)
  return <figure className={`testimonial-card${long && !open ? ' is-clamped' : ''}`}>
    <svg className="testimonial-quote" viewBox="3 0 32 24" fill="currentColor" aria-hidden="true"><path d="M3 13C3 6.5 6.5 3 12 2v4c-3 .8-4.5 2.4-4.8 5H14v11H3V13Zm16 0C19 6.5 22.5 3 28 2v4c-3 .8-4.5 2.4-4.8 5H30v11H19V13Z"/></svg>
    <ReviewBody review={review}/>
    {long && <button type="button" className="testimonial-more" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '收合' : '展開全文'}</button>}
    <figcaption>
      <span>{review.role}</span>
      <strong>{review.name}</strong>
    </figcaption>
  </figure>
}

function HorizontalScroller({ children, className, label, showControls = true }) {
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
    <div className="horizontal-controls"><span>左右瀏覽更多{label}</span>{showControls && <div><button type="button" aria-label={`上一組${label}`} disabled={edges.start} onClick={() => move(-1)}>上一組</button><button type="button" aria-label={`下一組${label}`} disabled={edges.end} onClick={() => move(1)}>下一組</button></div>}</div>
    <div ref={scroll} className={className} role="region" aria-label={`${label}，可左右滑動瀏覽`} tabIndex={0}>{children}</div>
  </>
}

function StudentMarquee() {
  return <HorizontalScroller className="testimonial-student-row" label="學員推薦" showControls={false}>
    <div className="testimonial-student-track"><div className="testimonial-student-group">
      {reviews.students.map(review => <ReviewCard review={review} key={review.name}/>)}
    </div></div>
  </HorizontalScroller>
}

function MediaCard({ item, index }) {
  return <article className="media-card">
    <a className="media-card-main" href={item.href} target="_blank" rel="noreferrer">
      <div className="media-card-visual">
        {item.image
          ? <img src={item.image} alt=""/>
          : <>
            <span className="media-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.source}</strong>
          </>}
        <span className="media-card-kind">{item.kind}</span>
      </div>
      <div className="media-card-copy">
        <div className="media-card-meta">
          <span>{item.date || item.mark}</span>
        </div>
        <h3>{item.title}</h3>
        <span className="media-card-action">{item.action}</span>
      </div>
    </a>
    {item.secondaryHref && <a
      className="media-card-secondary"
      href={item.secondaryHref}
      target="_blank"
      rel="noreferrer"
    >{item.secondaryAction}</a>}
  </article>
}

function MediaCoverage() {
  return <HorizontalScroller className="media-coverage-grid" label="媒體報導" showControls={false}>
    {mediaCoverage.map((item, index) => <MediaCard item={item} index={index} key={`${item.source}-${item.title}`}/>)}
  </HorizontalScroller>
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
]

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
          <img src={sitePath(`img/logos/${partner.file}`)} alt={copy === 0 ? partner.name : ''} loading="lazy"/>
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
    <div className="section-head" data-reveal><p className="eyebrow"><span>05</span>IN THEIR WORDS</p><h2 id="testimonial-heading" className="testimonial-heading">口碑推薦</h2></div>
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
    <div
      id={`testimonial-panel-${active}`}
      className={`testimonial-panel testimonial-panel--${active}`}
      role="tabpanel"
      aria-labelledby={`testimonial-tab-${active}`}
      tabIndex={0}
    >
      {active === 'students' && <StudentMarquee/>}
      {active === 'media' && <MediaCoverage/>}
      {active !== 'students' && active !== 'media' && reviews[active].map(review => <ReviewCard review={review} key={review.name}/>)}
    </div>
    <MediaPartners/>
    <span className="testimonial-current" aria-live="polite">目前顯示：{current.label}</span>
  </section>
}
