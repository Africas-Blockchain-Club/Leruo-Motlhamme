import { useEffect, useState } from 'react'
import { shortHash } from '../utils/format'

const ICONS = {
  success: '✅',
  error:   '❌',
  pending: '⏳',
  info:    'ℹ️',
}

const TITLES = {
  success: 'Transaction confirmed',
  error:   'Transaction failed',
  pending: 'Transaction pending',
  info:    'Notice',
}

// Auto-dismiss delays by type (ms). null = stays until manually closed.
const AUTO_DISMISS = {
  success: 6000,
  error:   null,
  pending: 12000,
  info:    6000,
}

function ToastItem({ toast, onDismiss }) {
  const [copied, setCopied] = useState(false)

  // Auto-dismiss
  useEffect(() => {
    const delay = AUTO_DISMISS[toast.type]
    if (delay == null) return
    const timer = setTimeout(() => onDismiss(toast.id), delay)
    return () => clearTimeout(timer)
  }, [toast.id, toast.type, onDismiss])

  const copyHash = () => {
    navigator.clipboard.writeText(toast.hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`toast ${toast.type}`}>
      <span className="toast-icon">{ICONS[toast.type] ?? 'ℹ️'}</span>
      <div className="toast-body">
        <div className="toast-title">{toast.title ?? TITLES[toast.type]}</div>
        {toast.message && <div className="toast-msg">{toast.message}</div>}
        {toast.hash && (
          <button
            className="toast-hash toast-hash-btn"
            title={`Click to copy: ${toast.hash}`}
            onClick={copyHash}
          >
            {copied ? '✅ Copied!' : `Tx: ${shortHash(toast.hash)}`}
          </button>
        )}
      </div>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>×</button>
    </div>
  )
}

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
