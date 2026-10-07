import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Vibration,
  ScrollView,
  Platform,
  Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import CustomText from "@/app/components/CustomText";
import * as LocalAuthentication from "expo-local-authentication";
import { NewUserPasscode } from "@/app/lib/thunks/authThunks";
import Header from "@/app/components/header-back";

const CreatePasscodeScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(
    (state) => state.auth
  );


  const { phone, verification_token } = useLocalSearchParams<{
    phone: string;
    verification_token: string;
  }>();


  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");
  const [enableBiometric, setEnableBiometric] = useState(false);

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
      // Always save userPin for biometric / quick passcode logins
      await AsyncStorage.setItem("userPin", passcode);
      if (enableBiometric) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: "Enable biometric authentication",
            fallbackLabel: "Use Passcode",
          });
          if (!authResult.success) {
            setError("Biometric authentication failed. Please try again.");
            return;
          }
          await AsyncStorage.setItem("loginBiometricEnabled", "true");
        } else {
          setError("Biometrics not available or enrolled on this device.");
          return;
        }
      } else {
        await AsyncStorage.setItem("loginBiometricEnabled", "true");
      }



      await dispatch(
        NewUserPasscode({
          phone: phone || "",
          verification_token: verification_token || "",
          passcode,
          confirm_passcode: confirmPasscode,
        })
      ).unwrap();

      router.push({
        pathname: "/(auth)/login",
      });
    } catch (err: any) {
      setError(err || "Setup failed");
    }
  };

  const handlePasscodeChange = (value: string) => {
    if (error) setError("");
    setPasscode(value);
  };

  const handleConfirmPasscodeChange = (value: string) => {
    if (error) setError("");
    setConfirmPasscode(value);
  };

  const canSubmit =
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
              Create Passcode
            </CustomText>

            <View className="mb-10">
              <Text className="text-white text-sm mb-3">Passcode</Text>
              <OtpInput
                digitCount={6}
                value={passcode}
                onChange={handlePasscodeChange}
                error={!!error}
                inputStyle="h-16 w-14"
              />
            </View>

            <View className="mb-6">
              <CustomText className="mb-3">Confirm passcode</CustomText>
              <OtpInput
                digitCount={6}
                value={confirmPasscode}
                onChange={handleConfirmPasscodeChange}
                error={!!error}
                inputStyle="h-16 w-14"
              />
            </View>

            <View className="flex-row items-center justify-between mb-6 p-4 bg-primary-200 rounded-xl border border-primary-300">
              <View className="flex-1 pr-2">
                <CustomText className="text-white text-base font-medium">
                  Enable Biometrics
                </CustomText>
                <CustomText secondary className="text-xs">
                  Log in quickly using Face ID or Fingerprint
                </CustomText>
              </View>
              <Switch
                value={enableBiometric}
                onValueChange={setEnableBiometric}
                trackColor={{ false: "#3a3a3c", true: "#007AFF" }}
                thumbColor={enableBiometric ? "#ffffff" : "#f4f3f4"}
              />
            </View>

            {error ? (
              <CustomText className="text-red-500 mb-6 text-sm font-semibold">
                {error}
              </CustomText>
            ) : null}

            <CustomText secondary className="text-center">
              By entering your 6-digit PASSCODE, you agree{"\n"}
              to our <Text className="font-semibold">
                Terms of Service
              </Text> and <Text className="font-semibold">Privacy Policy</Text>
            </CustomText>

            <View className="mt-10 pb-2">
              <Button
                title={isLoading ? "Creating..." : "Create Passcode"}
                variant="primary"
                onPress={handleSubmit}
                className="w-full"
                disabled={!canSubmit || isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default CreatePasscodeScreen;
