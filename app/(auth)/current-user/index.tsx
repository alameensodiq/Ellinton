import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Vibration
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import CustomText from "@/app/components/CustomText";
import { Image } from "react-native";
import InfoText from "@/app/components/InfoText";
import { loginUser } from "@/app/lib/thunks/authThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import Loading from "@/app/components/Loading";
import {
  registerDeviceWithBackend,
  registerForPushNotificationsAsync
} from "@/app/lib/notification.service";
import { getDeviceId } from "@/app/lib/utils";

export default function CurrentUser() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading, isRestoring } = useAppSelector(
    (state) => state.auth
  );

  console.log(user)
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  const email = user?.email || "";

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

  useEffect(() => {
    if (!isRestoring && !user) {
      router.replace("/(auth)/login");
    }
  }, [isRestoring, user, router]);

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
          setPasscode("");

          const token = await registerForPushNotificationsAsync();

          console.log(token);

          // 3. If we got a token, send it to the backend immediately
          if (token) {
            const isRegistered = await registerDeviceWithBackend(token);
            if (isRegistered) {
              console.log("✅ Push token synced with backend");
            } else {
              console.warn("⚠️ Login succeeded, but push registration failed");
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
      {isRestoring || !user ? (
        <View className="flex-1 justify-center items-center">
          <Loading visible={true} />
        </View>
      ) : (
        <>
          <View className="items-center mt-12">
            <View className="w-24 h-24 rounded-full  bg-primary-200 overflow-hidden border-4 border-primary-300">
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
            <TouchableOpacity>
              <Text
                onPress={() => router.push("/(auth)/forget-password")}
                className="text-primary-200 text-center font-semibold text-md mt-4"
              >
                Forgot passcode?
              </Text>
            </TouchableOpacity>
            <InfoText
              text="Not you?"
              actionText="Back to login"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
          <Loading visible={isLoading} />
        </>
      )}
    </SafeAreaView>
  );
}
