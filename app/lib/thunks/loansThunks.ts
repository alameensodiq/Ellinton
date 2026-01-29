import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  LOAN_PRODUCTS_ENDPOINT,
  LOAN_COMMERCIAL_BANKS_ENDPOINT,
  LOAN_CREDIT_CHECK_ENDPOINT,
  LOAN_CALCULATE_ENDPOINT,
  LOAN_APPLY_ENDPOINT,
  FETCH_USER_LOANS_ENDPOINT,
  FETCH_SINGLE_LOAN_ENDPOINT,
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
   TYPES
========================= */
export interface LoanProduct {
  id: string;
  institutionCode: string;
  name: string;
  productCode: string;
}


export interface LoanSchedule {
  principal: number;
  interest: number;
  total: number;
  repaymentDate: string;
}

export interface Loan {
  id: string;
  product_name: string;
  amount: number;
  interest_rate: number;
  total_repayment_expected: number;
  status: "active" | "completed" | "overdue";
  schedules: LoanSchedule[];
}

/* =========================
   PAYLOADS
========================= */
export interface CreditCheckPayload {
  bvn: string;
}

export interface CalculateLoanPayload {
  productCode: string;
  amount: number;
}

export interface ApplyLoanPayload {
  productCode: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  transactionPin: string;
}

/* =========================
   FETCH LOAN PRODUCTS
========================= */
export const fetchLoanProducts = createAsyncThunk<
  LoanProduct[],
  void,
  { rejectValue: string }
>("loans/products", async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(LOAN_PRODUCTS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<LoanProduct[]>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Failed to fetch loan products");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Loan products error");
  }
});

/* =========================
   FETCH COMMERCIAL BANKS
========================= */
export const fetchLoanBanks = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("loans/banks", async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(LOAN_COMMERCIAL_BANKS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any[]>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Failed to fetch banks");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch banks error");
  }
});

/* =========================
   CREDIT CHECK
========================= */
export const runCreditCheck = createAsyncThunk<
  any,
  CreditCheckPayload,
  { rejectValue: string }
>("loans/creditCheck", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(LOAN_CREDIT_CHECK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      return rejectWithValue(data?.message || "Credit check failed");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Credit check error");
  }
});

/* =========================
   CALCULATE LOAN
========================= */
export const calculateLoan = createAsyncThunk<
  any,
  CalculateLoanPayload,
  { rejectValue: string }
>("loans/calculate", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(LOAN_CALCULATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      return rejectWithValue(data?.message || "Loan calculation failed");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Loan calculation error");
  }
});

/* =========================
   APPLY FOR LOAN
========================= */
export const applyForLoan = createAsyncThunk<
  Loan,
  ApplyLoanPayload,
  { rejectValue: string }
>("loans/apply", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(LOAN_APPLY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<Loan>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Loan application failed");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Apply loan error");
  }
});

/* =========================
   FETCH USER LOANS
========================= */
export const fetchUserLoans = createAsyncThunk<
  Loan[],
  void,
  { rejectValue: string }
>("loans/fetchAll", async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(FETCH_USER_LOANS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<Loan[]>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Fetch loans failed");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch loans error");
  }
});

/* =========================
   FETCH SINGLE LOAN
========================= */
export const fetchLoanById = createAsyncThunk<
  Loan,
  string,
  { rejectValue: string }
>("loans/fetchOne", async (id, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(FETCH_SINGLE_LOAN_ENDPOINT(id), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<Loan>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Loan not found");
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch loan error");
  }
});
