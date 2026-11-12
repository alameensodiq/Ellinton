import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchBeneficiaries, Beneficiary } from "../thunks/beneficiaryThunks";

export interface BeneficiaryState {
  beneficiaries: Beneficiary[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BeneficiaryState = {
  beneficiaries: null,
  isLoading: false,
  error: null,
};

const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
   
    builder
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBeneficiaries.fulfilled,
        (state, action: PayloadAction<{ beneficiaries: Beneficiary[] }>) => {
          state.isLoading = false;
          state.beneficiaries = action.payload.beneficiaries;
          state.error = null;
        }
      )
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.isLoading = false;
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

export const { clearError } = beneficiarySlice.actions;
export default beneficiarySlice.reducer;
