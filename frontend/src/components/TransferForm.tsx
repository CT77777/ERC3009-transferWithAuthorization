import React, { useState } from 'react';
import { parseUnits } from 'ethers';
import { EIP712Service, TransferAuthorizationMessage, SignatureComponents } from '../services/eip712Service';
import { JsonRpcSigner } from 'ethers';

interface TransferFormProps {
  signer: JsonRpcSigner | null;
  contractAddress: string;
  chainId: number;
  account: string;
  onSignatureGenerated: (message: TransferAuthorizationMessage, signature: SignatureComponents) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  signer,
  contractAddress,
  chainId,
  account,
  onSignatureGenerated,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [validityDuration, setValidityDuration] = useState('3600'); // 1 hour default
  const [decimals] = useState(18); // Default ERC20 decimals
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer || !account) {
      setError('Wallet not connected');
      return;
    }

    if (!recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }

    // Validate recipient address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const eip712Service = new EIP712Service(contractAddress, chainId);
      
      // Convert amount to wei
      const valueInWei = parseUnits(amount, decimals);

      // Create message
      const message = eip712Service.createMessage(
        account,
        recipient,
        valueInWei,
        parseInt(validityDuration)
      );

      // Sign the message
      const { signature } = await eip712Service.signTransferAuthorization(signer, message);

      // Pass to parent component
      onSignatureGenerated(message, signature);

      // Reset form
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to sign authorization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Transfer Authorization</h2>
      <p style={styles.subtitle}>
        Sign an EIP-712 authorization to allow someone to transfer tokens on your behalf
      </p>

      <form onSubmit={handleSign} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000000000000000001"
            style={styles.input}
            disabled={isLoading}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Validity Duration (seconds)</label>
          <select
            value={validityDuration}
            onChange={(e) => setValidityDuration(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          >
            <option value="300">5 minutes</option>
            <option value="900">15 minutes</option>
            <option value="3600">1 hour</option>
            <option value="86400">24 hours</option>
            <option value="604800">7 days</option>
          </select>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={isLoading || !signer} style={styles.button}>
          {isLoading ? 'Signing...' : 'Sign Authorization'}
        </button>
      </form>
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
    margin: '0 auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '6px',
    fontSize: '14px',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
