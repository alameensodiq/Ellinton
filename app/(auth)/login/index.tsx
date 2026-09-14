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
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform
} from "react-native";
import { useState, useEffect } from "react";
import TextInputField from "@/app/components/inputs/TextInputField";
import OtpInput from "@/app/components/inputs/OtpInput";
import Button from "@/app/components/Button";
import { svgIcons } from "@/app/assets/icons/icons";
import ErrorModal from "@/app/components/ErrorModal";
import Loading from "@/app/components/Loading";
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

const FingerprintIcon = svgIcons.fingerprint;
const FaceIcon = svgIcons.faceicon;

const Login = () => {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [customError, setCustomError] = useState("");
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState(
    Platform.OS === "ios" ? "Face ID" : "Fingerprint"
  );
  const [useBiometric, setUseBiometric] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isLoading, error } = useAppSelector((state) => state.auth);

  const BiometricIcon = Platform.OS === "ios" ? FaceIcon : FingerprintIcon;

  // Auto-fill email and check if user has logged in before & biometric availability
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const [savedPin, savedEmail, userProfile, loggedInFlag, storedLoginBio] = await Promise.all([
          AsyncStorage.getItem("userPin"),
          AsyncStorage.getItem("userEmail"),
          AsyncStorage.getItem("userProfile"),
          AsyncStorage.getItem("hasLoggedInBefore"),
          AsyncStorage.getItem("loginBiometricEnabled"),
        ]);

        const returningUser = Boolean(savedPin || loggedInFlag === "true");
        setHasLoggedInBefore(returningUser);

        if (userProfile) {
          const parsedUser = JSON.parse(userProfile);
          if (parsedUser?.email) {
            setEmail(parsedUser.email);
          }
        } else if (savedEmail) {
          setEmail(savedEmail);
        }

        let isLoginBioEnabled = true;
        if (storedLoginBio !== null) {
          try {
            isLoginBioEnabled = JSON.parse(storedLoginBio) === true;
          } catch {
            isLoginBioEnabled = storedLoginBio === "true";
          }
        }

        if (LocalAuthentication && LocalAuthentication.hasHardwareAsync) {
          const [hasHardware, isEnrolled] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
          ]);

          if (hasHardware && isEnrolled) {
            setIsBiometricAvailable(true);

            const supportedTypes =
              await LocalAuthentication.supportedAuthenticationTypesAsync();

            let label = Platform.OS === "ios" ? "Face ID" : "Fingerprint";
            if (Platform.OS === "ios") {
              if (
                supportedTypes.includes(
                  LocalAuthentication.AuthenticationType.FINGERPRINT
                )
              ) {
                label = "Touch ID";
              }
            } else {
              label = "Fingerprint";
            }
            setBiometricLabel(label);

            if (returningUser && savedPin && isLoginBioEnabled) {
              setUseBiometric(true);
            } else {
              setUseBiometric(false);
            }
          }
        }
      } catch (e) {
        console.error("Error checking login status:", e);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    setShowErrorModal(Boolean(error));
  }, [error]);

  const handleLogin = async () => {
    // If user is returning and in biometric mode, trigger biometric auth
    if (useBiometric && isBiometricAvailable && hasLoggedInBefore) {
      await handleBiometricAuth();
      return;
    }

    // Validation for passcode input
    if (!email || !pin || pin.length !== 6) {
      setCustomError("Please enter your email and 6-digit passcode.");
      setShowErrorModal(true);
      return;
    }

    try {
      const deviceId = await getDeviceId();

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
          "No saved passcode found. Please enter your email and passcode."
        );
        setUseBiometric(false);
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
        setUseBiometric(false);
        setShowErrorModal(true);
        return;
      }

      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      let promptMessage = Platform.OS === "ios" ? `Log in with ${biometricLabel}` : "Log in with Fingerprint";
      if (Platform.OS === "ios") {
        if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          promptMessage = "Log in with Face ID";
        } else if (
          supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          promptMessage = "Log in with Touch ID";
        }
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

  const isBiometricActive = useBiometric && isBiometricAvailable && hasLoggedInBefore;

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

              {isCheckingStatus ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#D4FF00" />
                </View>
              ) : isBiometricActive ? (
                <View className="items-center justify-center my-6">
                  <TouchableOpacity
                    onPress={handleBiometricAuth}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className="w-28 h-28 rounded-full bg-primary-400 justify-center items-center border-2 border-accent-100/40 mb-3 shadow-lg"
                  >
                    {isLoading ? (
                      <ActivityIndicator size="large" color="#D4FF00" />
                    ) : (
                      <BiometricIcon width={56} height={56} fill="#D4FF00" />
                    )}
                  </TouchableOpacity>

                  <Text className="text-white text-base font-semibold text-center mb-1">
                    {isLoading ? "Logging in..." : `Log in with ${biometricLabel}`}
                  </Text>
                  <Text className="text-white/60 text-xs text-center">
                    {isLoading
                      ? "Please wait while we verify your credentials..."
                      : `Tap the icon above to trigger ${biometricLabel}`}
                  </Text>
                </View>
              ) : (
                <>
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
                </>
              )}
            </View>

            <View className="mb-10 mt-2">
              {!isCheckingStatus && !isBiometricActive && (
                <Button
                  title={isLoading ? "Logging in..." : "Login"}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                  onPress={handleLogin}
                />
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

        <Loading visible={isLoading} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;


