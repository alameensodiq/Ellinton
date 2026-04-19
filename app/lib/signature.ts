// lib/signature.service.ts
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';

const SECRET_KEY = 'ellingtonsignaturesecretkey';

// FIXED HMAC-SHA256 implementation - no buffer overflows
const hmacSha256 = async (message: string, secret: string): Promise<string> => {
  const blockSize = 64;
  const encoder = new TextEncoder();
  
  // Step 1: Hash key if longer than block size
  let key = secret;
  if (key.length > blockSize) {
    const keyHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key
    );
    key = keyHash;
  }
  
  // Step 2: Create padded key
  const keyBytes = new Uint8Array(blockSize);
  const keyStrBytes = encoder.encode(key);
  // SAFE: Only copy up to keyStrBytes length or blockSize, whichever is smaller
  const bytesToCopy = Math.min(keyStrBytes.length, blockSize);
  for (let i = 0; i < bytesToCopy; i++) {
    keyBytes[i] = keyStrBytes[i];
  }
  
  // Step 3: Create inner and outer padding
  const innerPadding = new Uint8Array(blockSize);
  const outerPadding = new Uint8Array(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    innerPadding[i] = keyBytes[i] ^ 0x36;
    outerPadding[i] = keyBytes[i] ^ 0x5c;
  }
  
  // Step 4: Hash inner layer (innerPadding + message)
  const messageBytes = encoder.encode(message);
  const innerData = new Uint8Array(innerPadding.length + messageBytes.length);
  // SAFE: Copy innerPadding
  for (let i = 0; i < innerPadding.length; i++) {
    innerData[i] = innerPadding[i];
  }
  // SAFE: Copy messageBytes
  for (let i = 0; i < messageBytes.length; i++) {
    innerData[innerPadding.length + i] = messageBytes[i];
  }
  
  const innerHashBuffer = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    innerData
  );
  const innerHash = new Uint8Array(innerHashBuffer);
  
  // Step 5: Hash outer layer (outerPadding + innerHash)
  const outerData = new Uint8Array(outerPadding.length + innerHash.length);
  // SAFE: Copy outerPadding
  for (let i = 0; i < outerPadding.length; i++) {
    outerData[i] = outerPadding[i];
  }
  // SAFE: Copy innerHash
  for (let i = 0; i < innerHash.length; i++) {
    outerData[outerPadding.length + i] = innerHash[i];
  }
  
  const outerHashBuffer = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    outerData
  );
  const outerHash = new Uint8Array(outerHashBuffer);
  
  // Convert to hex string
  return Array.from(outerHash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// EXACT MATCH of backend's stableStringify
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

// EXACT MATCH of backend's hashBody
const hashBody = async (body: unknown): Promise<string> => {
  const payload = body === undefined || body === null ? '' : stableStringify(body);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );
  return hash;
};

export const generateSignature = async (
  method: string,
  path: string,
  body: unknown,
  nonce: string,
  timestamp: string,
  deviceId: string,
): Promise<{ signature: string; bodyHash: string; payload: string }> => {
  const bodyHash = await hashBody(body);
  const payload = `${method.toUpperCase()}${path}${bodyHash}${nonce}${timestamp}${deviceId}`;
  const signature = await hmacSha256(payload, SECRET_KEY);

  console.log('===== BACKEND MATCHING SIGNATURE =====');
  console.log('Method:', method.toUpperCase());
  console.log('Path:', path);
  console.log('Body:', body);
  console.log('Body Hash:', bodyHash);
  console.log('Nonce:', nonce);
  console.log('Timestamp:', timestamp);
  console.log('Device ID:', deviceId);
  console.log('Payload:', payload);
  console.log('Signature:', signature);
  console.log('=======================================');

  return { signature, bodyHash, payload };
};

export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const deviceId = await Application.getAndroidId();
    return deviceId || 'unknown-device';
  } catch (error) {
    return 'fallback-device-id';
  }
};