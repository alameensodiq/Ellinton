import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  OVERDRAFT_APPLY_ENDPOINT,
  OVERDRAFT_ACCOUNT_ENDPOINT,
  OVERDRAFT_POSITION_ENDPOINT,
} from "../api";

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}

export const applyOverdraft = createAsyncThunk<any, any>(
  "overdraft/apply",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await fetch(OVERDRAFT_APPLY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload || {}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return rejectWithValue(
          err?.data?.message || err?.message || `Apply failed (${res.status})`
        );
      }

      const data = (await res.json()) as ApiResponse<any>;
        if (!data.success) return rejectWithValue(data.message || data.data.message || "Apply failed");
        console.log(data.data)
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Apply overdraft error");
    }
  }
);

// ✅ Get overdraft account details
export const fetchOverdraftAccount = createAsyncThunk<any, void>(
  "overdraft/account",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await fetch(OVERDRAFT_ACCOUNT_ENDPOINT, {
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
      if (!data.success) return rejectWithValue(
        data.message || data.data.message || "Fetch failed"
      );
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch overdraft error");
    }
  }
);

// ✅ Get overdraft position
export const fetchOverdraftPosition = createAsyncThunk<any, void>(
  "overdraft/position",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const res = await fetch(OVERDRAFT_POSITION_ENDPOINT, {
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
        return rejectWithValue(
          data.message || data.data.message || "Fetch position failed"
        );
      return data.data;
    } catch (e: any) {
      return rejectWithValue(e.message || "Fetch position error");
    }
  }
);
