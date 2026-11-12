import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Vibration,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import CustomText from "@/app/components/CustomText";
import InfoText from "@/app/components/InfoText";
import ErrorModal from "@/app/components/ErrorModal";

import { loginUser } from "@/app/lib/thunks/authThunks";
import { clearError } from "@/app/lib/slices/authSlice";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  registerDeviceWithBackend,
  registerForPushNotificationsAsync,
} from "@/app/lib/notification.service";
import { getDeviceId, formatPhoneNumber } from "@/app/lib/utils";
import { svgIcons } from "@/app/assets/icons/icons";

export default function CurrentUser() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading, isRestoring, error: authError } = useAppSelector(
    (state) => state.auth
  );

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [customError, setCustomError] = useState("");
  const [savedIdentifier, setSavedIdentifier] = useState("");
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState(
    Platform.OS === "ios" ? "Face ID" : "Fingerprint"
  );
  const [showPasscode, setShowPasscode] = useState(false);
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(true);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const biometricAuthenticationInProgress = useRef(false);

  const userIdentifier = (
    user?.email ||
    user?.phone ||
    savedIdentifier ||
    ""
  ).trim();
  const FingerprintIcon = svgIcons.fingerprint;
  const FaceIcon = svgIcons.faceicon;
  const BiometricIcon = Platform.OS === "ios" ? FaceIcon : FingerprintIcon;

  const handleNumberPress = (num: string) => {
    if (passcode.length < 6) {
      setPasscode((prev) => {
        const next = prev + num;
        setError(false);
        return next;
      });
    }
  };

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleDismissError = () => {
    setShowErrorModal(false);
    setCustomError("");
    dispatch(clearError());
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleBiometricAuth = useCallback(
    async (pinOverride?: string) => {
      if (biometricAuthenticationInProgress.current || isLoading) {
        return;
      }

      biometricAuthenticationInProgress.current = true;
      setIsBiometricAuthenticating(true);

      try {
        const [savedPin, storedEmail, storedProfile] = await Promise.all([
          pinOverride ? Promise.resolve(pinOverride) : AsyncStorage.getItem("userPin"),
          AsyncStorage.getItem("userEmail"),
          AsyncStorage.getItem("userProfile"),
        ]);

        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const targetIdentifier = (
          userIdentifier ||
          storedEmail ||
          parsedProfile?.email ||
          parsedProfile?.phone ||
          ""
        ).trim();

        if (!savedPin || !targetIdentifier) {
          setShowPasscode(true);
          return;
        }

        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Log in with ${biometricLabel}`,
          cancelLabel: "Use Passcode",
          disableDeviceFallback: true,
        });

        if (authResult.success) {
          const deviceId = await getDeviceId();
          const isEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetIdentifier) ||
            targetIdentifier.includes("@");
          const payload = isEmail
            ? {
                email: targetIdentifier.toLowerCase(),
                passcode: savedPin,
                device_id: deviceId,
              }
            : {
                phone: formatPhoneNumber(targetIdentifier),
                passcode: savedPin,
                device_id: deviceId,
              };

          await dispatch(loginUser(payload)).unwrap();

          void (async () => {
            try {
              const token = await registerForPushNotificationsAsync();
              if (token) {
                await registerDeviceWithBackend(token);
              }
            } catch (pushErr) {
              console.warn("Push token sync error (non-fatal):", pushErr);
            }
          })();
        }
      } catch (err: any) {
        console.error("Biometric authentication failed:", err);
        setCustomError(
          typeof err === "string"
            ? err
            : err?.message || "Biometric login failed. Please try again or use your passcode."
        );
        setShowErrorModal(true);
      } finally {
        biometricAuthenticationInProgress.current = false;
        setIsBiometricAuthenticating(false);
      }
    },
    [biometricLabel, dispatch, userIdentifier, isLoading]
  );

  useEffect(() => {
    if (!isRestoring && !user) {
      router.replace("/(auth)/login");
    }
  }, [isRestoring, user, router]);

  const checkBiometricSupport = useCallback(async () => {
    try {
      const [savedPin, storedLoginBio, storedEmail] = await Promise.all([
        AsyncStorage.getItem("userPin"),
        AsyncStorage.getItem("loginBiometricEnabled"),
        AsyncStorage.getItem("userEmail"),
      ]);

      if (storedEmail) {
        setSavedIdentifier(storedEmail);
      }

      if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync) {
        setIsBiometricAvailable(false);
        return;
      }

      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      // Biometric login is opt-in; no saved preference means it is off.
      let isLoginBioEnabled = false;
      if (storedLoginBio !== null) {
        try {
          isLoginBioEnabled = JSON.parse(storedLoginBio) === true;
        } catch {
          isLoginBioEnabled = storedLoginBio === "true";
        }
      }

      if (hasHardware && isEnrolled && savedPin && isLoginBioEnabled) {
        setIsBiometricAvailable(true);
        setShowPasscode(false);
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
      } else {
        setIsBiometricAvailable(false);
      }
    } catch (err) {
      console.error("Error checking biometric login:", err);
    } finally {
      setIsCheckingBiometrics(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkBiometricSupport();
    } else {
      setIsCheckingBiometrics(false);
    }
  }, [user, checkBiometricSupport]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        checkBiometricSupport();
      }
    }, [user, checkBiometricSupport])
  );

  useEffect(() => {
    if (passcode.length === 6 && !isLoading) {
      const t = setTimeout(async () => {
        try {
          if (!userIdentifier) {
            setError(true);
            Vibration.vibrate(400);
            setPasscode("");
            return;
          }

          if (isLoading) return;
          const [deviceId] = await Promise.all([getDeviceId()]);
          const isEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userIdentifier) ||
            userIdentifier.includes("@");
          const payload = isEmail
            ? {
                email: userIdentifier.toLowerCase(),
                passcode,
                device_id: deviceId,
              }
            : {
                phone: formatPhoneNumber(userIdentifier),
                passcode,
                device_id: deviceId,
              };

          await dispatch(loginUser(payload)).unwrap();

          // Save PIN for future biometric logins
          await Promise.all([
            AsyncStorage.setItem("userPin", passcode),
            AsyncStorage.setItem("hasLoggedInBefore", "true"),
          ]);
          setPasscode("");

          void (async () => {
            try {
              const token = await registerForPushNotificationsAsync();
              if (token) {
                const isRegistered = await registerDeviceWithBackend(token);
                if (isRegistered) {
                  console.log("✅ Push token synced with backend");
                }
              }
            } catch (pushErr) {
              console.warn("Push token sync error (non-fatal):", pushErr);
            }
          })();
        } catch (err: any) {
          setError(true);
          Vibration.vibrate(400);
          setPasscode("");
        }
      }, 300);

      return () => clearTimeout(t);
    }
  }, [passcode, dispatch, userIdentifier, isLoading]);

  const userName = user?.full_name || user?.name || "User";
  const userAvatar = user?.passport;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      {isRestoring || !user || isCheckingBiometrics ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#D4FF00" />
        </View>
      ) : (
        <>
          <View className="items-center mt-12 mb-4">
            <View className="w-24 h-24 rounded-full bg-primary-200 overflow-hidden border-4 border-primary-300">
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full bg-primary-500 justify-center items-center">
                  <Text className="text-white font-bold text-lg">
                    {getInitials(userName)}
                  </Text>
                </View>
              )}
            </View>

            <CustomText className="text-center mt-4">Welcome back</CustomText>
            <CustomText className="text-center" size="lg">
              {userName}
            </CustomText>
          </View>

          {isBiometricAvailable && !showPasscode ? (
            <View className="flex-1 justify-center items-center px-6 pb-12">
              <TouchableOpacity
                onPress={() => handleBiometricAuth()}
                disabled={isLoading || isBiometricAuthenticating}
                activeOpacity={0.8}
                className="w-28 h-28 rounded-full bg-primary-400 justify-center items-center border-2 border-accent-100/40 mb-6 shadow-lg"
              >
                {isLoading || isBiometricAuthenticating ? (
                  <ActivityIndicator size="large" color="#D4FF00" />
                ) : (
                  <BiometricIcon width={56} height={56} fill="#D4FF00" />
                )}
              </TouchableOpacity>

              <Text className="text-white text-lg font-semibold text-center mb-1">
                {isLoading
                  ? "Logging in..."
                  : isBiometricAuthenticating
                    ? `Opening ${biometricLabel}...`
                    : `Log in with ${biometricLabel}`}
              </Text>
              <Text className="text-white/60 text-sm text-center mb-8">
                {isLoading || isBiometricAuthenticating
                  ? "Please wait while we verify your credentials..."
                  : `Tap the icon above to trigger ${biometricLabel}`}
              </Text>

              <TouchableOpacity
                onPress={() => setShowPasscode(true)}
                disabled={isLoading || isBiometricAuthenticating}
                className="py-3 px-6 bg-primary-300 rounded-full mb-6"
              >
                <Text className="text-primary-200 font-semibold text-base">
                  Use Passcode Instead
                </Text>
              </TouchableOpacity>

              <InfoText
                text="Not you?"
                actionText="Back to login"
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          ) : (
            <View className="flex-1 justify-between px-6 pb-12">
              <View className="mt-6">
                <Text className="text-white text-base mb-3">
                  Enter your passcode
                </Text>

                <OtpInput
                  digitCount={6}
                  value={passcode}
                  onChange={(value) => {
                    setPasscode(value);
                    setError(false);
                  }}
                  error={error}
                  autoFocus={false}
                  secure={true}
                />

                {error && (
                  <Text className="text-red-500 text-sm mt-4">
                    {typeof authError === "string" && authError
                      ? authError
                      : "Incorrect passcode. Please try again."}
                  </Text>
                )}
              </View>

              <Numpad
                onPress={(num) => !isLoading && handleNumberPress(num)}
                onDelete={() => !isLoading && handleDelete()}
                disabled={isLoading}
              />

              <View className="flex-row justify-center gap-6 items-center mt-4">
                {isBiometricAvailable && (
                  <TouchableOpacity onPress={() => setShowPasscode(false)}>
                    <Text className="text-accent-100 font-semibold text-md">
                      Use {biometricLabel}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forget-password")}
                >
                  <Text className="text-primary-200 font-semibold text-md">
                    Forgot passcode?
                  </Text>
                </TouchableOpacity>
              </View>

              <InfoText
                text=""
                actionText="Back to login"
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          )}

          <ErrorModal
            visible={showErrorModal}
            title="Login Error"
            message={
              customError ||
              (typeof authError === "string" ? authError : "") ||
              "We could not complete your login, give it another shot"
            }
            onDismiss={handleDismissError}
          />

          {isLoading && (
            <View className="absolute inset-0 z-50 bg-black/50 justify-center items-center">
              <View className="bg-primary-100 rounded-lg p-6">
                <ActivityIndicator size="large" color="white" />
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
