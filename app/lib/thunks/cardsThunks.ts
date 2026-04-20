import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  CARD_INITIATE_PAYMENT_ENDPOINT,
  CARD_FETCH_PHYSICAL_ENDPOINT,
  CARD_REQUEST_PHYSICAL_ENDPOINT,
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

interface InitiateCardPaymentPayload {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  amount: number;
  beneficiaryAccount: string;
  currency?: string;
  remark?: string;
}

interface RequestPhysicalCardPayload {
  type: "Mastercard" | "Visa" | "Verve";
  deliveryOption?: string;
  address?: string;
  transactionPin: string;
  billingAddress: string;
  color: string;
  billingCity: string;
  billingCountry: string;
}

interface FetchPhysicalCardsPayload {
  status?: "Active" | "Frozen" | "Hotlist" | "Blocked" | "Expired";
}

export interface InitiatePaymentResponse {
  transactionReference: string;
  amount: number;
  currency: string;
  beneficiaryAccount: string;
  status: string;
  beneficiaryName: string;
  remark: string;
  date: string;
}

export interface PhysicalCard {
  id: string;
  account_number: string;
  card_type: string;
  delivery_option: string;
  delivery_address: string;
  date_linked: string | null;
  status: string;
  card_pan: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  batch_no: string;
  has_debited_fee: string;
  has_debited_delivery_fee: string;
  has_debited_vat: string;
  batch_status: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface RequestedCard {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  reference: string;
  status: string;
  type: string;
  delivery_option: string;
  delivery_fee: number;
  card_fee: number;
  address: string;
}

export interface RequestPhysicalResponse {
  message: string;
  card: RequestedCard;
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

export const initiateCardPayment = createAsyncThunk<
  InitiatePaymentResponse,
  InitiateCardPaymentPayload
>(
  "cards/initiatePayment",
  async (
    payload: InitiateCardPaymentPayload,
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const response = await safeFetch(CARD_INITIATE_PAYMENT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json() as ApiResponse<InitiatePaymentResponse>;
      
      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Payment initiation failed (${response.status})`
        );
      }
      
      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Payment initiation failed");
      }
      return data.data as InitiatePaymentResponse;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Payment initiation error"
      );
    }
  }
);

export const fetchPhysicalCards = createAsyncThunk<
  { physicalCards: PhysicalCard[] },
  FetchPhysicalCardsPayload
>(
  "cards/fetchPhysical",
  async (payload: FetchPhysicalCardsPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      console.log("Fetch physical cards - token exists:", !!token);
      const params = new URLSearchParams();
      if (payload.status) {
        params.append("status", payload.status);
      }
      const url = `${CARD_FETCH_PHYSICAL_ENDPOINT}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await safeFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json() as ApiResponse<PhysicalCard[]>;
      
      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Physical cards fetch failed (${response.status})`
        );
      }
      
      if (!data.data) {
        return rejectWithValue("Invalid response structure");
      }
      return { physicalCards: data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Physical cards fetch error"
      );
    }
  }
);

export const requestPhysicalCard = createAsyncThunk<
  RequestPhysicalResponse,
  RequestPhysicalCardPayload
>(
  "cards/requestPhysical",
  async (
    payload: RequestPhysicalCardPayload,
    { rejectWithValue, getState }
  ) => {
    console.log("requestPhysicalCard thunk started with payload:", payload);
    try {
      const state = getState() as any;
      const token = state.auth.token;
      console.log("requestPhysicalCard - token exists:", !!token);
      console.log(
        "requestPhysicalCard endpoint:",
        CARD_REQUEST_PHYSICAL_ENDPOINT
      );
      const body = JSON.stringify(payload);
      console.log("requestPhysicalCard body:", body);
      const response = await safeFetch(CARD_REQUEST_PHYSICAL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      console.log("requestPhysicalCard response status:", response.status);
      console.log("requestPhysicalCard response headers:", [
        ...response.headers.entries(),
      ]);
      
      const data = await response.json() as ApiResponse<RequestPhysicalResponse>;
      
      if (!response.ok) {
        const errorData = data as unknown as ErrorResponse;
        console.log("requestPhysicalCard error data:", errorData);
        return rejectWithValue(
          errorData?.data?.message ||
            data?.message ||
            `Physical card request failed (${response.status})`
        );
      }
      
      console.log("requestPhysicalCard success data:", data);
      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Physical card request failed");
      }
      return data.data as RequestPhysicalResponse;
    } catch (error: any) {
      console.log("requestPhysicalCard catch error:", error);
      return rejectWithValue(
        error.data?.message || error.message || "Physical card request error"
      );
    }
  }
);