import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  OVERDRAFT_APPLY_ENDPOINT,
  OVERDRAFT_ACCOUNT_ENDPOINT,
  OVERDRAFT_POSITION_ENDPOINT,
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

export const applyOverdraft = createAsyncThunk<any, any>(
  "overdraft/apply",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(OVERDRAFT_APPLY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload || {}),
      });

      const data = (await res.json()) as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || `Apply failed (${res.status})`
        );
      }

      if (!data.success) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || "Apply failed");
      }
      console.log(data.data);
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Apply overdraft error");
    }
  }
);

// ✅ Get overdraft account details
export const fetchOverdraftAccount = createAsyncThunk<any, void>(
  "overdraft/account",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(OVERDRAFT_ACCOUNT_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || `Fetch failed (${res.status})`
        );
      }

      if (!data.success) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || "Fetch failed"
        );
      }
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch overdraft error");
    }
  }
);

// ✅ Get overdraft position
export const fetchOverdraftPosition = createAsyncThunk<any, void>(
  "overdraft/position",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(OVERDRAFT_POSITION_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || `Fetch failed (${res.status})`
        );
      }

      if (!data.success) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || "Fetch position failed"
        );
      }
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch position error");
    }
  }
);