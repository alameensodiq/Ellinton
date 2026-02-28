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
   API RESPONSE WRAPPER
========================= */

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}

/* =========================
   TYPES (MATCH BACKEND)
========================= */

/** Returned from: GET /customer/all */
export interface VirtualCardListItem {
  id: string;
  identifier: string;
  card_pan: string;
  card_type: "MASTERCARD" | "VISA";
  status: "Active" | "Frozen" | "Blocked";
  has_debited_fee: boolean;
  has_debited_vat: boolean;
  customer_id: number;
  created_at: string;
  updated_at: string;
}

/** Returned from: POST /customer/card/{id} */
export interface VirtualCardDetails {
  id: string;
  name: string;
  message:string,
  card_number: string;
  masked_pan: string;
  expiry: string;
  cvv: string;
  status: "ACTIVE" | "DISABLED" | "BLOCKED";
  type: "VIRTUAL";
  issuer: "MASTERCARD" | "VISA";
  currency: string;
  balance: number;
  balance_updated_at: string;
  auto_approve: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
}

/* =========================
   PAYLOADS
========================= */

export interface RequestVirtualCardPayload {
  amount?: number;
  type: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingPostalCode: string;
  color: string;
  transactionPin: string;
}

export interface FundVirtualCardPayload {
  cardId: string| number;
  amount: number;
  transactionPin: string;
}

export interface WithdrawVirtualCardPayload {
  cardId: string| number;
  amount: number;
  transactionPin:string
}

/* =========================
   REQUEST VIRTUAL CARD
========================= */

export const requestVirtualCard = createAsyncThunk<
  VirtualCardDetails,
  RequestVirtualCardPayload,
  { rejectValue: string }
>("virtualCards/request", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await fetch(VIRTUAL_CARD_REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    const message =
      data?.message ||
      data?.data?.message ||
      data?.error?.message ||
      "Virtual card request failed";

    if (!res.ok || !data?.success || !data?.data) {
      return rejectWithValue(message);
    }

    return data.data as VirtualCardDetails;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Virtual card request error");
  }
});


/* =========================
   FETCH ALL VIRTUAL CARDS
========================= */

export const fetchVirtualCards = createAsyncThunk<VirtualCardListItem[], void>(
  "virtualCards/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      console.log(
        "Starting fetchVirtualCards with endpoint:",
        VIRTUAL_CARDS_FETCH_ALL_ENDPOINT
      );
      console.log("Token present?", !!token);

      const res = await fetch(VIRTUAL_CARDS_FETCH_ALL_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Fetch response status:", res.status);

      const data = (await res.json()) as ApiResponse<VirtualCardListItem[]>;
      console.log("Full API data for fetchAll:", data);

      if (!res.ok || !data.success || !data.data) {
        console.log(
          "Rejecting fetchAll:",
          data?.message || "Fetch cards failed"
        );
        return rejectWithValue(data?.message || "Fetch cards failed");
      }

      return data.data;
    } catch (err: any) {
      console.error("FetchAll error:", err.message);
      return rejectWithValue(err.message || "Fetch cards error");
    }
  }
);

/* =========================
   FETCH SINGLE CARD (IMPORTANT FIX)
   POST /customer/card/{id}
========================= */


type FetchVirtualCardPayload = {
  id: string;
  transactionPin: string;
};

export const fetchVirtualCard = createAsyncThunk<
  VirtualCardDetails,
  FetchVirtualCardPayload
>("virtualCards/fetchOne", async ({ id, transactionPin }, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await fetch(VIRTUAL_CARD_FETCH_ONE_ENDPOINT(id), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transactionPin }), // ✅ pin in request body
    });

    const data = (await res.json()) as ApiResponse<VirtualCardDetails>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Fetch card failed");
    }

    console.log("[fetchVirtualCard OK]", data.data);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch card error");
  }
});


/* =========================
   FUND VIRTUAL CARD
========================= */

export const fundVirtualCard = createAsyncThunk<
  VirtualCardDetails,
  FundVirtualCardPayload
>("virtualCards/fund", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await fetch(VIRTUAL_CARD_FUND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<VirtualCardDetails>;
console.log(data);

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.data?.message || "Fund card failed");
    }
console.log(data.data)
    return data.data;
  } catch (err: any) {
    console.log(err)
    return rejectWithValue(err.message || "Fund card error");
  }
});

/* =========================
   WITHDRAW VIRTUAL CARD
========================= */

export const withdrawVirtualCard = createAsyncThunk<
  VirtualCardDetails,
  WithdrawVirtualCardPayload
>("virtualCards/withdraw", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;

    const res = await fetch(VIRTUAL_CARD_WITHDRAW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<VirtualCardDetails>;
    console.log(data)

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.data?.message || "Withdraw failed");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Withdraw error");
  }
});

/* =========================
   FREEZE CARD
========================= */

export const freezeVirtualCard = createAsyncThunk<boolean, string>(
  "virtualCards/freeze",
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = VIRTUAL_CARD_FREEZE_ENDPOINT(id);
      console.log("Freeze URL:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return rejectWithValue(text || "Freeze failed");
      }

      return true;
    } catch (err: any) {
      return rejectWithValue(err.message || "Freeze error");
    }
  }
);


/* =========================
   UNFREEZE CARD
========================= */

export const unfreezeVirtualCard = createAsyncThunk<boolean, string>(
  "virtualCards/unfreeze",
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = VIRTUAL_CARD_UNFREEZE_ENDPOINT(id);
      console.log("Unfreeze URL:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return rejectWithValue(text || "Unfreeze failed");
      }

      return true;
    } catch (err: any) {
      return rejectWithValue(err.message || "Unfreeze error");
    }
  }
);


