import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  TRANSFER_SAME_BANK,
  TRANSFER_OTHER_BANK,
  FETCH_ACCOUNT_TRANSACTIONS,
  FETCH_SINGLE_ACCOUNT_TRANSACTION,
  FETCH_TRANSFER_FEE,
  TRANSACTION_PIN_VALIDATE,
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

export interface TransactionPinPayload {
  pin: string;

}

export interface TransferPayload {
  beneficiaryAccountNumber: string;
  amount: number;
  narration?: string;
  transactionPin: string;
  uniqueReference: string;
  isScheduled: boolean;
  saveBeneficiary: boolean;
  amount_grams?: number;
  gift?: boolean;
  scheduleType?: string;
  dayOfWeek?: string;
  dateOfTransfer?: string;
  dateOfMonth?: number;
  startDate?: string;
  endDate?: string;
  scheduleName?: string;
}

export interface InterBankTransferPayload extends TransferPayload {
  beneficiaryBankName: string;
  beneficiaryBankCode: string;
  beneficiaryName: string;
}

export interface TransferResult {
  transactionReference?: string;
  reference?: string;
  ReferenceID?: string;
  amount?: number;
  currency?: string;
  sender?: string;
  senderBank?: string;
  beneficiaryAccount?: string;
  beneficiaryBankName?: string;
  status?: string;
  beneficiaryName?: string;
  remark?: string;
  date?: string;
  TransactionDate?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Type for error responses that have message in data
interface ErrorResponse {
  data?: {
    message?: string;
  };
  message?: string;
}

export interface AccountTransaction {
  Id?: number;
  CurrentDate: string;
  IsReversed: boolean;
  ReversalReferenceNo?: string | null;
  WithdrawableAmount?: number;
  UniqueIdentifier?: string;
  InstrumentNo?: string;
  TransactionDate?: string;
  TransactionDateString?: string;
  ReferenceID: string | null;
  Narration: string;
  Amount?: number;
  AmountInNaira?: string;
  OpeningBalance?: number;
  Balance?: number;
  BalanceInNaira?: string;
  PostingType?: string;
  Debit: string;
  Credit: string;
  IsCardTransation?: boolean;
  AccountNumber?: string | null;
  ServiceCode?: string;
  RecordType: "Debit" | "Credit";
  ProductInfo?: any;
}

export interface TransactionReceipt {
  id?: string;
  senderName?: string;
  amount?: number;
  fee?: number;
  status?: string;
  date?: string;
  narration?: string;
  remark?: string;
  reference?: string;
  senderBank?: string;
  receiverBank?: string;
  receiverName?: string;
  receiverAccount?: string;
  senderAccount?: string;
  type?: string;
  channel?: string;
  source?: string;
  sessionId?: string;
  balanceAfter?: number | null;
}


export interface TransferFee {
  amount: number;
  fee: number;
  vat: number;
  emtl: number;
  totalDebit: number;
}

function extractError(errorData: any, status: number) {
  if (typeof errorData === "string" && errorData.trim()) {
    return errorData;
  }

  if (typeof errorData?.message === "string" && errorData.message.trim()) {
    return errorData.message;
  }

  if (typeof errorData?.data === "string" && errorData.data.trim()) {
    return errorData.data;
  }

  if (
    typeof errorData?.data?.message === "string" &&
    errorData.data.message.trim()
  ) {
    return errorData.data.message;
  }

  const errors =
    errorData?.errors ||
    errorData?.data?.errors ||
    errorData?.data?.error ||
    errorData?.error;

  if (Array.isArray(errors) && errors.length > 0) {
    return String(errors[0]);
  }

  if (typeof errors === "string" && errors.trim()) {
    return errors;
  }

  return `Transfer failed (${status})`;
}

export const TransactionPinValidation = createAsyncThunk<
  TransferResult,
  TransactionPinPayload
>(
  "transaction-pin/validate",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const response = await safeFetch(TRANSACTION_PIN_VALIDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      return result.data ?? { status: "SUCCESS" };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network Error");
    }
  }
);

export const performIntraBankTransfer = createAsyncThunk<
  TransferResult,
  TransferPayload
>(
  "transfers/performIntraBank",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const response = await safeFetch(TRANSFER_SAME_BANK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      return result.data ?? { status: "SUCCESS" };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network Error");
    }
  }
);

export const performInterBankTransfer = createAsyncThunk<
  TransferResult,
  InterBankTransferPayload
>(
  "transfers/performInterBank",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const response = await safeFetch(TRANSFER_OTHER_BANK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      return result.data ?? { status: "SUCCESS" };
    } catch (err: any) {
      return rejectWithValue(err.message || "Network Error");
    }
  }
);

export interface FetchTransactionsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
  isLoadMore?: boolean;
}

export interface FetchTransactionsResult {
  transactions: AccountTransaction[];
  isLoadMore: boolean;
  page: number;
  hasMore: boolean;
}

export const fetchAccountTransactions = createAsyncThunk<
  FetchTransactionsResult,
  FetchTransactionsParams | void
>(
  "transfers/fetchAccountTransactions",
  async (params, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit || 20));
      if (params?.startDate && params.startDate.trim()) {
        query.append("startDate", params.startDate.trim());
      }
      if (params?.endDate && params.endDate.trim()) {
        query.append("endDate", params.endDate.trim());
      }

      const queryString = query.toString();
      const url = queryString
        ? `${FETCH_ACCOUNT_TRANSACTIONS}?${queryString}`
        : FETCH_ACCOUNT_TRANSACTIONS;

      const response = await safeFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      const rawTxs =
        result.data?.transactions ||
        (Array.isArray(result.data) ? result.data : []);
      const transactionsArray = Array.isArray(rawTxs) ? rawTxs : [];
      const limit = params?.limit || 20;

      return {
        transactions: transactionsArray,
        isLoadMore: Boolean(
          params?.isLoadMore || (params?.page && params.page > 1)
        ),
        page: params?.page || 1,
        hasMore: transactionsArray.length >= limit,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch transactions");
    }
  }
);

export const fetchSingleTransactionReceipt = createAsyncThunk<
  TransactionReceipt,
  string
>(
  "transfers/fetchSingleTransactionReceipt",
  async (reference, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const response = await safeFetch(FETCH_SINGLE_ACCOUNT_TRANSACTION(reference), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      return result.data;
    } catch (err: any) {
      return rejectWithValue(
        err.message || "Failed to fetch transaction receipt"
      );
    }
  }
);


export const fetchTransferFee = createAsyncThunk<
  TransferFee,
  { transferType?: string; amount?: string | number }
>(
  "transfer-fees/quote",
  async (params, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const query = new URLSearchParams();
      if (params?.transferType) query.append("transferType", params.transferType);
      if (params?.amount) query.append("amount", String(params.amount));

      const response = await safeFetch(
        `${FETCH_TRANSFER_FEE}?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        return rejectWithValue(extractError(result, response.status));
      }

      // return result.data || [];
      return result.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch transactions");
    }
  }
);