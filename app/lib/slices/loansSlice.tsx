import { createSlice, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import {
  fetchLoanProducts,
  fetchLoanBanks,
  runCreditCheck,
  calculateLoan,
  applyForLoan,
  fetchUserLoans,
  fetchLoanById,
  Loan,
  LoanProduct,
} from "../thunks/loansThunks";

/* =========================
   STATE
========================= */

interface LoansState {
  products: LoanProduct[]; // ✅ array, not null
  banks: any[]; // ✅ array, not null
  loans: Loan[]; // ✅ array, not null
  selectedLoan: Loan | null;
  calculation: any | null;
  creditCheck: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LoansState = {
  products: [], // ✅ empty array
  banks: [], // ✅ empty array
  loans: [], // ✅ empty array
  selectedLoan: null,
  calculation: null,
  creditCheck: null,
  isLoading: false,
  error: null,
};

/* =========================
   SLICE
========================= */

const loansSlice = createSlice({
  name: "loans",
  initialState,
  reducers: {
    clearLoanError: (state) => {
      state.error = null;
    },
    clearSelectedLoan: (state) => {
      state.selectedLoan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchLoanProducts.fulfilled,
        (state, action: PayloadAction<LoanProduct[]>) => {
          state.products = action.payload;
        }
      )
      .addCase(
        fetchLoanBanks.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.banks = action.payload;
        }
      )
      .addCase(
        fetchUserLoans.fulfilled,
        (state, action: PayloadAction<Loan[]>) => {
          state.loans = action.payload;
        }
      )
      .addCase(
        fetchLoanById.fulfilled,
        (state, action: PayloadAction<Loan>) => {
          state.selectedLoan = action.payload;
        }
      )
      .addCase(calculateLoan.fulfilled, (state, action) => {
        state.calculation = action.payload;
      })
      .addCase(runCreditCheck.fulfilled, (state, action) => {
        state.creditCheck = action.payload;
      })
      .addCase(applyForLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loans.unshift(action.payload); // ✅ always safe now
      });

    builder
      .addMatcher(
        isAnyOf(
          fetchLoanProducts.pending,
          fetchLoanBanks.pending,
          fetchUserLoans.pending,
          fetchLoanById.pending,
          calculateLoan.pending,
          runCreditCheck.pending,
          applyForLoan.pending
        ),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          fetchLoanProducts.fulfilled,
          fetchLoanBanks.fulfilled,
          fetchUserLoans.fulfilled,
          fetchLoanById.fulfilled,
          calculateLoan.fulfilled,
          runCreditCheck.fulfilled,
          applyForLoan.fulfilled
        ),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        isAnyOf(
          fetchLoanProducts.rejected,
          fetchLoanBanks.rejected,
          fetchUserLoans.rejected,
          fetchLoanById.rejected,
          calculateLoan.rejected,
          runCreditCheck.rejected,
          applyForLoan.rejected
        ),
        (state, action) => {
          state.isLoading = false;
          state.error = (action.payload as string) || "Something went wrong";
        }
      );
  },
});

export const { clearLoanError, clearSelectedLoan } = loansSlice.actions;
export default loansSlice.reducer;
