import { createAsyncThunk } from "@reduxjs/toolkit";
import { BENEFICIARIES_ENDPOINT } from "../api";
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

export interface Beneficiary {
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
}

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

export const fetchBeneficiaries = createAsyncThunk<
  { beneficiaries: Beneficiary[] },
  void
>("beneficiaries/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const response = await safeFetch(BENEFICIARIES_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json() as ApiResponse<Beneficiary[]>;

    if (!response.ok) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
          errorData?.message ||
          `Beneficiaries fetch failed (${response.status})`
      );
    }

    if (!data.data) {
      return rejectWithValue("Invalid response structure");
    }
    return { beneficiaries: data.data };
  } catch (error: any) {
    console.log("Fetch error:", error);
    return rejectWithValue(
      error.data?.message || error.message || "Beneficiaries fetch error"
    );
  }
});