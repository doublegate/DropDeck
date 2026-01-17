import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedData } from '@/types/platform';

/**
 * Encryption constants
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const VERSION = 1;

/**
 * Get the encryption key from environment
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
  }

  if (keyHex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a token string
 * Uses AES-256-GCM for authenticated encryption
 */
export function encryptToken(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM,
    version: VERSION,
  };
}

/**
 * Decrypt an encrypted token
 */
export function decryptToken(encryptedData: EncryptedData): string {
  if (encryptedData.version !== VERSION) {
    throw new Error(`Unsupported encryption version: ${encryptedData.version}`);
  }

  if (encryptedData.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Generate a new encryption key
 * Use this to generate a new key for TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Check if encryption key is configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
