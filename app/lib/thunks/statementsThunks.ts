import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  STATEMENTS_REQUEST_ENDPOINT,
  STATEMENTS_HISTORY_ENDPOINT,
  STATEMENT_BY_ID_ENDPOINT,
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

export type StatementRequestPayload = {
  startDate: string; // "2025-01-01"
  endDate: string; // "2025-01-31"
};

export const requestStatement = createAsyncThunk<
  any,
  StatementRequestPayload,
  { rejectValue: string }
>("statements/request", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await safeFetch(STATEMENTS_REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Statement request failed"
      );
    }
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Statement request error");
  }
});

export const fetchStatementsHistory = createAsyncThunk<
  any,
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>("statements/history", async (args, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const page = args && "page" in args ? args.page : undefined;
    const limit = args && "limit" in args ? args.limit : undefined;

    const res = await safeFetch(STATEMENTS_HISTORY_ENDPOINT(page, limit), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(errorData?.data?.message || data?.message || "Failed to fetch statements");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch statements error");
  }
});

export const fetchStatementById = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("statements/fetchOne", async (id, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await safeFetch(STATEMENT_BY_ID_ENDPOINT(id), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(errorData?.data?.message || data?.message || "Statement not found");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch statement error");
  }
});