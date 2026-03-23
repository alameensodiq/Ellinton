import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const CreateTransactionPinScreen = () => {
  const router = useRouter();
  const { userId, source } = useLocalSearchParams<{
    userId?: string;
    source?: string;
  }>();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => router.back();

  const handleOtpChange = (value: string) => {
    const trimmed = value.replace(/\s/g, "");
    setOtp(trimmed);

    if (error && trimmed.length === 4) {
      setError(false);
    }

    if (trimmed.length === 4) {
      router.push({
        pathname: "/(auth)/transacion-pin/confirm",
        params: {
          userId: userId as string,
          transactionPin: trimmed,
          source: source || "signup",
        },
      });
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
            <Text className="text-2xl font-bold text-white">
              Create Transaction PIN
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-6 mb-8">
              Always keep your transaction private. Create a 4-digit transacion.
            </Text>

            <OtpInput
              digitCount={4}
              value={otp}
              onChange={handleOtpChange}
              error={error}
              autoFocus
              inputStyle="w-20 h-20"
            />

            {error && (
              <Text className="text-red-500 text-left mt-4 text-sm font-semibold">
                Code incorrect. Retry.
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
              title={isComplete ? "Continue" : "Enter PIN"}
              variant="primary"
              disabled={!isComplete}
              className="w-full"
            />
          </View>

          <Loading visible={loading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default CreateTransactionPinScreen;
