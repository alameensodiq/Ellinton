import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  performIntraBankTransfer,
  performInterBankTransfer,
  fetchAccountTransactions,
  AccountTransaction,
  fetchSingleTransactionReceipt,
  TransactionReceipt,
} from "../thunks/transferThunks";

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

export interface TransferState {
  transferResult: TransferResult | null;
  transactions: AccountTransaction[]; // ✅ ADDED
  transactionReceipt: TransactionReceipt | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TransferState = {
  transferResult: null,
  transactions: [], // ✅ ADDED
  transactionReceipt: null,
  isLoading: false,
  error: null,
};

const transferSlice = createSlice({
  name: "transfers",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransfer: (state) => {
      state.transferResult = null;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
    clearTransactionReceipt: (state) => {
      state.transactionReceipt = null;
    },
  },

  extraReducers: (builder) => {
    /** -----------------------------------------
     * INTRA-BANK TRANSFER
     * ----------------------------------------- */
    builder
      .addCase(performIntraBankTransfer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.transferResult = null;
      })
      .addCase(
        performIntraBankTransfer.fulfilled,
        (state, action: PayloadAction<TransferResult | undefined>) => {
          state.isLoading = false;
          state.transferResult = action.payload || { status: "SUCCESS" };
          state.error = null;
        }
      )
      .addCase(performIntraBankTransfer.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Transfer failed";
        state.transferResult = null;
      });

    /** -----------------------------------------
     * FETCH ACCOUNT TRANSACTIONS
     * ----------------------------------------- */
    builder
      .addCase(fetchAccountTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAccountTransactions.fulfilled,
        (state, action: PayloadAction<AccountTransaction[]>) => {
          state.isLoading = false;
          state.transactions = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchAccountTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch transactions";
      })
      .addCase(fetchSingleTransactionReceipt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.transactionReceipt = null;
      })
      .addCase(
        fetchSingleTransactionReceipt.fulfilled,
        (state, action: PayloadAction<TransactionReceipt>) => {
          state.isLoading = false;
          state.transactionReceipt = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchSingleTransactionReceipt.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch transaction receipt";
      });

    /** -----------------------------------------
     * INTER-BANK TRANSFER
     * ----------------------------------------- */
    builder
      .addCase(performInterBankTransfer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.transferResult = null;
      })
      .addCase(
        performInterBankTransfer.fulfilled,
        (state, action: PayloadAction<TransferResult | undefined>) => {
          state.isLoading = false;
          state.transferResult = action.payload || { status: "SUCCESS" };
          state.error = null;
        }
      )
      .addCase(performInterBankTransfer.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Transfer failed";
        state.transferResult = null;
      });
  },
});

export const {
  clearError,
  clearTransfer,
  clearTransactions,
  clearTransactionReceipt,
} =
  transferSlice.actions;

export default transferSlice.reducer;
