import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import InfoText from "@/app/components/InfoText";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const EmailIdentityScreen = () => {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [emailError, setEmailError] = useState("");

  const { user} = useAppSelector((state) => state.auth);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleContinue = () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      return;
    }

    router.push({
      pathname: "/(auth)/passcode",
      params: {
        email: (email || user?.email) ?? "",
        phone: (phone || user?.phone) ?? "",
        referralCode,
      },
    });
  };

  const isContinueDisabled = !email || !validateEmail(email);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 pt-4">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
          >
            <ProgressBar currentStep={2} totalSteps={2} />

            <CustomText size="xxl" className="mb-6 mt-4">
              Your Identity
            </CustomText>

            <TextInputField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(
                  text && !validateEmail(text)
                    ? "Please enter a valid email"
                    : ""
                );
              }}
              placeholder="john.doe@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
            />

            <TextInputField
              label="Referral code (optional)"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              placeholder="NHRGJK"
              autoCapitalize="characters"
              maxLength={6}
            />
          </ScrollView>

          <View className="px-6 pb-6">
            <InfoText
              text="Already registered?"
              actionText="Login"
              onPress={() => router.push("/(auth)/login")}
            />

            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              className="w-full mt-4"
              disabled={isContinueDisabled}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default EmailIdentityScreen;
