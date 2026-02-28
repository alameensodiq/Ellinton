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

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
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

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return rejectWithValue(
          err?.data?.message || err?.message || `Fetch failed (${res.status})`
        );
      }

      const data = (await res.json()) as ApiResponse<any>;
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

      const res = await fetch(SAVINGS_CALCULATE_ESTIMATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return rejectWithValue(
          err?.data?.message ||
            err?.message ||
            `Calculate failed (${res.status})`
        );
      }

      const data = (await res.json()) as ApiResponse<any>;
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

    const res = await fetch(SAVINGS_CREATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return rejectWithValue(
        err?.data?.message || err?.message || `Create failed (${res.status})`
      );
    }

    const data = (await res.json()) as ApiResponse<any>;
    if (!data.success)
      return rejectWithValue(
        data.message || data.data.message || "Create saving failed"
      );
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

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return rejectWithValue(
          err?.data?.message || err?.message || `Fetch failed (${res.status})`
        );
      }

      const data = (await res.json()) as ApiResponse<any>;
      if (!data.success)
        return rejectWithValue(data.message || data.data.message || "Fetch user savings failed");
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

    const res = await fetch(SAVINGS_TOP_UP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return rejectWithValue(
        err?.data?.message || err?.message || `Top up failed (${res.status})`
      );
    }

    const data = (await res.json()) as ApiResponse<any>;
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

    const res = await fetch(SAVINGS_WITHDRAWAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return rejectWithValue(
        err?.data?.message ||
          err?.message ||
          `Withdrawal failed (${res.status})`
      );
    }

    const data = (await res.json()) as ApiResponse<any>;
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

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return rejectWithValue(
          err?.data?.message || err?.message || `Fetch failed (${res.status})`
        );
      }

      const data = (await res.json()) as ApiResponse<any>;
      if (!data.success)
        return rejectWithValue(data.message || "Fetch transactions failed");
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Fetch transactions error");
    }
  }
);
