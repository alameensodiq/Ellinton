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

const Login = () => {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();

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
    dispatch(clearError());
  };

  // Add this function INSIDE your Login component
//  const testLocalNotification = async () => {
//   try {
//     console.log("📱 Testing LOCAL notification...");
    
//     // Create a channel specifically for this test (Vivo needs this)
//     if (Platform.OS === "android") {
//       await Notifications.setNotificationChannelAsync('local_test', {
//         name: 'Local Test Channel',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//         sound: 'default',
//         enableVibrate: true,
//         enableLights: true,
//         bypassDnd: true, // Force through Do Not Disturb
//       });
//     }
    
//     // Send a local notification immediately
//     const notificationId = await Notifications.scheduleNotificationAsync({
//       content: {
//         title: "🔔 Local Test Success!",
//         body: "If you see this, your device CAN show notifications!",
//         sound: true,
//         priority: Notifications.AndroidNotificationPriority.HIGH,
//         data: { source: "local_test", timestamp: Date.now() }
//       },
//       trigger: null, // null = show immediately
//     });
    
//     console.log("✅ Local notification sent with ID:", notificationId);
//     console.log("📱 CHECK YOUR NOTIFICATION SHADE NOW!");
    
//   } catch (error) {
//     console.error("❌ Local notification failed:", error);
//   }
// };

// const testFCM = async () => {
//   try {
//     const token = await Notifications.getDevicePushTokenAsync();
//     console.log("FCM TOKEN:", token);
//   } catch (e) {
//     console.error("FCM ERROR:", e);
//   }
// };

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
            <View className="mt-10">
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

            <View className="w-full">
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

            <View className="mb-10 mt-6">
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
            error || "We could not complete your login, give it another shot"
          }
          onDismiss={handleDismissError}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
