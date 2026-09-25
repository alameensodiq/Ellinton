import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Vibration,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import CustomText from "@/app/components/CustomText";
import Header from "@/app/components/header-back";
import { changePasscode } from "@/app/lib/thunks/authThunks";

const ChangePasscodeScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const isValid =
      currentPasscode.length === 6 &&
      newPasscode.length === 6 &&
      confirmPasscode.length === 6 &&
      newPasscode === confirmPasscode;
    if (!isValid) {
      Vibration.vibrate(100);
      setError("Passcodes do not match or are incomplete.");
      return;
    }

    try {
      const result = await dispatch(
        changePasscode({
          confirmNewPasscode: confirmPasscode,
          currentPasscode: currentPasscode,
          newPasscode: newPasscode,
        })
      ).unwrap();
      router.push({
        pathname: "/(root)/account-settings/sucess-reset-code",
      });
    } catch (err: any) {
      setError(err || "Reset failed");
    }
  };

  const canShowButton =
    currentPasscode.length === 6 &&
    newPasscode.length === 6 &&
    confirmPasscode.length === 6 &&
    newPasscode === confirmPasscode;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 px-4">
        <Header title="Change Passcode" showCancel />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          >
            <CustomText size="xxl" className="mb-6">
              Change your passcode
            </CustomText>
            <CustomText size="lg" className="mb-6" secondary>
              Enter your current passcode and create a new 6-digit passcode.
            </CustomText>
            <View className="mb-10">
              <Text className="text-white text-sm mb-3">Current passcode</Text>
              <OtpInput
                digitCount={6}
                value={currentPasscode}
                onChange={setCurrentPasscode}
                error={!!error}
                inputStyle="h-16 w-14"
              />
            </View>
            <View className="mb-10">
              <Text className="text-white text-sm mb-3">New passcode</Text>
              <OtpInput
                digitCount={6}
                value={newPasscode}
                onChange={setNewPasscode}
                error={!!error}
                inputStyle="h-16 w-14"
              />
            </View>
            <View className="mb-6">
              <CustomText className="mb-3">Confirm new passcode</CustomText>
              <OtpInput
                digitCount={6}
                value={confirmPasscode}
                onChange={setConfirmPasscode}
                error={!!error}
                inputStyle="h-16 w-14"
              />
            </View>
            {error ? (
              <CustomText className="text-red-500 text-left mb-6 text-sm font-semibold">
                {error}
              </CustomText>
            ) : null}
            {canShowButton && (
              <Button
                title={isLoading ? "Resetting..." : "Reset Passcode"}
                variant="primary"
                onPress={handleSubmit}
                className="w-full mt-10"
                disabled={isLoading}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
export default ChangePasscodeScreen;
