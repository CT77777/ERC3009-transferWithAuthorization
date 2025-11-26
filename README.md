# ERC-3009 Transfer With Authorization

This repository contains an implementation of [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) (Transfer With Authorization) and a React frontend to demonstrate its functionality.

## Overview

ERC-3009 allows users to authorize token transfers via EIP-712 signatures. This enables "gasless" transactions where a user signs a message authorizing a transfer, and a third party (relayer) submits the transaction to the blockchain, paying the gas fees.

## Project Structure

- `src/`: Solidity smart contracts
  - `TransferAuthorizationToken.sol`: ERC-20 token implementing ERC-3009
  - `EIP712Domain.sol`: Helper for EIP-712 domain separator
  - `EIP712Library.sol`: Helper for EIP-712 signature verification
- `script/`: Foundry deployment scripts
- `test/`: Foundry tests
- `frontend/`: React + TypeScript application for interacting with the contract

## Smart Contracts

The contracts are built using [Foundry](https://book.getfoundry.sh/).

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Deploy

To deploy the contract to a network:

1. Copy `.env.example` to `.env` and fill in your variables:
   ```shell
   cp .env.example .env
   ```

2. Run the deployment script:
   ```shell
   source .env
   forge script script/TransferAuthorizationToken.s.sol:DeployTransferAuthorizationToken \
     --rpc-url $TESTNET_RPC_URL \
     --broadcast
   ```

## Frontend

The frontend is a React application that allows users to:
1. Connect their MetaMask wallet
2. View their token balance
3. Create and sign transfer authorizations (EIP-712)
4. Execute transfers using signed authorizations

### Setup

1. Navigate to the frontend directory:
   ```shell
   cd frontend
   ```

2. Install dependencies:
   ```shell
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and update with your contract address and chain ID.
   ```shell
   cp .env.example .env
   ```
   
   Example `.env`:
   ```
   REACT_APP_CONTRACT_ADDRESS=0x...
   REACT_APP_TARGET_CHAIN_ID=5042002
   ```

### Run

Start the development server:

```shell
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## License

MIT
