import { useState } from 'react'
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

function ReviewCard({ review }) {
  return <figure className="testimonial-card">
    <span className="testimonial-quote" aria-hidden="true">“</span>
    <ReviewBody review={review}/>
    <figcaption>
      <span>{review.role}</span>
      <strong>{review.name}</strong>
    </figcaption>
  </figure>
}

function StudentMarquee() {
  return <div
    className="testimonial-student-row"
    role="region"
    aria-label="學員推薦，可左右滑動瀏覽"
    tabIndex={0}
  >
    <div className="testimonial-student-track">
      <div className="testimonial-student-group">
        {reviews.students.map(review => <ReviewCard review={review} key={review.name}/>)}
      </div>
    </div>
  </div>
}

function MediaCard({ item, index }) {
  return <article className="media-card">
    <a className="media-card-main" href={item.href} target="_blank" rel="noreferrer">
      <div className="media-card-visual">
        {item.image
          ? <img src={item.image} alt=""/>
          : <>
            <span className="media-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.mark}</strong>
          </>}
        <span className="media-card-kind">{item.kind}</span>
      </div>
      <div className="media-card-copy">
        <div className="media-card-meta">
          <span>{item.source}</span>
          {item.date && <span>{item.date}</span>}
        </div>
        <h3>{item.title}</h3>
        <span className="media-card-action">{item.action}<span aria-hidden="true">↗</span></span>
      </div>
    </a>
    {item.secondaryHref && <a
      className="media-card-secondary"
      href={item.secondaryHref}
      target="_blank"
      rel="noreferrer"
    >{item.secondaryAction}<span aria-hidden="true">↗</span></a>}
  </article>
}

function MediaCoverage() {
  return <div
    className="media-coverage-grid"
    role="region"
    aria-label="媒體報導，可左右滑動瀏覽"
    tabIndex={0}
  >
    {mediaCoverage.map((item, index) => <MediaCard item={item} index={index} key={`${item.source}-${item.title}`}/>)}
  </div>
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

  return <section id="voices" aria-labelledby="testimonial-heading" className="v2-sec testimonial-marquee">
    <h2 id="testimonial-heading" className="testimonial-heading">口碑推薦</h2>
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
