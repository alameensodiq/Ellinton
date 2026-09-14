import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Vibration,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import CustomText from "@/app/components/CustomText";
import InfoText from "@/app/components/InfoText";
import Loading from "@/app/components/Loading";

import { loginUser } from "@/app/lib/thunks/authThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  registerDeviceWithBackend,
  registerForPushNotificationsAsync,
} from "@/app/lib/notification.service";
import { getDeviceId } from "@/app/lib/utils";
import { svgIcons } from "@/app/assets/icons/icons";

export default function CurrentUser() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading, isRestoring } = useAppSelector(
    (state) => state.auth
  );

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState(
    Platform.OS === "ios" ? "Face ID" : "Fingerprint"
  );
  const [showPasscode, setShowPasscode] = useState(false);
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(true);

  const email = user?.email || "";
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
      try {
        const savedPin =
          pinOverride || (await AsyncStorage.getItem("userPin"));
        if (!savedPin || !email || isLoading) return;

        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Log in with ${biometricLabel}`,
          cancelLabel: "Use Passcode",
          disableDeviceFallback: true,
        });

        if (authResult.success) {
          const deviceId = await getDeviceId();
          await dispatch(
            loginUser({ email, passcode: savedPin, device_id: deviceId })
          ).unwrap();

          const token = await registerForPushNotificationsAsync();
          if (token) {
            await registerDeviceWithBackend(token);
          }
        }
      } catch (err) {
        console.error("Biometric authentication failed:", err);
      }
    },
    [biometricLabel, dispatch, email, isLoading]
  );

  useEffect(() => {
    if (!isRestoring && !user) {
      router.replace("/(auth)/login");
    }
  }, [isRestoring, user, router]);

  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        if (!LocalAuthentication || !LocalAuthentication.hasHardwareAsync)
          return;

        const [hasHardware, isEnrolled, savedPin, storedLoginBio] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          AsyncStorage.getItem("userPin"),
          AsyncStorage.getItem("loginBiometricEnabled"),
        ]);

        let isLoginBioEnabled = true;
        if (storedLoginBio !== null) {
          try {
            isLoginBioEnabled = JSON.parse(storedLoginBio) === true;
          } catch {
            isLoginBioEnabled = storedLoginBio === "true";
          }
        }

        if (hasHardware && isEnrolled && savedPin && isLoginBioEnabled) {
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
        }
      } catch (err) {
        console.error("Error checking biometric login:", err);
      } finally {
        setIsCheckingBiometrics(false);
      }
    };

    if (user && email) {
      checkBiometricSupport();
    } else {
      setIsCheckingBiometrics(false);
    }
  }, [user, email]);

  useEffect(() => {
    if (passcode.length === 6 && !isLoading) {
      const t = setTimeout(async () => {
        try {
          if (!email) {
            setError(true);
            Vibration.vibrate(400);
            setPasscode("");
            return;
          }

          if (isLoading) return;
          const [deviceId] = await Promise.all([getDeviceId()]);
          await dispatch(
            loginUser({ email, passcode, device_id: deviceId })
          ).unwrap();

          // Save PIN for future biometric logins
          await AsyncStorage.setItem("userPin", passcode);
          setPasscode("");

          const token = await registerForPushNotificationsAsync();
          if (token) {
            const isRegistered = await registerDeviceWithBackend(token);
            if (isRegistered) {
              console.log("✅ Push token synced with backend");
            } else {
              console.warn(
                "⚠️ Login succeeded, but push registration failed"
              );
            }
          }
        } catch (err: any) {
          setError(true);
          Vibration.vibrate(400);
          setPasscode("");
        }
      }, 300);

      return () => clearTimeout(t);
    }
  }, [passcode, dispatch, email, isLoading]);

  const userName = user?.full_name || user?.name || "User";
  const userAvatar = user?.passport;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      {isRestoring || !user || isCheckingBiometrics ? (
        <View className="flex-1 justify-center items-center">
          <Loading visible={true} />
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
                activeOpacity={0.8}
                className="w-28 h-28 rounded-full bg-primary-400 justify-center items-center border-2 border-accent-100/40 mb-6 shadow-lg"
              >
                <BiometricIcon width={56} height={56} fill="#D4FF00" />
              </TouchableOpacity>

              <Text className="text-white text-lg font-semibold text-center mb-1">
                Log in with {biometricLabel}
              </Text>
              <Text className="text-white/60 text-sm text-center mb-8">
                Tap the icon above to trigger {biometricLabel}
              </Text>

              <TouchableOpacity
                onPress={() => setShowPasscode(true)}
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
                    Incorrect passcode. Please try again.
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
                text="Not you?"
                actionText="Back to login"
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          )}

          <Loading visible={isLoading} />
        </>
      )}
    </SafeAreaView>
  );
}
