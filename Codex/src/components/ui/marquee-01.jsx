import { useEffect, useRef, useState } from 'react'
import reviews from '../../content/reviews.json'
import './marquee-01.css'

function Marquee({ reviews, reverse = false }) {
  return <div className={`testimonial-row${reverse ? ' testimonial-row--reverse' : ''}`}>
    <div className="testimonial-track">
      {[0, 1].map(copy => <div className="testimonial-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {reviews.map(review => <figure className="testimonial-card" key={review.name}>
          <span className="testimonial-quote" aria-hidden="true">“</span>
          <blockquote>{review.body}</blockquote>
          <figcaption>{review.name}</figcaption>
        </figure>)}
      </div>)}
    </div>
  </div>
}

export default function TestimonialMarquee() {
  const host = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 離開可視區域即停止，回到區域後從同一位置繼續。
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])

  return <section ref={host} id="voices" aria-label="學員見證"
    className={`v2-sec testimonial-marquee${!visible ? ' is-paused' : ''}`}>
    <div className="testimonial-rows" id="testimonial-rows">
      <Marquee reviews={reviews.slice(0, 3)}/>
      <Marquee reviews={reviews.slice(3)} reverse/>
    </div>
  </section>
}
