import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";

const PersonalDetailsScreen = () => {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");

  const handleContinue = () => {
    router.push({
      pathname: "/(auth)/phone-number-screen",
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim(),
      },
    });
  };

  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-primary-100 pt-4">
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <StatusBar />

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressBar currentStep={1} totalSteps={3} />

          <CustomText size="xxl" className="mb-2 mt-10">
            Tell us about yourself
          </CustomText>
          <CustomText secondary className="mb-10">
            Please enter your name exactly as it appears on your ID.
          </CustomText>

          <TextInputField
            label="First Name"
            placeholder="e.g. John"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInputField
            label="Last Name"
            placeholder="e.g. Doe"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInputField
            label="Middle Name (Optional)"
            placeholder="e.g. Michael"
            value={middleName}
            onChangeText={setMiddleName}
          />
        </ScrollView>

        <View className="px-6 pb-6">
          <Button
            title="Continue"
            variant="primary"
            onPress={handleContinue}
            className="w-full mt-4"
            disabled={!isFormValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PersonalDetailsScreen;
