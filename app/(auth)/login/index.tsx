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
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";
import { Switch } from "react-native";

const Login = () => {
  const FingerprintIcon = svgIcons.fingerprint;
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [customError, setCustomError] = useState("");

  const router = useRouter();
  const dispatch = useAppDispatch();
  const BIOMETRIC_STORAGE_KEY = "biometricEnabled";

  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Auto-fill email if user profile is saved
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const userProfile = await AsyncStorage.getItem("userProfile");
        if (userProfile) {
          const parsedUser = JSON.parse(userProfile);
          if (parsedUser?.email) {
            setEmail(parsedUser.email);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    loadSavedEmail();
    const loadBiometricState = async () => {
      try {
        const stored = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
        if (stored !== null) {
          setMfaEnabled(JSON.parse(stored)); // parse to boolean
        } else {
          // Default value (e.g., false) – you can also check with API if needed
          setMfaEnabled(false);
        }
      } catch (error) {
        console.error("Failed to load biometric state:", error);
        setMfaEnabled(false); // fallback
      }
    };
    loadBiometricState();
  }, []);

  useEffect(() => {
    setShowErrorModal(Boolean(error));
  }, [error]);

  const handleLogin = async () => {
    if (!email || !pin) return;

    try {
      const [deviceId] = await Promise.all([getDeviceId()]);
      console.log(deviceId);
      console.log(email, pin);

      // 1. Log in to your app
      await dispatch(
        loginUser({
          email: email.trim().toLowerCase(),
          passcode: pin,
          device_id: deviceId
        })
      ).unwrap();

      await AsyncStorage.setItem("userPin", pin);
      await AsyncStorage.setItem("userEmail", email.trim().toLowerCase());
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Request/Get the Push Token
      const token = await registerForPushNotificationsAsync();
      console.log("Push Token:", token);

      // 3. If we got a token, send it to the backend immediately
      if (token) {
        const isRegistered = await registerDeviceWithBackend(token);
        if (isRegistered) {
          console.log("✅ Push token synced with backend");
          console.log("📱 Ready to receive push notifications from backend");
        } else {
          console.warn("⚠️ Login succeeded, but push registration failed");
        }
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
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

  const [mfaEnabled, setMfaEnabled] = useState(false);

  const handleBiometricAuth = async () => {
    try {
      if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
        setCustomError(
          "Biometric native module not found in the current app build. Please rebuild the app (npx expo run:android or npx expo run:ios)."
        );
        setShowErrorModal(true);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setCustomError(
          "Biometric authentication is not supported or not enrolled on this device."
        );
        setShowErrorModal(true);
        return;
      }

      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isIOS = Platform.OS === "ios";
      const isAndroid = Platform.OS === "android";

      let promptMessage = "Authenticate to log in";
      if (
        isIOS ||
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        promptMessage = "Use Face Recognition to log in";
      } else if (
        isAndroid ||
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        promptMessage = "Scan Fingerprint to log in";
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

      const [deviceId, savedPin, userProfile, storedEmail] = await Promise.all([
        getDeviceId(),
        AsyncStorage.getItem("userPin"),
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("userEmail"),
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
          "No saved credentials found. Please log in with your passcode first."
        );
        setShowErrorModal(true);
        return;
      }

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


  const handleMfaToggle = async (value: boolean) => {
    // Optimistic update
    setMfaEnabled(value);

    try {
      // Call your API
      await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      // Revert UI on failure
      setMfaEnabled(!value);
      console.error("MFA update failed:", err);
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
            </View>

            <View className="rounded-2xl overflow-hidden mt-1">

              <View className="flex-row justify-center items-center px-6 py-2">
                {
                  mfaEnabled && (
                    <Pressable onPress={handleBiometricAuth}>
                      <FingerprintIcon
                        width={60} height={60}
                      />
                    </Pressable>

                  )
                }

              </View>
              <View className="flex-row items-center px-6">
                <Text className="text-white text-base flex-1">Biometric</Text>
                <Switch
                  value={mfaEnabled}
                  onValueChange={handleMfaToggle}
                  trackColor={{ false: "#555", true: "#63642A" }}
                  thumbColor={mfaEnabled ? "#fff" : "#ccc"}
                />
              </View>
            </View>

            <View className="mb-10 mt-2">
              <Button
                title={isLoading ? "Logging in..." : "Login"}
                variant="primary"
                className="w-full"
                disabled={isLoading}
                onPress={handleLogin}
              />
              {/* <Button
                title="📱 Test Push Notification"
                variant="secondary"
                className="w-full mt-2"
                onPress={testFCM}
              /> */}

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
