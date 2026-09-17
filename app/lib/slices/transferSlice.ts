import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  performIntraBankTransfer,
  performInterBankTransfer,
  fetchAccountTransactions,
  AccountTransaction,
  fetchSingleTransactionReceipt,
  TransactionReceipt,
  fetchTransferFee,
  TransferFee
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
  transactions: AccountTransaction[];
  transactionReceipt: TransactionReceipt | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMoreTransactions: boolean;
  currentPage: number;
  error: string | null;
  transferfee: TransferFee | null;
}

const initialState: TransferState = {
  transferResult: null,
  transactions: [],
  transactionReceipt: null,
  isLoading: false,
  isFetchingMore: false,
  hasMoreTransactions: false,
  currentPage: 1,
  error: null,
  transferfee: null,
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
      state.currentPage = 1;
      state.hasMoreTransactions = false;
    },
    clearTransactionReceipt: (state) => {
      state.transactionReceipt = null;
    },
    clearTransferFee: (state) => {
      state.transferfee = null;
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
      .addCase(fetchAccountTransactions.pending, (state, action) => {
        const arg = action.meta.arg;
        const isLoadMore =
          arg &&
          typeof arg === "object" &&
          (arg.isLoadMore || (arg.page && arg.page > 1));

        if (isLoadMore) {
          state.isFetchingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(
        fetchAccountTransactions.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.isFetchingMore = false;
          state.error = null;

          if (Array.isArray(action.payload)) {
            state.transactions = action.payload;
            state.currentPage = 1;
            state.hasMoreTransactions = false;
          } else if (action.payload && typeof action.payload === "object") {
            const { transactions, isLoadMore, page, hasMore } = action.payload;
            state.currentPage = page || 1;
            state.hasMoreTransactions = Boolean(hasMore);

            if (isLoadMore) {
              const existingKeys = new Set(
                state.transactions.map(
                  (t, idx) =>
                    t.ReferenceID || t.UniqueIdentifier || String(t.Id) || `tx-${idx}`
                )
              );
              const newItems = (transactions as AccountTransaction[]).filter(
                (t, idx) =>
                  !existingKeys.has(
                    t.ReferenceID || t.UniqueIdentifier || String(t.Id) || `tx-${idx}`
                  )
              );
              state.transactions = [...state.transactions, ...newItems];
            } else {
              state.transactions = transactions;
            }
          }
        }
      )
      .addCase(fetchAccountTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetchingMore = false;
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

    builder
      .addCase(fetchTransferFee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.transferfee = null;
      })
      .addCase(
        fetchTransferFee.fulfilled,
        (state, action: PayloadAction<TransferFee>) => {
          state.isLoading = false;
          state.transferfee = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchTransferFee.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Transfer failed";
        state.transferfee = null;
      });
  },
});

export const {
  clearError,
  clearTransfer,
  clearTransactions,
  clearTransactionReceipt,
  clearTransferFee
} =
  transferSlice.actions;

export default transferSlice.reducer;
