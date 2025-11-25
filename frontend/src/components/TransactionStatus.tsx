import React, { useState, useEffect } from 'react';
import { ContractService, TransferAuthorizationParams } from '../services/contractService';
import { TransferAuthorizationMessage, SignatureComponents } from '../services/eip712Service';
import { BrowserProvider } from 'ethers';

interface TransactionStatusProps {
  provider: BrowserProvider | null;
  contractAddress: string;
  pendingAuthorization: {
    message: TransferAuthorizationMessage;
    signature: SignatureComponents;
  } | null;
  onClear: () => void;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  provider,
  contractAddress,
  pendingAuthorization,
  onClear,
}) => {
  const [status, setStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pendingAuthorization) {
      setStatus('idle');
      setTxHash(null);
      setError(null);
    }
  }, [pendingAuthorization]);

  const handleExecuteTransfer = async () => {
    if (!provider || !pendingAuthorization) return;

    setIsSubmitting(true);
    setStatus('pending');
    setError(null);

    try {
      const contractService = new ContractService(contractAddress, provider);

      const params: TransferAuthorizationParams = {
        from: pendingAuthorization.message.from,
        to: pendingAuthorization.message.to,
        value: pendingAuthorization.message.value,
        validAfter: pendingAuthorization.message.validAfter,
        validBefore: pendingAuthorization.message.validBefore,
        nonce: pendingAuthorization.message.nonce,
        signature: pendingAuthorization.signature,
      };

      const { hash, wait } = await contractService.executeTransferWithAuthorization(params);
      setTxHash(hash);

      // Wait for confirmation
      const txReceipt = await wait();
      if (txReceipt.status !== 1) {
        setStatus('error');
      }
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Transaction submission failed');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: bigint) => {
    // Simple formatting - divide by 10^18 for standard ERC20
    const valueStr = value.toString();
    const decimals = 18;

    if (valueStr.length <= decimals) {
      return `0.${valueStr.padStart(decimals, '0')}`.replace(/\.?0+$/, '');
    }

    const intPart = valueStr.slice(0, -decimals);
    const decPart = valueStr.slice(-decimals);
    return `${intPart}.${decPart.slice(0, 6)}`.replace(/\.?0+$/, '');
  };

  if (!pendingAuthorization) {
    return null;
  }

  return (
    <div className="card transaction-status-card">
      <div className="wallet-header">
        <h3 className="card-title">Signed Authorization</h3>
        <button onClick={onClear} className="btn btn-secondary close-btn">×</button>
      </div>

      <div className="token-info-grid">
        <div className="token-item">
          <span className="token-label">From</span>
          <span className="token-value small-text">{formatAddress(pendingAuthorization.message.from)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">To</span>
          <span className="token-value small-text">{formatAddress(pendingAuthorization.message.to)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Amount</span>
          <span className="token-value small-text">{formatValue(pendingAuthorization.message.value)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Valid After</span>
          <span className="token-value small-text">{formatTimestamp(pendingAuthorization.message.validAfter)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Valid Before</span>
          <span className="token-value small-text">{formatTimestamp(pendingAuthorization.message.validBefore)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Nonce</span>
          <span className="token-value small-text">{pendingAuthorization.message.nonce.slice(0, 10)}...</span>
        </div>
      </div>

      <div className="signature-section">
        <h4 className="signature-title">Signature Components</h4>
        <div className="signature-data">
          <div><strong>v:</strong> {pendingAuthorization.signature.v}</div>
          <div><strong>r:</strong> {pendingAuthorization.signature.r.slice(0, 20)}...</div>
          <div><strong>s:</strong> {pendingAuthorization.signature.s.slice(0, 20)}...</div>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleExecuteTransfer}
          disabled={isSubmitting}
          className="btn btn-primary full-width"
        >
          Execute Transfer
        </button>
      )}

      {status === 'pending' && (
        <div className="status-message status-pending">
          <span className="spinner"></span>
          <span>Transaction pending...</span>
          {txHash && (
            <div className="tx-hash">
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="status-message status-success">
          ✓ Transfer executed successfully!
          {txHash && (
            <div className="tx-hash">
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          ✗ {error}
        </div>
      )}
    </div>
  );
};
