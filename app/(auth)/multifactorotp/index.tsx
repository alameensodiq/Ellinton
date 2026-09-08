import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  ScrollView,
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
  loginUser,
  MultiFactorOtp,
  resendUserOtp,
  verifyUserOtp
} from "@/app/lib/thunks/authThunks";
import CustomText from "@/app/components/CustomText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "@/app/lib/utils";
import {
  registerDeviceWithBackend,
  registerForPushNotificationsAsync
} from "@/app/lib/notification.service";

const MultiFactorOtpScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, multi } = useAppSelector((state) => state.auth);
  const { userId } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState(30);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      setErrorMessage("Please enter a 6-digit code.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const [challenge, deviceId] = await Promise.all([
        AsyncStorage.getItem("challenge"),
        getDeviceId()
      ]);

      if (!challenge) {
        setErrorMessage("Authentication token not found. Please try again.");
        return;
      }

      if (!deviceId) {
        setErrorMessage("Device ID not found. Please try again.");
        return;
      }

      await dispatch(
        MultiFactorOtp({ device_id: deviceId, otp: otp.trim(), challenge_token: challenge })
      ).unwrap();

      console.log({ device_id: deviceId, otp: otp.trim(), challenge_token: challenge });

      const token = await registerForPushNotificationsAsync();

      console.log(token);

      if (token) {
        await registerDeviceWithBackend(token);
      }

      router.replace({
        pathname: "/(auth)/mfasuccess",
        params: { userId: userId as string }
      });
    } catch {
      setErrorMessage("Code incorrect. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      const [userProfileStr, storedPin, deviceId] = await Promise.all([
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("userPin"),
        getDeviceId()
      ]);

      if (!userProfileStr) {
        setErrorMessage("User profile not found. Please login again.");
        return;
      }

      const user = JSON.parse(userProfileStr);
      const userEmail = user.email;

      if (!storedPin) {
        setErrorMessage("PIN not found. Please login again.");
        return;
      }

      await dispatch(
        loginUser({
          email: userEmail.trim().toLowerCase(),
          passcode: storedPin,
          device_id: deviceId
        })
      ).unwrap();

      setErrorMessage("");
      setRemainingTime(30);
      startCountdown();
    } catch (error) {
      setErrorMessage("Failed to resend code. Please try again.");
    }
  };

  const canResend = remainingTime === 0;

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row justify-start items-center pt-4 pb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 space-y-6">
            <CustomText size="xxl" className="mb-4">
              Verify your Authentication
            </CustomText>
            <CustomText secondary className="mb-8">
              We’ve sent a 6-digit code to your email.
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

            <InfoText
              text={`Code not received? ${
                canResend ? "Send again" : `Resend in ${remainingTime}s`
              }`}
              actionText={canResend ? "Send again" : ""}
              onPress={canResend ? handleResend : undefined}
              disabled={!canResend}
            />
          </View>
        </ScrollView>

        <View className="pb-6 pt-2">
          <Button
            title="Verify"
            variant="primary"
            onPress={handleVerify}
            disabled={otp.trim().length < 6 || isSubmitting}
            className="w-full"
          />
        </View>

        <Loading visible={isSubmitting} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MultiFactorOtpScreen;
