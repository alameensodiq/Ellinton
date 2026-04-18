// lib/signature.service.ts
import * as Crypto from 'expo-crypto';

const SECRET_KEY = 'ellingtonsignaturesecretkey';

// Simple HMAC-SHA256 implementation using only expo-crypto
const hmacSha256 = async (message: string, secret: string): Promise<string> => {
  let key = secret;
  if (key.length > 64) {
    key = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  }
  
  const paddedKey = key.padEnd(64, '\0');
  
  const innerKey = paddedKey.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x36)).join('');
  const outerKey = paddedKey.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x5c)).join('');
  
  const innerHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    innerKey + message
  );
  
  const outerHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    outerKey + innerHash
  );
  
  return outerHash;
};

export const generateSignature = async (
  method: string,
  path: string,
  body: unknown,
  nonce: string,
  timestamp: string,
  deviceId: string,
): Promise<{ signature: string }> => {
  // Calculate body hash (same as backend)
  const bodyHash = await hashBody(body);
  
  // Create payload string - MUST MATCH BACKEND EXACTLY
  // Backend: `${method.toUpperCase()}${path}${bodyHash}${nonce}${timestamp}${deviceId}`
  const payload = `${method.toUpperCase()}${path}${bodyHash}${nonce}${timestamp}${deviceId}`;
  
  // Generate signature
  const signature = await hmacSha256(payload, SECRET_KEY);

  console.log('🔐 Signature Debug:', {
    method: method.toUpperCase(),
    path,
    bodyHash: bodyHash.substring(0, 20) + '...',
    nonce: nonce.substring(0, 10) + '...',
    timestamp,
    deviceId: deviceId.substring(0, 10) + '...',
    payload: payload.substring(0, 100) + '...',
    signature: signature.substring(0, 30) + '...'
  });

  return { signature };
};

const hashBody = async (body: unknown): Promise<string> => {
  const payload = body === undefined || body === null ? '' : stableStringify(body);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );
  return hash;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return `{${entries
    .map(
      ([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`,
    )
    .join(',')}}`;
};

export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};