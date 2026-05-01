import { formatUnits } from 'ethers'

export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

export const shortHash = (hash) =>
  hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : ''

export const formatUSDC = (raw) => {
  if (!raw) return '0.00'
  const num = parseFloat(formatUnits(BigInt(raw.toString()), 6))
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const formatZAR = (usdcRaw, rate) => {
  if (!usdcRaw || !rate) return 'R 0.00'
  const usdc = parseFloat(formatUnits(BigInt(usdcRaw.toString()), 6))
  const zar = usdc * rate
  return `R ${zar.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const parseTrade = (result) => ({
  txId: result.txId.toString(),
  seller: result.seller,
  buyer: result.buyer,
  amountOfSBC: result.amountOfSBC.toString(),
  state: Number(result.state),
})
