import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  STATEMENTS_REQUEST_ENDPOINT,
  STATEMENTS_HISTORY_ENDPOINT,
  STATEMENT_BY_ID_ENDPOINT,
} from "../api";

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
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

    const res = await fetch(STATEMENTS_REQUEST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      return rejectWithValue(
        data?.message || data.data.message || "Statement request failed"
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

    const res = await fetch(STATEMENTS_HISTORY_ENDPOINT(page, limit), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      return rejectWithValue(data?.message || "Failed to fetch statements");
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

    const res = await fetch(STATEMENT_BY_ID_ENDPOINT(id), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      return rejectWithValue(data?.message || "Statement not found");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch statement error");
  }
});
