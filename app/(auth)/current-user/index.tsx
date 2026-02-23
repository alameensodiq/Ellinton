import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import CustomText from "@/app/components/CustomText";
import { Image } from "react-native";
import InfoText from "@/app/components/InfoText";
import { loginUser } from "@/app/lib/thunks/authThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import Loading from "@/app/components/Loading";

export default function CurrentUser() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading, isRestoring } = useAppSelector((state) => state.auth);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  const email = user?.email || "";

  if (isRestoring || !user) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 justify-center items-center">
        <Loading visible={true} />
      </SafeAreaView>
    );
  }

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
    if (passcode.length === 6) {
      const t = setTimeout(async () => {
        try {
          if (!email) {
            setError(true);
            Vibration.vibrate(400);
            setPasscode("");
            return;
          }

          if (isLoading) return;

          const result = await dispatch(
            loginUser({ email, passcode })
          ).unwrap();

          setPasscode(""); // Clear passcode after successful login
          router.push({
            pathname: "/(root)/(tabs)",
            params: params,
          });
        } catch (err: any) {
          setError(true);
          Vibration.vibrate(400);
          setPasscode("");
        }
      }, 300);

      return () => clearTimeout(t);
    }
  }, [passcode, dispatch, email, router, params]); // Removed isLoading from dependencies

  const userName = user?.full_name || user?.name || "User";
  const userAvatar = user?.passport;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
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
          <Text className="text-white text-base mb-3">Enter your passcode</Text>

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

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
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
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
      <Loading visible={isLoading} />
    </SafeAreaView>
  );
}
