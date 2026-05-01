import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: '📋',
    step: 'Step 01',
    title: 'Create a Listing',
    desc: 'Deposit your USDC into the escrow smart contract. Approve the contract to spend your tokens, then your listing goes live on-chain instantly.',
  },
  {
    icon: '🤝',
    step: 'Step 02',
    title: 'Buyer Accepts',
    desc: 'A buyer locks in your listing on-chain, then transfers the ZAR payment directly to you via bank transfer — no intermediaries involved.',
  },
  {
    icon: '🔒',
    step: 'Step 03',
    title: 'Escrow Protection',
    desc: 'Funds stay locked in the smart contract until the seller confirms receipt of payment. Open a dispute at any time — the arbiter resolves it fairly.',
  },
]

export default function HowItWorks({
  wallet,
  isArbiter,
  onConnect,
  onEnterMarketplace,
  onCreateListing,
  onArbiterDashboard,
  connecting,
}) {
  const sectionRef = useRef(null)
  const trackRef   = useRef(null)
  const [activePanel, setActivePanel] = useState(0)

  const TOTAL_PANELS = STEPS.length + 1 // 3 info + 1 connect

  useEffect(() => {
    const section = sectionRef.current
    const track   = trackRef.current
    if (!section || !track) return

    const ctx = gsap.context(() => {
      const distance = track.scrollWidth - window.innerWidth

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${distance}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const panel = Math.min(
              TOTAL_PANELS - 1,
              Math.floor(self.progress * TOTAL_PANELS)
            )
            setActivePanel(panel)
          },
        },
      })

      tl.to(track, { x: -distance, ease: 'none' })
    })

    return () => ctx.revert()
  }, [TOTAL_PANELS])

  const navigate = (cb) => {
    ScrollTrigger.killAll()
    window.scrollTo(0, 0)
    cb()
  }

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum

  return (
    <div ref={sectionRef} className="hiw-section">
      <div ref={trackRef} className="hiw-track">

        {/* ── Info Panels ── */}
        {STEPS.map((step, i) => (
          <div className="hiw-panel" key={i}>
            <div className="hiw-panel-bg-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="hiw-panel-icon">{step.icon}</div>
            <p className="hiw-step-label">{step.step}</p>
            <h2 className="hiw-panel-title">{step.title}</h2>
            <p className="hiw-panel-desc">{step.desc}</p>
          </div>
        ))}

        {/* ── Connect / Action Panel ── */}
        <div className="hiw-panel">
          <div className="hiw-panel-bg-num">04</div>
          <div className="hiw-panel-icon">🚀</div>
          <p className="hiw-step-label">Get Started</p>

          {!wallet ? (
            <>
              <h2 className="hiw-panel-title">Connect Your Wallet</h2>
              <p className="hiw-panel-desc">
                Connect your MetaMask wallet to create listings, browse the
                marketplace, and trade securely on-chain.
              </p>
              <div className="hiw-connect-area">
                {hasMetaMask ? (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '16px', padding: '14px 36px' }}
                    onClick={onConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <><div className="spinner" /> Connecting…</>
                    ) : (
                      '🦊 Connect MetaMask'
                    )}
                  </button>
                ) : (
                  <div className="hiw-no-metamask">
                    MetaMask is not installed. Please install it to continue.
                  </div>
                )}
              </div>
            </>
          ) : isArbiter ? (
            <>
              <h2 className="hiw-panel-title">Arbiter Dashboard</h2>
              <p className="hiw-panel-desc">
                You are connected as the arbiter. Review and resolve disputed
                trades to keep the marketplace running fairly.
              </p>
              <div className="hiw-connect-area">
                <div
                  className="navbar-pill"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  <div className="navbar-pill-dot" />
                  Arbiter Mode Active
                </div>
                <div className="hiw-btns-row">
                  <button
                    className="btn btn-warning"
                    style={{ fontSize: '15px', padding: '13px 30px' }}
                    onClick={() => navigate(onArbiterDashboard)}
                  >
                    ⚖️ Arbiter&apos;s Dashboard
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '15px', padding: '13px 30px' }}
                    onClick={() => navigate(onEnterMarketplace)}
                  >
                    View Marketplace
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="hiw-panel-title">You&apos;re Connected</h2>
              <p className="hiw-panel-desc">
                Start trading — create a USDC listing or browse the marketplace
                to buy from existing sellers.
              </p>
              <div className="hiw-connect-area">
                <div
                  className="navbar-pill"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  <div className="navbar-pill-dot" />
                  Wallet Connected
                </div>
                <div className="hiw-btns-row">
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '15px', padding: '13px 30px' }}
                    onClick={() => navigate(onCreateListing)}
                  >
                    + Create Listing
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '15px', padding: '13px 30px' }}
                    onClick={() => navigate(onEnterMarketplace)}
                  >
                    Enter Marketplace →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* progress dots */}
      <div className="hiw-dots">
        {Array.from({ length: TOTAL_PANELS }).map((_, i) => (
          <div key={i} className={`hiw-dot${activePanel === i ? ' active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
