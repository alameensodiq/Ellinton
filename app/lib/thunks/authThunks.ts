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
  MULTI_FACTOR_OTP_ENDPOINT,
  DEVICE_ENDPOINT,
  RESEND_DEVICE_OTP
} from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout, setCredentials, setUserOnly } from "../slices/authSlice";
import { encryptedFetch } from "../encryptedFetch";
import { encryptionClient } from "../encrption.client";
import { generateSignature, generateNonce } from "../signature";
import { getDeviceId } from "../utils";

const USE_ENCRYPTION = true;

const safeFetch = async (url: string, options: RequestInit = {}) => {
  const method = options.method?.toLowerCase() || "get";
  const headers = (options.headers as Record<string, string>) || {};
  const body = options.body ? JSON.parse(options.body as string) : undefined;
  
  const hasAuthToken = headers.Authorization && headers.Authorization.startsWith('Bearer ');
  
  let enhancedHeaders = { ...headers };
  
  if (hasAuthToken) {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const deviceId = await getDeviceId();
    
    // IMPORTANT: Extract ONLY the pathname, not the full URL
    const urlObj = new URL(url);
    const path = urlObj.pathname; // This should be like "/api/v1/virtual-cards"
    
    // console.log("📡 Request details:", {
    //   fullUrl: url,
    //   path,
    //   method,
    //   hasBody: !!body,
    //   deviceId
    // });
    
    // Generate signature
    const { signature } = await generateSignature(
      method,
      path,
      body,
      nonce,
      timestamp,
      deviceId
    );
    
    // CRITICAL FIX: Add x-device-id header
    enhancedHeaders = {
      ...headers,
      'x-request-timestamp': timestamp,
      'x-request-nonce': nonce,
      'x-signature': signature,
      'x-device-id': deviceId,  // ← THIS WAS MISSING - ADD THIS LINE
    };
    
    // console.log("🔐 Added signature headers:", {
    //   timestamp,
    //   noncePreview: nonce.substring(0, 10) + "...",
    //   signaturePreview: signature.substring(0, 20) + "...",
    //   deviceId
    // });
  } else {
    // console.log("🔓 No auth token, skipping signature");
  }
  
  if (USE_ENCRYPTION) {
    switch (method) {
      case "post":
        return await encryptedFetch.post(url, body, enhancedHeaders);
      case "put":
        return await encryptedFetch.put(url, body, enhancedHeaders);
      case "patch":
        return await encryptedFetch.patch(url, body, enhancedHeaders);
      case "delete":
        return await encryptedFetch.delete(url, enhancedHeaders);
      default:
        return await encryptedFetch.get(url, enhancedHeaders);
    }
  } else {
    return await fetch(url, {
      ...options,
      headers: enhancedHeaders,
    });
  }
};

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
  device_id: string;
}

interface VerifyOtpPayload {
  userId: string;
  otp: string;
}

interface MultiFactorOtpPayload {
  challenge_token: string;
  device_id: string;
  otp: string;
}

interface DeviceOtpPayload {
  push_token: string;
  device_id: string;
  platform: string;
  app_version: string;
  device_make: string;
  device_model: string;
  device_name: string;
  sms_otp: string;
  email_otp: string;
   token?: string;
}

interface ResendOtpPayload {
  userId: string;
}

