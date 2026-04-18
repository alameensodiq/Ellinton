import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  SAVINGS_PRODUCTS_ENDPOINT,
  SAVINGS_CALCULATE_ESTIMATE_ENDPOINT,
  SAVINGS_CREATE_ENDPOINT,
  SAVINGS_FETCH_USER_ENDPOINT,
  SAVINGS_TOP_UP_ENDPOINT,
  SAVINGS_WITHDRAWAL_ENDPOINT,
  SAVINGS_TRANSACTIONS_ENDPOINT,
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

// Fetch Savings Products
export const fetchSavingsProducts = createAsyncThunk<any, { type?: string }>(
  "savings/fetchProducts",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = payload?.type
        ? `${SAVINGS_PRODUCTS_ENDPOINT}?type=${payload.type}`
        : SAVINGS_PRODUCTS_ENDPOINT;

      const res = await safeFetch(url, {
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

      if (!data.success)
        return rejectWithValue(data.message || "Savings products fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Savings products error");
    }
  }
);

// Calculate Savings Estimate
export const calculateSavingsEstimate = createAsyncThunk<
  any,
  {
    amount: number;
    type: string;
    tenure: number;
    frequency: string;
  }
>(
  "savings/calculateEstimate",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(SAVINGS_CALCULATE_ESTIMATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Calculate failed (${res.status})`
        );
      }

      if (!data.success)
        return rejectWithValue(data.message || "Calculate estimate failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Calculate estimate error");
    }
  }
);

// Create Saving
export const createSaving = createAsyncThunk<
  any,
  {
    name: string;
    productCode: string;
    amount: number;
    frequency: string;
    tenure: number;
    startDate: string;
    endDate: string;
    dayOfWeek?: string;
    dateInMonth?: number;
    debitSource: string;
    maturityAction: string;
    targetAmount?: number;
    participants?: Array<{
      userId: string;
      accountNumber: string;
      userName: string;
    }>;
  }
>("savings/create", async (payload, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await safeFetch(SAVINGS_CREATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || `Create failed (${res.status})`
      );
    }

    if (!data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Create saving failed"
      );
    }
    return data.data;
  } catch (error: any) {
    console.log(error);
    return rejectWithValue(error.message || "Create saving error");
  }
});

// Fetch User Savings
export const fetchUserSavings = createAsyncThunk<
  any,
  { page: number; limit: number; type?: string }
>(
  "savings/fetchUserSavings",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const params = new URLSearchParams({
        page: String(payload.page),
        limit: String(payload.limit),
      });

      if (payload.type) {
        params.set("type", payload.type);
      }

      const url = `${SAVINGS_FETCH_USER_ENDPOINT}?${params.toString()}`;

      const res = await safeFetch(url, {
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
        return rejectWithValue(errorData?.data?.message || data?.message || "Fetch user savings failed");
      }
      console.log("Fetched user savings:", data.data);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Fetch user savings error");
    }
  }
);

// Top Up Saving
export const topUpSaving = createAsyncThunk<
  any,
  {
    savingsId: number;
    amount: number;
    uniqueRef: string;
  }
>("savings/topUp", async (payload, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await safeFetch(SAVINGS_TOP_UP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || `Top up failed (${res.status})`
      );
    }

    if (!data.success)
      return rejectWithValue(data.message || "Top up saving failed");
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Top up saving error");
  }
});

// Withdraw from Saving
export const withdrawFromSaving = createAsyncThunk<
  any,
  {
    savingsId: number;
    amount: number;
    uniqueRef: string;
  }
>("savings/withdraw", async (payload, { rejectWithValue, getState }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await safeFetch(SAVINGS_WITHDRAWAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
          data?.message ||
          `Withdrawal failed (${res.status})`
      );
    }

    if (!data.success)
      return rejectWithValue(data.message || "Withdrawal from saving failed");
    return data.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Withdrawal from saving error");
  }
});

// Fetch User Savings Transactions
export const fetchSavingsTransactions = createAsyncThunk<
  any,
  { page: number; limit: number; accountNumber: string }
>(
  "savings/fetchTransactions",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const params = new URLSearchParams({
        page: String(payload.page),
        limit: String(payload.limit),
        accountNumber: payload.accountNumber,
      });

      const url = `${SAVINGS_TRANSACTIONS_ENDPOINT}?${params.toString()}`;

      const res = await safeFetch(url, {
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

      if (!data.success)
        return rejectWithValue(data.message || "Fetch transactions failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Fetch transactions error");
    }
  }
);