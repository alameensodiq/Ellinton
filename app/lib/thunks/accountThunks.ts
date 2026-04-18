import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  ACCOUNT_INFO_ENDPOINT,
  ACCOUNT_VALIDATE_NIP_ENDPOINT,
  ACCOUNT_VALIDATE_ELLINGLON_ENDPOINT,
  BANKS_ENDPOINT,
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

interface ValidateAccountPayload {
  accountNumber: string;
  bankCode?: string;
}

interface AccountValidation {
  accountName: string;
  accountNumber: string;
}

export interface AccountInfo {
  accountName: string;
  accountNumber: string;
  accountBalance: number;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  suffices: string | null;
  is_blacklisted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
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

export const validateEllingtonAccount = createAsyncThunk<
  AccountValidation,
  ValidateAccountPayload
>(
  "accounts/validateEllington",
  async (payload: ValidateAccountPayload, { rejectWithValue, getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    try {
      const response = await safeFetch(ACCOUNT_VALIDATE_ELLINGLON_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({ accountNumber: payload.accountNumber }),
      });

      const data = await response.json() as ApiResponse<AccountValidation>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Validation failed (${response.status})`
        );
      }

      console.log(data);
      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Account validation failed");
      }
      console.log(data);
      return data.data as AccountValidation;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.data?.message || error.message || "Validation error"
      );
    }
  }
);

export const validateNipAccount = createAsyncThunk<
  AccountValidation,
  ValidateAccountPayload
>(
  "accounts/validateNip",
  async (payload: ValidateAccountPayload, { rejectWithValue, getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    try {
      if (!payload.bankCode) {
        return rejectWithValue("Bank code is required for NIP validation");
      }
      const response = await safeFetch(ACCOUNT_VALIDATE_NIP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: payload.accountNumber,
          bankCode: payload.bankCode,
        }),
      });

      const data = await response.json() as ApiResponse<AccountValidation>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Validation failed (${response.status})`
        );
      }

      console.log(data);
      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Account validation failed");
      }
      return data.data as AccountValidation;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.data?.message || error.message || "Validation error"
      );
    }
  }
);

export const fetchAccountInfo = createAsyncThunk<
  { accountInfo: AccountInfo },
  void
>("accounts/fetchInfo", async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const response = await safeFetch(ACCOUNT_INFO_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json() as ApiResponse<AccountInfo>;

    if (!response.ok) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
          errorData?.message ||
          `Account info fetch failed (${response.status})`
      );
    }

    if (!data.data) {
      return rejectWithValue("Invalid response structure");
    }
    return { accountInfo: data.data };
  } catch (error: any) {
    console.log("Fetch error:", error);
    return rejectWithValue(
      error.data?.message || error.message || "Account info fetch error"
    );
  }
});

export const fetchBanks = createAsyncThunk<{ banks: Bank[] }, void>(
  "accounts/fetchBanks",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(BANKS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as ApiResponse<Bank[]>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Banks fetch failed (${response.status})`
        );
      }

      if (!data.data) {
        return rejectWithValue("Invalid response structure");
      }
      return { banks: data.data };
    } catch (error: any) {
      console.log("Fetch banks error:", error);
      return rejectWithValue(
        error.data?.message || error.message || "Banks fetch error"
      );
    }
  }
);