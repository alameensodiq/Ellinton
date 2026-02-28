import { createSlice } from "@reduxjs/toolkit";
import {
  applyOverdraft,
  fetchOverdraftAccount,
  fetchOverdraftPosition,
} from "../thunks/overdraftThunks";

type OverdraftState = {
  isLoading: boolean;
  error: string | null;
  account: any | null;
  position: any | null;
};

const initialState: OverdraftState = {
  isLoading: false,
  error: null,
  account: null,
  position: null,
};

const overdraftSlice = createSlice({
  name: "overdraft",
  initialState,
  reducers: {
    clearOverdraftError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyOverdraft.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyOverdraft.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(applyOverdraft.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchOverdraftAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOverdraftAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.account = action.payload ?? null;
      })
      .addCase(fetchOverdraftAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchOverdraftPosition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOverdraftPosition.fulfilled, (state, action) => {
        state.isLoading = false;
        state.position = action.payload ?? null;
      })
      .addCase(fetchOverdraftPosition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOverdraftError } = overdraftSlice.actions;
export default overdraftSlice.reducer;
