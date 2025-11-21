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
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Signed Authorization</h3>
        <button onClick={onClear} style={styles.clearButton}>×</button>
      </div>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.label}>From:</span>
          <span style={styles.value}>{formatAddress(pendingAuthorization.message.from)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>To:</span>
          <span style={styles.value}>{formatAddress(pendingAuthorization.message.to)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Amount:</span>
          <span style={styles.value}>{formatValue(pendingAuthorization.message.value)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Valid After:</span>
          <span style={styles.value}>{formatTimestamp(pendingAuthorization.message.validAfter)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Valid Before:</span>
          <span style={styles.value}>{formatTimestamp(pendingAuthorization.message.validBefore)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Nonce:</span>
          <span style={styles.value}>{pendingAuthorization.message.nonce.slice(0, 10)}...</span>
        </div>
      </div>

      <div style={styles.signature}>
        <h4 style={styles.signatureTitle}>Signature Components</h4>
        <div style={styles.signatureData}>
          <div><strong>v:</strong> {pendingAuthorization.signature.v}</div>
          <div><strong>r:</strong> {pendingAuthorization.signature.r.slice(0, 20)}...</div>
          <div><strong>s:</strong> {pendingAuthorization.signature.s.slice(0, 20)}...</div>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={handleExecuteTransfer}
          disabled={isSubmitting}
          style={styles.executeButton}
        >
          Execute Transfer
        </button>
      )}

      {status === 'pending' && (
        <div style={styles.statusPending}>
          <div style={styles.spinner}></div>
          <span>Transaction pending...</span>
          {txHash && (
            <div style={styles.txHash}>
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <div style={styles.statusSuccess}>
          ✓ Transfer executed successfully!
          {txHash && (
            <div style={styles.txHash}>
              Tx: {formatAddress(txHash)}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div style={styles.statusError}>
          ✗ {error}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    margin: '20px auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0',
    width: '30px',
    height: '30px',
  },
  details: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  value: {
    color: '#333',
    fontFamily: 'monospace',
  },
  signature: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  },
  signatureTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#333',
  },
  signatureData: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#666',
    lineHeight: '1.6',
  },
  executeButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  statusPending: {
    padding: '16px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    textAlign: 'center' as const,
    color: '#856404',
  },
  statusSuccess: {
    padding: '16px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
    textAlign: 'center' as const,
    color: '#155724',
  },
  statusError: {
    padding: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '6px',
    textAlign: 'center' as const,
    color: '#721c24',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #856404',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '8px',
  },
  txHash: {
    marginTop: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
};
