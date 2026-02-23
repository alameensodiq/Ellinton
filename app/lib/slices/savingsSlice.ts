import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchSavingsProducts,
  calculateSavingsEstimate,
  createSaving,
  fetchUserSavings,
  topUpSaving,
  withdrawFromSaving,
  fetchSavingsTransactions,
} from "../thunks/savingsThunks";

interface SavingsState {
  products: any[];
  estimate: any | null;
  savings: any[];
  savingsDetail: any | null;
  transactions: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SavingsState = {
  products: [],
  estimate: null,
  savings: [],
  savingsDetail: null,
  transactions: [],
  isLoading: false,
  error: null,
};

const savingsSlice = createSlice({
  name: "savings",
  initialState,
  reducers: {
    clearSavingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Savings Products
      .addCase(fetchSavingsProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavingsProducts.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.products = action.payload || [];
        state.error = null;
      })
      .addCase(fetchSavingsProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Calculate Savings Estimate
      .addCase(calculateSavingsEstimate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calculateSavingsEstimate.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.estimate = action.payload;
        state.error = null;
      })
      .addCase(calculateSavingsEstimate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Saving
      .addCase(createSaving.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSaving.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.savingsDetail = action.payload;
        if (action.payload) {
          state.savings = [action.payload, ...state.savings];
        }
        state.error = null;
      })
      .addCase(createSaving.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch User Savings
      .addCase(fetchUserSavings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSavings.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.savings = action.payload || [];
        state.error = null;
      })
      .addCase(fetchUserSavings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Top Up Saving
      .addCase(topUpSaving.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(topUpSaving.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(topUpSaving.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Withdraw from Saving
      .addCase(withdrawFromSaving.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawFromSaving.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(withdrawFromSaving.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Savings Transactions
      .addCase(fetchSavingsTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavingsTransactions.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.transactions = action.payload || [];
        state.error = null;
      })
      .addCase(fetchSavingsTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSavingsError } = savingsSlice.actions;
export default savingsSlice.reducer;
