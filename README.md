# Leruo-Motlhamme
🏗️ A collection of the backend and blockchain solutions I've designed and deployed at ABC. 

## Vending Machine
As developers, we were tasked with understanding ABIs and building a simple Dapp. Through this task, I was able to understand that ABIs are a bridge that allows communication between the Dapp/frontend and the backend/smart contract. When the contract is compiled, a JSON is created and this, being the ABI, is used with the front end to build a Dapp.

## Sweepstake Lottery
A decentralized Ethereum reward pool and sweepstake system. Users can participate in a transparent, automated lottery governed by smart contracts.

### 🚀 Features
- **Automated Execution:** Uses Chainlink Automation (inferred from your file names) to trigger pool draws.
- **Secure:** Built with OpenZeppelin security standards.
- **Modern UI:** Responsive frontend built with Vite and React.

---

### 🗺️ Logic Diagram
```text
[ User Deposit ] -> [ Pool Grows ] -> [ Timer Hits Limit ]
                                             |
                                    [ Chainlink Automation Triggers ]
                                             |
                                    [ Chainlink VRF Picks Winner ]
                                             |
[ Next Round Starts ] <--- [ Rewards Distributed ]

## 🛠️ Local Development

To run the frontend locally:
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

To interact with the contracts:
1. Open the `contracts` folder in Remix or your preferred Solidity environment.
2. Deploy `SweepstakeLeruo.sol` to a testnet (like Sepolia).

## Running the Server
1. Move to the frontend folder
2. Run `npm run dev`

## 7-Ball Lottery 
