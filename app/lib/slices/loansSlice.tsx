import { createSlice, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import {
  fetchLoanProducts,
  fetchLoanBanks,
  runCreditCheck,
  calculateLoan,
  applyForLoan,
  fetchUserLoans,
  fetchLoanById,
  sendLoanDisbursementWebhook,
  confirmLoanConsent, // ✅ added
  Loan,
  LoanProduct,
  LoanStatus,
} from "../thunks/loansThunks";

interface LoansState {
  products: LoanProduct[];
  banks: any[];
  loans: Loan[];
  selectedLoan: Loan | null;
  calculation: any | null;
  creditCheck: any | null;
  disbursementWebhook: any | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LoansState = {
  products: [],
  banks: [],
  loans: [],
  selectedLoan: null,
  calculation: null,
  creditCheck: null,
  disbursementWebhook: null,
  isLoading: false,
  error: null,
};

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
    clearDisbursementWebhook: (state) => {
      state.disbursementWebhook = null;
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
      .addCase(sendLoanDisbursementWebhook.fulfilled, (state, action) => {
        state.disbursementWebhook = action.payload;
      })
      .addCase(applyForLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loans.unshift(action.payload);
      })

      // ✅ CONFIRM LOAN CONSENT
      .addCase(
        confirmLoanConsent.fulfilled,
        (state, action: PayloadAction<{ id: string; status: LoanStatus }>) => {
          const { id, status } = action.payload;

          // update loan in list
          const idx = state.loans.findIndex((l) => l.id === id);
          if (idx !== -1) {
            state.loans[idx] = {
              ...state.loans[idx],
              status,
              consent_approved: true,
            };
          }

          // update selectedLoan if it matches
          if (state.selectedLoan?.id === id) {
            state.selectedLoan = {
              ...state.selectedLoan,
              status,
              consent_approved: true,
            };
          }
        }
      );

    builder
      .addMatcher(
        isAnyOf(
          fetchLoanProducts.pending,
          fetchLoanBanks.pending,
          fetchUserLoans.pending,
          fetchLoanById.pending,
          calculateLoan.pending,
          runCreditCheck.pending,
          applyForLoan.pending,
          sendLoanDisbursementWebhook.pending,
          confirmLoanConsent.pending // ✅ added
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
          applyForLoan.fulfilled,
          sendLoanDisbursementWebhook.fulfilled,
          confirmLoanConsent.fulfilled // ✅ added
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
          applyForLoan.rejected,
          sendLoanDisbursementWebhook.rejected,
          confirmLoanConsent.rejected 
        ),
        (state, action) => {
          state.isLoading = false;
          state.error = (action.payload as string) || "Something went wrong";
        }
      );
  },
});

export const { clearLoanError, clearSelectedLoan, clearDisbursementWebhook } =
  loansSlice.actions;

export default loansSlice.reducer;