import { useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { MARKETPLACE_ABI, TX_STATE } from '../config/contracts'
import { shortAddr, formatUSDC, formatZAR } from '../utils/format'

export default function ListingCard({ trade, wallet, contractAddr, zarRate, onRefresh, addToast }) {
  const [busy, setBusy] = useState(false)

  const { txId, seller, buyer, amountOfSBC, state } = trade
  const stateInfo = TX_STATE[state] ?? TX_STATE[0]
  const isMyListing = wallet?.address?.toLowerCase() === seller?.toLowerCase()
  const isMyBuy     = wallet?.address?.toLowerCase() === buyer?.toLowerCase()

  const callContract = async (method, ...args) => {
    setBusy(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const market   = new Contract(contractAddr, MARKETPLACE_ABI, signer)
      addToast({ type: 'pending', message: `Sending ${method}…` })
      const tx = await market[method](...args)
      addToast({ type: 'pending', message: 'Waiting for confirmation…', hash: tx.hash })
      const receipt = await tx.wait()
      addToast({ type: 'success', message: `${method} confirmed!`, hash: receipt.hash })
      onRefresh()
    } catch (e) {
      const msg = e?.reason || e?.message || 'Transaction failed.'
      addToast({ type: 'error', message: msg.length > 120 ? msg.slice(0, 120) + '…' : msg })
    } finally {
      setBusy(false)
    }
  }

  const renderActions = () => {
    if (!wallet) return null

    // state 0: Open
    if (state === 0) {
      if (isMyListing) {
        return (
          <button
            className="btn btn-danger btn-sm btn-full"
            onClick={() => callContract('cancelListing', BigInt(txId))}
            disabled={busy}
          >
            {busy ? <><div className="spinner" /> Cancelling…</> : '✕ Cancel Listing'}
          </button>
        )
      }
      return (
        <button
          className="btn btn-primary btn-sm btn-full"
          onClick={() => callContract('acceptListing', BigInt(txId))}
          disabled={busy}
        >
          {busy ? <><div className="spinner" /> Accepting…</> : 'Accept Listing →'}
        </button>
      )
    }

    // state 1: Accepted — buyer marks as paid
    if (state === 1) {
      if (isMyBuy) {
        return (
          <button
            className="btn btn-success btn-sm btn-full"
            onClick={() => callContract('setAsPaid', BigInt(txId))}
            disabled={busy}
          >
            {busy ? <><div className="spinner" /> Confirming…</> : '💳 Mark as Paid'}
          </button>
        )
      }
      return (
        <button className="btn btn-ghost btn-sm btn-full" disabled style={{ cursor: 'default' }}>
          ⏳ Awaiting Buyer Payment
        </button>
      )
    }

    // state 2: Paid — seller confirms receipt or either party opens dispute
    if (state === 2) {
      return (
        <div className="card-actions-row">
          {isMyListing && (
            <button
              className="btn btn-success btn-sm"
              style={{ flex: 1 }}
              onClick={() => callContract('confirmReceipt', BigInt(txId))}
              disabled={busy}
            >
              {busy ? <><div className="spinner" /> …</> : '✅ Confirm Receipt'}
            </button>
          )}
          {(isMyListing || isMyBuy) && (
            <button
              className="btn btn-danger btn-sm"
              style={{ flex: 1 }}
              onClick={() => callContract('openDispute', BigInt(txId))}
              disabled={busy}
            >
              {busy ? <><div className="spinner" /> …</> : '⚠️ Open Dispute'}
            </button>
          )}
          {!isMyListing && !isMyBuy && (
            <button className="btn btn-ghost btn-sm btn-full" disabled>
              Trade in progress
            </button>
          )}
        </div>
      )
    }

    // state 3: Disputed
    if (state === 3) {
      return (
        <button className="btn btn-ghost btn-sm btn-full" disabled style={{ cursor: 'default' }}>
          ⚖️ Dispute — Arbiter Reviewing
        </button>
      )
    }

    return null
  }

  return (
    <div className="card">
      <div className="card-top">
        <span
          className="card-status"
          style={{
            color: stateInfo.color,
            background: stateInfo.bg,
            borderColor: stateInfo.border,
          }}
        >
          {stateInfo.label}
        </span>
        <span className="card-txid">TxID #{txId}</span>
      </div>

      <div className="card-amount">
        {formatUSDC(amountOfSBC)} <span>USDC</span>
      </div>
      <div className="card-zar">
        ≈ {formatZAR(amountOfSBC, zarRate)} ZAR
      </div>

      <div className="card-sep" />

      <div className="card-row">
        <div className="card-lbl">Seller</div>
        <div className="card-addr" title={seller}>{shortAddr(seller)}</div>
      </div>

      {buyer && buyer !== '0x0000000000000000000000000000000000000000' && (
        <div className="card-row">
          <div className="card-lbl">Buyer</div>
          <div className="card-addr" title={buyer}>{shortAddr(buyer)}</div>
        </div>
      )}

      <div className="card-actions">
        {renderActions()}
      </div>
    </div>
  )
}
