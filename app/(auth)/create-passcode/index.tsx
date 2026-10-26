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
  Switch,
  Modal,
  Pressable,
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
  const [biometricConfirmationVisible, setBiometricConfirmationVisible] = useState(false);
  const [biometricNoticeVisible, setBiometricNoticeVisible] = useState(false);

  const handleBiometricToggle = (value: boolean) => {
    if (!value) {
      setEnableBiometric(false);
      return;
    }

    // Explain the requirement before opening the device's native biometric prompt.
    setEnableBiometric(false);
    setBiometricConfirmationVisible(true);
  };

  const handleConfirmBiometricEnable = async () => {
    setBiometricConfirmationVisible(false);
    const biometricName = Platform.OS === "ios" ? "Face ID" : "biometrics";
    try {
      const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      const supportsRequiredBiometric = Platform.OS === "ios"
        ? supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        : supportedTypes.length > 0;
      if (!hasHardware || !isEnrolled || !supportsRequiredBiometric) {
        setEnableBiometric(false);
        setBiometricNoticeVisible(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable Login with ${biometricName}`,
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });
      setEnableBiometric(result.success);
    } catch {
      setEnableBiometric(false);
    }
  };

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
      await dispatch(
        NewUserPasscode({
          phone: phone || "",
          verification_token: verification_token || "",
          passcode,
          confirm_passcode: confirmPasscode,
        })
      ).unwrap();

      // Persist the login preference only after passcode creation succeeds.
      await AsyncStorage.multiSet([
        ["userPin", passcode],
        ["loginBiometricEnabled", String(enableBiometric)],
      ]);

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
                onValueChange={handleBiometricToggle}
                trackColor={{ false: "#3a3a3c", true: "#007AFF" }}
                thumbColor={enableBiometric ? "#ffffff" : "#f4f3f4"}
              />
            </View>

            <Modal
              visible={biometricConfirmationVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setBiometricConfirmationVisible(false)}
            >
              <View className="flex-1 justify-center px-6 bg-black/60">
                <View className="bg-white rounded-2xl p-6">
                  <Text className="text-primary-100 text-lg font-bold mb-2">
                    Enable {Platform.OS === "ios" ? "Face ID" : "Biometrics"}?
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    Make sure {Platform.OS === "ios" ? "Face ID is" : "biometrics are"} enabled in your device settings. Continue to verify with {Platform.OS === "ios" ? "Face ID" : "your device biometric"} and enable biometric login.
                  </Text>
                  <View className="flex-row gap-3 mt-6">
                    <Pressable onPress={() => setBiometricConfirmationVisible(false)} className="flex-1 border border-gray-300 rounded-xl items-center py-3">
                      <Text className="text-gray-700 font-semibold">Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleConfirmBiometricEnable} className="flex-1 bg-primary-100 rounded-xl items-center py-3">
                      <Text className="text-white font-semibold">Continue</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={biometricNoticeVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setBiometricNoticeVisible(false)}
            >
              <View className="flex-1 justify-center px-6 bg-black/60">
                <View className="bg-white rounded-2xl p-6">
                  <Text className="text-primary-100 text-lg font-bold mb-2">
                    {Platform.OS === "ios" ? "Face ID required" : "Biometrics required"}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    Set up {Platform.OS === "ios" ? "Face ID" : "biometrics"} in your device settings before turning on biometric login.
                  </Text>
                  <Pressable
                    onPress={() => setBiometricNoticeVisible(false)}
                    className="bg-primary-100 rounded-xl items-center py-3 mt-6"
                  >
                    <Text className="text-white font-semibold">OK</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>

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
