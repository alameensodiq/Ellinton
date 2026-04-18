import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  GOLD_DASHBOARD_ENDPOINT,
  GOLD_PRICE_ENDPOINT,
  GOLD_PRICE_HISTORY_ENDPOINT,
  GOLD_BUY_ENDPOINT,
  GOLD_SELL_ENDPOINT,
  GOLD_WITHDRAW_ENDPOINT,
  GOLD_TRANSACTIONS_ENDPOINT,
  GOLD_TRANSACTION_BY_ID_ENDPOINT,
  GOLD_TRIGGERS_ENDPOINT,
  GOLD_TRIGGER_BY_ID_ENDPOINT,
  GOLD_SKR_ENDPOINT,
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

export const fetchGoldDashboard = createAsyncThunk<any, void>(
  "gold/fetchDashboard",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_DASHBOARD_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold dashboard fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold dashboard error");
    }
  }
);

export const fetchGoldPrice = createAsyncThunk<any, void>(
  "gold/fetchPrice",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_PRICE_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold price fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold price error");
    }
  }
);

export const fetchGoldPriceHistory = createAsyncThunk<any, { period?: string }>(
  "gold/fetchPriceHistory",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = payload?.period ? `${GOLD_PRICE_HISTORY_ENDPOINT}?period=${payload.period}` : GOLD_PRICE_HISTORY_ENDPOINT;

      const res = await safeFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold price history fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold price history error");
    }
  }
);

export const buyGold = createAsyncThunk<any, { amount_ngn?: number; amount_grams?: number; transaction_pin: string }>(
  "gold/buy",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_BUY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Buy failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Buy gold failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Buy gold error");
    }
  }
);

export const sellGold = createAsyncThunk<any, { amount_ngn?: number; amount_grams?: number; transaction_pin: string }>(
  "gold/sell",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_SELL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Sell failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Sell gold failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Sell gold error");
    }
  }
);

export const withdrawGold = createAsyncThunk<any, { amount_ngn?: number; amount_grams?: number; delivery_address?: string; transaction_pin: string }>(
  "gold/withdraw",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_WITHDRAW_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Withdraw failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Withdraw gold failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Withdraw gold error");
    }
  }
);

export const fetchGoldTransactions = createAsyncThunk<any, void>(
  "gold/fetchTransactions",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_TRANSACTIONS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold transactions fetch failed");
      return data.data.transactions;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold transactions error");
    }
  }
);

export const fetchGoldTransactionById = createAsyncThunk<any, { id: string }>(
  "gold/fetchTransactionById",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = GOLD_TRANSACTION_BY_ID_ENDPOINT(payload.id);

      const res = await safeFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold transaction fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold transaction error");
    }
  }
);

export const fetchGoldSkr = createAsyncThunk<any, void>(
  "gold/fetchSkr",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_SKR_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Gold SKR fetch failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gold SKR error");
    }
  }
);

export const createGoldTrigger = createAsyncThunk<any, any>(
  "gold/createTrigger",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_TRIGGERS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Create trigger failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || data.data?.message || "Create trigger failed");
      console.log(data);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Create trigger error");
    }
  }
);

export const listGoldTriggers = createAsyncThunk<any, void>(
  "gold/listTriggers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await safeFetch(GOLD_TRIGGERS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Fetch failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "List triggers failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "List triggers error");
    }
  }
);

export const cancelGoldTrigger = createAsyncThunk<any, { id: string }>(
  "gold/cancelTrigger",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = GOLD_TRIGGER_BY_ID_ENDPOINT(payload.id);

      const res = await safeFetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as ApiResponse<any>;

      if (!res.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(errorData?.data?.message || data?.message || `Cancel failed (${res.status})`);
      }

      if (!data.success) return rejectWithValue(data.message || "Cancel trigger failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Cancel trigger error");
    }
  }
);