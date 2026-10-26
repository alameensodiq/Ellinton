import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/app/lib/store";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";
import TextInputField from "@/app/components/inputs/TextInputField";
import { forgotPasscode } from "@/app/lib/thunks/authThunks";

const EmailOtpScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleBack = () => router.back();

  const handleEmailChange = (text: string) => {
    const phoneNumber = text.replace(/\D/g, "").slice(0, 11);
    setEmail(phoneNumber);
    setEmailError(
      phoneNumber && phoneNumber.length !== 11
        ? "Phone number must be exactly 11 digits"
        : ""
    );
  };

  const handleContinue = async () => {
    if (!email) {
      setEmailError("Phone number is required");
      return;
    }

    if (email.length !== 11) {
      setEmailError("Phone number must be exactly 11 digits");
      return;
    }

    setIsLoading(true);
    try {
      const resultAction = await dispatch(forgotPasscode({ email })).unwrap();
      router.replace({
        pathname: "/(auth)/verify-forget-password",
        params: { email },
      });
    } catch (error: any) {
      console.log(error);
      setEmailError(error || "Unable to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

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
              Passcode reset
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-4 mb-8">
              Enter your registered email address to continue
            </Text>

            <TextInputField
              label="Phone Number"
              placeholder="Enter your phone number"
              onChangeText={handleEmailChange}
              value={email}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={11}
              error={emailError}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>

          <View className="pb-2">
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              className="w-full"
              disabled={isLoading}
            />
          </View>

          <Loading visible={isLoading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default EmailOtpScreen;
