import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

const MFaSuccessScreen = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Slide up
    Animated.timing(slideAnim, {
      toValue: -50,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(fallAnim, {
          toValue: 20,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fallAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <View className="flex-row justify-start items-center pt-4 pb-6">
        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: "/(auth)/login",
              params: { userId: userId as string },
            })
          }
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center space-y-6">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateY: fallAnim }],
          }}
        >
          <Text className="text-8xl">🎉</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text className="text-3xl font-bold text-white leading-normal text-center mt-4 max-w-72">
            Login Success!
          </Text>

          <Text className="text-accent-100 text-center text-base leading-relaxed mt-4">
            Welcome to Ellington Bank.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <View className="pb-6">
          <Button
            title="Continue"
            variant="primary"
            onPress={() =>
              router.replace({
                pathname: "/(root)/(tabs)",
                params: { userId: userId as string },
              })
            }
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default MFaSuccessScreen;
