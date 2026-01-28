import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  VIRTUAL_CARD_REQUEST_ENDPOINT,
  VIRTUAL_CARDS_FETCH_ALL_ENDPOINT,
  VIRTUAL_CARD_FETCH_ONE_ENDPOINT,
  VIRTUAL_CARD_FUND_ENDPOINT,
  VIRTUAL_CARD_WITHDRAW_ENDPOINT,
  VIRTUAL_CARD_FREEZE_ENDPOINT,
  VIRTUAL_CARD_UNFREEZE_ENDPOINT,
} from "../api";

/* =========================
   TYPES
========================= */

export interface VirtualCard {
  id: string;
  card_pan: string;
  masked_pan: string;
  expiry_date: string;
  cvv: string;
  balance: number;
  currency: string;
  status: "Active" | "Frozen" | "Blocked";
  created_at: string;
}

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}

export interface RequestVirtualCardPayload {
  amount?: number;
  type: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingPostalCode: string;
  color: string;
  transactionPin:string;
}

export interface FundVirtualCardPayload {
  cardId: string;
  amount: number;
}

export interface WithdrawVirtualCardPayload {
  cardId: string;
  amount: number;
}

/* =========================
   THUNKS (MATCH PHYSICAL CARD ERROR HANDLING)
========================= */

// -------------------------
// REQUEST VIRTUAL CARD
// -------------------------
export const requestVirtualCard = createAsyncThunk<
  VirtualCard,
  RequestVirtualCardPayload
>("virtualCards/request", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const response = await fetch(VIRTUAL_CARD_REQUEST_ENDPOINT, {
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
          `Virtual card request failed (${response.status})`
      );
    }

    const data = (await response.json()) as ApiResponse<VirtualCard>;

    if (!data.success || !data.data) {
      return rejectWithValue(data.message || "Virtual card request failed");
    }

    return data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.data?.message || error.message || "Virtual card request error"
    );
  }
});

// -------------------------
// FETCH ALL VIRTUAL CARDS
// -------------------------
export const fetchVirtualCards = createAsyncThunk<VirtualCard[], void>(
  "virtualCards/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(VIRTUAL_CARDS_FETCH_ALL_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Fetch virtual cards failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<VirtualCard[]>;

      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Fetch virtual cards failed");
      }

      return data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Fetch virtual cards error"
      );
    }
  }
);

// -------------------------
// FETCH SINGLE VIRTUAL CARD
// -------------------------
export const fetchVirtualCard = createAsyncThunk<VirtualCard, string>(
  "virtualCards/fetchOne",
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(VIRTUAL_CARD_FETCH_ONE_ENDPOINT(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Fetch virtual card failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<VirtualCard>;

      if (!data.success || !data.data) {
        return rejectWithValue(data.message || "Fetch virtual card failed");
      }

      return data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Fetch virtual card error"
      );
    }
  }
);

// -------------------------
// FUND VIRTUAL CARD
// -------------------------
export const fundVirtualCard = createAsyncThunk<
  VirtualCard,
  FundVirtualCardPayload
>("virtualCards/fund", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const response = await fetch(VIRTUAL_CARD_FUND_ENDPOINT, {
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
          `Fund virtual card failed (${response.status})`
      );
    }

    const data = (await response.json()) as ApiResponse<VirtualCard>;

    if (!data.success || !data.data) {
      return rejectWithValue(data.message || "Fund virtual card failed");
    }

    return data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.data?.message || error.message || "Fund virtual card error"
    );
  }
});

// -------------------------
// WITHDRAW VIRTUAL CARD
// -------------------------
export const withdrawVirtualCard = createAsyncThunk<
  VirtualCard,
  WithdrawVirtualCardPayload
>("virtualCards/withdraw", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const response = await fetch(VIRTUAL_CARD_WITHDRAW_ENDPOINT, {
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
          `Withdraw virtual card failed (${response.status})`
      );
    }

    const data = (await response.json()) as ApiResponse<VirtualCard>;

    if (!data.success || !data.data) {
      return rejectWithValue(data.message || "Withdraw virtual card failed");
    }

    return data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.data?.message || error.message || "Withdraw virtual card error"
    );
  }
});

// -------------------------
// FREEZE VIRTUAL CARD
// -------------------------
export const freezeVirtualCard = createAsyncThunk<boolean, string>(
  "virtualCards/freeze",
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(VIRTUAL_CARD_FREEZE_ENDPOINT(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Freeze virtual card failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse;

      if (!data.success) {
        return rejectWithValue(data.message || "Freeze virtual card failed");
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Freeze virtual card error"
      );
    }
  }
);

// -------------------------
// UNFREEZE VIRTUAL CARD
// -------------------------
export const unfreezeVirtualCard = createAsyncThunk<boolean, string>(
  "virtualCards/unfreeze",
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(VIRTUAL_CARD_UNFREEZE_ENDPOINT(id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Unfreeze virtual card failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse;

      if (!data.success) {
        return rejectWithValue(data.message || "Unfreeze virtual card failed");
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Unfreeze virtual card error"
      );
    }
  }
);