interface ResendDeviceOtpPayload {
  device_id: string;
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

const parseResponseJson = (responseText: string) => {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
};

const formatResponseLogBody = (responseText: string, limit = 1200) => {
  if (!responseText) {
    return "<empty>";
  }

  if (responseText.length <= limit) {
    return responseText;
  }

  return `${responseText.slice(0, limit)}... [truncated]`;
};

const getResponseErrorMessage = async (
  response: Response,
  fallback: string,
  responseText?: string,
  responseJson?: ApiResponse<any> | null
) => {
  if (response.status === 413) {
    return "Uploaded image is too large. Please try a smaller image.";
  }

  const contentType = response.headers.get("content-type") || "";

  const errorData =
    typeof responseJson !== "undefined"
      ? responseJson
      : contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : parseResponseJson(responseText || "");

  if (errorData) {
    return errorData?.data?.message || errorData?.message || fallback;
  }

  if (typeof responseText === "string") {
    return responseText.trim() || fallback;
  }

  const errorText = await response.text().catch(() => "");
  return errorText.trim() || fallback;
};

// Helper function to persist user profile
const persistUserProfile = async (user: User) => {
  try {
    await AsyncStorage.setItem("userProfile", JSON.stringify(user));
  } catch (error) {
    console.error("Failed to persist user profile:", error);
  }
};

// Helper function to persist token
// Helper function to persist token
const persistToken = async (token: string) => {
  try {
    if (!token) {
      return;
    }
    
    await AsyncStorage.setItem("authToken", token);
    
    // Verify immediately
    const savedToken = await AsyncStorage.getItem("authToken");
    if (savedToken === token) {
    } else {
    }
  } catch (error) {
  }
};

const persistChallenge = async (challenge: string | null | undefined) => {
  try {
    if (challenge && typeof challenge === "string") {
      await AsyncStorage.setItem("challenge", challenge);
    } else {
      // If you want to remove the challenge when null is passed:
      if (challenge === null) {
        await AsyncStorage.removeItem("challenge");
      }
    }
  } catch (error) {
  }
};

const persistData = async (data: any) => {
  try {
    // If data is an object, stringify it first
    const dataToStore = typeof data === "object" ? JSON.stringify(data) : data;
    await AsyncStorage.setItem("data", dataToStore);
  } catch (error) {
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
      const response = await safeFetch(REGISTER_USERS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Registration failed (${response.status})`
        );
      }

      return {
        userId: data?.data?.user_id || "",
        message:
          data?.data?.message || data?.message || "User registered, OTP sent"
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
      const response = await safeFetch(LOGIN_USERS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("📱 Thunk received data:", data);

      if (!response.ok) {
        const errorMessage =
          data?.data?.message || data?.message || "Login failed";
        // console.log("📱 Error message to display:", errorMessage);
        return rejectWithValue(errorMessage);
      }

      if (!data?.data) {
        return rejectWithValue("Invalid response structure");
      }

      const apiData = data.data;
      const user = apiData.user;
      const token = apiData.access_token;
      console.log(token);
      console.log(data)
      const challenge = apiData.challenge_token;
      const requiresPasscodeSetup = apiData.requires_passcode_setup;
      const requiresTransactionPinSetup =
        apiData.requires_transaction_pin_setup ?? false;

      await Promise.all([
        persistUserProfile(user),
        persistToken(token),
        persistData(apiData),
        persistChallenge(challenge)
      ]);

      const verifyToken = await AsyncStorage.getItem("authToken");
      // console.log(
      //   "✅ Token saved verification:",
      //   verifyToken ? "SUCCESS" : "FAILED"
      // );
      // console.log(
      //   "✅ Token value:",
      //   verifyToken ? verifyToken.substring(0, 50) + "..." : "null"
      // );

      return {
        user,
        token,
        requiresPasscodeSetup,
        requiresTransactionPinSetup
      };
    } catch (error: any) {
      // console.error("❌ Login error caught:", error);
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
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: payload.otp })
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message || data?.message || "OTP verified successfully"
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "OTP verification error"
      );
    }
  }
);

export const MultiFactorOtp = createAsyncThunk(
  "auth/verify-mfa-otp",
  async (payload: MultiFactorOtpPayload, { rejectWithValue }) => {
    try {
      const url = MULTI_FACTOR_OTP_ENDPOINT;
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("MFA Response:", data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      if (!data?.data) {
        return rejectWithValue("Invalid response structure");
      }

      // Extract data from response
      const apiData = data.data;
      const accessToken = apiData.access_token || apiData.token;
      
      // Extract user data
      const user = apiData.user;
      
      // Extract flags (using snake_case from API)
      const requiresPasscodeSetup = apiData.requires_passcode_setup || false;
      const requiresTransactionPinSetup = apiData.requires_transaction_pin_setup || false;
      
      if (!user) {
        return rejectWithValue("User data not found in response");
      }
      
      if (!accessToken) {
        console.log("ℹ️ No access_token in MFA response");
        
        // Verify existing token is still valid
        const existingToken = await AsyncStorage.getItem("authToken");
        if (!existingToken) {
          console.error("❌ No token found after MFA");
          return rejectWithValue("Session expired. Please login again.");
        }
      } else {
        console.log("✅ MFA returned access_token, saving to storage...");
        await AsyncStorage.setItem("authToken", accessToken);
        
        // Also save user data
        if (user) {
          await AsyncStorage.setItem("userProfile", JSON.stringify(user));
        }
        
        console.log("✅ Access token saved successfully after MFA");
      }

      // Return the properly structured data
      return {
        user: user,
        token: accessToken,
        requiresPasscodeSetup: requiresPasscodeSetup,
        requiresTransactionPinSetup: requiresTransactionPinSetup
      };

    } catch (error: any) {
      console.error("MFA error:", error);
      return rejectWithValue(
        error.data?.message || error.message || "OTP verification error"
      );
    }
  }
);

// export const DeviceOtp = createAsyncThunk(
//   "auth/verify-device",
//   async (payload: DeviceOtpPayload, { rejectWithValue }) => {
//     try {
//        console.log("🔵 DeviceOtp called at:", new Date().toISOString());
//       const url = DEVICE_ENDPOINT();
//         const allKeys = await AsyncStorage.getAllKeys();
//       console.log("🔑 All keys in AsyncStorage:", allKeys)
//       let token = await AsyncStorage.getItem("authToken");
//       console.log("Token retrieved:", token ? "Yes" : "No");

//       const headers: HeadersInit = { "Content-Type": "application/json" };
//       if (token) {
//         headers.Authorization = `Bearer ${token}`;
//       } else {
//         return rejectWithValue(
//           "Authentication token not found. Please login again."
//         );
//       }

//       const response = await safeFetch(url, {
//         method: "POST",
//         headers: headers,
//         body: JSON.stringify(payload)
//       });

//       const data = await response.json();
//       console.log("DeviceOtp response:", data);

//       if (!response.ok) {
//         return rejectWithValue(
//           data?.data?.message ||
//             data?.message ||
//             `OTP verification failed (${response.status})`
//         );
//       }

//       return {
//         message:
//           data?.data?.message || data?.message || "OTP verified successfully"
//       };
//     } catch (error: any) {
//       console.error("DeviceOtp error:", error);
//       return rejectWithValue(
//         error.data?.message || error.message || "OTP verification error"
//       );
//     }
//   }
// );

export const DeviceOtp = createAsyncThunk(
  "auth/verify-device",
  async (payload: DeviceOtpPayload, { rejectWithValue }) => {
    try {
      console.log("🔵 DeviceOtp called at:", new Date().toISOString());
      
      const url = DEVICE_ENDPOINT;
      
      // Use token from payload first, then try AsyncStorage
      let authToken: string | undefined = payload.token;
      if (!authToken) {
        const storedToken = await AsyncStorage.getItem("authToken");
        authToken = storedToken || undefined; // Convert null to undefined
        console.log("🔐 Token from AsyncStorage:", authToken ? "Found" : "Not found");
      } else {
        console.log("🔐 Token from Redux payload:", authToken.substring(0, 30) + "...");
      }
      
      if (!authToken) {
        console.error("❌ No token found in DeviceOtp");
        return rejectWithValue("Authentication token not found. Please login again.");
      }
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      headers.Authorization = `Bearer ${authToken}`;
      
      // Remove token from body before sending
      const { token, ...bodyPayload } = payload;
      console.log("📤 Request body:", bodyPayload);
      
      const response = await safeFetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await response.json();
      console.log("📥 DeviceOtp response:", data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      return {
        message: data?.data?.message || data?.message || "OTP verified successfully"
      };
    } catch (error: any) {
      console.error("❌ DeviceOtp error:", error);
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
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Resend OTP failed (${response.status})`
        );
      }
      return {
        message:
          data?.data?.message || data?.message || "OTP resent successfully"
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Resend OTP error"
      );
    }
  }
);

