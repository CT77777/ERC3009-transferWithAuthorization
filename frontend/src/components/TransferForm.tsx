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
    <div className="card transfer-form-card">
      <h2 className="card-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Transfer Authorization</h2>
      <p className="card-subtitle" style={{ color: '#64748b', marginBottom: '24px' }}>
        Sign an EIP-712 authorization to allow someone to transfer tokens on your behalf
      </p>

      <form onSubmit={handleSign}>
        <div className="form-group">
          <label className="form-label">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="form-input"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000000000000000001"
            className="form-input"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Validity Duration</label>
          <select
            value={validityDuration}
            onChange={(e) => setValidityDuration(e.target.value)}
            className="form-input"
            disabled={isLoading}
          >
            <option value="300">5 minutes</option>
            <option value="900">15 minutes</option>
            <option value="3600">1 hour</option>
            <option value="86400">24 hours</option>
            <option value="604800">7 days</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isLoading || !signer} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
          {isLoading ? (
            <>
              <span className="spinner"></span> Signing...
            </>
          ) : (
            'Sign Authorization'
          )}
        </button>
      </form>
    </div>
  );
};
