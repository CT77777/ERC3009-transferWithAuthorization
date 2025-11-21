import { JsonRpcSigner, ethers, Signature } from 'ethers';

// EIP-712 Domain
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

// TransferWithAuthorization message
export interface TransferAuthorizationMessage {
  from: string;
  to: string;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: string;
}

// Signature components
export interface SignatureComponents {
  v: number;
  r: string;
  s: string;
}

// EIP-712 Type definitions
const EIP712_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};

export class EIP712Service {
  private domain: EIP712Domain;

  constructor(
    contractAddress: string,
    chainId: number,
    name: string = 'TransferAuthorizationToken',
    version: string = '1'
  ) {
    this.domain = {
      name,
      version,
      chainId,
      verifyingContract: contractAddress,
    };
  }

  /**
   * Generate a random nonce for the authorization
   */
  generateNonce(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Create transfer authorization message
   */
  createMessage(
    from: string,
    to: string,
    value: bigint,
    validityDurationSeconds: number = 3600
  ): TransferAuthorizationMessage {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    
    return {
      from,
      to,
      value,
      validAfter: currentTime,
      validBefore: currentTime + BigInt(validityDurationSeconds),
      nonce: this.generateNonce(),
    };
  }

  /**
   * Sign the transfer authorization using EIP-712
   */
  async signTransferAuthorization(
    signer: JsonRpcSigner,
    message: TransferAuthorizationMessage
  ): Promise<{ signature: SignatureComponents; message: TransferAuthorizationMessage }> {
    try {
      // Sign typed data
      const signature = await signer.signTypedData(
        this.domain,
        EIP712_TYPES,
        message
      );

      // Split signature into v, r, s components
      const sig = Signature.from(signature);

      console.log('v', sig.v);
      console.log('r', sig.r);
      console.log('s', sig.s);

      return {
        signature: {
          v: sig.v,
          r: sig.r,
          s: sig.s,
        },
        message,
      };
    } catch (error: any) {
      throw new Error(`Failed to sign authorization: ${error.message}`);
    }
  }

  /**
   * Get the domain separator (for debugging)
   */
  getDomain(): EIP712Domain {
    return this.domain;
  }

  /**
   * Update contract address (e.g., when switching networks)
   */
  updateContractAddress(contractAddress: string, chainId: number) {
    this.domain = {
      ...this.domain,
      verifyingContract: contractAddress,
      chainId,
    };
  }
}