export const resendDeviceOtp = createAsyncThunk(
  "auth/resend-device-otp",
  async (payload: ResendDeviceOtpPayload, { rejectWithValue }) => {
    try {
      const url = RESEND_DEVICE_OTP;
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Resend OTP failed (${response.status})`
        );
      }
      return {
        message:
          data?.data?.message || data?.message || "OTP resent successfully"
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
      const response = await safeFetch(url, {
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
          address_2: payload.address_2 || ""
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `BVN verification failed (${response.status})`
        );
      }
      console.log("verifyUserBvn API response:", data);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "BVN verification error"
      );
    }
  }
);

export const verifyUserFacial = createAsyncThunk(
  "auth/verifyUserFacial",
  async (payload: VerifyFacialPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const url = VERIFY_FACIAL_USERS_ENDPOINT(payload.userId);
      const requestBody = JSON.stringify({ selfie: payload.selfie });
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("[verifyUserFacial] request", {
        url,
        userId: payload.userId,
        requestBytes: requestBody.length,
        selfieLength: payload.selfie.length
      });

      const response = await safeFetch(url, {
        method: "POST",
        headers,
        body: requestBody
      });
      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text().catch(() => "");
      const responseJson = parseResponseJson(responseText) as ApiResponse<{
        message?: string;
      }> | null;

      console.log("[verifyUserFacial] response", {
        status: response.status,
        ok: response.ok,
        contentType,
        body: formatResponseLogBody(responseText)
      });

      if (!response.ok) {
        return rejectWithValue(
          await getResponseErrorMessage(
            response,
            `Facial verification failed (${response.status})`,
            responseText,
            responseJson
          )
        );
      }

      return {
        message:
          responseJson?.data?.message ||
          responseJson?.message ||
          "Facial verification completed"
      };
    } catch (error: any) {
      console.error("[verifyUserFacial] request failed", error);
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
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Account creation failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message ||
          data?.message ||
          "Bank account created successfully"
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
      const response = await safeFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: payload.pin })
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Transaction PIN creation failed (${response.status})`
        );
      }
      return {
        message: data?.data?.message || data?.message || "Registration complete"
      };
    } catch (error: any) {
      console.log(error);
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

      const response = await safeFetch(CHANGE_TRANSACTION_PIN_USERS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_pin: payload.currentPin,
          new_pin: payload.newPin,
          confirm_pin: payload.confirmPin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Change transaction PIN failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message ||
          data?.message ||
          "Transaction PIN updated successfully"
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
      console.log(token)
      const maskedToken = token ? `${String(token).slice(0, 12)}...` : "<none>";

      console.log("[getUserProfile] request", {
        endpoint: GET_USER_PROFILE_ENDPOINT,
        hasToken: Boolean(token),
        tokenPreview: maskedToken
      });

      const response = await safeFetch(GET_USER_PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const responseText = await response.text().catch(() => "");
      const responseJson = parseResponseJson(
        responseText
      ) as ApiResponse<User> | null;

      console.log("[getUserProfile] response", {
        status: response.status,
        ok: response.ok,
        body: formatResponseLogBody(responseText, 4000)
      });

      if (responseJson) {
        console.log(token)
        const authy = AsyncStorage.getItem('authToken')
        console.log(authy)
        console.log("[getUserProfile] parsed response", responseJson);
      }

      if (!response.ok) {
        if (response.status === 401) {
          await clearAuthToken();
          dispatch(logout());
        }
        const errorData = responseJson;
        return rejectWithValue(
          errorData?.data?.message ||
            errorData?.message ||
            `Profile safeFetch failed (${response.status})`
        );
      }

      const apiData = responseJson;
      if (!apiData?.data) {
        return rejectWithValue("Invalid response structure");
      }

      const user = apiData.data;
      await persistUserProfile(user);

      return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Profile safeFetch error"
      );
    }
  }
);

