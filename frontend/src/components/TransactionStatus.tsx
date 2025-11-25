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
      <div className="wallet-header" style={{ marginBottom: '16px', paddingBottom: '0', borderBottom: 'none' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Signed Authorization</h3>
        <button onClick={onClear} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '1.2rem' }}>×</button>
      </div>

      <div className="token-info-grid" style={{ marginBottom: '24px' }}>
        <div className="token-item">
          <span className="token-label">From</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{formatAddress(pendingAuthorization.message.from)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">To</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{formatAddress(pendingAuthorization.message.to)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Amount</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{formatValue(pendingAuthorization.message.value)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Valid After</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{formatTimestamp(pendingAuthorization.message.validAfter)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Valid Before</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{formatTimestamp(pendingAuthorization.message.validBefore)}</span>
        </div>
        <div className="token-item">
          <span className="token-label">Nonce</span>
          <span className="token-value" style={{ fontSize: '0.9rem' }}>{pendingAuthorization.message.nonce.slice(0, 10)}...</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: '0 0 8px 0', color: '#64748b' }}>Signature Components</h4>
        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', lineHeight: '1.6' }}>
          <div><strong>v:</strong> {pendingAuthorization.signature.v}</div>
          <div><strong>r:</strong> {pendingAuthorization.signature.r.slice(0, 20)}...</div>
          <div><strong>s:</strong> {pendingAuthorization.signature.s.slice(0, 20)}...</div>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleExecuteTransfer}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%', backgroundColor: '#22c55e' }}
        >
          Execute Transfer
        </button>
      )}

      {status === 'pending' && (
        <div style={{ padding: '16px', backgroundColor: '#fff7ed', borderRadius: '6px', textAlign: 'center', color: '#c2410c' }}>
          <span className="spinner" style={{ borderColor: '#c2410c', borderTopColor: 'transparent' }}></span>
          <span>Transaction pending...</span>
          {txHash && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '6px', textAlign: 'center', color: '#15803d' }}>
          ✓ Transfer executed successfully!
          {txHash && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="error-message" style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
};
