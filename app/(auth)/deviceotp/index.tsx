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

const DeviceOtpScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    isLoading,
    device,
    token: reduxToken
  } = useAppSelector((state) => state.auth);
  console.log(reduxToken);
  const { userId, token } = useLocalSearchParams();
  console.log(token);

  const [otp, setOtp] = useState("");
  const [otp2, setOtp2] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessage2, setErrorMessage2] = useState("");
  const [remainingTime, setRemainingTime] = useState(30);
  const [intervalId, setIntervalId] = useState<number | null>(null);

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
    const saveTokenToStorage = async () => {
      const authToken = reduxToken || (token as string);
      console.log(authToken);
      if (authToken) {
        try {
          await AsyncStorage.setItem("authToken", authToken);
          console.log("✅ Token saved to AsyncStorage from DeviceOtpScreen");

          // Verify it was saved
          const savedToken = await AsyncStorage.getItem("authToken");
          console.log(
            "🔐 Verified token in storage:",
            savedToken ? "Present" : "Missing"
          );
        } catch (error) {
          console.error("Failed to save token to AsyncStorage:", error);
        }
      }
    };

    saveTokenToStorage();
  }, [reduxToken, token]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setErrorMessage("Please enter a 6-digit code.");
      return;
    }
    if (otp2.length !== 6) {
      setErrorMessage2("Please enter a 6-digit code.");
      return;
    }

    setErrorMessage("");
    setErrorMessage2("");

    // Get token from AsyncStorage instead of relying on URL param
     let authToken = await AsyncStorage.getItem("authToken");

    if (!authToken) {
      try {
        const dataStr = await AsyncStorage.getItem("data");
        if (dataStr) {
          const parsedData = JSON.parse(dataStr);
          authToken = parsedData?.access_token || parsedData?.token;
          console.log(
            "🔑 Retrieved token from AsyncStorage:",
            authToken ? "Present" : "Missing"
          );
          console.log(authToken)
        }
      } catch (error) {
        console.error("Failed to get token from AsyncStorage:", error);
      }
    }

    if (!authToken) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }

    try {
      const [deviceId, pushToken] = await Promise.all([
        getDeviceId(),
        getPushToken()
      ]);

      if (!pushToken) {
        setErrorMessage(
          "Unable to get push notification token. Please try again."
        );
        return;
      }

      console.log(
        "📤 Sending DeviceOtp verification with token:",
        authToken.substring(0, 30) + "..."
      );

      await dispatch(
        DeviceOtp({
          push_token: pushToken,
          device_id: deviceId,
          platform: Platform.OS,
          app_version: Constants.expoConfig?.version || "2.0.5",
          device_make: Device.manufacturer || "Unknown",
          device_model: Device.modelName || Platform.OS,
          device_name: Device.deviceName || "Unknown",
          email_otp: otp2,
          sms_otp: otp,
          token: authToken
        })
      ).unwrap();

      // 2. Request/Get the Push Token
      // const pushNotificationToken = await registerForPushNotificationsAsync();

      // console.log(pushNotificationToken);

      // // 3. If we got a token, send it to the backend immediately
      // if (pushNotificationToken) {
      //   const isRegistered = await registerDeviceWithBackend(
      //     pushNotificationToken
      //   );
      //   if (isRegistered) {
      //     console.log("✅ Push token synced with backend");
      //   } else {
      //     console.warn("⚠️ Login succeeded, but push registration failed");
      //   }
      // }

      // After successful verification, redirect
      router.replace({
        pathname: "/(auth)/devicesuccess",
        params: { userId: userId as string }
      });
    } catch (error: any) {
      // console.error("Verification error:", error);
      setErrorMessage(error?.message || "Code incorrect. Try again.");
      setErrorMessage2(error?.message || "Code incorrect. Try again.");
    }
  };

  const handleResend = async () => {
    try {
      const [deviceId] = await Promise.all([getDeviceId()]);
      await dispatch(resendDeviceOtp({ device_id: deviceId })).unwrap();
      setErrorMessage("");
      setErrorMessage2("");
      setRemainingTime(30);
      startCountdown();
    } catch {
      setErrorMessage("Failed to resend code. Please try again.");
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
              We've sent a 6-digit code to your phone and email.
            </CustomText>
            <CustomText secondary className="mb-2">
              Device Otp
            </CustomText>
            <OtpInput
              digitCount={6}
              value={otp}
              onChange={setOtp}
              error={!!errorMessage}
              autoFocus
            />
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
              text={`Code not received? ${
                canResend ? "Send again" : `Resend in ${remainingTime}s`
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
              disabled={otp.length < 6 || otp2.length < 6 || isLoading}
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
