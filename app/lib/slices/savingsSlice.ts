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

type UserSavingsResponse = { data: any[]; total: number };

type SavingsTotals = {
  basic: number;
  target: number;
  group: number;
  fixed: number;
  overall: number;
};

interface SavingsState {
  products: any[];
  estimate: any | null;

  savings: any[];
  savingsDetail: any | null;
  transactions: any[];

  // current screen list (your MyPlans screen uses this)
  userSavings: UserSavingsResponse | null;

  // ✅ cache per type + totals
  userSavingsByType: Record<string, UserSavingsResponse>;
  totals: SavingsTotals;

  isLoading: boolean;
  error: string | null;
}

const sumSaved = (arr: any[]) =>
  arr.reduce((t, x) => t + Number(x?.amount_saved ?? x?.amount ?? 0), 0);

const normalizeType = (t: any) => String(t || "").toLowerCase(); // "basic" etc

const initialState: SavingsState = {
  products: [],
  estimate: null,

  savings: [],
  savingsDetail: null,
  transactions: [],

  userSavings: null,

  userSavingsByType: {},
  totals: {
    basic: 0,
    target: 0,
    group: 0,
    fixed: 0,
    overall: 0,
  },

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
      .addCase(
        fetchSavingsProducts.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.isLoading = false;
          state.products = action.payload || [];
          state.error = null;
        }
      )
      .addCase(fetchSavingsProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Calculate Savings Estimate
      .addCase(calculateSavingsEstimate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        calculateSavingsEstimate.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.estimate = action.payload;
          state.error = null;
        }
      )
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

      // ✅ Fetch User Savings (updates totals + cache)
      .addCase(fetchUserSavings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUserSavings.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;

          const payload: UserSavingsResponse = action.payload || {
            data: [],
            total: 0,
          };

          // keep the current list for MyPlans screen
          state.userSavings = payload;

          // figure out which type was fetched
          const type = normalizeType((action as any).meta?.arg?.type); // "basic" | "target" | "group" | "fixed"
          if (type) {
            state.userSavingsByType[type] = payload;

            const list = Array.isArray(payload?.data) ? payload.data : [];
            const totalForType = sumSaved(list);

            if (type === "basic") state.totals.basic = totalForType;
            if (type === "target") state.totals.target = totalForType;
            if (type === "group") state.totals.group = totalForType;
            if (type === "fixed") state.totals.fixed = totalForType;

            state.totals.overall =
              state.totals.basic +
              state.totals.target +
              state.totals.group +
              state.totals.fixed;
          }

          state.error = null;
        }
      )
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
      .addCase(
        fetchSavingsTransactions.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.isLoading = false;
          state.transactions = action.payload || [];
          state.error = null;
        }
      )
      .addCase(fetchSavingsTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSavingsError } = savingsSlice.actions;
export default savingsSlice.reducer;
