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
  LOAN_CONFIRM_CONSENT_ENDPOINT,
  LOAN_REPAYMENT_ENDPOINT
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

  const hasAuthToken =
    headers.Authorization && headers.Authorization.startsWith("Bearer ");

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
      "x-request-timestamp": timestamp,
      "x-request-nonce": nonce,
      "x-signature": signature,
      "x-device-id": deviceId // ← THIS WAS MISSING - ADD THIS LINE
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
      headers: enhancedHeaders
    });
  }
};

/* =========================
   API RESPONSE WRAPPER
========================= */
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

/* =========================
   TYPES (MATCH YOUR API)
========================= */
export interface LoanProduct {
  id: string | number;
  code?: string;
  name: string;
  category?: string;
  interest_rate?: number;
  tenure?: number;
  min_amount?: string;
  max_amount?: string;
  starter_amount?: string;
  tenor_options?: number[];
  max_installments?: number;
  requires_savings?: boolean;
  down_payment_pct?: string | null;
  hold_down_payment?: boolean;
  description?: string;
  status?: string;
  institutionCode?: string;
  productCode?: string;
}

export interface LoanSchedule {
  emi?: number;
  fee?: number | string;
  fees?: number | string;
  total?: number | string;
  amount?: number | string;
  interest?: number | string;
  principal?: number | string;
  paymentType?: string | null;
  repaymentDate?: string;
  paymentDueDate?: string;
  dueDate?: string;
  cumulativeTotal?: number;
  cumulativePrincipal?: number;
  outstandingPricipal?: number;
  repaymentAmountInNaira?: number | string;
  status?: string;
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
export interface CalculateLoanPayload {
  loanAmount: number;
  tenureInDays: number;
  interestRate: number;
  repaymentFrequency: string;
}

export interface ApplyLoanPayload {
  productCode: string;
  loanAmount: number;
  tenorInDays: number;
  repaymentFrequency: string;
  address: {
    address: string;
    state: string;
    lga: string;
  };
  account: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  accountNumber: string;
  bankCode: string;
}

export interface RepayLoanPayload {
  amount: number;
  narration: string;
  idempotencyKey: string;
  loanId: string;
  pin: string;
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

    const res = await safeFetch(LOAN_PRODUCTS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json()) as ApiResponse<LoanProduct[]>;

    if (!res.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
        data?.message ||
        "Failed to fetch loan products"
      );
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

    const res = await safeFetch(LOAN_COMMERCIAL_BANKS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json()) as ApiResponse<any[]>;

    if (!res.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Failed to fetch banks"
      );
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
  { productCode: string },
  { rejectValue: string }
>(
  "loans/creditCheck",
  async ({ productCode }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;

      console.log(productCode)

      const res = await safeFetch(LOAN_CREDIT_CHECK_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({ productCode })
      });

      const data = (await res.json()) as ApiResponse<any>;

      console.log("📥 CREDIT CHECK RESPONSE:", data);

      if (!res.ok || !data.success) {
        console.log("❌ CREDIT CHECK ERROR BODY:", data);
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message || data?.message || "Credit check failed"
        );
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Credit check error");
    }
  }
);

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

    const res = await safeFetch(LOAN_CALCULATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Loan calculation failed"
      );
    }
    console.log("✅ LOAN CALCULATION RESPONSE:", data);

    return data.data.schedule;
  } catch (err: any) {
    return rejectWithValue(err.message || "Loan calculation error");
  }
});

/* =========================
   APPLY FOR LOAN
========================= */
// export const applyForLoan = createAsyncThunk<
//   Loan,
//   ApplyLoanPayload,
//   { rejectValue: string }
// >("loans/apply", async (payload, { getState, rejectWithValue }) => {
//   try {
//     const token = (getState() as any).auth.token;
//     const requestBody = JSON.stringify(payload);

//     console.log("📤 LOAN APPLY REQUEST BODY:", requestBody);

//     const res = await safeFetch(LOAN_APPLY_ENDPOINT, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: requestBody
//     });

//     const data = (await res.json()) as ApiResponse<Loan>;
//     console.log("📥 FULL RESPONSE:", data);

//     // Check if response is successful
//     if (!res.ok || !data.success) {
//       const errorData = data as unknown as ErrorResponse;
//       return rejectWithValue(
//         errorData?.data?.message ||
//           data?.message ||
//           (data as any)?.data?.message ||
//           "Loan application failed"
//       );
//     }

