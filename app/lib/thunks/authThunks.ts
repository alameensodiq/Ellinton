import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  REGISTER_USERS_ENDPOINT,
  LOGIN_USERS_ENDPOINT,
  VERIFY_OTP_USERS_ENDPOINT,
  RESEND_OTP_USERS_ENDPOINT,
  VERIFY_BVN_USERS_ENDPOINT,
  VERIFY_FACIAL_USERS_ENDPOINT,
  CREATE_ACCOUNT_USERS_ENDPOINT,
  CREATE_TRANSACTION_PIN_USERS_ENDPOINT,
  SETUP_PASSCODE_AUTH_ENDPOINT,
  LOGOUT_AUTH_ENDPOINT,
  FORGET_PASSCODE_AUTH_ENDPOINT,
  FORGET_PASSCODE_VERIFY_OTP_AUTH_ENDPOINT,
  FORGET_PASSCODE_RESET_AUTH_ENDPOINT,
  CHANGE_PASSCODE_AUTH_ENDPOINT,
  GET_USER_PROFILE_ENDPOINT,
  UPDATE_USER_PROFILE_ENDPOINT,
  UPDATE_USER_ADDRESS_PROFILE_ENDPOINT,
  UPDATE_USER_PROFILE_PASSWORD_ENDPOINT,
  CHANGE_TRANSACTION_PIN_USERS_ENDPOINT,
  SEARCH_USERS_ENDPOINT,
} from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout, setCredentials, setUserOnly } from "../slices/authSlice";

interface RegisterPayload {
  email: string;
  phone: string;
  passcode: string;
  referral_code: string;
}
interface ForgotPasscodePayload {
  email: string;
}

interface LoginPayload {
  email: string;
  passcode: string;
}

interface VerifyOtpPayload {
  userId: string;
  otp: string;
}

interface ResendOtpPayload {
  userId: string;
}

interface VerifyBvnPayload {
  userId: string;
  bvn: string;
  first_name: string;
  last_name: string;
  gender: string;
  state: string;
  city: string;
  address_1: string;
  address_2: string;
  country_code: string;
  local_government: string;
}

interface VerifyFacialPayload {
  userId: string;
  selfie: string;
}

interface CreateAccountPayload {
  userId: string;
}

interface CreateTransactionPinPayload {
  userId: string;
  pin: string;
}

interface SetupPasscodePayload {
  passcode: string;
}

interface VerifyForgotOtpPayload {
  email: string;
  otp: string;
}

interface ResetPasscodePayload {
  resetToken: string;
  newPasscode: string;
  confirmNewPasscode: string;
}

interface ChangePasscodePayload {
  currentPasscode: string;
  newPasscode: string;
  confirmNewPasscode: string;
}

interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  [key: string]: any;
}

interface UpdateAddressPayload {
  state?: string;
  city?: string;
  local_government?: string;
  address_1?: string;
  address_2?: string;
  [key: string]: any;
}

interface UpdateProfilePicturePayload {
  passport: string; // e.g., base64 image or file reference
}

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
  utility_bill_provided: boolean;
  passport?: any;
  bvn_masked: string;
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
  [key: string]: any;
}

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}
interface ChangeTransactionPinPayload {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}


// Helper function to persist user profile
const persistUserProfile = async (user: User) => {
  try {
    await AsyncStorage.setItem("userProfile", JSON.stringify(user));
  } catch (error) {
    console.error("Failed to persist user profile:", error);
  }
};

// Helper function to persist token
const persistToken = async (token: string) => {
  try {
    await AsyncStorage.setItem("authToken", token);
  } catch (error) {
    console.error("Failed to persist token:", error);
  }
};

// Helper function to clear auth token only
const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem("authToken");
  } catch (error) {
    console.error("Failed to clear auth token:", error);
  }
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(REGISTER_USERS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Registration failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{
        user_id: string;
        message?: string;
      }>;
      console.log(data);
      return {
        userId: data.data?.user_id || "",
        message:
          data.data?.message || data.message || "User registered, OTP sent",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Registration error"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(LOGIN_USERS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(errorData?.data?.message || errorData?.message);
      }

      const data = (await response.json()) as ApiResponse<{
        access_token: string;
        requires_passcode_setup: boolean;
        user: User;
      }>;
      console.log(data);
      if (!data.data) {
        return rejectWithValue("Invalid response structure");
      }
      const apiData = data.data;
      const user = apiData.user;
      const token = apiData.access_token;
      const requiresPasscodeSetup = apiData.requires_passcode_setup;

      // Persist both user profile and token
      await Promise.all([persistUserProfile(user), persistToken(token)]);

      return { user, token, requiresPasscodeSetup };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Login error"
      );
    }
  }
);

