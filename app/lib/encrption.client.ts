// utils/encryption.client.ts
import * as CryptoJS from "crypto-js";
import * as SecureStore from "expo-secure-store";

class EncryptionClient {
  private static instance: EncryptionClient;
  private aesKey: CryptoJS.lib.WordArray | null = null;
  private isInitialized: boolean = false;
  private readonly ENCRYPTION_KEY_STORAGE = "encryption_secret_key";
  
  // FIXED ENCRYPTION KEY - MUST MATCH BACKEND
  private readonly FIXED_SECRET_KEY = "12345678909876543212345678909876";

  private constructor() {}

  static getInstance(): EncryptionClient {
    if (!EncryptionClient.instance) {
      EncryptionClient.instance = new EncryptionClient();
    }
    return EncryptionClient.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // USE THE FIXED KEY instead of generating or loading from storage
      const secretKey = this.FIXED_SECRET_KEY;
      
      console.log("\n🔑 ========== ENCRYPTION KEY LOADED ==========");
      console.log("  🔑 Full encryption key:", secretKey);
      console.log("  🔑 Key length:", secretKey.length, "chars (", secretKey.length, "bytes)");
      console.log("  🔑 Key must match backend exactly:", secretKey);
      console.log("🔑 ========== KEY SET ==========\n");

      this.aesKey = CryptoJS.enc.Utf8.parse(secretKey);
      this.isInitialized = true;
      console.log("✅ Encryption client initialized successfully with fixed key\n");
    } catch (error) {
      console.error("Failed to initialize encryption:", error);
      throw error;
    }
  }

  private generateRandomHex(bytes: number): string {
    const array = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async setEncryptionKey(secretKey: string): Promise<void> {
    console.log("\n🔑 ========== SETTING NEW ENCRYPTION KEY ==========");
    console.log("  🔑 New encryption key:", secretKey);
    console.log("  🔑 Key length:", secretKey.length, "chars (", secretKey.length, "bytes)");
    console.log("🔑 ========== KEY UPDATED ==========\n");
    
    await SecureStore.setItemAsync(this.ENCRYPTION_KEY_STORAGE, secretKey);
    this.aesKey = CryptoJS.enc.Utf8.parse(secretKey);
    this.isInitialized = true;
  }

  async encrypt(data: string, iv: string): Promise<string> {
    if (!this.isInitialized || !this.aesKey) {
      throw new Error("Encryption not initialized. Call initialize() first.");
    }

    console.log("\n🔐 ========== ENCRYPTION START ==========");
    console.log("  🔑 ENCRYPTION KEY:", this.FIXED_SECRET_KEY);
    console.log("  📝 Original data:", data.substring(0, 100) + (data.length > 100 ? "..." : ""));
    console.log("  🔑 IV used for encryption:", iv);
    console.log("  🔑 IV length:", iv.length, "chars (", iv.length / 2, "bytes)");
    
    const ivKey = CryptoJS.enc.Utf8.parse(iv);
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.aesKey, {
        iv: ivKey,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      console.log("  ✅ Encrypted result length:", encryptedHex.length, "chars");
      console.log("  ✅ Encrypted result (first 50 chars):", encryptedHex.substring(0, 50) + "...");
      console.log("🔐 ========== ENCRYPTION END ==========\n");
      
      return encryptedHex;
    } catch (error: any) {
      console.error("❌ Encryption failed:", error);
      throw new Error(error.message || "Failed to encrypt data");
    }
  }

  async decrypt(data: string, iv: string): Promise<any> {
    if (!this.isInitialized || !this.aesKey) {
      throw new Error("Encryption not initialized. Call initialize() first.");
    }

    console.log("\n🔓 ========== DECRYPTION START ==========");
    console.log("  🔑 DECRYPTION KEY:", this.FIXED_SECRET_KEY);
    console.log("  📦 Encrypted data length:", data.length, "chars");
    console.log("  📦 Encrypted data (first 50 chars):", data.substring(0, 50) + "...");
    console.log("  🔑 IV used for decryption:", iv);
    console.log("  🔑 IV length:", iv.length, "chars (", iv.length / 2, "bytes)");

    let plaintext: string;
    const ivKey = CryptoJS.enc.Utf8.parse(iv);

    try {
      const encryptedWordArray = CryptoJS.enc.Hex.parse(data);
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedWordArray
      });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, this.aesKey, {
        iv: ivKey,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      console.log("  ✅ Decrypted raw text:", plaintext.substring(0, 100) + (plaintext.length > 100 ? "..." : ""));
    } catch (error) {
      console.error("  ❌ Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }

    if (!plaintext) {
      console.error("  ❌ Decryption produced empty result");
      throw new Error("Failed to decrypt data: invalid ciphertext");
    }

    try {
      const parsed = JSON.parse(plaintext);
      console.log("  ✅ Parsed JSON result:", JSON.stringify(parsed, null, 2).substring(0, 200));
      console.log("🔓 ========== DECRYPTION END - SUCCESS ==========\n");
      return parsed;
    } catch (error) {
      console.log("  ⚠️ Not JSON, returning plaintext");
      console.log("🔓 ========== DECRYPTION END - Returning plaintext ==========\n");
      return plaintext;
    }
  }

  generateIV(): string {
    const iv = this.generateRandomHex(16);
    console.log("  🔑 Generated IV:", iv);
    return iv;
  }
}

export const encryptionClient = EncryptionClient.getInstance();