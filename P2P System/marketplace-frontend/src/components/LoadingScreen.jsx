import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function LoadingScreen({ onComplete }) {
  const screenRef = useRef(null)
  const barRef    = useRef(null)
  const titleRef  = useRef(null)
  const subRef    = useRef(null)
  const dotsRef   = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // bar sweeps left → right
      tl.to(barRef.current, {
        scaleX: 1,
        duration: 2.2,
        ease: 'power2.inOut',
      })

      // title + sub fade up
      .to(titleRef.current, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=1.6')
      .to(subRef.current,   { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=1.2')
      .to(dotsRef.current,  { opacity: 1,        duration: 0.4  }, '-=0.9')

      // pulse dots one by one
      .to('.loading-dot', {
        opacity: 1,
        stagger: { each: 0.12, repeat: 2, yoyo: true },
        duration: 0.25,
      }, '-=0.5')

      // hold then slide the whole screen up and out
      .to({}, { duration: 0.5 })
      .to(screenRef.current, {
        yPercent: -100,
        duration: 0.85,
        ease: 'power3.inOut',
        onComplete,
      })
    }, screenRef)

    return () => ctx.revert()
  }, [onComplete])

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" ref={barRef} />
      </div>

      <p className="loading-logo">Escrow · P2P · On-chain</p>

      <h1
        className="loading-title"
        ref={titleRef}
        style={{ transform: 'translateY(24px)' }}
      >
        LM-<span>MARKETPLACE</span>
      </h1>

      <p
        className="loading-sub"
        ref={subRef}
        style={{ transform: 'translateY(12px)' }}
      >
        Smart Contract Protected
      </p>

      <div className="loading-dots" ref={dotsRef}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="loading-dot" style={{ opacity: 0.15 + i * 0.12 }} />
        ))}
      </div>
    </div>
  )
}
