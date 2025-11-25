import { createHash, webcrypto } from 'crypto';

function ensureString(value: unknown, label: string): asserts value is string {
  if (value === null || value === undefined) {
    throw new Error(`${label} is required`);
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hashWithNode(data: string): string | null {
  if (typeof createHash !== 'function') {
    return null;
  }

  return createHash('sha256').update(data).digest('hex');
}

function hashWithWebCrypto(data: string): string | null {
  const subtle = webcrypto?.subtle ?? globalThis.crypto?.subtle;
  const digestSync = (subtle as { digestSync?: (algorithm: string, data: BufferSource) => ArrayBuffer } | undefined)?.digestSync;

  if (!digestSync) {
    return null;
  }

  const encoded = new TextEncoder().encode(data);
  const digest = digestSync('SHA-256', encoded);
  return bufferToHex(digest);
}

/**
 * Hash a user identifier with a salt using SHA-256.
 */
export function hashUserId(userId: string, salt: string): string {
  ensureString(userId, 'userId');
  ensureString(salt, 'salt');

  const payload = `${salt}:${userId}`;
  const nodeResult = hashWithNode(payload);
  if (nodeResult) {
    return nodeResult;
  }

  const webCryptoResult = hashWithWebCrypto(payload);
  if (webCryptoResult) {
    return webCryptoResult;
  }

  throw new Error('SHA-256 hashing is unavailable in this environment');
}