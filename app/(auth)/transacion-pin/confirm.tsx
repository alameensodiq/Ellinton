import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";
import {
  createUserAccount,
  createUserTransactionPin
} from "@/app/lib/thunks/authThunks";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const ConfirmTransactionPinScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { userId, transactionPin, source } = useLocalSearchParams<{
    userId?: string;
    transactionPin?: string;
    source?: string;
  }>();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => router.back();

  const handleOtpChange = (value: string) => {
    const trimmed = value.replace(/\s/g, "");
    setOtp(trimmed);

    if (error && trimmed.length === 4) {
      setError(false);
      setErrorMessage("");
    }

    if (trimmed.length === 4) {
      handleVerify(trimmed);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object" && "message" in error) {
      return (error as { message: string }).message;
    }
    if (typeof error === "string") {
      return error;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Failed to set transaction PIN. Please try again.";
  };

  const handleVerify = async (valueToCheck?: string) => {
    const code = valueToCheck ?? otp;

    if (code.length !== 4) {
      setError(true);
      setErrorMessage("Please enter a 4-digit PIN.");
      return;
    }

    if (code !== transactionPin) {
      setError(true);
      setErrorMessage("PIN incorrect. Please retry.");
      return;
    }

    setLoading(true);

    try {

      await dispatch(
        createUserTransactionPin({
          userId: userId as string,
          pin: code
        })
      ).unwrap();
      router.push({
        pathname: "/(auth)/transacion-pin/success",
        params: { userId: userId as string, source: source || "signup" }
      });
    } catch (err: any) {
      setError(true);
      setErrorMessage(getErrorMessage(err));
      // setErrorMessage(
      //   err.message || "Failed to set transaction PIN. Please try again."
      // );
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.length === 4;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 px-6">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="flex-row justify-start items-center pt-4 pb-6">
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 space-y-6 pt-4">
            <Text className="text-2xl font-bold text-white">Confirm PIN</Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-6 mb-8">
              Enter your PIN again to confirm
            </Text>

            <OtpInput
              digitCount={4}
              value={otp}
              onChange={handleOtpChange}
              error={error}
              autoFocus
              inputStyle="w-20 h-20"
              secure
            />

            {error && (
              <Text className="text-red-500 text-left mt-4 text-sm font-semibold">
                {errorMessage}
              </Text>
            )}
          </View>

          <View className="pb-2">
            <Text className="text-center text-white/60 text-xs mb-6">
              by entering your 4-digit PASSCODE. You agree{"\n"}
              to our <Text className="font-semibold">
                Terms of Service
              </Text> and <Text className="font-semibold">Privacy Policy</Text>
            </Text>
            <Button
              title={isComplete ? "Confirm" : "Enter PIN"}
              variant="primary"
              onPress={handleVerify}
              disabled={!isComplete || isLoading}
              className="w-full"
            />
          </View>

          <Loading visible={loading || isLoading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ConfirmTransactionPinScreen;