export const verifyUserOtp = createAsyncThunk(
  "auth/verifyUserOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const url = VERIFY_OTP_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: payload.otp }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data);
      return {
        message:
          data.data?.message || data.message || "OTP verified successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "OTP verification error"
      );
    }
  }
);

export const resendUserOtp = createAsyncThunk(
  "auth/resendUserOtp",
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      const url = RESEND_OTP_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      console.log(response);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Resend OTP failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      return {
        message:
          data.data?.message || data.message || "OTP resent successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Resend OTP error"
      );
    }
  }
);

export const verifyUserBvn = createAsyncThunk(
  "auth/verifyUserBvn",
  async (payload: VerifyBvnPayload, { rejectWithValue }) => {
    try {
      const url = VERIFY_BVN_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bvn: payload.bvn,
          first_name: payload.first_name,
          last_name: payload.last_name,
          gender: payload.gender,
          state: payload.state,
          city: payload.city,
          local_government: payload.local_government,
          address_1: payload.address_1,
          address_2: payload.address_2 || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `BVN verification failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data);
      return {
        message:
          data.data?.message || data.message || "BVN verified successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "BVN verification error"
      );
    }
  }
);

export const verifyUserFacial = createAsyncThunk(
  "auth/verifyUserFacial",
  async (payload: VerifyFacialPayload, { rejectWithValue }) => {
    try {
      const url = VERIFY_FACIAL_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfie: payload.selfie }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Facial verification failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data);
      return {
        message:
          data.data?.message || data.message || "Facial verification completed",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Facial verification error"
      );
    }
  }
);

export const createUserAccount = createAsyncThunk(
  "auth/createUserAccount",
  async (payload: CreateAccountPayload, { rejectWithValue }) => {
    try {
      const url = CREATE_ACCOUNT_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Account creation failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      return {
        message:
          data.data?.message ||
          data.message ||
          "Bank account created successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Account creation error"
      );
    }
  }
);

export const createUserTransactionPin = createAsyncThunk(
  "auth/createUserTransactionPin",
  async (payload: CreateTransactionPinPayload, { rejectWithValue }) => {
    try {
      const url = CREATE_TRANSACTION_PIN_USERS_ENDPOINT(payload.userId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: payload.pin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Transaction PIN creation failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data)
      return {
        message: data.data?.message || data.message || "Registration complete",
      };
    } catch (error: any) {
      console.log(error)
      return rejectWithValue(
        error.data?.message || error.message || "Transaction PIN creation error"
      );
    }
  }
);
export const changeTransactionPin = createAsyncThunk(
  "auth/changeTransactionPin",
  async (
    payload: ChangeTransactionPinPayload,
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(CHANGE_TRANSACTION_PIN_USERS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_pin: payload.currentPin,
          new_pin: payload.newPin,
          confirm_pin: payload.confirmPin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Change transaction PIN failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;

      return {
        message:
          data.data?.message ||
          data.message ||
          "Transaction PIN updated successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Change transaction PIN error"
      );
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(GET_USER_PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If 401, clear token and logout (sync)
        if (response.status === 401) {
          await clearAuthToken();
          dispatch(logout());
        }
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Profile fetch failed (${response.status})`
        );
      }

      const responseData = await response.json();
      const apiData = responseData as ApiResponse<User>;
      if (!apiData.data) {
        return rejectWithValue("Invalid response structure");
      }

      const user = apiData.data;

      // Persist updated user profile
      await persistUserProfile(user);

      return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Profile fetch error"
      );
    }
  }
);

