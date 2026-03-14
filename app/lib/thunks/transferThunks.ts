import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  TRANSFER_SAME_BANK,
  TRANSFER_OTHER_BANK,
  FETCH_ACCOUNT_TRANSACTIONS,
  FETCH_SINGLE_ACCOUNT_TRANSACTION,
} from "../api";

export interface TransferPayload {
  beneficiaryAccountNumber: string;
  amount: number;
  narration: string;
  transactionPin: string;
  uniqueReference: string;
  isScheduled: boolean;
  saveBeneficiary: boolean;
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
  senderName: string;
  amount: number;
  status: string;
  date: string;
  narration: string;
  reference: string;
  senderBank: string;
  receiverBank: string;
  receiverName: string;
  receiverAccount: string;
  senderAccount: string;
}


function extractError(errorData: any, status: number) {
  return errorData?.message || errorData?.data || `Transfer failed (${status})`;
}

export const performIntraBankTransfer = createAsyncThunk<
  TransferResult,
  TransferPayload
>(
  "transfers/performIntraBank",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const response = await fetch(TRANSFER_SAME_BANK, {
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

      const response = await fetch(TRANSFER_OTHER_BANK, {
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
}

export const fetchAccountTransactions = createAsyncThunk<
  AccountTransaction[],
  FetchTransactionsParams | void
>(
  "transfers/fetchAccountTransactions",
  async (params, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);

      const response = await fetch(
        `${FETCH_ACCOUNT_TRANSACTIONS}?${query.toString()}`,
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

      return result.data || [];
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

      const response = await fetch(FETCH_SINGLE_ACCOUNT_TRANSACTION(reference), {
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
