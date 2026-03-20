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
  Pressable
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
import notificationService from "@/app/lib/notification.service";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase";

const Login = () => {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isLoading, error, isAuthenticated, requiresPasscodeSetup, user } =
    useAppSelector((state) => state.auth);

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
    if (isAuthenticated) {
      if (user?.status === "otp_verified") {
        router.replace("/(auth)/profile-update");
      } else if (user?.status === "bvn_verified") {
        router.replace("/(auth)/facial-verification");
      } else if (requiresPasscodeSetup) {
        router.replace("/(auth)/create-passcode");
      } else {
        router.replace("/(root)/(tabs)");
      }
    }
  }, [isAuthenticated]);

  // Handle post-authentication navigation
  useEffect(() => {
    const handleAuthSuccess = async () => {
      if (isAuthenticated) {
        try {
          // Register device with backend after successful login
          await notificationService.registerDeviceWithBackend();
          console.log("✅ Device registered after login");
        } catch (error) {
          console.error("❌ Error registering device:", error);
        }

        // Navigate based on user status
        if (user?.status === "otp_verified") {
          router.replace("/(auth)/profile-update");
        } else if (user?.status === "bvn_verified") {
          router.replace("/(auth)/facial-verification");
        } else if (requiresPasscodeSetup) {
          router.replace("/(auth)/create-passcode");
        } else {
          router.replace("/(root)/(tabs)");
        }
      }
    };

    handleAuthSuccess();
  }, [isAuthenticated, user, requiresPasscodeSetup, router]);

  useEffect(() => {
    setShowErrorModal(Boolean(error));
  }, [error]);

  const handleLogin = async () => {
    if (!email || !pin) return;

    try {
      // 1. First login to YOUR app
      await dispatch(
        loginUser({
          email: email.trim().toLowerCase(),
          passcode: pin
        })
      ).unwrap();

      console.log("✅ App login successful");

      // 2. THEN login to Firebase (to get Firebase token)
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          pin // Your PIN is used as Firebase password
        );
        console.log("✅ Firebase login successful:", userCredential.user.email);

        // Store Firebase user info if needed
        const firebaseToken = await userCredential.user.getIdToken();
        await AsyncStorage.setItem("firebaseToken", firebaseToken);
      } catch (firebaseError: any) {
        // Don't block login if Firebase fails
        console.log("⚠️ Firebase login failed:", firebaseError.code);
        // You might want to handle specific errors
        if (firebaseError.code === "auth/user-not-found") {
          console.log("User needs to be created in Firebase first");
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
          message={error || "We could not complete your login, give it another shot"}
          onDismiss={handleDismissError}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
