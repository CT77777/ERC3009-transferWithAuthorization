import React, { useState, useEffect } from 'react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { TransferForm } from './components/TransferForm';
import { TransactionStatus } from './components/TransactionStatus';
import { ContractService } from './services/contractService';
import { TransferAuthorizationMessage, SignatureComponents } from './services/eip712Service';

// Configure your contract address here
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Update with your deployed contract
const TARGET_CHAIN_ID = 31337; // Anvil local testnet

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
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.appTitle}>ERC-3009 Transfer Authorization</h1>
        <p style={styles.appSubtitle}>Gasless token transfers with EIP-712 signatures</p>
      </header>

      <div style={styles.container}>
        {/* Wallet Connection Section */}
        <div style={styles.walletSection}>
          {!account ? (
            <div style={styles.connectContainer}>
              <p style={styles.connectText}>Connect your wallet to get started</p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                style={styles.connectButton}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
              {walletError && <div style={styles.error}>{walletError}</div>}
            </div>
          ) : (
            <div style={styles.walletInfo}>
              <div style={styles.walletHeader}>
                <div>
                  <div style={styles.walletLabel}>Connected Account</div>
                  <div style={styles.walletAddress}>{formatAddress(account)}</div>
                </div>
                <button onClick={disconnectWallet} style={styles.disconnectButton}>
                  Disconnect
                </button>
              </div>

              {chainId !== TARGET_CHAIN_ID && (
                <div style={styles.wrongNetwork}>
                  ⚠️ Wrong network. Please switch to Chain ID {TARGET_CHAIN_ID}
                  <button
                    onClick={() => switchNetwork(TARGET_CHAIN_ID)}
                    style={styles.switchButton}
                  >
                    Switch Network
                  </button>
                </div>
              )}

              {tokenInfo && chainId === TARGET_CHAIN_ID && (
                <div style={styles.tokenInfo}>
                  <div style={styles.tokenRow}>
                    <span>Token:</span>
                    <span style={styles.tokenValue}>{tokenInfo.name} ({tokenInfo.symbol})</span>
                  </div>
                  <div style={styles.tokenRow}>
                    <span>Your Balance:</span>
                    <span style={styles.tokenValue}>{tokenInfo.balance} {tokenInfo.symbol}</span>
                  </div>
                </div>
              )}

              {isLoadingTokenInfo && (
                <div style={styles.loading}>Loading token information...</div>
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

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Built with React + ethers.js • ERC-3009 Standard
        </p>
        <p style={styles.footerSubtext}>
          Contract: {formatAddress(CONTRACT_ADDRESS)}
        </p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    backgroundColor: '#282c34',
    padding: '32px 20px',
    textAlign: 'center' as const,
    color: 'white',
  },
  appTitle: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  appSubtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#aaa',
  },
  container: {
    flex: 1,
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  walletSection: {
    marginBottom: '32px',
  },
  connectContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  connectText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '24px',
  },
  connectButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#f6851b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  walletInfo: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  walletHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  walletLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  walletAddress: {
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#333',
  },
  disconnectButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  wrongNetwork: {
    padding: '16px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    color: '#856404',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  tokenInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '16px',
  },
  tokenRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  tokenValue: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  loading: {
    padding: '16px',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '14px',
  },
  error: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    fontSize: '14px',
  },
  footer: {
    backgroundColor: '#282c34',
    padding: '24px',
    textAlign: 'center' as const,
    color: '#aaa',
  },
  footerText: {
    margin: '0 0 8px 0',
    fontSize: '14px',
  },
  footerSubtext: {
    margin: 0,
    fontSize: '12px',
    fontFamily: 'monospace',
  },
};

export default App;
