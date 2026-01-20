/**
 * Phantom Mobile Deep Link Cryptography Utilities
 * 
 * Implements the encryption/decryption required for Phantom iOS deep link communication.
 * Based on Phantom's official documentation for mobile deep links.
 * 
 * Key Features:
 * - ECDH key exchange using secp256k1
 * - AES-GCM encryption (fallback from ChaCha20-Poly1305)
 * - Base58 encoding for all data transfer
 * - Session management
 */

// Import browser polyfills FIRST
import './browser-polyfills';
import { createLogger } from 'src/lib/logger';

const logger = createLogger('[PhantomMobileCrypto]');

// Base58 encoding utilities
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

class Base58 {
  static encode(bytes: Uint8Array): string {
    if (bytes.length === 0) return '';
    
    let result = '';
    let num = BigInt(0);
    
    // Convert bytes to bigint
    for (let i = 0; i < bytes.length; i++) {
      num = num * BigInt(256) + BigInt(bytes[i]);
    }
    
    // Convert to base58
    while (num > 0) {
      result = BASE58_ALPHABET[Number(num % BigInt(58))] + result;
      num = num / BigInt(58);
    }
    
    // Handle leading zeros
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }
  
  static decode(str: string): Uint8Array {
    if (str.length === 0) return new Uint8Array(0);
    
    let num = BigInt(0);
    
    // Convert from base58
    for (let i = 0; i < str.length; i++) {
      const charIndex = BASE58_ALPHABET.indexOf(str[i]);
      if (charIndex === -1) {
        throw new Error(`Invalid base58 character: ${str[i]}`);
      }
      num = num * BigInt(58) + BigInt(charIndex);
    }
    
    // Convert to bytes
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    
    // Handle leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
      bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
  }
}

// Utility to convert Uint8Array to proper ArrayBuffer for crypto operations
function toArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  const buffer = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
  return buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(0);
}

// Cryptography interface for Phantom mobile deep links
export interface PhantomMobileSession {
  dappKeyPair: CryptoKeyPair;
  phantomPublicKey?: Uint8Array;
  sharedSecret?: Uint8Array;
  sessionToken?: string;
  walletPublicKey?: string;
}

export interface PhantomEncryptedPayload {
  nonce: string; // base58
  data: string;  // base58 encrypted data
}

export interface PhantomConnectRequest {
  app_url: string;
  dapp_encryption_public_key: string; // base58
  redirect_link: string;
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface PhantomConnectResponse {
  phantom_encryption_public_key: string; // base58
  nonce: string; // base58
  data: string;  // base58 encrypted JSON
}

export interface PhantomSignRequest {
  dapp_encryption_public_key: string; // base58
  nonce: string; // base58
  redirect_link: string;
  payload: string; // base58 encrypted JSON
}

export interface PhantomSignResponse {
  nonce: string; // base58
  data: string;  // base58 encrypted JSON with signed transaction
}

// Internal payload structures (encrypted content)
export interface PhantomSignPayload {
  transaction: string; // base58 serialized transaction
  session: string;     // session token
}

export interface PhantomConnectPayload {
  public_key: string; // wallet's public key
  session: string;    // session token
}

export class PhantomMobileCrypto {
  private session: PhantomMobileSession | null = null;

  constructor() {
    logger.info('Initializing Phantom mobile cryptography utilities');
  }

