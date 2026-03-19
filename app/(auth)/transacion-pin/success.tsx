import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { clearError, logout } from "@/app/lib/slices/authSlice";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { trackRegistrationCompleted } from "@/app/lib/analytics/appsflyer";
import notificationService from "@/app/lib/notification.service";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase";

const RegistrationSuccessScreen = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!userId) {
      return;
    }

    trackRegistrationCompleted({
      userId,
      registrationMethod: "mobile_app",
      status: "completed",
    }).catch((error) => {
      console.warn("Failed to track registration completion:", error);
    });
  }, [userId]);

const goToLogin = async () => {
  try {
    // ✅ 1. Unregister device from backend FIRST
    await notificationService.unregisterDeviceFromBackend();
    console.log("✅ Device unregistered");
    
    // ✅ 2. Sign out from Firebase
    await signOut(auth);
    console.log("✅ Firebase logout");
    
    // ✅ 3. Clear Redux state
    if (user) {
      dispatch(clearError());
      dispatch(logout());
    }
    
    // ✅ 4. Navigate to login
    router.replace("/(auth)/login");
    
  } catch (error) {
    console.error("❌ Logout error:", error);
    // Still logout app even if unregister fails
    if (user) {
      dispatch(clearError());
      dispatch(logout());
    }
    router.replace("/(auth)/login");
  }
};

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <View className="flex-row justify-start items-center pt-4 pb-6">
        <TouchableOpacity onPress={goToLogin}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center space-y-6">
        <Text className="text-8xl">🎉</Text>

        <Text className="text-3xl font-bold text-white leading-normal text-center mt-4 max-w-72">
          You are good to go
        </Text>

        <Text className="text-accent-100 text-center text-base leading-relaxed mt-4">
          Thank you for completing your registration. Welcome to Ellington Bank.
        </Text>
      </View>

      <View className="pb-6">
        <Button title="Login now" variant="primary" onPress={goToLogin} />
      </View>
    </SafeAreaView>
  );
};

export default RegistrationSuccessScreen;
