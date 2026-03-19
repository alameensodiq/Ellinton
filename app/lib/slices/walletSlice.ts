import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchBonusWalletBalance,
  withdrawBonusWallet,
  BonusWalletBalance,
} from "../thunks/walletThunks";

interface WalletState {
  bonusBalance: BonusWalletBalance | null;
  withdrawalResult: any | null;
  isLoading: boolean;
  withdrawing: boolean;
  error: string | null;
}

const initialState: WalletState = {
  bonusBalance: null,
  withdrawalResult: null,
  isLoading: false,
  withdrawing: false,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearWithdrawalResult: (state) => {
      state.withdrawalResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBonusWalletBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBonusWalletBalance.fulfilled,
        (state, action: PayloadAction<BonusWalletBalance>) => {
          state.isLoading = false;
          state.bonusBalance = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchBonusWalletBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(withdrawBonusWallet.pending, (state) => {
        state.withdrawing = true;
        state.error = null;
      })
      .addCase(withdrawBonusWallet.fulfilled, (state, action) => {
        state.withdrawing = false;
        state.withdrawalResult = action.payload;
        if (state.bonusBalance) {
          const amount = Number((action.meta as any)?.arg?.amount || 0);
          state.bonusBalance.balance = Math.max(
            Number(state.bonusBalance.balance || 0) - amount,
            0
          );
        }
      })
      .addCase(withdrawBonusWallet.rejected, (state, action) => {
        state.withdrawing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWalletError, clearWithdrawalResult } = walletSlice.actions;
export default walletSlice.reducer;
