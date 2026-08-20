import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";
import { changeTransactionPin, ResetTransaction } from "@/app/lib/thunks/authThunks";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const ResetTransactionPinScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => router.back();

  const cleanPin = (value: string) => value.replace(/\s/g, "");

  const handleCurrentPinChange = (value: string) => {
    const trimmed = cleanPin(value);
    setCurrentPin(trimmed);

    if (error && trimmed.length === 4) {
      setError(false);
      setErrorMessage("");
    }
  };

  const handlePinChange = (value: string) => {
    const trimmed = cleanPin(value);
    setPin(trimmed);

    if (error && trimmed.length === 4) {
      setError(false);
      setErrorMessage("");
    }
  };

  const handleConfirmPinChange = (value: string) => {
    const trimmed = cleanPin(value);
    setConfirmPin(trimmed);

    if (error && trimmed.length === 4) {
      setError(false);
      setErrorMessage("");
    }
  };

  const handleSubmit = async () => {
    if (
      currentPin.length !== 4 ||
      pin.length !== 4 ||
      confirmPin.length !== 4
    ) {
      setError(true);
      setErrorMessage("Please enter all  PINs.");
      return;
    }

    if (pin !== confirmPin) {
      setError(true);
      setErrorMessage("New PINs do not match.");
      return;
    }

    // if (currentPin === pin) {
    //   setError(true);
    //   setErrorMessage("New PIN must be different from current PIN.");
    //   return;
    // }

    setLoading(true);

    try {
      console.log({
          otp: currentPin,
          pin: pin,
          confirm_pin: confirmPin,
        })
      await dispatch(
        ResetTransaction({
          otp: currentPin,
          pin: pin,
          confirm_pin: confirmPin,
        })
      ).unwrap();

      router.push({
        pathname: "/(root)/account-settings/transaction-pin-success",
      });
    } catch (err: any) {
      setError(true);
      setErrorMessage(
        err || "Failed to reset transaction PIN. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isComplete =
    currentPin.length === 4 &&
    pin.length === 4 &&
    confirmPin.length === 4 &&
    pin === confirmPin;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-row justify-start items-center pt-4 pb-6">
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-1"
          >
            <Text className="text-2xl font-bold text-white">
              Reset Transaction PIN
            </Text>

            <Text className="text-accent-100 text-base leading-relaxed mt-6 mb-8">
              Enter your Otp and choose a new 4-digit PIN
            </Text>

            {/* Current PIN */}
            <View className="mb-6">
              <Text className="text-white text-sm mb-3">OTP</Text>
              <OtpInput
                digitCount={4}
                value={currentPin}
                onChange={handleCurrentPinChange}
                error={error}
                autoFocus
                inputStyle="w-20 h-16"
              />
            </View>

            {/* New PIN */}
            <View className="mb-6">
              <Text className="text-white text-sm mb-3">New PIN</Text>
              <OtpInput
                digitCount={4}
                value={pin}
                onChange={handlePinChange}
                error={error}
                inputStyle="w-20 h-16"
              />
            </View>

            {/* Confirm PIN */}
            <View className="mb-6">
              <Text className="text-white text-sm mb-3">Confirm New PIN</Text>
              <OtpInput
                digitCount={4}
                value={confirmPin}
                onChange={handleConfirmPinChange}
                error={error}
                inputStyle="w-20 h-16"
              />
            </View>

            {error && (
              <Text className="text-red-500 mt-4 text-sm font-semibold">
                {errorMessage}
              </Text>
            )}

            <View className="pb-2">
              <Text className="text-center text-white/60 text-xs mb-6">
                By continuing, you agree to our{" "}
                <Text className="font-semibold">Terms of Service</Text> and{" "}
                <Text className="font-semibold">Privacy Policy</Text>
              </Text>

              <Button
                title={isComplete ? "Confirm Change" : "Enter PINs"}
                variant="primary"
                onPress={handleSubmit}
                disabled={!isComplete || isLoading}
                className="w-full"
              />
            </View>
          </ScrollView>

          <Loading visible={loading || isLoading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ResetTransactionPinScreen;