//     // ✅ Return the loan data (which is at the root level)
//     // Since data contains the loan properties directly
//     return data as unknown as Loan;

//   } catch (err: any) {
//     return rejectWithValue(err.message || "Apply loan error");
//   }
// });

export const applyForLoan = createAsyncThunk<
  Loan,
  ApplyLoanPayload,
  { rejectValue: string }
>("loans/apply", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;
    const requestBody = JSON.stringify(payload);

    console.log("📤 LOAN APPLY REQUEST BODY:", requestBody);

    const res = await safeFetch(LOAN_APPLY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: requestBody
    });

    const data = await res.json();
    console.log("📥 FULL RESPONSE:", JSON.stringify(data, null, 2));

    // Check if response is successful
    if (!res.ok || !data.success) {
      console.log("❌ LOAN APPLICATION FAILED");
      return rejectWithValue(
        data?.message ||
        data?.data?.message ||
        "Loan application failed"
      );
    }

    // ✅ The loan data is the entire response (it already contains all loan fields)
    // Just remove the 'success' field or keep it - the Loan type might not need it
    const { success, ...loanData } = data;
    console.log("✅ RETURNING LOAN DATA:", loanData);

    return loanData as Loan;

  } catch (err: any) {
    console.error("❌ LOAN APPLICATION EXCEPTION:", err);
    return rejectWithValue(err.message || "Apply loan error");
  }
});


export const LoanRepayment = createAsyncThunk<
  Loan,
  RepayLoanPayload,
  { rejectValue: string }
>("loans/repay", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;
    const url = `${LOAN_REPAYMENT_ENDPOINT}/${payload.loanId}/repay`;
    const { loanId, pin, ...requestBody } = payload;


    console.log("📤 LOAN REPAYMENT REQUEST BODY:", requestBody);

    const res = await safeFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Transaction-PIN": `${payload.pin}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await res.json();
    console.log("📥 FULL RESPONSE:", JSON.stringify(data, null, 2));

    // Check if response is successful
    if (!res.ok || !data.success) {
      console.log("❌ LOAN REPAYMENT FAILED");
      return rejectWithValue(
        data?.message ||
        data?.data?.message ||
        "Loan Repayment failed"
      );
    }

    // ✅ The loan data is the entire response (it already contains all loan fields)
    // Just remove the 'success' field or keep it - the Loan type might not need it
    const { success, ...loanData } = data;
    console.log("✅ RETURNING LOAN DATA:", loanData);

    return loanData as Loan;

  } catch (err: any) {
    console.error("❌ LOAN REPAYMENT EXCEPTION:", err);
    return rejectWithValue(err.message || "Repayment of loan error");
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

    const res = await safeFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success || !data.data?.loans) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
        data?.message ||
        data?.data?.message ||
        "Fetch loans failed"
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

    const res = await safeFetch(FETCH_SINGLE_LOAN_ENDPOINT(id), {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message || data?.message || "Loan not found"
      );
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

      const res = await safeFetch(LOAN_DISBURSEMENT_WEBHOOK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as ApiResponse<any>;

      console.log("✅ DISBURSEMENT WEBHOOK RESPONSE:", data);

      if (!res.ok || !data.success) {
        console.log("❌ DISBURSEMENT WEBHOOK ERROR BODY:", data);
        const errorData = data as unknown as ErrorResponse;
        return rejectWithValue(
          errorData?.data?.message ||
          data?.message ||
          (data as any)?.data?.message ||
          "Webhook failed"
        );
      }

      return data.data;
    } catch (err: any) {
      console.log("❌ DISBURSEMENT WEBHOOK ERROR:", err);
      return rejectWithValue(err.message || "Webhook error");
    }
  }
);

export const confirmLoanConsent = createAsyncThunk<
  { id: string; status: LoanStatus },
  string,
  { rejectValue: string }
>("loans/confirmConsent", async (loanId, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await safeFetch(LOAN_CONFIRM_CONSENT_ENDPOINT(loanId), {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !data.success || !data.data) {
      const errorData = data as unknown as ErrorResponse;
      return rejectWithValue(
        errorData?.data?.message ||
        data?.message ||
        data?.data?.message ||
        "Consent confirmation failed"
      );
    }

    return data.data as { id: string; status: LoanStatus };
  } catch (err: any) {
    return rejectWithValue(err.message || "Consent confirmation error");
  }
});
