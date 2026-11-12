import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getKycStatus,
  verifyNin,
  submitNextOfKin,
  captureSignature,
  getKycSummary,
  submitKyc,
  uploadUtilityBill,
  submitTier3,
  getUtilityBillUrl,
} from "../thunks/kycThunks";

interface KycStatus {
  id: string;
  status: string;
  nin_verified: boolean;
  nin: string;
  next_of_kin?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gender: string;
    relationship: string;
  };
  has_signature: boolean;
  has_utility_bill: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface NinExtractedData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
}

interface KycSummary {
  nin_details: {
    nin: string;
  };
  next_of_kin?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gender: string;
    relationship: string;
  };
  has_signature: boolean;
  [key: string]: any;
}

interface VerifyNinResponse {
  nin_verified: boolean;
  extracted_data: NinExtractedData;
}

interface KycState {
  status: KycStatus | null;
  summary: KycSummary | null;
  extractedData: NinExtractedData | null;
  utilityBillUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: KycState = {
  status: null,
  summary: null,
  extractedData: null,
  utilityBillUrl: null,
  isLoading: false,
  error: null,
};

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /** -----------------------------------------
     * GET KYC STATUS
     * ----------------------------------------- */
    builder
      .addCase(getKycStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        getKycStatus.fulfilled,
        (state, action: PayloadAction<KycStatus>) => {
          state.isLoading = false;
          state.status = action.payload;
          state.error = null;
        }
      )
      .addCase(getKycStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VERIFY NIN
     * ----------------------------------------- */
    builder
      .addCase(verifyNin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        verifyNin.fulfilled,
        (state, action: PayloadAction<VerifyNinResponse>) => {
          state.isLoading = false;
          state.extractedData = action.payload.extracted_data;
          if (state.status) {
            state.status.nin_verified = true;
            state.status.nin = action.payload.extracted_data.last_name; // Adjust based on actual NIN field if available
          }
          state.error = null;
        }
      )
      .addCase(verifyNin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * SUBMIT NEXT OF KIN
     * ----------------------------------------- */
    builder
      .addCase(submitNextOfKin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitNextOfKin.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(submitNextOfKin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * CAPTURE SIGNATURE
     * ----------------------------------------- */
    builder
      .addCase(captureSignature.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(captureSignature.fulfilled, (state) => {
        state.isLoading = false;
        if (state.status) {
          state.status.has_signature = true;
        }
        state.error = null;
      })
      .addCase(captureSignature.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * GET KYC SUMMARY
     * ----------------------------------------- */
    builder
      .addCase(getKycSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        getKycSummary.fulfilled,
        (state, action: PayloadAction<KycSummary>) => {
          state.isLoading = false;
          state.summary = action.payload;
          state.error = null;
        }
      )
      .addCase(getKycSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * SUBMIT KYC
     * ----------------------------------------- */
    builder
      .addCase(submitKyc.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitKyc.fulfilled, (state) => {
        state.isLoading = false;
        state.status = null; // Reset or update based on needs
        state.error = null;
      })
      .addCase(submitKyc.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * UPLOAD UTILITY BILL
     * ----------------------------------------- */
    builder
      .addCase(uploadUtilityBill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadUtilityBill.fulfilled, (state) => {
        state.isLoading = false;
        if (state.status) {
          state.status.has_utility_bill = true;
        }
        state.error = null;
      })
      .addCase(uploadUtilityBill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * SUBMIT TIER 3
     * ----------------------------------------- */
    builder
      .addCase(submitTier3.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitTier3.fulfilled, (state) => {
        state.isLoading = false;
        state.status = null; // Reset or update based on needs
        state.error = null;
      })
      .addCase(submitTier3.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * GET UTILITY BILL URL
     * ----------------------------------------- */
    builder
      .addCase(getUtilityBillUrl.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        getUtilityBillUrl.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.isLoading = false;
          state.utilityBillUrl = action.payload.url || action.payload; // Adjust based on response structure
          state.error = null;
        }
      )
      .addCase(getUtilityBillUrl.rejected, (state, action) => {
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

export const { clearError } = kycSlice.actions;
export default kycSlice.reducer;
