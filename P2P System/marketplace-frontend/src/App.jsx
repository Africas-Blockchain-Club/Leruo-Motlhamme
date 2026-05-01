import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { BrowserProvider, Contract } from 'ethers'

import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from './config/contracts'
import { parseTrade } from './utils/format'

import LoadingScreen      from './components/LoadingScreen'
import Navbar             from './components/Navbar'
import HeroSection        from './components/HeroSection'
import HowItWorks         from './components/HowItWorks'
import CreateListingModal from './components/CreateListingModal'
import Marketplace        from './components/Marketplace'
import ArbiterDashboard   from './components/ArbiterDashboard'
import Toast              from './components/Toast'
import ScrollToTop        from './components/ScrollToTop'

const ZERO = '0x0000000000000000000000000000000000000000'
let toastId = 0

export default function App() {
  const navigate = useNavigate()

  // ── Core state ──────────────────────────────────────────────
  const [appReady,      setAppReady]      = useState(false)
  const [wallet,        setWallet]        = useState(null)
  const [isArbiter,     setIsArbiter]     = useState(false)
  const [showCreate,    setShowCreate]    = useState(false)
  const [listings,      setListings]      = useState([])
  const [loadingList,   setLoadingList]   = useState(false)
  const [connecting,    setConnecting]    = useState(false)
  const [zarRate,       setZarRate]       = useState(18.84)
  const [toasts,        setToasts]        = useState([])
  const [contractAddr,  setContractAddr]  = useState(() =>
    MARKETPLACE_ADDRESS ||
    localStorage.getItem('lm_contract_addr') ||
    ''
  )
  const [setupInput,    setSetupInput]    = useState('')
  const [showSetup,     setShowSetup]     = useState(!contractAddr)

  // ── Toast helpers ──────────────────────────────────────────
  const addToast = useCallback((toast) => {
    const id = ++toastId
    setToasts((prev) => [...prev.slice(-4), { id, ...toast }])
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Fetch ZAR rate ─────────────────────────────────────────
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then((r) => r.json())
      .then((d) => { if (d.rates?.ZAR) setZarRate(d.rates.ZAR) })
      .catch(() => {/* use default */})
  }, [])

  // ── Fetch listings ─────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!contractAddr || !window.ethereum) return
    setLoadingList(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const market   = new Contract(contractAddr, MARKETPLACE_ABI, provider)
      const nextId   = await market.nextID()
      const count    = Number(nextId)
      const trades   = []
      for (let i = 1; i <= count; i++) {
        try {
          const raw    = await market.CurrentTrades(i)
          const parsed = parseTrade(raw)
          if (parsed.seller !== ZERO) trades.push(parsed)
        } catch { /* skip bad entries */ }
      }
      setListings(trades)
    } catch {
      addToast({ type: 'error', message: 'Failed to load listings from contract.' })
    } finally {
      setLoadingList(false)
    }
  }, [contractAddr, addToast])

  // ── Connect wallet ─────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      addToast({ type: 'error', message: 'MetaMask not detected. Please install it.' })
      return
    }
    setConnecting(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer  = await provider.getSigner()
      const address = await signer.getAddress()

      let admin = false
      if (contractAddr) {
        try {
          const market     = new Contract(contractAddr, MARKETPLACE_ABI, provider)
          const [arb, own] = await Promise.all([market.arbiter(), market.owner()])
          const low = address.toLowerCase()
          admin = low === arb.toLowerCase() || low === own.toLowerCase()
        } catch { /* contract not deployed or wrong network */ }
      }

      setWallet({ address, signer, provider })
      setIsArbiter(admin)
      addToast({ type: 'success', title: 'Wallet connected', message: admin ? 'Arbiter mode active.' : 'Ready to trade.' })
    } catch (e) {
      addToast({ type: 'error', message: e?.message?.slice(0, 100) || 'Failed to connect wallet.' })
    } finally {
      setConnecting(false)
    }
  }, [contractAddr, addToast])

  // ── Listen for account changes ──────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return
    const handleChange = () => { setWallet(null); setIsArbiter(false); navigate('/') }
    window.ethereum.on('accountsChanged', handleChange)
    return () => window.ethereum.removeListener('accountsChanged', handleChange)
  }, [navigate])

  // ── Contract address setup ──────────────────────────────────
  const saveContractAddr = () => {
    const addr = setupInput.trim()
    if (!addr.startsWith('0x') || addr.length !== 42) {
      addToast({ type: 'error', message: 'Invalid contract address.' })
      return
    }
    localStorage.setItem('lm_contract_addr', addr)
    setContractAddr(addr)
    setShowSetup(false)
  }

  const openCount = listings.filter((l) => l.seller !== ZERO && l.state === 0).length

  // ── Loading / setup screens ────────────────────────────────
  if (!appReady) {
    return <LoadingScreen onComplete={() => setAppReady(true)} />
  }

  if (showSetup) {
    return (
      <div className="setup-screen">
        <div className="setup-box">
          <div className="setup-icon">🔗</div>
          <h2 className="setup-title">Connect to Contract</h2>
          <p className="setup-sub">
            Enter the deployed <strong>LmMarketplace proxy address</strong> to
            connect the frontend to your smart contract.
          </p>
          <input
            className="setup-input"
            placeholder="0x... (proxy contract address)"
            value={setupInput}
            onChange={(e) => setSetupInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveContractAddr()}
          />
          <button className="btn btn-primary btn-full" onClick={saveContractAddr}>
            Connect Contract
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}
            onClick={() => setShowSetup(false)}
          >
            Skip for now (read-only preview)
          </button>
        </div>
      </div>
    )
  }

  // ── Shared props ───────────────────────────────────────────
  const marketplaceProps = { listings, loading: loadingList, wallet, contractAddr, zarRate, onRefresh: fetchListings, addToast }

  return (
    <>
      <Navbar
        wallet={wallet}
        onGoHome={() => navigate('/')}
      />

      <ScrollToTop />
      <Routes>
        <Route path="/" element={
          <>
            <HeroSection zarRate={zarRate} listingCount={openCount} />
            <HowItWorks
              wallet={wallet}
              isArbiter={isArbiter}
              onConnect={connectWallet}
              onEnterMarketplace={() => navigate('/marketplace')}
              onCreateListing={() => setShowCreate(true)}
              onArbiterDashboard={() => navigate('/arbiter')}
              connecting={connecting}
            />
          </>
        } />

        <Route path="/marketplace" element={
          <Marketplace
            {...marketplaceProps}
            onCreateListing={() => setShowCreate(true)}
          />
        } />

        <Route path="/arbiter" element={
          <ArbiterDashboard {...marketplaceProps} />
        } />
      </Routes>

      {showCreate && wallet && contractAddr && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          contractAddr={contractAddr}
          wallet={wallet}
          zarRate={zarRate}
          onSuccess={() => {
            fetchListings()
            navigate('/marketplace')
            setShowCreate(false)
          }}
          addToast={addToast}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
