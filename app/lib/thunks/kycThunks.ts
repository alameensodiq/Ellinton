// kycThunks.ts (Updated getKycSummary thunk)
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

export const getKycStatus = createAsyncThunk(
  "kyc/getStatus",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(KYC_STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `KYC status fetch failed (${response.status})`
        );
      }

      const data = (await response.json()) as KycStatus;
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

      const response = await fetch(KYC_NIN_VERIFY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nin: payload.nin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `NIN verification failed (${response.status})`
        );
      }

      const responseData =
        (await response.json()) as ApiResponse<VerifyNinResponse>;
      const innerData = responseData.data;
      if (!responseData.success || !innerData) {
        return rejectWithValue(
          responseData.message || "Invalid response: Missing verification data"
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

      const response = await fetch(KYC_NEXT_OF_KIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Next of kin submission failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
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

      const response = await fetch(KYC_SIGNATURE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: payload.signature }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Signature capture failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
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

      const response = await fetch(KYC_SUMMARY_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `KYC summary fetch failed (${response.status})`
        );
      }

      const responseData = (await response.json()) as ApiResponse<KycSummary>;
      console.log(responseData)
      const innerData = responseData.data;
      if (!responseData.success || !innerData) {
        return rejectWithValue(
          responseData.message || "Invalid response: Missing summary data"
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

      const response = await fetch(KYC_SUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `KYC submission failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
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

      const response = await fetch(KYC_UTILITY_BILL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ utility_bill: payload.utility_bill }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Utility bill upload failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
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

      const response = await fetch(KYC_TIER3_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Tier 3 submission failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
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

      const response = await fetch(KYC_UTILITY_BILL_URL_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Utility bill URL fetch failed (${response.status})`
        );
      }

      const data = await response.json();
      return data; 
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Utility bill URL fetch error"
      );
    }
  }
);
