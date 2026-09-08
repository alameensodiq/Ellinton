import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/app/lib/store";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";
import InfoText from "@/app/components/InfoText";
import { verifyForgotOtp, forgotPasscode } from "@/app/lib/thunks/authThunks";

const EmailOtpScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => router.back();

  const handleOtpChange = (value: string) => {
    const trimmed = value.replace(/\s/g, "");
    setOtp(trimmed);

    if (error && trimmed.length === 6) {
      setError(false);
    }

    if (trimmed.length === 6) {
      handleVerify(trimmed);
    }
  };

  const handleVerify = async (valueToCheck?: string) => {
    const code = valueToCheck ?? otp;

    if (code.trim().length !== 6) {
      setError(true);
      return;
    }

    setLoading(true);
    try {
      const resultAction = await dispatch(
        verifyForgotOtp({ email: email || "", otp: code.trim() })
      ).unwrap();
      router.replace({
        pathname: "/(auth)/reset-passcode",
        params: { resetToken: resultAction.resetToken, email: email || "" },
      });
      console.log(resultAction);
    } catch (error: any) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      await dispatch(forgotPasscode({ email: email || "" })).unwrap();
    } catch (error: any) {
      // Handle error silently or set state if needed
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = otp.trim().length === 6;

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
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 space-y-6 pt-4">
            <Text className="text-2xl font-bold text-white">
              Enter reset code
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-6 mb-8">
              We’ve sent you a 6-digit code number to your email address.
            </Text>

            <OtpInput
              digitCount={6}
              value={otp}
              onChange={handleOtpChange}
              error={error}
              autoFocus
              inputStyle="h-16 w-14"
            />

            {error && (
              <Text className="text-red-500 text-left mt-4 text-sm font-semibold">
                Code incorrect. Retry.
              </Text>
            )}

            <View className="mt-6">
              <InfoText
                text="Code not received?"
                actionText={isResending ? "Sending..." : "Send again"}
                onPress={handleResend}
                disabled={isResending}
              />
            </View>
          </View>
        </ScrollView>

        <View className="pb-6 pt-2">
          <Button
            title={isComplete ? "Verify" : "Continue"}
            variant="primary"
            onPress={() => handleVerify()}
            disabled={!isComplete || loading}
            className="w-full"
          />
        </View>

        <Loading visible={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailOtpScreen;
