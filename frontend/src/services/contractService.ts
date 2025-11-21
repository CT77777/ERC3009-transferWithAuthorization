import { BrowserProvider, Contract, formatUnits } from 'ethers';
import { SignatureComponents } from './eip712Service';

// ERC3009 Contract ABI (only the functions we need)
const ERC3009_ABI = [
  // ERC20 Standard functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  
  // ERC3009 specific functions
  'function authorizationState(address authorizer, bytes32 nonce) view returns (bool)',
  'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)',
  
  // Events
  'event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface TransferAuthorizationParams {
  from: string;
  to: string;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: string;
  signature: SignatureComponents;
}

export class ContractService {
  private contract: Contract;
  private provider: BrowserProvider;

  constructor(contractAddress: string, provider: BrowserProvider) {
    this.provider = provider;
    this.contract = new Contract(contractAddress, ERC3009_ABI, provider);
  }

  /**
   * Get token information
   */
  async getTokenInfo(): Promise<TokenInfo> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals(),
        this.contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: formatUnits(totalSupply, decimals),
      };
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const decimals = await this.contract.decimals();
      const balance = await this.contract.balanceOf(address);
      return formatUnits(balance, decimals);
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Check if an authorization has been used
   */
  async isAuthorizationUsed(authorizer: string, nonce: string): Promise<boolean> {
    try {
      return await this.contract.authorizationState(authorizer, nonce);
    } catch (error: any) {
      throw new Error(`Failed to check authorization state: ${error.message}`);
    }
  }

  /**
   * Execute transferWithAuthorization
   */
  async executeTransferWithAuthorization(
    params: TransferAuthorizationParams
  ): Promise<{ hash: string; wait: () => Promise<any> }> {
    try {
      const signer = await this.provider.getSigner();
      const contractWithSigner = this.contract.connect(signer) as Contract;

      const txResponse = await contractWithSigner.transferWithAuthorization(
        params.from,
        params.to,
        params.value,
        params.validAfter,
        params.validBefore,
        params.nonce,
        params.signature.v,
        params.signature.r,
        params.signature.s
      );

      return {
        hash: txResponse.hash,
        wait: () => txResponse.wait(),
      };
    } catch (error: any) {
      // Parse common errors
      if (error.message.includes('authorization is not yet valid')) {
        throw new Error('Authorization is not yet valid');
      } else if (error.message.includes('authorization is expired')) {
        throw new Error('Authorization has expired');
      } else if (error.message.includes('authorization is used')) {
        throw new Error('Authorization has already been used');
      } else if (error.message.includes('invalid signature')) {
        throw new Error('Invalid signature');
      } else {
        throw new Error(`Transaction failed: ${error.message}`);
      }
    }
  }

  /**
   * Listen for AuthorizationUsed events
   */
  onAuthorizationUsed(
    callback: (authorizer: string, nonce: string) => void
  ): () => void {
    const filter = this.contract.filters.AuthorizationUsed();
    
    const listener = (authorizer: string, nonce: string) => {
      callback(authorizer, nonce);
    };

    this.contract.on(filter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(filter, listener);
    };
  }

  /**
   * Listen for Transfer events
   */
  onTransfer(
    callback: (from: string, to: string, value: bigint) => void
  ): () => void {
    const filter = this.contract.filters.Transfer();
    
    const listener = (from: string, to: string, value: bigint) => {
      callback(from, to, value);
    };

    this.contract.on(filter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(filter, listener);
    };
  }
}