export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      console.log("🔐 restoreAuth: Starting...");
      
      const [token, userProfileStr] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("userProfile")
      ]);
      
      console.log("🔐 restoreAuth: Token found?", !!token);
      console.log("🔐 restoreAuth: User profile found?", !!userProfileStr);

      if (userProfileStr) {
        const user = JSON.parse(userProfileStr) as User;

        if (token) {
          console.log("🔐 restoreAuth: Both token and user found, restoring session");
          dispatch(setCredentials({ token, user, isAuthenticated: true }));

          try {
            await dispatch(getUserProfile()).unwrap();
            console.log("🔐 restoreAuth: User profile validated successfully");
            return { token, user };
          } catch (error) {
            console.error("🔐 restoreAuth: Token validation failed, but keeping user data", error);
            // Don't clear token here - just return user without token
            dispatch(setUserOnly({ user }));
            return { user };
          }
        } else {
          console.log("🔐 restoreAuth: No token, setting user only");
          dispatch(setUserOnly({ user }));
          return { user };
        }
      } else {
        console.log("🔐 restoreAuth: No user profile found");
        // Don't clear token if no user profile - just return
        return rejectWithValue("No user profile found");
      }
    } catch (error: any) {
      console.error("🔐 restoreAuth: Error during restore", error);
      // Don't clear token on error - just return
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

      const response = await safeFetch(UPDATE_USER_PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Profile update failed (${response.status})`
        );
      }

      const apiData = data as ApiResponse<User>;
      const user = apiData.data;

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

      const response = await safeFetch(UPDATE_USER_ADDRESS_PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Address update failed (${response.status})`
        );
      }

      const apiData = data as ApiResponse<User>;
      const user = apiData.data;

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

      const response = await safeFetch(UPDATE_USER_PROFILE_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Profile picture update failed (${response.status})`
        );
      }

      const apiData = data as ApiResponse<User>;
      const user = apiData.data;

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

      const response = await safeFetch(SETUP_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passcode: payload.passcode })
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Setup failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message || data?.message || "Passcode setup successfully"
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
      
      console.log("🔐 Logout - Token exists:", !!token);
      console.log("🔐 Logout - USE_ENCRYPTION:", USE_ENCRYPTION);
      console.log("🔐 Logout - Endpoint:", LOGOUT_AUTH_ENDPOINT);

      const response = await safeFetch(LOGOUT_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
             body: JSON.stringify({})
        }
      });

      console.log("🔐 Logout - Response status:", response.status);

      const data = await response.json();
      console.log("🔐 Logout - Response data:", data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Logout failed (${response.status})`
        );
      }

      await clearAuthToken();

      return { message: "Logged out successfully" };
    } catch (error: any) {
      console.error("🔐 Logout - Error:", error);
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
      const response = await safeFetch(FORGET_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email })
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Forgot passcode request failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message || data?.message || "Reset code sent to email"
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
      const response = await safeFetch(
        FORGET_PASSCODE_VERIFY_OTP_AUTH_ENDPOINT,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email,
            otp: payload.otp
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `OTP verification failed (${response.status})`
        );
      }

      return {
        resetToken: data?.data?.reset_token || ""
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
      const response = await safeFetch(FORGET_PASSCODE_RESET_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: payload.resetToken,
          new_passcode: payload.newPasscode,
          confirm_passcode: payload.confirmNewPasscode
        })
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Reset failed (${response.status})`
        );
      }

      return {
        message:
          data?.data?.message || data?.message || "Passcode reset successfully"
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

      const response = await safeFetch(CHANGE_PASSCODE_AUTH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_passcode: payload.currentPasscode,
          new_passcode: payload.newPasscode,
          confirm_passcode: payload.confirmNewPasscode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Change failed (${response.status})`
        );
      }

      await clearAuthToken();
      return {
        message:
          data?.data?.message ||
          data?.message ||
          "Passcode changed successfully"
      };
    } catch (error: any) {
      return rejectWithValue(
        error.data?.message || error.message || "Change passcode error"
      );
    }
  }
);

export const searchUsers = createAsyncThunk<any[], { search: string }>(
  "auth/searchUsers",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const url = `${SEARCH_USERS_ENDPOINT}?search=${encodeURIComponent(
        payload.search
      )}`;

      const response = await safeFetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data?.data?.message ||
            data?.message ||
            `Search failed (${response.status})`
        );
      }

      if (!data.success)
        return rejectWithValue(data.message || "User search failed");
      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "User search error");
    }
  }
);
