import { useState } from 'react'
import { TX_STATE } from '../config/contracts'
import ListingCard from './ListingCard'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const TABS = [
  { key: 'open',    label: 'Open',       states: [0] },
  { key: 'active',  label: 'In Progress', states: [1, 2, 3] },
  { key: 'all',     label: 'All',         states: [0,1,2,3] },
]

export default function Marketplace({
  listings,
  loading,
  wallet,
  contractAddr,
  zarRate,
  onRefresh,
  onCreateListing,
  addToast,
}) {
  const [tab, setTab] = useState('open')

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]

  const visible = listings.filter(
    (l) =>
      l.seller !== ZERO_ADDR &&
      activeTab.states.includes(l.state)
  )

  const openCount = listings.filter(
    (l) => l.seller !== ZERO_ADDR && l.state === 0
  ).length

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <div className="marketplace-title-row">
          <h1 className="marketplace-title">Marketplace</h1>
          <span className="marketplace-count">{openCount} open</span>
        </div>
        <div className="marketplace-actions">
          <button
            className="refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh listings"
          >
            {loading ? <div className="spinner" /> : '↻'} Refresh
          </button>
          {wallet && (
            <button className="btn btn-primary btn-sm" onClick={onCreateListing}>
              + Create Listing
            </button>
          )}
        </div>
      </div>

      <div className="marketplace-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`marketplace-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="marketplace-grid">
          <div className="marketplace-empty">
            <div className="marketplace-empty-icon">
              <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
            <div className="marketplace-empty-text" style={{ marginTop: 20 }}>
              Loading listings…
            </div>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="marketplace-grid">
          <div className="marketplace-empty">
            <div className="marketplace-empty-icon">📭</div>
            <div className="marketplace-empty-text">No listings found</div>
            <div className="marketplace-empty-sub">
              {tab === 'open'
                ? 'No open listings right now. Be the first to create one!'
                : 'No trades in this category.'}
            </div>
            {wallet && tab === 'open' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 20 }}
                onClick={onCreateListing}
              >
                + Create Listing
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="marketplace-grid">
          {visible.map((trade) => (
            <ListingCard
              key={trade.txId}
              trade={trade}
              wallet={wallet}
              contractAddr={contractAddr}
              zarRate={zarRate}
              onRefresh={onRefresh}
              addToast={addToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}
