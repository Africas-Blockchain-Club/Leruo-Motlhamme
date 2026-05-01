import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function HeroSection({ zarRate, listingCount }) {
  const badgeRef = useRef(null)
  const titleRef = useRef(null)
  const descRef  = useRef(null)
  const statsRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 })
      tl.to(badgeRef.current,  { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(titleRef.current,  { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
        .to(descRef.current,   { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.4')
        .to(statsRef.current,  { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        .to(scrollRef.current, { opacity: 1, duration: 0.5 }, '-=0.1')
    })
    return () => ctx.revert()
  }, [])

  const rate = zarRate ? zarRate.toFixed(2) : '—'

  return (
    <section className="hero" id="hero">
      <div className="hero-blob1" />
      <div className="hero-blob2" />

      <div
        className="hero-badge"
        ref={badgeRef}
        style={{ transform: 'translateY(12px)' }}
      >
        <div className="hero-badge-dot" />
        Smart Contract Escrow
      </div>

      <h1
        className="hero-title"
        ref={titleRef}
        style={{ transform: 'translateY(24px)' }}
      >
        LM-<span>MARKETPLACE</span>
      </h1>

      <p
        className="hero-desc"
        ref={descRef}
        style={{ transform: 'translateY(20px)' }}
      >
        A peer-to-peer USDC exchange secured by on-chain escrow. Every trade
        is locked in a smart contract — funds only release when both parties
        confirm, with arbiter-backed dispute resolution.
      </p>

      <div
        className="hero-stats"
        ref={statsRef}
        style={{ transform: 'translateY(16px)' }}
      >
        <div className="hero-stat">
          <div className="hero-stat-val">
            R<span>{rate}</span>
          </div>
          <div className="hero-stat-lbl">USD / ZAR Live Rate</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-val">
            {listingCount}<span> active</span>
          </div>
          <div className="hero-stat-lbl">Open Listings</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-val">
            100<span>%</span>
          </div>
          <div className="hero-stat-lbl">Escrow Protected</div>
        </div>
      </div>

      <div
        className="hero-scroll"
        ref={scrollRef}
      >
        <span className="hero-scroll-text">Scroll to explore</span>
        <div className="hero-scroll-line" />
      </div>
    </section>
  )
}
