import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  BILLS_DATA_OPTIONS_ENDPOINT,
  BILLS_VALIDATE_CUSTOMER_ENDPOINT,
  BILLS_PAY_ENDPOINT,
  BILLS_PROVIDERS_ENDPOINT,
  BILLS_PACKAGES_ENDPOINT,
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

export interface BillerOption {
  id: number;
  name: string;
  slug: string;
  amount: number;
  billerId: number;
  hasPending: boolean;
  sequenceNumber: number;
}

export interface BillerProvider {
  id: number;
  name: string;
  slug: string;
  groupId: number;
  skipValidation: boolean;
  handleWithProductCode: boolean;
  isRestricted: boolean;
  hideInstitution: boolean;
  sendSms: boolean;
}

export interface Package {
  id: number;
  name: string;
  slug: string;
  amount: number;
  billerId: number;
  hasPending: boolean;
  sequenceNumber: number;
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

export interface BillerOptionsPayload {
  type: string;
  provider: string;
}

export interface ValidateCustomerPayload {
  customerId: string;
  productName: string;
  billerSlug: string;
}

export interface PayBillPayload {
  type: string;
  provider: string;
  amount: number;
  bundleSlug: string;
  customerId: string;
  transactionPin: string;
}

export interface GetProvidersPayload {
  type: string;
}

export interface GetPackagesPayload {
  slug: string;
}

export const fetchBillerOptions = createAsyncThunk<
  BillerOption[],
  BillerOptionsPayload
>("bills/fetchOptions", async (payload, { rejectWithValue, getState }) => {
  const state = getState() as any;
  const token = state.auth.token;

  try {
    const response = await safeFetch(BILLS_DATA_OPTIONS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<BillerOption[]> = await response.json();
    if (!response.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(errorData?.data?.message || data.message || "Failed");
    }
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Network error");
  }
});

export const validateBillCustomer = createAsyncThunk<
  any,
  ValidateCustomerPayload
>("bills/validateCustomer", async (payload, { rejectWithValue, getState }) => {
  const state = getState() as any;
  const token = state.auth.token;

  try {
    const response = await safeFetch(BILLS_VALIDATE_CUSTOMER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<any> = await response.json();
    console.log(data);
    if (!response.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(errorData?.data?.message || data.message || "Failed");
    }
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Network error");
  }
});

export const payBill = createAsyncThunk<any, PayBillPayload>(
  "bills/payBill",
  async (payload, { rejectWithValue, getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    try {
      const response = await safeFetch(BILLS_PAY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<any> = await response.json();
      console.log(data);
      if (!response.ok || !data.success || !data.data) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data.message || "Failed");
      }
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

export const getBillerProviders = createAsyncThunk<
  BillerProvider[],
  GetProvidersPayload
>("bills/getProviders", async (payload, { rejectWithValue, getState }) => {
  const state = getState() as any;
  const token = state.auth.token;

  try {
    const response = await safeFetch(BILLS_PROVIDERS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse<BillerProvider[]> = await response.json();
    console.log(data);
    if (!response.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(errorData?.data?.message || data.message || "Failed");
    }
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Network error");
  }
});

export const getPackages = createAsyncThunk<Package[], GetPackagesPayload>(
  "bills/getPackages",
  async (payload, { rejectWithValue, getState }) => {
    const state = getState() as any;
    const token = state.auth.token;

    try {
      const response = await safeFetch(BILLS_PACKAGES_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<Package[]> = await response.json();

      if (!response.ok || !data.success || !data.data) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data.message || "Failed");
      }
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);