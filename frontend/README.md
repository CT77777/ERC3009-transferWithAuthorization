# ERC-3009 Transfer Authorization Frontend

A React TypeScript application that demonstrates ERC-3009 (Transfer With Authorization) using EIP-712 signatures and MetaMask integration.

## Features

- 🦊 **MetaMask Integration**: Connect wallet and manage accounts
- ✍️ **EIP-712 Signing**: Sign structured data for transfer authorizations
- ⛽ **Gasless Transfers**: Allow relayers to execute transfers on behalf of users
- 📊 **Real-time Status**: Track authorization and transaction states
- 🔒 **Secure**: Nonce-based replay attack prevention

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Update the contract address and chain ID in \`src/App.tsx\`:

\`\`\`typescript
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const TARGET_CHAIN_ID = 31337; // Anvil local testnet
\`\`\`

## Running

\`\`\`bash
npm start
\`\`\`

Opens at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Connect MetaMask** - Click connect button
2. **Sign Authorization** - Fill form and sign with MetaMask
3. **Execute Transfer** - Submit the signed authorization on-chain

## Technologies

- React 18 + TypeScript
- ethers.js v6
- EIP-712 structured signing
- MetaMask integration
