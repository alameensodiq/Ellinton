"use client";

import {
  Text,
  View,
  ImageBackground,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  Platform
} from "react-native";
import { useState, useEffect } from "react";
import TextInputField from "@/app/components/inputs/TextInputField";
import OtpInput from "@/app/components/inputs/OtpInput";
import Button from "@/app/components/Button";
import { svgIcons } from "@/app/assets/icons/icons";
import ErrorModal from "@/app/components/ErrorModal";
import { SafeAreaView } from "react-native-safe-area-context";
import InfoText from "@/app/components/InfoText";
import { useRouter } from "expo-router";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import CustomText from "@/app/components/CustomText";
import images from "@/app/assets/images";
import { loginUser } from "@/app/lib/thunks/authThunks";
import { clearError } from "@/app/lib/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  registerDeviceWithBackend,
  registerForPushNotificationsAsync
} from "@/app/lib/notification.service";
import { getDeviceId } from "@/app/lib/utils";
import * as LocalAuthentication from "expo-local-authentication";

const Login = () => {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [customError, setCustomError] = useState("");
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Auto-fill email and check if user has logged in before
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const [savedPin, savedEmail, userProfile, loggedInFlag] = await Promise.all([
          AsyncStorage.getItem("userPin"),
          AsyncStorage.getItem("userEmail"),
          AsyncStorage.getItem("userProfile"),
          AsyncStorage.getItem("hasLoggedInBefore"),
        ]);

        const returningUser = Boolean(savedPin || loggedInFlag === "true");
        setHasLoggedInBefore(returningUser);
        setShowPasscodeInput(!returningUser);

        if (userProfile) {
          const parsedUser = JSON.parse(userProfile);
          if (parsedUser?.email) {
            setEmail(parsedUser.email);
          }
        } else if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (e) {
        setShowPasscodeInput(true);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    setShowErrorModal(Boolean(error));
  }, [error]);

  const handleLogin = async () => {
    // If user is returning and hasn't toggled manual passcode entry, trigger biometric auth
    if (hasLoggedInBefore && !showPasscodeInput) {
      await handleBiometricAuth();
      return;
    }

    // If 6-digit passcode is entered, use passcode login directly
    if (email && pin.length === 6) {
      try {
        const deviceId = await getDeviceId();
        console.log(deviceId);
        console.log(email, pin);

        await dispatch(
          loginUser({
            email: email.trim().toLowerCase(),
            passcode: pin,
            device_id: deviceId
          })
        ).unwrap();

        await AsyncStorage.setItem("userPin", pin);
        await AsyncStorage.setItem("userEmail", email.trim().toLowerCase());
        await AsyncStorage.setItem("hasLoggedInBefore", "true");
        await new Promise((resolve) => setTimeout(resolve, 500));

        const token = await registerForPushNotificationsAsync();
        if (token) {
          const isRegistered = await registerDeviceWithBackend(token);
          if (isRegistered) {
            console.log("✅ Push token synced with backend");
          }
        }
      } catch (error) {
        console.error("❌ Login failed:", error);
      }
      return;
    }

    // Validation for passcode input
    if (!email || !pin) {
      setCustomError("Please enter your email and 6-digit passcode.");
      setShowErrorModal(true);
      return;
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleDismissError = () => {
    setShowErrorModal(false);
    setCustomError("");
    dispatch(clearError());
  };

  const handleBiometricAuth = async () => {
    try {
      const [savedPin, storedEmail, userProfile] = await Promise.all([
        AsyncStorage.getItem("userPin"),
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userProfile"),
      ]);

      const parsedProfile = userProfile ? JSON.parse(userProfile) : null;
      const targetEmail = (
        email ||
        storedEmail ||
        parsedProfile?.email ||
        ""
      ).trim().toLowerCase();
      const targetPin = pin || savedPin;

      if (!targetEmail || !targetPin) {
        setCustomError(
          "No saved passcode found. Please enter your passcode to log in for the first time."
        );
        setShowPasscodeInput(true);
        setShowErrorModal(true);
        return;
      }

      if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
        setCustomError(
          "Biometric native module not found in the current app build."
        );
        setShowErrorModal(true);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setCustomError(
          "Biometric authentication is not supported or not set up on this device. Please enter your passcode."
        );
        setShowPasscodeInput(true);
        setShowErrorModal(true);
        return;
      }

      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      let promptMessage = "Authenticate to log in";
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        promptMessage = "Use Face ID to log in";
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        promptMessage =
          Platform.OS === "ios"
            ? "Use Touch ID to log in"
            : "Scan Fingerprint to log in";
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });

      if (!authResult.success) {
        console.log("Biometric authentication cancelled or failed:", authResult.error);
        return;
      }

      const deviceId = await getDeviceId();

      await dispatch(
        loginUser({
          email: targetEmail,
          passcode: targetPin,
          device_id: deviceId,
        })
      ).unwrap();

      await new Promise((resolve) => setTimeout(resolve, 500));

      const token = await registerForPushNotificationsAsync();
      if (token) {
        const isRegistered = await registerDeviceWithBackend(token);
        if (isRegistered) {
          console.log("✅ Push token synced with backend");
        }
      }
    } catch (error: any) {
      console.error("❌ Biometric login failed:", error);
      setCustomError(
        typeof error === "string"
          ? error
          : error?.message || "Biometric authentication failed. Please try again."
      );
      setShowErrorModal(true);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-primary-100">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16,
              justifyContent: inputFocused ? "flex-start" : "space-between"
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mt-9">
              <View className="bg-primary-400 h-80 rounded-3xl overflow-hidden">
                <ImageBackground
                  source={images.login_bg}
                  resizeMode="cover"
                  className="w-full h-full p-5 flex-row justify-between items-start"
                >
                  <Image
                    source={images.login_logo}
                    className="w-32 h-24"
                    resizeMode="contain"
                  />
                  <View className="flex-col items-end mt-4">
                    <CustomText
                      weight="bold"
                      className="text-center mb-4 max-w-72"
                      size="xs"
                      secondary
                    >
                      Welcome to the{"\n"}bank of more
                    </CustomText>
                  </View>
                </ImageBackground>
              </View>
            </View>

            <View className="w-full mt-2">
              <CustomText weight="bold" className="mb-4" size="lg">
                Login to your account
              </CustomText>

              <TextInputField
                label="Email"
                placeholder="Enter your email address"
                value={email}
                keyboardType="email-address"
                onChangeText={handleEmailChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />

              {showPasscodeInput && (
                <>
                  <CustomText weight="bold" className="mb-2" size="sm" secondary>
                    Enter your passcode
                  </CustomText>

                  <OtpInput
                    digitCount={6}
                    value={pin}
                    onChange={handlePinChange}
                    inputStyle="h-16 w-14"
                    secure
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                </>
              )}
            </View>

            <View className="mb-10 mt-2">
              <Button
                title={isLoading ? "Logging in..." : "Login"}
                variant="primary"
                className="w-full"
                disabled={isLoading}
                onPress={handleLogin}
              />

              {hasLoggedInBefore && !showPasscodeInput && (
                <Pressable onPress={() => setShowPasscodeInput(true)}>
                  <Text className="text-primary-200 text-center font-semibold text-md mt-3">
                    Use passcode instead
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={() => router.push("/(auth)/forget-password")}>
                <Text className="text-primary-200 text-center font-semibold text-md mt-4">
                  Forgot passcode?
                </Text>
              </Pressable>

              <InfoText
                text="Don't have an account?"
                actionText="Sign up"
                onPress={() => router.push("/(auth)/create-account-info")}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ErrorModal
          visible={showErrorModal}
          title="Login Error"
          message={
            customError ||
            error ||
            "We could not complete your login, give it another shot"
          }
          onDismiss={handleDismissError}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
