"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image,
  ImageBackground,
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Button from "./components/Button";
import CustomText from "./components/CustomText";
import { clearError, logout } from "@/app/lib/slices/authSlice";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

const backgrounds = [
  {
    image: require("./assets/landing-bg1.png"),
    title: "Do more with Ellington MFB.",
    subtitle: "Your goals, backed by smart banking.",
  },
  {
    image: require("./assets/landing-bg2.png"),
    title: "Smart spending. Bigger rewards",
    subtitle: "Our debit card works harder for you",
  },
  {
    image: require("./assets/landing-bg3.png"),
    title: "Instant loans, zero hassle.",
    subtitle: "Track, repay, and grow with Ellington.",
  },
  {
    image: require("./assets/landing-bg4.png"),
    title: "Send Money. Anytime, anywhere",
    subtitle: "Fast easy transfer to friends and family.",
  },
  {
    image: require("./assets/landing-bg5.png"),
    title: "Pay bills. Earn Rewards",
    subtitle: "Recharge, shop, and stream—all in one place",
  },
];

export default function Index() {
  const router = useRouter();
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [checkingStorage, setCheckingStorage] = useState(true);
  const pan = useRef(new Animated.ValueXY()).current;
  const dispatch = useDispatch();

  useEffect(() => {
    // If user data is already saved, skip the landing screen.
    (async () => {
      try {
        const userProfile = await AsyncStorage.getItem("userProfile");
        const token = await AsyncStorage.getItem("authToken");

        if (token) {
          router.replace("/(root)/(tabs)");
          return;
        }

        if (userProfile) {
          // user exists but no token — show unlock/current-user screen
          router.replace("/(auth)/current-user");
          return;
        }
      } catch (e) {
        // ignore and show index
      } finally {
        setCheckingStorage(false);
      }
    })();

    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (checkingStorage) return null;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20,

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          setBackgroundIndex((prev) =>
            prev === 0 ? backgrounds.length - 1 : prev - 1
          );
        } else if (gestureState.dx < -50) {
          setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
        }
      },
    })
  ).current;
  const handleAuthNavigation = (path: string) => {
    dispatch(logout());
    dispatch(clearError());
    router.push(path as any);
  };
  return (
    <Animated.View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <ImageBackground
        source={backgrounds[backgroundIndex].image}
        resizeMode="cover"
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-between">
          {/* Indicators */}
          <View className="flex-row gap-2 px-4 pt-3">
            {backgrounds.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setBackgroundIndex(index)}
                className="flex-1"
              >
                <View
                  className={`h-1 rounded ${
                    index === backgroundIndex
                      ? "bg-primary-200"
                      : "bg-primary-100"
                  }`}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View className="px-4 pb-10">
            <View className="items-center mb-6">
              <CustomText
                weight="bold"
                size="xxl"
                className="text-center mb-4 max-w-72"
              >
                {backgrounds[backgroundIndex].title}
              </CustomText>

              <CustomText
                size="base"
                className="text-accent-100 text-center mb-4"
              >
                {backgrounds[backgroundIndex].subtitle}
              </CustomText>
            </View>

            <View className="gap-4 mb-6">
              <Button
                title="Create account"
                variant="secondary"
                onPress={() =>
                  handleAuthNavigation("/(auth)/create-account-info")
                }
              />

              <Button
                title="Login"
                variant="primary"
                onPress={() => handleAuthNavigation("/(auth)/login")}
              />
            </View>

            <View className="flex-row items-center justify-center gap-4">
              <CustomText size="xs" className="text-accent-100">
                Regulated by NDIC
              </CustomText>
              <Image
                source={require("./assets/ndic-logo.png")}
                className="w-12 h-6"
              />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Animated.View>
  );
}
// MTN_VTU
// AIRTEL_VTU
// GLO_VTU
// 9MOBILE_VTU
