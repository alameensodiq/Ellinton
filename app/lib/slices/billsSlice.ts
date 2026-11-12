import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  BillerOption,
  validateBillCustomer,
  fetchBillerOptions,
  payBill,
  getBillerProviders,
  getPackages,
} from "../thunks/billsThunks";

interface BillsState {
  options: BillerOption[] | null;
  validatedCustomer: any | null;
  providers: any[] | null;
  packages: any[] | null;
  paymentResult: any | null;
  isLoading: boolean;
  error: string | null;
  providersStatus: "idle" | "loading" | "succeeded" | "failed";
  packagesStatus: "idle" | "loading" | "succeeded" | "failed";
  currentProviderType: string | null; // track current type
}

const initialState: BillsState = {
  options: null,
  validatedCustomer: null,
  providers: null,
  packages: null,
  paymentResult: null,
  isLoading: false,
  error: null,
  providersStatus: "idle",
  packagesStatus: "idle",
  currentProviderType: null,
};

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    clearBillerOptions: (state) => {
      state.options = null;
      state.error = null;
    },
    clearValidatedCustomer: (state) => {
      state.validatedCustomer = null;
      state.error = null;
    },
    clearProviders: (state) => {
      state.providers = null;
      state.providersStatus = "idle";
      state.currentProviderType = null;
      state.error = null;
    },
    clearPackages: (state) => {
      state.packages = null;
      state.packagesStatus = "idle";
      state.error = null;
    },
    clearPaymentResult: (state) => {
      state.paymentResult = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch options
      .addCase(fetchBillerOptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBillerOptions.fulfilled,
        (state, action: PayloadAction<BillerOption[]>) => {
          state.isLoading = false;
          state.options = action.payload;
        }
      )
      .addCase(fetchBillerOptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // validate customer
      .addCase(validateBillCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        validateBillCustomer.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.validatedCustomer = action.payload;
        }
      )
      .addCase(validateBillCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // pay bill
      .addCase(payBill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payBill.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.paymentResult = action.payload;
      })
      .addCase(payBill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // get providers
      .addCase(getBillerProviders.pending, (state) => {
        state.isLoading = true;
        state.providersStatus = "loading";
        state.error = null;
      })
      .addCase(getBillerProviders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providersStatus = "succeeded";
        state.providers = action.payload;
        state.currentProviderType = action.meta.arg.type; // track type
      })
      .addCase(getBillerProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.providersStatus = "failed";
        state.error = action.payload as string;
      })

      // get packages
      .addCase(getPackages.pending, (state) => {
        state.isLoading = true;
        state.packagesStatus = "loading";
        state.error = null;
      })
      .addCase(getPackages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packagesStatus = "succeeded";
        state.packages = action.payload;
      })
      .addCase(getPackages.rejected, (state, action) => {
        state.isLoading = false;
        state.packagesStatus = "failed";
        state.error = action.payload as string;
      })
      .addMatcher(
        (action) =>
          action.type === "auth/logout" ||
          action.type === "auth/setUserOnly" ||
          action.type === "auth/setCredentials" ||
          action.type === "auth/loginUser/pending" ||
          action.type === "auth/loginUser/fulfilled" ||
          action.type === "auth/logoutUser/fulfilled" ||
          action.type === "auth/verify-mfa-otp/fulfilled" ||
          action.type === "auth/verify-device/fulfilled",
        (state) => {
          state.error = null;
          state.isLoading = false;
        }
      );
  },
});

export const {
  clearBillerOptions,
  clearValidatedCustomer,
  clearProviders,
  clearPackages,
  clearPaymentResult,
  clearError,
} = billsSlice.actions;

export default billsSlice.reducer;
