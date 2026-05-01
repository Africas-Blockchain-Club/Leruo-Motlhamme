export const MARKETPLACE_ADDRESS =
  import.meta.env.VITE_MARKETPLACE_ADDRESS ||
  localStorage.getItem('lm_contract_addr') ||
  ''

export const MARKETPLACE_ABI = [
  'function nextID() view returns (uint256)',
  'function arbiter() view returns (address)',
  'function owner() view returns (address)',
  'function usdc() view returns (address)',
  'function CurrentTrades(uint256) view returns (uint256 txId, address seller, address buyer, uint256 amountOfSBC, uint8 state)',
  'function createListing(uint256 _amountOfSBC)',
  'function acceptListing(uint256 _txId)',
  'function setAsPaid(uint256 _txId)',
  'function confirmReceipt(uint256 _txId)',
  'function cancelListing(uint256 _TxID)',
  'function openDispute(uint256 _txId)',
  'function resolveDispute(uint256 _txId, bool refundSeller)',
  'event OpenedListing(address indexed seller, uint256 amountOfSBC, uint256 TxID)',
  'event BuyerAccepted(address indexed buyer)',
  'event BuyerPaid(address indexed buyer)',
  'event ListingCompleted(address indexed seller, address indexed buyer, uint256 amountOfUSDC)',
  'event DisputeOpened(address indexed party)',
  'event Resolved(address indexed arb, bool refundSeller)',
  'event Refunded(address indexed seller, uint256 amount)',
]

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

export const TX_STATE = [
  { label: 'Open',                 color: '#10B981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)'  },
  { label: 'Accepted',             color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)'  },
  { label: 'Awaiting Confirmation',color: '#818CF8', bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.2)'  },
  { label: 'Disputed',             color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)'   },
  { label: 'Completed',            color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
  { label: 'Cancelled',            color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)' },
]