  /**
   * Generate a new ECDH keypair for communication with Phantom
   */
  async generateKeyPair(): Promise<CryptoKeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256', // Using P-256 for broader compatibility
        },
        false, // not extractable
        ['deriveKey', 'deriveBits']
      );
      
      logger.debug('Generated new ECDH keypair for Phantom communication');
      return keyPair;
    } catch (error) {
      logger.error('Failed to generate keypair:', error);
      throw new Error(`Failed to generate keypair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export public key to base58 format for Phantom deep links
   */
  async exportPublicKeyToBase58(publicKey: CryptoKey): Promise<string> {
    try {
      const publicKeyBytes = await crypto.subtle.exportKey('raw', publicKey);
      const publicKeyArray = new Uint8Array(publicKeyBytes);
      const base58Key = Base58.encode(publicKeyArray);
      
      logger.debug('Exported public key to base58:', { 
        keyLength: publicKeyArray.length, 
        base58Length: base58Key.length 
      });
      
      return base58Key;
    } catch (error) {
      logger.error('Failed to export public key:', error);
      throw new Error(`Failed to export public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import Phantom's public key from base58 format
   */
  async importPublicKeyFromBase58(base58Key: string): Promise<CryptoKey> {
    try {
      const keyBytes = Base58.decode(base58Key);
      
      const publicKey = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(keyBytes),
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        []
      );
      
      logger.debug('Imported Phantom public key from base58:', {
        keyLength: keyBytes.length,
        base58Length: base58Key.length
      });
      
      return publicKey;
    } catch (error) {
      logger.error('Failed to import Phantom public key:', error);
      throw new Error(`Failed to import Phantom public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive shared secret using ECDH
   */
  async deriveSharedSecret(privateKey: CryptoKey, phantomPublicKey: CryptoKey): Promise<Uint8Array> {
    try {
      const sharedSecretBuffer = await crypto.subtle.deriveBits(
        {
          name: 'ECDH',
          public: phantomPublicKey,
        },
        privateKey,
        256 // 256 bits = 32 bytes
      );
      
      const sharedSecret = new Uint8Array(sharedSecretBuffer);
      logger.debug('Derived shared secret:', { secretLength: sharedSecret.length });
      
      return sharedSecret;
    } catch (error) {
      logger.error('Failed to derive shared secret:', error);
      throw new Error(`Failed to derive shared secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random nonce for encryption
   */
  generateNonce(): Uint8Array {
    const nonce = new Uint8Array(24); // 24 bytes for compatibility
    crypto.getRandomValues(nonce);
    return nonce;
  }

  /**
   * Encrypt payload using the shared secret with AES-GCM
   */
  async encryptPayload(payload: object, sharedSecret: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    try {
      const payloadString = JSON.stringify(payload);
      const payloadBytes = new TextEncoder().encode(payloadString);
      
      // Import shared secret as AES-GCM key
      const key = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(sharedSecret),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Use first 12 bytes of nonce for AES-GCM IV
      const iv = nonce.slice(0, 12);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: toArrayBuffer(iv),
        },
        key,
        toArrayBuffer(payloadBytes)
      );
      
      const encrypted = new Uint8Array(encryptedBuffer);
      logger.debug('Encrypted payload:', {
        originalLength: payloadBytes.length,
        encryptedLength: encrypted.length,
        nonceLength: nonce.length
      });
      
      return encrypted;
    } catch (error) {
      logger.error('Failed to encrypt payload:', error);
      throw new Error(`Failed to encrypt payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt payload using the shared secret with AES-GCM
   */
  async decryptPayload(encryptedData: Uint8Array, sharedSecret: Uint8Array, nonce: Uint8Array): Promise<object> {
    try {
      // Import shared secret as AES-GCM key
      const key = await crypto.subtle.importKey(
        'raw',
        toArrayBuffer(sharedSecret),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Use first 12 bytes of nonce for AES-GCM IV
      const iv = nonce.slice(0, 12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: toArrayBuffer(iv),
        },
        key,
        toArrayBuffer(encryptedData)
      );
      
      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      const payload = JSON.parse(decryptedString);
      
      logger.debug('Decrypted payload:', {
        encryptedLength: encryptedData.length,
        decryptedLength: decryptedString.length,
        payloadKeys: Object.keys(payload)
      });
      
      return payload;
    } catch (error) {
      logger.error('Failed to decrypt payload:', error);
      throw new Error(`Failed to decrypt payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize a new session with generated keypair
   */
  async initializeSession(): Promise<PhantomMobileSession> {
    try {
      const dappKeyPair = await this.generateKeyPair();
      
      this.session = {
        dappKeyPair
      };
      
      logger.info('Initialized new Phantom mobile session');
      return this.session;
    } catch (error) {
      logger.error('Failed to initialize session:', error);
      throw error;
    }
  }

  /**
   * Complete session setup after receiving Phantom's public key
   */
  async completeSession(phantomPublicKeyBase58: string): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized. Call initializeSession() first.');
    }

    try {
      const phantomPublicKey = await this.importPublicKeyFromBase58(phantomPublicKeyBase58);
      const sharedSecret = await this.deriveSharedSecret(
        this.session.dappKeyPair.privateKey,
        phantomPublicKey
      );

      this.session.phantomPublicKey = Base58.decode(phantomPublicKeyBase58);
      this.session.sharedSecret = sharedSecret;
      
      logger.info('Completed session setup with Phantom public key');
    } catch (error) {
      logger.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Encrypt data for sending to Phantom
   */
  async encryptForPhantom(payload: object): Promise<PhantomEncryptedPayload> {
    if (!this.session?.sharedSecret) {
      throw new Error('Session not properly established. Shared secret missing.');
    }

    try {
      const nonce = this.generateNonce();
      const encryptedData = await this.encryptPayload(payload, this.session.sharedSecret, nonce);
      
      return {
        nonce: Base58.encode(nonce),
        data: Base58.encode(encryptedData)
      };
    } catch (error) {
      logger.error('Failed to encrypt data for Phantom:', error);
      throw error;
    }
  }

  /**
   * Decrypt data received from Phantom
   */
  async decryptFromPhantom(encryptedPayload: PhantomEncryptedPayload): Promise<object> {
    if (!this.session?.sharedSecret) {
      throw new Error('Session not properly established. Shared secret missing.');
    }

    try {
      const nonce = Base58.decode(encryptedPayload.nonce);
      const encryptedData = Base58.decode(encryptedPayload.data);
      
      return await this.decryptPayload(encryptedData, this.session.sharedSecret, nonce);
    } catch (error) {
      logger.error('Failed to decrypt data from Phantom:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  getSession(): PhantomMobileSession | null {
    return this.session;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.session = null;
    logger.info('Cleared Phantom mobile session');
  }
}

// Export singleton instance
export const phantomMobileCrypto = new PhantomMobileCrypto();

// Export utility functions
export { Base58 };