export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      const [token, userProfileStr] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userProfile"),
      ]);

      if (userProfileStr) {
        const user = JSON.parse(userProfileStr) as User;

        if (token) {
          // Set credentials temporarily to validate token
          dispatch(setCredentials({ token, user, isAuthenticated: true }));

          // Validate token by calling getUserProfile
          try {
            await dispatch(getUserProfile()).unwrap();
            // If successful, user may be updated, token valid
            return { token, user };
          } catch (error) {
            // Token invalid, getUserProfile already dispatched logout on 401
            // State now has token null, isAuthenticated false, user kept
            return { user };
          }
        } else {
          // No token, set user only
          dispatch(setUserOnly({ user }));
          return { user };
        }
      } else {
        // No userProfile: clear token if exists
        if (token) {
          await clearAuthToken();
        }
        return rejectWithValue("No user profile found");
      }
    } catch (error: any) {
      await clearAuthToken();
      return rejectWithValue(error.message || "Restore auth error");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (payload: UpdateProfilePayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(UPDATE_USER_PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Profile update failed (${response.status})`
        );
      }

      const responseData = await response.json();
      const apiData = responseData as ApiResponse<User>;
      const user = apiData.data;

      // Persist updated user profile
      if (user) {
        await persistUserProfile(user);
      }

      return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Profile update error"
      );
    }
  }
);

export const updateUserAddress = createAsyncThunk(
  "auth/updateUserAddress",
  async (payload: UpdateAddressPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(UPDATE_USER_ADDRESS_PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Address update failed (${response.status})`
        );
      }

      const responseData = await response.json();
      const apiData = responseData as ApiResponse<User>;
      const user = apiData.data;

      // Persist updated user profile
      if (user) {
        await persistUserProfile(user);
      }

      return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Address update error"
      );
    }
  }
);

export const updateProfilePicture = createAsyncThunk(
  "auth/updateProfilePicture",
  async (
    payload: UpdateProfilePicturePayload,
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(UPDATE_USER_PROFILE_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Profile picture update failed (${response.status})`
        );
      }

      const responseData = await response.json();
      const apiData = responseData as ApiResponse<User>;
      const user = apiData.data;

      // Persist updated user profile
      if (user) {
        await persistUserProfile(user);
      }

      return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Profile picture update error"
      );
    }
  }
);

export const setupPasscode = createAsyncThunk(
  "auth/setupPasscode",
  async (payload: SetupPasscodePayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(SETUP_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passcode: payload.passcode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Setup failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      return {
        message:
          data.data?.message || data.message || "Passcode setup successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Setup passcode error"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(LOGOUT_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Logout failed (${response.status})`
        );
      }

      // Clear token only on success
      await clearAuthToken();

      return { message: "Logged out successfully" };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Logout error"
      );
    }
  }
);

export const forgotPasscode = createAsyncThunk(
  "auth/forgotPasscode",
  async (payload: ForgotPasscodePayload, { rejectWithValue }) => {
    try {
      const response = await fetch(FORGET_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Forgot passcode request failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data)
      return {
        message:
          data.data?.message || data.message || "Reset code sent to email",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Forgot passcode error"
      );
    }
  }
);

export const verifyForgotOtp = createAsyncThunk(
  "auth/verifyForgotOtp",
  async (payload: VerifyForgotOtpPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(FORGET_PASSCODE_VERIFY_OTP_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          otp: payload.otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{
        reset_token?: string;
        message?: string;
      }>;
      return {
        resetToken: data.data?.reset_token || "",
      };
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error.data?.message || error.message || "Verify OTP error"
      );
    }
  }
);

export const resetPasscode = createAsyncThunk(
  "auth/resetPasscode",
  async (payload: ResetPasscodePayload, { rejectWithValue }) => {
    try {
      const response = await fetch(FORGET_PASSCODE_RESET_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: payload.resetToken,
          new_passcode: payload.newPasscode,
          confirm_passcode: payload.confirmNewPasscode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Reset failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      console.log(data);
      return {
        message:
          data.data?.message || data.message || "Passcode reset successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Reset passcode error"
      );
    }
  }
);

export const changePasscode = createAsyncThunk(
  "auth/changePasscode",
  async (payload: ChangePasscodePayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(CHANGE_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_passcode: payload.currentPasscode,
          new_passcode: payload.newPasscode,
          confirm_passcode: payload.confirmNewPasscode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Change failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<{ message?: string }>;
      // All sessions invalidated, so clear token
      await clearAuthToken();
      return {
        message:
          data.data?.message || data.message || "Passcode changed successfully",
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Change passcode error"
      );
    }
  }
);

export const searchUsers = createAsyncThunk<
  any[],
  { search: string }
>(
  "auth/searchUsers",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = `${SEARCH_USERS_ENDPOINT}?search=${encodeURIComponent(payload.search)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Search failed (${response.status})`
        );
      }

      const data = (await response.json()) as ApiResponse<any[]>;
      if (!data.success)
        return rejectWithValue(data.message || "User search failed");
      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "User search error");
    }
  }
);
