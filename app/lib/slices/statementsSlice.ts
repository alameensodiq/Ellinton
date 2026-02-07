import { createSlice, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import {
  requestStatement,
  fetchStatementsHistory,
  fetchStatementById,
} from "../thunks/statementsThunks";

interface StatementsState {
  history: any[];
  selected: any | null;
  lastRequest: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StatementsState = {
  history: [],
  selected: null,
  lastRequest: null,
  isLoading: false,
  error: null,
};

const statementsSlice = createSlice({
  name: "statements",
  initialState,
  reducers: {
    clearStatementsError: (state) => {
      state.error = null;
    },
    clearSelectedStatement: (state) => {
      state.selected = null;
    },
    clearLastStatementRequest: (state) => {
      state.lastRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        requestStatement.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.lastRequest = action.payload;
          // optional: put it on top of history if your API returns the request item
          if (action.payload) state.history.unshift(action.payload);
        }
      )
      .addCase(
        fetchStatementsHistory.fulfilled,
        (state, action: PayloadAction<any>) => {
          // if API returns {items:[], pagination:{}} keep it as is
          state.history = Array.isArray(action.payload)
            ? action.payload
            : action.payload?.data || [];
        }
      )
      .addCase(
        fetchStatementById.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.selected = action.payload;
        }
      );

    builder
      .addMatcher(
        isAnyOf(
          requestStatement.pending,
          fetchStatementsHistory.pending,
          fetchStatementById.pending
        ),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          requestStatement.fulfilled,
          fetchStatementsHistory.fulfilled,
          fetchStatementById.fulfilled
        ),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        isAnyOf(
          requestStatement.rejected,
          fetchStatementsHistory.rejected,
          fetchStatementById.rejected
        ),
        (state, action) => {
          state.isLoading = false;
          state.error = (action.payload as string) || "Something went wrong";
        }
      );
  },
});

export const {
  clearStatementsError,
  clearSelectedStatement,
  clearLastStatementRequest,
} = statementsSlice.actions;

export default statementsSlice.reducer;
