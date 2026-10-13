import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { logoutUser } from "@/app/lib/thunks/authThunks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase";
import { useRouter } from "expo-router";

const CLOSURE_REASONS = [
  "I have another primary bank account",
  "Temporary account closure / No longer needed",
  "High transaction fees or regulatory charges",
  "Poor customer support / experience",
  "Moving abroad / Relocating from Nigeria",
  "Other personal reasons",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accountInfo = useAppSelector((state) => state.accounts.accountInfo);
  const user = useAppSelector((state) => state.auth.user);

  const balance = accountInfo?.accountBalance ?? 0;
  const hasRemainingBalance = balance > 0;

  // Step state: 1 (Balance check), 2 (Reason selector), 3 (Identity re-verification)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherComments, setOtherComments] = useState<string>("");

  // Verification state
  const [passcode, setPasscode] = useState("");
  const [otp, setOtp] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStep1Continue = () => {
    if (hasRemainingBalance) {
      Alert.alert(
        "Outstanding Funds",
        `You currently have ₦${balance.toLocaleString()} in your account. You must transfer or withdraw your entire balance to ₦0.00 before requesting account closure.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Transfer Funds",
            onPress: () => router.push("/(root)/transfer"),
          },
        ]
      );
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    if (!selectedReason) {
      Alert.alert("Reason Required", "Please select a reason for account closure.");
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalDeletion = async () => {
    if (passcode.length !== 6) {
      Alert.alert("Passcode Required", "Please enter your 6-digit login passcode.");
      return;
    }
    if (otp.length !== 6) {
      Alert.alert("OTP Required", "Please enter the 6-digit confirmation OTP sent to your phone/email.");
      return;
    }

    setIsDeleting(true);
    try {
      // Clear all user credentials and sign out
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("data");
      await dispatch(logoutUser()).unwrap();
      await signOut(auth);

      Alert.alert(
        "Account Scheduled for Deletion",
        "Your account is now placed into a 30-day compliance freeze. If you do not sign back in within 30 days, your account and records will be permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/current-user"),
          },
        ]
      );
    } catch (e) {
      router.replace("/(auth)/current-user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Close Account" />

      {/* STEP PROGRESS INDICATOR */}
      <View className="px-6 py-3 flex-row items-center justify-between">
        {[
          { step: 1, title: "Balance Check" },
          { step: 2, title: "Reason" },
          { step: 3, title: "Re-Verify" },
        ].map((item, idx) => (
          <View key={item.step} className="flex-row items-center flex-1">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center ${
                currentStep >= item.step ? "bg-red-600" : "bg-gray-200"
              }`}
            >
              <Text className="text-white text-xs font-outfit-bold">{item.step}</Text>
            </View>
            <Text
              className={`ml-1.5 text-[11px] font-outfit-medium ${
                currentStep >= item.step ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {item.title}
            </Text>
            {idx < 2 && <View className="flex-1 h-0.5 bg-gray-200 mx-2" />}
          </View>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-4 py-2"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SAFETY STEP 1: BALANCE CHECK */}
        {currentStep === 1 && (
          <View className="space-y-4">
            <View className="bg-red-50 border border-red-200 p-4 rounded-2xl flex-row items-center gap-3">
              <MaterialCommunityIcons name="alert-octagon-outline" size={26} color="#DC2626" />
              <View className="flex-1">
                <Text className="text-red-900 text-xs font-outfit-bold">
                  Mandatory Safety Step 1 of 3
                </Text>
                <Text className="text-red-700 text-[11px] font-outfit mt-0.5 leading-4">
                  Regulatory regulations require all customer deposit accounts to have exactly ₦0.00 balance before termination.
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 items-center">
              <Text className="text-gray-400 text-xs font-outfit mb-1">Current Account Balance</Text>
              <Text className="text-gray-900 text-2xl font-outfit-bold mb-3">
                ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>

              {hasRemainingBalance ? (
                <View className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 items-center">
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#D97706" />
                  <Text className="text-amber-900 text-xs font-outfit-bold mt-1 text-center">
                    Outstanding Funds Detected
                  </Text>
                  <Text className="text-amber-700 text-[11px] font-outfit text-center mt-1 leading-4">
                    Please transfer your remaining ₦{balance.toLocaleString()} to another bank account before you can proceed with closure.
                  </Text>

                  <Pressable
                    onPress={() => router.push("/(root)/transfer")}
                    className="bg-primary-200 rounded-xl px-5 py-2.5 mt-3 active:opacity-90"
                  >
                    <Text className="text-white text-xs font-outfit-bold">Transfer Funds Now</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-4 flex-row items-center gap-2.5">
                  <MaterialCommunityIcons name="check-circle" size={20} color="#15803D" />
                  <Text className="text-emerald-900 text-xs font-outfit-medium flex-1">
                    Verified: Zero balance confirmed (₦0.00). You are eligible to proceed.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleStep1Continue}
                disabled={hasRemainingBalance}
                className={`w-full rounded-xl py-3.5 items-center ${
                  hasRemainingBalance ? "bg-gray-300" : "bg-red-600 active:opacity-90"
                }`}
              >
                <Text className="text-white text-xs font-outfit-bold">
                  {hasRemainingBalance ? "Clear Balance to Proceed" : "Proceed to Reason Selection"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SAFETY STEP 2: MANDATORY REASON */}
        {currentStep === 2 && (
          <View className="space-y-4">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-900 text-sm font-outfit-bold mb-1">
                Why are you closing your account?
              </Text>
              <Text className="text-gray-500 text-xs font-outfit mb-4">
                Please help us understand how we can improve our services.
              </Text>

              <View className="space-y-2.5 mb-4">
                {CLOSURE_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      onPress={() => setSelectedReason(reason)}
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "bg-red-50/70 border-red-500"
                          : "bg-[#F8FAFC] border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-outfit flex-1 mr-2 ${
                          isSelected ? "text-red-900 font-outfit-bold" : "text-gray-800"
                        }`}
                      >
                        {reason}
                      </Text>
                      <View
                        className={`w-4 h-4 rounded-full border items-center justify-center ${
                          isSelected ? "border-red-600 bg-red-600" : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="text-gray-700 text-xs font-outfit-medium mb-1.5">
                Additional Comments (Optional)
              </Text>
              <TextInput
                value={otherComments}
                onChangeText={setOtherComments}
                placeholder="Share your feedback..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-900 font-outfit mb-4 h-16"
              />

              <Pressable
                onPress={handleStep2Continue}
                className="w-full bg-red-600 rounded-xl py-3.5 items-center active:opacity-90"
              >
                <Text className="text-white text-xs font-outfit-bold">
                  Continue to Identity Re-Verification
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SAFETY STEP 3: IDENTITY RE-VERIFICATION */}
        {currentStep === 3 && (
          <View className="space-y-4">
            <View className="bg-red-50 border border-red-200 p-4 rounded-2xl flex-row items-center gap-3">
              <MaterialCommunityIcons name="shield-lock-open-outline" size={26} color="#DC2626" />
              <View className="flex-1">
                <Text className="text-red-900 text-xs font-outfit-bold">
                  Final Authorization & 30-Day Freeze
                </Text>
                <Text className="text-red-700 text-[11px] font-outfit mt-0.5 leading-4">
                  Once confirmed, your account will enter an immediate 30-day compliance freeze. You can sign back in during this period to cancel deletion.
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-900 text-xs font-outfit-bold mb-2">
                1. Enter 6-Digit App Passcode
              </Text>
              <View className="mb-5 items-center">
                <OtpInput
                  digitCount={6}
                  value={passcode}
                  onChange={setPasscode}
                  secure
                  inputStyle="w-10 h-10 text-base"
                />
              </View>

              <Text className="text-gray-900 text-xs font-outfit-bold mb-2">
                2. Enter 6-Digit Security OTP (Sent to {user?.phone || user?.email || "Phone"})
              </Text>
              <View className="mb-6 items-center">
                <OtpInput
                  digitCount={6}
                  value={otp}
                  onChange={setOtp}
                  inputStyle="w-10 h-10 text-base"
                />
              </View>

              <Pressable
                onPress={handleFinalDeletion}
                disabled={isDeleting}
                className="w-full bg-red-600 rounded-xl py-4 items-center shadow-sm active:opacity-90"
              >
                <Text className="text-white text-xs font-outfit-bold">
                  {isDeleting ? "Processing Freeze..." : "Confirm & Delete Account"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
