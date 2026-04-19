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
    
    // IMPORTANT: Extract ONLY the pathname, not the full URL
    const urlObj = new URL(url);
    const path = urlObj.pathname; // This should be like "/api/v1/virtual-cards"
    
    // console.log("📡 Request details:", {
    //   fullUrl: url,
    //   path,
    //   method,
    //   hasBody: !!body,
    //   deviceId
    // });
    
    // Generate signature
    const { signature } = await generateSignature(
      method,
      path,
      body,
      nonce,
      timestamp,
      deviceId
    );
    
    // CRITICAL FIX: Add x-device-id header
    enhancedHeaders = {
      ...headers,
      'x-request-timestamp': timestamp,
      'x-request-nonce': nonce,
      'x-signature': signature,
      'x-device-id': deviceId,  // ← THIS WAS MISSING - ADD THIS LINE
    };
    
    // console.log("🔐 Added signature headers:", {
    //   timestamp,
    //   noncePreview: nonce.substring(0, 10) + "...",
    //   signaturePreview: signature.substring(0, 20) + "...",
    //   deviceId
    // });
  } else {
    // console.log("🔓 No auth token, skipping signature");
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