import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  LOAN_PRODUCTS_ENDPOINT,
  LOAN_COMMERCIAL_BANKS_ENDPOINT,
  LOAN_CREDIT_CHECK_ENDPOINT,
  LOAN_CALCULATE_ENDPOINT,
  LOAN_APPLY_ENDPOINT,
  FETCH_USER_LOANS_ENDPOINT,
  FETCH_SINGLE_LOAN_ENDPOINT,
  LOAN_DISBURSEMENT_WEBHOOK_ENDPOINT,
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
   TYPES (MATCH YOUR API)
========================= */
export interface LoanProduct {
  id: string;
  institutionCode: string;
  name: string;
  productCode: string;
}

export interface LoanSchedule {
  emi: number;
  fee: number;
  total: number;
  interest: number;
  principal: number;
  paymentType: string | null;
  repaymentDate: string;
  paymentDueDate: string;
  cumulativeTotal: number;
  cumulativePrincipal: number;
  outstandingPricipal: number;
  repaymentAmountInNaira: number;
}

export type LoanStatus =
  | "pending_disbursement"
  | "active"
  | "completed"
  | "overdue"
  | "failed";

export interface Loan {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;

  product_code: string;
  product_name: string;

  amount: string; // ✅ API returns string e.g "10000.00"
  interest_rate: string; // ✅ API returns string e.g "6.00"

  tenure_in_days: number;
  loan_tenure: number;

  repayment_frequency: string;
  total_repayment_expected: string; // ✅ API returns string e.g "10140.00"

  loan_reference: string;
  mandate_request_reference?: string;

  network_provider: string;
  preferred_repayment_bank_code?: string;
  preferred_repayment_account?: string;

  consent_approved: boolean;
  recovery_consent_approved: boolean;

  schedules: LoanSchedule[];

  credit_check_data?: any;
  loan_details?: string;

  status: LoanStatus;

  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FetchLoansResponse {
  loans: Loan[];
  pagination: Pagination;
}

/* =========================
   PAYLOADS
========================= */
export interface CreditCheckPayload {
  networkProvider: string;
  productCode: string;
}

export interface CalculateLoanPayload {
  loanAmount: number;
  tenureInDays: number;
  interestRate: number;
  repaymentFrequency: string;
}

export interface ApplyLoanPayload {
  productCode: string;
  productName: string; // ✅ was number (wrong)
  loanAmount: number;
  tenureInDays: number; // ✅ was string (wrong)
  loanTenure: number;
  repaymentFrequency: string;
  totalRepaymentExpected: number;
  networkProvider: string;
  loanDetails: string;
  recoveryConsentApproved: boolean;
  transactionPin: string;
  consentApproved: boolean;
  preferredRepaymentBankCBNCode: string;
  preferredRepaymentAccount:string;
}

export interface LoanDisbursementWebhookPayload {
  loanReference: string;
  status: string;
  success: boolean;
  transactionReference?: string;
  disbursedAmount?: number;
  disbursementDate?: string;
  message?: string;
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

    console.log("✅ CREDIT CHECK RESPONSE:", data);
    return data.data;
  } catch (err: any) {
    console.log("❌ CREDIT CHECK ERROR:", err);
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
      return rejectWithValue(
        data?.message ||
          (data as any)?.data?.message ||
          "Loan application failed"
      );
    }

    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Apply loan error");
  }
});

export const fetchUserLoans = createAsyncThunk<
  Loan[],
  { status?: string; page?: number; limit?: number } | void,
  { rejectValue: string }
>("loans/fetchAll", async (args, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const params = new URLSearchParams();
    if (args && "status" in args && args.status)
      params.set("status", args.status);
    if (args && "page" in args && args.page)
      params.set("page", String(args.page));
    if (args && "limit" in args && args.limit)
      params.set("limit", String(args.limit));

    const url =
      params.toString().length > 0
        ? `${FETCH_USER_LOANS_ENDPOINT}?${params.toString()}`
        : FETCH_USER_LOANS_ENDPOINT;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json()) as ApiResponse<any>;


    if (!res.ok || !data.success || !data.data?.loans) {
      return rejectWithValue(
        data?.message || data?.data?.message || "Fetch loans failed"
      );
    }

    return data.data.loans;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch loans error");
  }
});


/* =========================
   FETCH SINGLE LOAN
   (kept simple; adjust if your API wraps it differently)
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

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(data?.message || "Loan not found");
    }

    // ✅ support both shapes: data.data OR data.data.loan
    const loan = data.data.loan ? data.data.loan : data.data;

    return loan as Loan;
  } catch (err: any) {
    return rejectWithValue(err.message || "Fetch loan error");
  }
});

/* =========================
   DISBURSEMENT WEBHOOK
========================= */
export const sendLoanDisbursementWebhook = createAsyncThunk<
  any,
  LoanDisbursementWebhookPayload,
  { rejectValue: string }
>(
  "loans/disbursementWebhook",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;

      const res = await fetch(LOAN_DISBURSEMENT_WEBHOOK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as ApiResponse<any>;

      console.log("✅ DISBURSEMENT WEBHOOK RESPONSE:", data);

      if (!res.ok || !data.success) {
        console.log("❌ DISBURSEMENT WEBHOOK ERROR BODY:", data);
        return rejectWithValue(
          data?.message || (data as any)?.data?.message || "Webhook failed"
        );
      }

      return data.data;
    } catch (err: any) {
      console.log("❌ DISBURSEMENT WEBHOOK ERROR:", err);
      return rejectWithValue(err.message || "Webhook error");
    }
  }
);
