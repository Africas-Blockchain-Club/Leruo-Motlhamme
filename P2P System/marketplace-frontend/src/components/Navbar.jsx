import { useLocation } from 'react-router-dom'
import { shortAddr } from '../utils/format'

export default function Navbar({ wallet, onGoHome }) {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={onGoHome} title="Back to home">
        LM-<span>MARKET</span>
      </div>

      <div className="navbar-right">
        {pathname !== '/' && (
          <button className="navbar-back-btn" onClick={onGoHome}>
            ← Home
          </button>
        )}

        {wallet ? (
          <>
            <div className="navbar-pill">
              <div className="navbar-pill-dot" />
              Connected
            </div>
            <div className="navbar-addr" title={wallet.address}>
              {shortAddr(wallet.address)}
            </div>
          </>
        ) : (
          <div
            className="navbar-addr"
            style={{ color: 'var(--text-muted)', cursor: 'default' }}
          >
            Not connected
          </div>
        )}
      </div>
    </nav>
  )
}
