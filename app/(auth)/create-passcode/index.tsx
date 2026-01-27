import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import CustomText from "@/app/components/CustomText";
import Header from "@/app/components/header-back";
import { setupPasscode } from "@/app/lib/thunks/authThunks";

const CreatePasscodeScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);


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
        setupPasscode({
          passcode,
        })
      ).unwrap();

      router.push({
        pathname: "/(root)/(tabs)", 
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
        <KeyboardAvoidingView behavior="padding" className="flex-1">
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

          <View className="mt-10">
            <Button
              title={isLoading ? "Creating..." : "Create Passcode"}
              variant="primary"
              onPress={handleSubmit}
              className="w-full"
              disabled={!canSubmit || isLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default CreatePasscodeScreen;
