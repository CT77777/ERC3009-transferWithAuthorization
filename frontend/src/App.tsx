import { useState, useEffect } from 'react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { TransferForm } from './components/TransferForm';
import { TransactionStatus } from './components/TransactionStatus';
import { ContractService } from './services/contractService';
import { TransferAuthorizationMessage, SignatureComponents } from './services/eip712Service';

// Configure your contract address here
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x3600000000000000000000000000000000000000'; // USDC
const TARGET_CHAIN_ID = parseInt(process.env.REACT_APP_TARGET_CHAIN_ID || '5042002'); // Arc testnet

interface PendingAuthorization {
  message: TransferAuthorizationMessage;
  signature: SignatureComponents;
}

function App() {
  const {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string; balance: string } | null>(null);
  const [pendingAuthorization, setPendingAuthorization] = useState<PendingAuthorization | null>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);

  // Load token info when wallet is connected
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!provider || !account) {
        setTokenInfo(null);
        return;
      }

      setIsLoadingTokenInfo(true);
      try {
        const contractService = new ContractService(CONTRACT_ADDRESS, provider);
        const info = await contractService.getTokenInfo();
        const balance = await contractService.getBalance(account);

        setTokenInfo({
          name: info.name,
          symbol: info.symbol,
          balance,
        });
      } catch (error) {
        console.error('Failed to load token info:', error);
      } finally {
        setIsLoadingTokenInfo(false);
      }
    };

    loadTokenInfo();
  }, [provider, account]);

  const handleSignatureGenerated = (message: TransferAuthorizationMessage, signature: SignatureComponents) => {
    setPendingAuthorization({ message, signature });
  };

  const handleClearAuthorization = () => {
    setPendingAuthorization(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">ERC-3009 Transfer</h1>
        <p className="app-subtitle">Gasless token transfers with EIP-712 signatures</p>
      </header>

      <div className="main-container">
        {/* Wallet Connection Section */}
        <div className="card wallet-section">
          {!account ? (
            <div className="wallet-connect-container">
              <p className="connect-text">Connect your wallet to get started</p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn btn-primary"
              >
                {isConnecting ? (
                  <>
                    <span className="spinner"></span> Connecting...
                  </>
                ) : (
                  'Connect MetaMask'
                )}
              </button>
              {walletError && <div className="error-message">{walletError}</div>}
            </div>
          ) : (
            <div className="wallet-info">
              <div className="wallet-header">
                <div>
                  <div className="wallet-label">Connected Account</div>
                  <div className="wallet-address">{formatAddress(account)}</div>
                </div>
                <button onClick={disconnectWallet} className="btn btn-secondary">
                  Disconnect
                </button>
              </div>

              {chainId !== TARGET_CHAIN_ID && (
                <div className="network-warning">
                  <span>⚠️ Wrong network. Please switch to Chain ID {TARGET_CHAIN_ID}</span>
                  <button
                    onClick={() => switchNetwork(TARGET_CHAIN_ID)}
                    className="btn btn-warning"
                  >
                    Switch Network
                  </button>
                </div>
              )}

              {tokenInfo && chainId === TARGET_CHAIN_ID && (
                <div className="token-info-grid">
                  <div className="token-item">
                    <span className="token-label">Token</span>
                    <span className="token-value">{tokenInfo.name} ({tokenInfo.symbol})</span>
                  </div>
                  <div className="token-item">
                    <span className="token-label">Balance</span>
                    <span className="token-value">{tokenInfo.balance} {tokenInfo.symbol}</span>
                  </div>
                </div>
              )}

              {isLoadingTokenInfo && (
                <div className="loading-text">
                  <span className="spinner"></span>
                  Loading token information...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Form */}
        {account && chainId === TARGET_CHAIN_ID && (
          <TransferForm
            signer={signer}
            contractAddress={CONTRACT_ADDRESS}
            chainId={chainId}
            account={account}
            onSignatureGenerated={handleSignatureGenerated}
          />
        )}

        {/* Transaction Status */}
        {pendingAuthorization && (
          <TransactionStatus
            provider={provider}
            contractAddress={CONTRACT_ADDRESS}
            pendingAuthorization={pendingAuthorization}
            onClear={handleClearAuthorization}
          />
        )}
      </div>

      <footer className="app-footer">
        <p>Built with React + ethers.js • ERC-3009 Standard</p>
        <p className="footer-contract">Contract: {formatAddress(CONTRACT_ADDRESS)}</p>
      </footer>
    </div>
  );
}

export default App;
