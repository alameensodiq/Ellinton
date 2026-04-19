// kycThunks.ts (Updated with encryption)
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  KYC_STATUS_ENDPOINT,
  KYC_NIN_VERIFY_ENDPOINT,
  KYC_NEXT_OF_KIN_ENDPOINT,
  KYC_SIGNATURE_ENDPOINT,
  KYC_SUMMARY_ENDPOINT,
  KYC_SUBMIT_ENDPOINT,
  KYC_UTILITY_BILL_ENDPOINT,
  KYC_TIER3_ENDPOINT,
  KYC_UTILITY_BILL_URL_ENDPOINT,
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
    
    // IMPORTANT: Extract ONLY the pathname, not the full URL
    const urlObj = new URL(url);
    const path = urlObj.pathname; // This should be like "/api/v1/virtual-cards"
    
    console.log("📡 Request details:", {
      fullUrl: url,
      path,
      method,
      hasBody: !!body,
      deviceId
    });
    
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
    
    console.log("🔐 Added signature headers:", {
      timestamp,
      noncePreview: nonce.substring(0, 10) + "...",
      signaturePreview: signature.substring(0, 20) + "...",
      deviceId
    });
  } else {
    console.log("🔓 No auth token, skipping signature");
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

interface VerifyNinPayload {
  nin: string;
}

export interface NextOfKinPayload {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: string;
  relationship: string;
  country_code: string;
  state: string;
  city: string;
  address_1: string;
  address_2: string;
}

interface SignaturePayload {
  signature: string;
}

interface UtilityBillPayload {
  utility_bill: string; // e.g., base64 encoded file
}

interface KycStatus {
  id: string;
  status: string;
  nin_verified: boolean;
  nin: string;
  next_of_kin?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gender: string;
    relationship: string;
  };
  has_signature: boolean;
  has_utility_bill: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface NinExtractedData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
}

interface VerifyNinResponse {
  nin_verified: boolean;
  extracted_data: NinExtractedData;
}

export interface KycSummary {
  message?: string;
  nin_details: {
    nin: string;
  };
  next_of_kin?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gender: string;
    relationship: string;
  };
  has_signature: boolean;
  [key: string]: any;
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

const getResponseErrorMessage = async (
  response: Response,
  fallback: string
) => {
  if (response.status === 413) {
    return "Uploaded image is too large. Please try a smaller image.";
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const errorData = await response.json().catch(() => null);
    return errorData?.data?.message || errorData?.message || fallback;
  }

  const errorText = await response.text().catch(() => "");
  return errorText?.trim() || fallback;
};

export const getKycStatus = createAsyncThunk(
  "kyc/getStatus",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as KycStatus;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `KYC status fetch failed (${response.status})`
        );
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "KYC status fetch error"
      );
    }
  }
);

export const verifyNin = createAsyncThunk(
  "kyc/verifyNin",
  async (payload: VerifyNinPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_NIN_VERIFY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nin: payload.nin }),
      });

      const data = await response.json() as ApiResponse<VerifyNinResponse>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `NIN verification failed (${response.status})`
        );
      }

      const innerData = data.data;
      if (!data.success || !innerData) {
        return rejectWithValue(
          data.message || "Invalid response: Missing verification data"
        );
      }

      console.log(innerData);
      return innerData;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "NIN verification error"
      );
    }
  }
);

export const submitNextOfKin = createAsyncThunk(
  "kyc/submitNextOfKin",
  async (payload: NextOfKinPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_NEXT_OF_KIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as ApiResponse<{ message?: string }>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Next of kin submission failed (${response.status})`
        );
      }

      return {
        message:
          data.data?.message ||
          data.message ||
          "Next of kin submitted successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Next of kin submission error"
      );
    }
  }
);

export const captureSignature = createAsyncThunk(
  "kyc/captureSignature",
  async (payload: SignaturePayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_SIGNATURE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: payload.signature }),
      });

      const data = await response.json() as ApiResponse<{ message?: string }>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Signature capture failed (${response.status})`
        );
      }

      return {
        message:
          data.data?.message ||
          data.message ||
          "Signature captured successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Signature capture error"
      );
    }
  }
);

export const getKycSummary = createAsyncThunk(
  "kyc/getSummary",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_SUMMARY_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as ApiResponse<KycSummary>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `KYC summary fetch failed (${response.status})`
        );
      }

      console.log(data);
      const innerData = data.data;
      if (!data.success || !innerData) {
        return rejectWithValue(
          data.message || "Invalid response: Missing summary data"
        );
      }
      return innerData;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "KYC summary fetch error"
      );
    }
  }
);

export const submitKyc = createAsyncThunk(
  "kyc/submitKyc",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_SUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as ApiResponse<{ message?: string }>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `KYC submission failed (${response.status})`
        );
      }

      return {
        message:
          data.data?.message || data.message || "KYC submitted successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "KYC submission error"
      );
    }
  }
);

export const uploadUtilityBill = createAsyncThunk(
  "kyc/uploadUtilityBill",
  async (payload: UtilityBillPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_UTILITY_BILL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ utility_bill: payload.utility_bill }),
      });

      const data = await response.json() as ApiResponse<{ message?: string }>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Utility bill upload failed (${response.status})`
        );
      }

      return {
        message:
          data.data?.message ||
          data.message ||
          "Utility bill uploaded successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Utility bill upload error"
      );
    }
  }
);

export const submitTier3 = createAsyncThunk(
  "kyc/submitTier3",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_TIER3_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as ApiResponse<{ message?: string }>;

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Tier 3 submission failed (${response.status})`
        );
      }

      return {
        message:
          data.data?.message ||
          data.message ||
          "Tier 3 verification completed successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Tier 3 submission error"
      );
    }
  }
);

export const getUtilityBillUrl = createAsyncThunk(
  "kyc/getUtilityBillUrl",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await safeFetch(KYC_UTILITY_BILL_URL_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Utility bill URL fetch failed (${response.status})`
        );
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Utility bill URL fetch error"
      );
    }
  }
);