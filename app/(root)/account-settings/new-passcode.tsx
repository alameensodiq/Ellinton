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
import { resetPasscode } from "@/app/lib/thunks/authThunks";

const ResetPasscodeScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { resetToken, email } = useLocalSearchParams();
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const isValid =
      passcode.length === 6 &&
      confirmPasscode.length === 6 &&
      passcode === confirmPasscode;
    if (!isValid) {
      Vibration.vibrate(100);
      setError("Passcodes do not match or are incomplete.");
      return;
    }

    try {
      const result = await dispatch(
        resetPasscode({
          resetToken: resetToken as string,
          newPasscode: passcode as string,
          confirmNewPasscode: confirmPasscode as string,
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
    passcode.length === 6 &&
    confirmPasscode.length === 6 &&
    passcode === confirmPasscode;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          >
            <Header title="" showCancel />
            <CustomText size="xxl" className="mb-6">
              Enter your new passcode
            </CustomText>
            <CustomText size="lg" className="mb-6" secondary>
              Always keep your passcode private. Create a 6-digit passcode.
            </CustomText>
            <View className="mb-10">
              <Text className="text-white text-sm mb-3">New passcode</Text>
              <OtpInput
                digitCount={6}
                value={passcode}
                onChange={setPasscode}
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
export default ResetPasscodeScreen;
