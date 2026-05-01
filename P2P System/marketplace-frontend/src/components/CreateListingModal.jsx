import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'
import { MARKETPLACE_ABI, ERC20_ABI } from '../config/contracts'
import { shortHash, formatZAR } from '../utils/format'

export default function CreateListingModal({
  onClose,
  contractAddr,
  wallet,
  zarRate,
  onSuccess,
  addToast,
}) {
  const [amount, setAmount]         = useState('')
  const [balance, setBalance]       = useState(null)
  const [step, setStep]             = useState('input') // input | approving | approved | creating | done
  const [txId, setTxId]             = useState(null)
  const [createHash, setCreateHash] = useState(null)
  const [error, setError]           = useState('')

  // fetch USDC balance
  useEffect(() => {
    if (!wallet || !contractAddr) return
    ;(async () => {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const market   = new Contract(contractAddr, MARKETPLACE_ABI, provider)
        const usdcAddr = await market.usdc()
        const usdc     = new Contract(usdcAddr, ERC20_ABI, provider)
        const bal      = await usdc.balanceOf(wallet.address)
        setBalance(formatUnits(bal, 6))
      } catch {
        setBalance(null)
      }
    })()
  }, [wallet, contractAddr])

  const zarDisplay = (() => {
    const n = parseFloat(amount)
    if (!n || !zarRate) return null
    const raw = BigInt(Math.round(n * 1e6)).toString()
    return formatZAR(raw, zarRate)
  })()

  const handleApprove = async () => {
    setError('')
    const n = parseFloat(amount)
    if (!n || n <= 0) { setError('Enter a valid USDC amount.'); return }

    setStep('approving')
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const market   = new Contract(contractAddr, MARKETPLACE_ABI, provider)
      const usdcAddr = await market.usdc()
      const usdc     = new Contract(usdcAddr, ERC20_ABI, signer)
      const raw      = parseUnits(amount, 6)

      addToast({ type: 'pending', message: 'Approving USDC spend…' })
      const tx      = await usdc.approve(contractAddr, raw)
      addToast({ type: 'pending', message: 'Waiting for approval confirmation…', hash: tx.hash })
      await tx.wait()
      addToast({ type: 'success', message: 'USDC approved successfully.' })
      setStep('approved')
    } catch (e) {
      const msg = e?.reason || e?.message || 'Approval failed.'
      setError(msg.length > 120 ? msg.slice(0, 120) + '…' : msg)
      addToast({ type: 'error', message: msg })
      setStep('input')
    }
  }

  const handleCreate = async () => {
    setError('')
    setStep('creating')
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const market   = new Contract(contractAddr, MARKETPLACE_ABI, signer)
      const raw      = parseUnits(amount, 6)

      addToast({ type: 'pending', message: 'Creating listing on-chain…' })
      const tx      = await market.createListing(raw)
      addToast({ type: 'pending', message: 'Waiting for confirmation…', hash: tx.hash })
      const receipt = await tx.wait()

      // parse OpenedListing event to get TxID
      const iface  = market.interface
      let foundId  = null
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data })
          if (parsed?.name === 'OpenedListing') {
            foundId = parsed.args.TxID.toString()
            break
          }
        } catch { /* skip */ }
      }

      setTxId(foundId)
      setCreateHash(receipt.hash)
      setStep('done')
      addToast({ type: 'success', message: `Listing #${foundId} created!`, hash: receipt.hash })
      onSuccess()
    } catch (e) {
      const msg = e?.reason || e?.message || 'Listing failed.'
      setError(msg.length > 120 ? msg.slice(0, 120) + '…' : msg)
      addToast({ type: 'error', message: msg })
      setStep('approved')
    }
  }

  const isDone      = step === 'done'
  const isApproving = step === 'approving'
  const isCreating  = step === 'creating'
  const isApproved  = step === 'approved'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>

        {!isDone ? (
          <>
            <h2 className="modal-title">Create Listing</h2>
            <p className="modal-sub">
              Deposit USDC into escrow. Buyers will pay you in ZAR off-chain.
            </p>

            {/* step indicators */}
            <div className="modal-steps">
              <div className={`modal-step ${step !== 'input' ? 'done' : 'active'}`}>
                <div className="modal-step-num">{step !== 'input' ? '✓' : '1'}</div>
                Approve USDC
              </div>
              <div className="modal-step-line" />
              <div className={`modal-step ${isApproved || isCreating ? 'active' : ''}`}>
                <div className="modal-step-num">2</div>
                Create Listing
              </div>
            </div>

            {/* amount input */}
            <div className="form-group">
              <label className="form-label">USDC Amount</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isApproving || isApproved || isCreating}
              />
              {zarDisplay && (
                <p className="form-zar">≈ {zarDisplay} ZAR (at current rate)</p>
              )}
              {balance !== null && (
                <p className="form-balance">
                  Balance: <strong>{parseFloat(balance).toFixed(2)} USDC</strong>
                </p>
              )}
              {error && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{error}</p>
              )}
            </div>

            {!isApproved && !isCreating ? (
              <>
                <p className="form-note">
                  Step 1: Approves the marketplace contract to spend your USDC.
                  A wallet confirmation will appear.
                </p>
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 16 }}
                  onClick={handleApprove}
                  disabled={!amount || parseFloat(amount) <= 0 || isApproving}
                >
                  {isApproving ? (
                    <><div className="spinner" /> Approving…</>
                  ) : (
                    '🔓 Approve USDC'
                  )}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-bdr)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--success)',
                    marginBottom: 14,
                  }}
                >
                  ✓ USDC approved — ready to create listing
                </div>
                <p className="form-note">
                  Step 2: Creates the listing and transfers your USDC into escrow.
                </p>
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 12 }}
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <><div className="spinner" /> Creating…</>
                  ) : (
                    '📋 Create Listing'
                  )}
                </button>
              </>
            )}
          </>
        ) : (
          /* Success state */
          <div className="modal-success">
            <div className="modal-success-icon">✅</div>
            <h3 className="modal-success-title">Listing Created!</h3>
            <p className="modal-success-sub">
              Your USDC is now locked in escrow and visible in the marketplace.
            </p>

            <div className="modal-info-box">
              <div className="modal-info-label">Transaction ID (TxID)</div>
              <div className="modal-info-val">#{txId}</div>
            </div>

            {createHash && (
              <div className="modal-hash-box">
                <div className="modal-hash-label">Transaction Hash</div>
                <div className="modal-hash-val">{createHash}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
                Close
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose()
                }}
              >
                View Marketplace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
