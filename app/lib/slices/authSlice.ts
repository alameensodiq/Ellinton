import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  verifyUserOtp,
  resendUserOtp,
  verifyUserBvn,
  verifyUserFacial,
  createUserAccount,
  createUserTransactionPin,
  getUserProfile,
  updateUserProfile,
  updateUserAddress,
  updateProfilePicture,
  setupPasscode,
  logoutUser,
  forgotPasscode,
  verifyForgotOtp,
  resetPasscode,
  changePasscode,
  restoreAuth,
  changeTransactionPin,
  searchUsers,
} from "../thunks/authThunks";

interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  account_number?: number;
  country_code?: string;
  gender?: string;
  date_of_birth?: string;
  role?: string;
  status?: string;
  is_verified?: boolean;
  passport?: any;
  referral_code?: string;
  points?: number;
  state?: string;
  city?: string;
  local_government?: string;
  address_1?: string;
  address_2?: string;
  bvn_verified?: boolean;
  facial_verification_status?: string;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  created_at?: string;
  kyc_level?: number;

   firebaseUid?: string;
  firebaseUser?: {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    displayName?: string | null;
    photoURL?: string | null;
  };
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  requiresPasscodeSetup?: boolean;
  requiresTransactionPinSetup?: boolean;
  pendingUserId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  searchResults: User[];
}

const initialState: AuthState = {
  user: null,
  token: null,
  pendingUserId: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isRestoring: false,
  searchResults: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        user: User;
        isAuthenticated: boolean;
      }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
    setUserOnly: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.token = null;
      state.requiresPasscodeSetup = undefined;
      state.requiresTransactionPinSetup = undefined;
      state.pendingUserId = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    logout: (state) => {
      // Keep user profile; only clear sensitive auth data
      state.token = null;
      state.requiresPasscodeSetup = undefined;
      state.requiresTransactionPinSetup = undefined;
      state.pendingUserId = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isRestoring = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /** -----------------------------------------
     * RESTORE AUTH
     * ----------------------------------------- */
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.isRestoring = true;
      })
      .addCase(restoreAuth.fulfilled, (state) => {
        state.isRestoring = false;
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.isRestoring = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    /** -----------------------------------------
     * REGISTER USER
     * ----------------------------------------- */
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        registerUser.fulfilled,
        (
          state,
          action: PayloadAction<{ userId: string; message?: string }>
        ) => {
          state.isLoading = false;
          state.pendingUserId = action.payload.userId;
          state.error = null;
        }
      )
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * LOGIN USER
     * ----------------------------------------- */
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: User;
            token: string;
            requiresPasscodeSetup: boolean;
            requiresTransactionPinSetup: boolean;
          }>
        ) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.requiresPasscodeSetup = action.payload.requiresPasscodeSetup;
          state.requiresTransactionPinSetup =
            action.payload.requiresTransactionPinSetup;
          state.pendingUserId = null;
          state.isAuthenticated = true;
          state.error = null;
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
    /** -----------------------------------------
     * CHANGE TRANSACTION PIN
     * ----------------------------------------- */
    builder
      .addCase(changeTransactionPin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeTransactionPin.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changeTransactionPin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VERIFY USER OTP
     * ----------------------------------------- */
    builder
      .addCase(verifyUserOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyUserOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyUserOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * RESEND USER OTP
     * ----------------------------------------- */
    builder
      .addCase(resendUserOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendUserOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendUserOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VERIFY USER BVN
     * ----------------------------------------- */
    builder
      .addCase(verifyUserBvn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyUserBvn.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyUserBvn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VERIFY USER FACIAL
     * ----------------------------------------- */
    builder
      .addCase(verifyUserFacial.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyUserFacial.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyUserFacial.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * CREATE USER ACCOUNT
     * ----------------------------------------- */
    builder
      .addCase(createUserAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createUserAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * CREATE USER TRANSACTION PIN
     * ----------------------------------------- */
    builder
      .addCase(createUserTransactionPin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserTransactionPin.fulfilled, (state) => {
        state.isLoading = false;
        state.requiresTransactionPinSetup = false;
        state.error = null;
      })
      .addCase(createUserTransactionPin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * GET USER PROFILE
     * ----------------------------------------- */
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        getUserProfile.fulfilled,
        (state, action: PayloadAction<{ user: User }>) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.error = null;
        }
      )
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * UPDATE USER PROFILE
     * ----------------------------------------- */
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<{ user: User | undefined }>) => {
          state.isLoading = false;
          if (action.payload.user && state.user) {
            state.user = { ...state.user, ...action.payload.user };
          }
          state.error = null;
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * UPDATE USER ADDRESS
     * ----------------------------------------- */
    builder
      .addCase(updateUserAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateUserAddress.fulfilled,
        (state, action: PayloadAction<{ user: User | undefined }>) => {
          state.isLoading = false;
          if (action.payload.user && state.user) {
            state.user = { ...state.user, ...action.payload.user };
          }
          state.error = null;
        }
      )
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * UPDATE PROFILE PICTURE
     * ----------------------------------------- */
    builder
      .addCase(updateProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateProfilePicture.fulfilled,
        (state, action: PayloadAction<{ user: User | undefined }>) => {
          state.isLoading = false;
          if (action.payload.user && state.user) {
            state.user = { ...state.user, ...action.payload.user };
          }
          state.error = null;
        }
      )
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * SETUP PASSCODE
     * ----------------------------------------- */
    builder
      .addCase(setupPasscode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setupPasscode.fulfilled, (state) => {
        state.isLoading = false;
        state.requiresPasscodeSetup = false; // Reset after setup
        state.error = null;
      })
      .addCase(setupPasscode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * LOGOUT USER
     * ----------------------------------------- */
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        // Keep user profile; only clear sensitive auth data
        state.token = null;
        state.requiresPasscodeSetup = undefined;
        state.requiresTransactionPinSetup = undefined;
        state.pendingUserId = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * FORGOT PASSCODE
     * ----------------------------------------- */
    builder
      .addCase(forgotPasscode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPasscode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPasscode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * VERIFY FORGOT OTP
     * ----------------------------------------- */
    builder
      .addCase(verifyForgotOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        verifyForgotOtp.fulfilled,
        (state, action: PayloadAction<{ resetToken: string }>) => {
          state.isLoading = false;
          state.error = null;
          // Note: resetToken is returned but not stored in state; use it for next step
        }
      )
      .addCase(verifyForgotOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * RESET PASSCODE
     * ----------------------------------------- */
    builder
      .addCase(resetPasscode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPasscode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPasscode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * CHANGE PASSCODE
     * ----------------------------------------- */
    builder
      .addCase(changePasscode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePasscode.fulfilled, (state) => {
        state.isLoading = false;
        // All sessions invalidated, so clear auth state but keep user profile
        state.token = null;
        state.requiresPasscodeSetup = undefined;
        state.requiresTransactionPinSetup = undefined;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(changePasscode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * SEARCH USERS
     * ----------------------------------------- */
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.searchResults = action.payload || [];
        state.error = null;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.searchResults = [];
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setCredentials, setUserOnly } =
  authSlice.actions;
export default authSlice.reducer;
