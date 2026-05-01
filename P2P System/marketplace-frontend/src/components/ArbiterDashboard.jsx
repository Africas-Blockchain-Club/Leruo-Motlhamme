import { useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { MARKETPLACE_ABI } from '../config/contracts'
import { shortAddr, formatUSDC, formatZAR } from '../utils/format'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export default function ArbiterDashboard({
  listings,
  loading,
  wallet,
  contractAddr,
  zarRate,
  onRefresh,
  addToast,
}) {
  const [busyId, setBusyId] = useState(null)

  const disputed = listings.filter(
    (l) => l.seller !== ZERO_ADDR && l.state === 3
  )

  const resolve = async (txId, refundSeller) => {
    setBusyId(txId)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const market   = new Contract(contractAddr, MARKETPLACE_ABI, signer)
      const label    = refundSeller ? 'Refund Seller' : 'Release to Buyer'
      addToast({ type: 'pending', message: `Resolving dispute — ${label}…` })
      const tx      = await market.resolveDispute(BigInt(txId), refundSeller)
      addToast({ type: 'pending', message: 'Waiting for confirmation…', hash: tx.hash })
      const receipt = await tx.wait()
      addToast({ type: 'success', message: `Dispute #${txId} resolved.`, hash: receipt.hash })
      onRefresh()
    } catch (e) {
      const msg = e?.reason || e?.message || 'Resolution failed.'
      addToast({ type: 'error', message: msg.length > 120 ? msg.slice(0, 120) + '…' : msg })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="arbiter">
      <div className="arbiter-header">
        <div className="arbiter-warning-badge">
          ⚖️ Arbiter Mode
        </div>
        <h1 className="arbiter-title">Dispute Resolution</h1>
        <p className="arbiter-sub">
          Review disputed trades and decide whether to refund the seller or
          release funds to the buyer.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Active Disputes</span>
          <span
            className="marketplace-count"
            style={{
              background: 'var(--danger-bg)',
              borderColor: 'var(--danger-bdr)',
              color: 'var(--danger)',
            }}
          >
            {disputed.length}
          </span>
        </div>
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? <div className="spinner" /> : '↻'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="arbiter-empty">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
          <div className="arbiter-empty-text">Loading disputes…</div>
        </div>
      ) : disputed.length === 0 ? (
        <div className="arbiter-empty">
          <div className="arbiter-empty-icon">✅</div>
          <div className="arbiter-empty-text">No active disputes</div>
          <div className="arbiter-empty-sub">
            All trades are resolving smoothly. Check back later.
          </div>
        </div>
      ) : (
        <div className="arbiter-grid">
          {disputed.map((trade) => {
            const isBusy = busyId === trade.txId
            return (
              <div key={trade.txId} className="arbiter-card">
                <div className="arbiter-card-badge">
                  ⚠️ Dispute · TxID #{trade.txId}
                </div>

                <div className="arbiter-card-amount">
                  {formatUSDC(trade.amountOfSBC)} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>USDC</span>
                </div>
                <div className="arbiter-card-zar">
                  ≈ {formatZAR(trade.amountOfSBC, zarRate)} ZAR
                </div>

                <div className="arbiter-card-sep" />

                <div className="arbiter-card-row">
                  <span className="arbiter-card-lbl">Seller</span>
                  <span className="arbiter-card-addr" title={trade.seller}>
                    {shortAddr(trade.seller)}
                  </span>
                </div>
                <div className="arbiter-card-row">
                  <span className="arbiter-card-lbl">Buyer</span>
                  <span className="arbiter-card-addr" title={trade.buyer}>
                    {trade.buyer !== ZERO_ADDR ? shortAddr(trade.buyer) : '—'}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                  Choose: refund the USDC back to the seller, or release it to the buyer.
                </p>

                <div className="arbiter-card-actions">
                  <button
                    className="btn btn-warning btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => resolve(trade.txId, true)}
                    disabled={isBusy}
                  >
                    {isBusy ? <><div className="spinner" /> …</> : '↩ Refund Seller'}
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => resolve(trade.txId, false)}
                    disabled={isBusy}
                  >
                    {isBusy ? <><div className="spinner" /> …</> : '→ Release to Buyer'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
