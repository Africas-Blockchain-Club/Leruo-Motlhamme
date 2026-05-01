# P2P Escrow System

A decentralised peer-to-peer escrow platform that allows users to trade stablecoins (USDT/USDC) for fiat currency via off-chain bank transfers, with on-chain settlement handled by a smart contract.

## How It Works

1. A seller posts an advert stating they want to sell a stablecoin amount — for example, 200 USDT at R15 per dollar.
2. A buyer agrees to the trade and sends the fiat payment via a standard bank transfer (off-chain).
3. Once the transfer is done, the buyer signs on-chain to confirm the payment was sent.
4. The seller signs on-chain when they receive the bank notification.
5. Both signatures trigger the smart contract to release the stablecoins to the buyer.

No intermediary is needed — the escrow contract holds the funds and only releases them when both parties confirm.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity (UUPS upgradeable proxy pattern) |
| Backend | Node.js, Ethers.js |
| Frontend | React / Next.js, GSAP, Tailwind CSS |
| Deployment | Vercel (frontend), Railway (server) |

## Project Structure

```
contracts/
    P2P_Escrow.sol       # Core escrow smart contract

scripts/
    deploy.js            # Deployment script
    upgrade.js           # Upgrade script (UUPS pattern)

tests/
    Escrow.test.js       # Contract test suite

server/
    server.js            # Backend server (only if required)

frontend/                # All UI components and pages
```

**Live site:** [https://lm-marketplace.netlify.app/](https://lm-marketplace.netlify.app/)

A peer-to-peer stablecoin escrow marketplace built with React, Vite, ethers.js, and GSAP.
