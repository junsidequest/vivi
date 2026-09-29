import { useState } from 'react'
import reviews from '../../content/reviews.json'
import './marquee-01.css'

const categories = [
  { id: 'business', label: '企業主推薦' },
  { id: 'professional', label: '專業領域推薦' },
  { id: 'students', label: '學員推薦' },
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
  return <div className="testimonial-student-row">
    <div className="testimonial-student-track">
      {[0, 1].map(copy => <div className="testimonial-student-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {reviews.students.map(review => <ReviewCard review={review} key={review.name}/>)}
      </div>)}
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
      {active === 'students'
        ? <StudentMarquee/>
        : reviews[active].map(review => <ReviewCard review={review} key={review.name}/>)}
    </div>
    <span className="testimonial-current" aria-live="polite">目前顯示：{current.label}</span>
  </section>
}
