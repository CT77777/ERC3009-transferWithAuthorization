import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletState {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = async () => {
    if (!window.ethereum) {
      setWalletState((prev) => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to use this app.',
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setWalletState({
        account: accounts[0],
        chainId: Number(network.chainId),
        provider,
        signer,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      account: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnecting: false,
      error: null,
    });
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        error: error.message || 'Failed to switch network',
      }));
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState((prev) => ({ ...prev, account: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
