// lib/initEncryption.ts
import { encryptionClient } from "./encrption.client";

export const initializeEncryption = async () => {
  try {
    console.log("🔐 Initializing encryption client...");
    await encryptionClient.initialize();
    console.log("✅ Encryption initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize encryption:", error);
    throw error;
  }
};