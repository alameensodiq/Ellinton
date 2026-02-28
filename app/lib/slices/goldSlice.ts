import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchGoldDashboard,
  fetchGoldPrice,
  fetchGoldPriceHistory,
  buyGold,
  sellGold,
  fetchGoldTransactions,
  fetchGoldTransactionById,
  fetchGoldSkr,
  createGoldTrigger,
  listGoldTriggers,
  cancelGoldTrigger,
} from "../thunks/goldThunks";

interface GoldState {
  dashboard: any | null;
  price: any | null;
  history: any[];
  transactions: any[];
  transactionDetail: any | null;
  skr: any | null;
  triggers: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GoldState = {
  dashboard: null,
  price: null,
  history: [],
  transactions: [],
  transactionDetail: null,
  skr: null,
  triggers: [],
  isLoading: false,
  error: null,
};

const goldSlice = createSlice({
  name: "gold",
  initialState,
  reducers: {
    clearGoldError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoldDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldDashboard.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        state.error = null;
      })
      .addCase(fetchGoldDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGoldPrice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldPrice.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.price = action.payload;
        state.error = null;
      })
      .addCase(fetchGoldPrice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGoldPriceHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldPriceHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.history = action.payload || [];
        state.error = null;
      })
      .addCase(fetchGoldPriceHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(buyGold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buyGold.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(buyGold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(sellGold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sellGold.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sellGold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGoldTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldTransactions.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.transactions = action.payload || [];
        state.error = null;
      })
      .addCase(fetchGoldTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGoldTransactionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldTransactionById.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.transactionDetail = action.payload;
        state.error = null;
      })
      .addCase(fetchGoldTransactionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchGoldSkr.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoldSkr.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.skr = action.payload;
        state.error = null;
      })
      .addCase(fetchGoldSkr.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(listGoldTriggers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(listGoldTriggers.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.triggers = action.payload || [];
        state.error = null;
      })
      .addCase(listGoldTriggers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(createGoldTrigger.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGoldTrigger.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // Optionally push new trigger
        if (action.payload) state.triggers = [action.payload, ...state.triggers];
        state.error = null;
      })
      .addCase(createGoldTrigger.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(cancelGoldTrigger.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelGoldTrigger.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // remove cancelled trigger if id present
        const removedId = action.payload?.id;
        if (removedId) state.triggers = state.triggers.filter((t) => t.id !== removedId);
        state.error = null;
      })
      .addCase(cancelGoldTrigger.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGoldError } = goldSlice.actions;
export default goldSlice.reducer;
