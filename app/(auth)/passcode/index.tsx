import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Vibration
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
import { registerUser } from "@/app/lib/thunks/authThunks";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase";

const CreatePasscodeScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { phone, email, referralCode } = useLocalSearchParams();
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
        registerUser({
          email: email as string,
          phone: phone as string,
          passcode,
          referral_code: referralCode as string
        })
      ).unwrap();
      console.log(result);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email as string,
          passcode // Using passcode as Firebase password
        );
        console.log("✅ Firebase user created:", userCredential.user.email);

        // Optional: Store Firebase UID in your backend
        // await dispatch(updateUserWithFirebaseUid({
        //   userId: result.userId,
        //   firebaseUid: userCredential.user.uid
        // }));
      } catch (firebaseError: any) {
        // Log but don't block signup if Firebase fails
        console.log("⚠️ Firebase user creation failed:", firebaseError.code);
        // User can still use app, but push notifications may not work
      }
      router.push({
        pathname: "/(auth)/otp",
        params: { userId: result.userId }
      });
    } catch (err: any) {
      setError(err || "Registration failed");
    }
  };

  const canShowButton =
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
              onChange={setPasscode}
              error={!!error}
              inputStyle="h-16 w-14"
            />
          </View>
          <View className="mb-6">
            <CustomText className="mb-3">Confirm passcode</CustomText>
            <OtpInput
              digitCount={6}
              value={confirmPasscode}
              onChange={setConfirmPasscode}
              error={!!error}
              inputStyle="h-16 w-14"
              secure
            />
          </View>
          {error ? (
            <CustomText className="text-red-500 text-left mb-6 text-sm font-semibold">
              {" "}
              {error}
            </CustomText>
          ) : null}
          <CustomText secondary className="text-center">
            {" "}
            By entering your 6-digit PASSCODE, you agree{"\n"}
            to our <Text className="font-semibold">
              Terms of Service
            </Text> and <Text className="font-semibold">Privacy Policy</Text>
          </CustomText>
          {canShowButton && (
            <Button
              title={isLoading ? "Creating..." : "Create Passcode"}
              variant="primary"
              onPress={handleSubmit}
              className="w-full mt-10"
              disabled={isLoading}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
export default CreatePasscodeScreen;
