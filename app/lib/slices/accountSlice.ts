import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  validateEllingtonAccount,
  validateNipAccount,
  fetchAccountInfo,
  updateNotificationPreference,
  fetchBanks,
  Bank,
} from "../thunks/accountThunks"; // Adjust path

interface AccountValidation {
  accountName: string;
  accountNumber: string;
}

interface AccountInfo {
  accountName: string;
  accountNumber: string;
  accountBalance: number;
  notificationPreference?: number;
}

export interface AccountState {
  // Export this if needed elsewhere
  accountInfo: AccountInfo | null;
  validationResult: AccountValidation | null;
  banks: Bank[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  accountInfo: null,
  validationResult: null,
  banks: null,
  isLoading: false,
  error: null,
};

const accountSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearValidation: (state) => {
      state.validationResult = null;
    },
    clearBanks: (state) => {
      state.banks = null;
    },
  },
  extraReducers: (builder) => {
    /** -----------------------------------------
     * VALIDATE ELLINGTON ACCOUNT
     * ----------------------------------------- */
    builder
      .addCase(validateEllingtonAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        validateEllingtonAccount.fulfilled,
        (state, action: PayloadAction<AccountValidation>) => {
          state.isLoading = false;
          state.validationResult = action.payload;
          state.error = null;
        }
      )
      .addCase(validateEllingtonAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VALIDATE NIP ACCOUNT
     * ----------------------------------------- */
    builder
      .addCase(validateNipAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        validateNipAccount.fulfilled,
        (state, action: PayloadAction<AccountValidation>) => {
          state.isLoading = false;
          state.validationResult = action.payload;
          state.error = null;
        }
      )
      .addCase(validateNipAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * FETCH ACCOUNT INFO
     * ----------------------------------------- */
    builder
      .addCase(fetchAccountInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAccountInfo.fulfilled,
        (state, action: PayloadAction<{ accountInfo: AccountInfo }>) => {
          state.isLoading = false;
          state.accountInfo = action.payload.accountInfo;
          state.error = null;
        }
      )
      .addCase(fetchAccountInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateNotificationPreference.fulfilled, (state, action) => {
        if (state.accountInfo) {
          state.accountInfo.notificationPreference = action.payload;
        }
      });

    /** -----------------------------------------
     * FETCH BANKS
     * ----------------------------------------- */
    builder
      .addCase(fetchBanks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBanks.fulfilled,
        (state, action: PayloadAction<{ banks: Bank[] }>) => {
          state.isLoading = false;
          state.banks = action.payload.banks;
          state.error = null;
        }
      )
      .addCase(fetchBanks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearValidation, clearBanks } = accountSlice.actions;
export default accountSlice.reducer;
