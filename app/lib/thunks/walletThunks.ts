import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  WALLET_BONUS_BALANCE_ENDPOINT,
  WALLET_WITHDRAW_ENDPOINT,
} from "../api";
import { encryptedFetch } from "../encryptedFetch";
import { encryptionClient } from "../encrption.client";
import { generateSignature, generateNonce } from "../signature";
import { getDeviceId } from "../utils";

const USE_ENCRYPTION = true;

const safeFetch = async (url: string, options: RequestInit = {}) => {
  const method = options.method?.toLowerCase() || "get";
  const headers = (options.headers as Record<string, string>) || {};
  const body = options.body ? JSON.parse(options.body as string) : undefined;
  
  const hasAuthToken = headers.Authorization && headers.Authorization.startsWith('Bearer ');
  
  let enhancedHeaders = { ...headers };
  
  if (hasAuthToken) {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const deviceId = await getDeviceId();
    
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Generate signature - only returns signature, no body_hash
    const { signature } = await generateSignature(
      method,
      path,
      body,
      nonce,
      timestamp,
      deviceId
    );
    
    // ONLY add these 3 headers as expected by backend
    enhancedHeaders = {
      ...headers,
      'x-request-timestamp': timestamp,
      'x-request-nonce': nonce,
      'x-signature': signature,
    };
    
    console.log("🔐 Adding signature headers for authenticated request:", {
      timestamp,
      nonce: nonce.substring(0, 10) + "...",
      hasSignature: !!signature
    });
  } else {
    console.log("🔓 No auth token, skipping signature headers");
  }
  
  if (USE_ENCRYPTION) {
    switch (method) {
      case "post":
        return await encryptedFetch.post(url, body, enhancedHeaders);
      case "put":
        return await encryptedFetch.put(url, body, enhancedHeaders);
      case "patch":
        return await encryptedFetch.patch(url, body, enhancedHeaders);
      case "delete":
        return await encryptedFetch.delete(url, enhancedHeaders);
      default:
        return await encryptedFetch.get(url, enhancedHeaders);
    }
  } else {
    return await fetch(url, {
      ...options,
      headers: enhancedHeaders,
    });
  }
};

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}

// Type for error responses that have message in data
interface ErrorResponse {
  data?: {
    message?: string;
  };
  message?: string;
}

export interface BonusWalletBalance {
  walletNumber: string;
  balance: number;
  currency: string;
}

export interface WalletWithdrawPayload {
  amount: number;
  reference: string;
}

export interface WalletWithdrawResponse {
  [key: string]: any;
}

export const fetchBonusWalletBalance = createAsyncThunk<
  BonusWalletBalance,
  void,
  { rejectValue: string }
>("wallet/fetchBonusBalance", async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await safeFetch(WALLET_BONUS_BALANCE_ENDPOINT, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as ApiResponse<BonusWalletBalance>;

    if (!res.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Failed to fetch wallet balance"
      );
    }

    return data.data;
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "Wallet balance fetch error"
    );
  }
});

export const withdrawBonusWallet = createAsyncThunk<
  WalletWithdrawResponse,
  WalletWithdrawPayload,
  { rejectValue: string }
>("wallet/withdraw", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;
    const idempotencyKey = `bonus-${payload.reference}`;

    const res = await safeFetch(WALLET_WITHDRAW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "idempotency-key": idempotencyKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<WalletWithdrawResponse>;

    if (!res.ok || !data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Wallet withdrawal failed"
      );
    }

    return data.data || {};
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "Wallet withdrawal error"
    );
  }
});