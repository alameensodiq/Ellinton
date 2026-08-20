import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";
import InfoText from "@/app/components/InfoText";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  DeviceOtp,
  resendDeviceOtp,
  resendUserOtp
} from "@/app/lib/thunks/authThunks";
import CustomText from "@/app/components/CustomText";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "@/app/lib/utils";
import {
  getPushToken,
  registerDeviceWithBackend,
  registerForPushNotificationsAsync
} from "@/app/lib/notification.service";
import { useSelector } from "react-redux";


const DeviceOtpScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    isLoading,
    device,
    token: reduxToken,
    user: reduxUser
  } = useAppSelector((state) => state.auth);
  console.log(reduxToken);
  const { token } = useLocalSearchParams();
  console.log(token);
  const userId = useSelector((state: any) => state.auth.user?.id);
  console.log(userId);

  const [otp, setOtp] = useState("");
  const [otp2, setOtp2] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [remainingTime, setRemainingTime] = useState(30);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);


  const startCountdown = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    const id = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  useEffect(() => {
    startCountdown();
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Save token to AsyncStorage when component mounts
  useEffect(() => {
    const loadToken = async () => {
      try {
        // Method 1: Check stored data first (most comprehensive)
        const dataStr = await AsyncStorage.getItem("data");
        if (dataStr) {
          const parsedData = JSON.parse(dataStr);
          const token = parsedData?.access_token || parsedData?.token;
          if (token) {
            console.log("✅ Token found in stored data");
            setAuthToken(token);
            return;
          }
        }

        // Method 2: Check direct authToken key
        const directAuthToken = await AsyncStorage.getItem("authToken");
        if (directAuthToken) {
          console.log("✅ Token found in authToken key");
          setAuthToken(directAuthToken);
          return;
        }

        // Method 3: Fallback to URL param
        if (token && typeof token === "string") {
          console.log("✅ Token from URL param");
          setAuthToken(token);
          // Save it for future use
          await AsyncStorage.setItem("authToken", token);
          return;
        }

        // Method 4: Fallback to Redux token
        if (reduxToken) {
          console.log("✅ Token from Redux");
          setAuthToken(reduxToken);
          // Save it for future use
          await AsyncStorage.setItem("authToken", reduxToken);
          return;
        }

        console.log("❌ No token found anywhere");
        setErrorMessage("Session expired. Please login again.");
      } catch (error) {
        console.error("Failed to load token:", error);
        setErrorMessage("Failed to load session. Please login again.");
      }
    };

    loadToken();
  }, [reduxToken, token]);

  const handleVerify = async () => {
    // if (otp.length !== 6) {
    //   setErrorMessage("Please enter a 6-digit code.");
    //   return;
    // }
    if (otp2.length !== 6) {
      setErrorMessage2("Please enter a 6-digit code.");
      return;
    }

    // setErrorMessage("");
    setErrorMessage2("");

    if (!authToken) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    try {
      const [deviceId, pushToken] = await Promise.all([
        getDeviceId(),
        getPushToken()
      ]);

      // if (!pushToken) {
      //   setErrorMessage(
      //     "Unable to get push notification token. Please allow notification in settings and login again"
      //   );
      //   return;
      // }

      const payload: any = {
        device_id: deviceId,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version || "2.0.5",
        device_make: Device.manufacturer || "Unknown",
        device_model: Device.modelName || Platform.OS,
        device_name: Device.deviceName || "Unknown",
        otp: otp2,
        // sms_otp: otp,
        token: authToken
      };

      // Only add push_token if it's available
      if (pushToken) {
        payload.push_token = pushToken;
        console.log("✅ Push token available and included");
      } else {
        console.log("⚠️ Push token not available, skipping");
      }

      console.log("📤 Dispatching DeviceOtp...");
      const result = await dispatch(
        DeviceOtp(payload)
      ).unwrap();

      console.log("✅ DeviceOtp succeeded, result:", result);

      // ✅ Extract userId from the API response
      const userIdFromResponse = result?.user?.id;

      // Also try to get from Redux after the dispatch
      // Wait a moment for Redux to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userIdFromRedux = reduxUser?.id;
      const finalUserId = userIdFromResponse || userIdFromRedux;

      // ✅ The token is now automatically saved to Redux state by the slice
      // Access the updated Redux state using useAppSelector

      // Get userId from Redux state or AsyncStorage
      let userId = null;
      try {
        // Try from Redux user object first
        if (reduxUser?.id) {
          userId = reduxUser.id;
          console.log("✅ Got userId from Redux:", userId);
        } else {
          // Fallback to AsyncStorage
          const userProfileStr = await AsyncStorage.getItem("userProfile");
          if (userProfileStr) {
            const userProfile = JSON.parse(userProfileStr);
            userId = userProfile.id;
            console.log("✅ Got userId from AsyncStorage:", userId);
          }
        }
      } catch (err) {
        console.error("Failed to get user profile:", err);
      }

      const token = await registerForPushNotificationsAsync();

      console.log(token);

      // 3. If we got a token, send it to the backend immediately
      if (token) {
        const isRegistered = await registerDeviceWithBackend(token);
        if (isRegistered) {
          // console.log("✅ Push token synced with backend");
        } else {
          // console.warn("⚠️ Login succeeded, but push registration failed");
        }
      }

      console.log(finalUserId.toString());

      router.replace({
        pathname: "/(auth)/devicesuccess",
        params: { userId: finalUserId.toString() }
      });

      // Navigate to success screen
      // if (!userId) {
      //   router.replace("/(auth)/devicesuccess");
      // } else {
      //   router.replace({
      //     pathname: "/(auth)/devicesuccess",
      //     params: { userId: userId }
      //   });
      // }
    } catch (error: any) {
      // setErrorMessage("");
      setErrorMessage2("");
      const errorMsg = error?.message || "Code incorrect. Try again.";
      console.log("Setting error message:", errorMsg, error);
      // setErrorMessage(errorMsg);
      setErrorMessage2(errorMsg);
    }
  };

  const handleResend = async () => {
    try {
      const [deviceId] = await Promise.all([getDeviceId()]);
      console.log(deviceId);
      const token = authToken || undefined;
      console.log(token);

      await dispatch(resendDeviceOtp({ device_id: deviceId, token })).unwrap();
      // setErrorMessage("");
      setErrorMessage2("");
      setRemainingTime(30);
      startCountdown();
    } catch {
      // setErrorMessage("Failed to resend code. Please try again.");
      setErrorMessage2("Failed to resend code. Please try again.");
    }
  };

  const canResend = remainingTime === 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 px-6">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="flex-row justify-start items-center pt-4 pb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 space-y-6">
            <CustomText size="xxl" className="mb-4">
              Verify your Device and Identity
            </CustomText>
            <CustomText secondary className="mb-8">
              We've sent a 6-digit code to your  email.
            </CustomText>
            {/* <CustomText secondary className="mb-2">
              Device Otp
            </CustomText>
            <OtpInput
              digitCount={6}
              value={otp}
              onChange={setOtp}
              error={!!errorMessage}
              autoFocus
               textContentType="oneTimeCode"  // ✅ iOS
              autoComplete="sms-otp" 
            /> */}
            {errorMessage && (
              <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
                {errorMessage}
              </CustomText>
            )}
            <CustomText secondary className="mb-2 mt-6">
              Email Otp
            </CustomText>
            <OtpInput
              digitCount={6}
              value={otp2}
              onChange={setOtp2}
              error={!!errorMessage2}
              autoFocus
            />

            {errorMessage2 && (
              <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
                {errorMessage2}
              </CustomText>
            )}

            <InfoText
              text={`Code not received? ${canResend ? "Send again" : `Resend in ${remainingTime}s`
                }`}
              actionText={canResend ? "Send again" : ""}
              onPress={canResend ? handleResend : undefined}
              disabled={!canResend}
            />
          </View>

          <View className="pb-2">
            <Button
              title="Verify"
              variant="primary"
              onPress={handleVerify}
              disabled={otp2.length < 6 || isLoading}
              className="w-full"
            />
          </View>

          <Loading visible={isLoading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default DeviceOtpScreen;
