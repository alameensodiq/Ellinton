import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import OtpInput from "@/app/components/inputs/OtpInput";
import CustomText from "@/app/components/CustomText";
import InfoText from "@/app/components/InfoText";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { verifyNewUserOtp, ResendNewUserOtp } from "@/app/lib/thunks/authThunks";


const VerifyPhoneOtpScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendModalVisible, setResendModalVisible] = useState(false);
  const { phone } = useLocalSearchParams<{
    phone: string;
  }>();

  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (remainingTime > 0) {
      timer = setTimeout(() => setRemainingTime((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [remainingTime]);

  const handleResendClick = () => {
    setResendModalVisible(true);
  };

  const handleConfirmResend = async (channel: "sms" | "whatsapp") => {
    setResendModalVisible(false);
    setErrorMessage("");
    try {
      await dispatch(
        ResendNewUserOtp({ phone: phone || "", channel })
      ).unwrap();

      setRemainingTime(60);
      setCanResend(false);
      setOtp("");
    } catch (err: any) {
      setErrorMessage(
        typeof err === "string" ? err : err?.message || "Failed to resend OTP"
      );
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setErrorMessage("Please enter a valid 6-digit code.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await dispatch(
        verifyNewUserOtp({ phone: phone || "", otp })
      ).unwrap();

      const verificationToken = result.verification_token;

      setIsSubmitting(false);
      router.push({
        pathname: "/(auth)/create-passcode",
        params: { verification_token: verificationToken, phone },
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        typeof err === "string" ? err : err?.message || "OTP verification failed"
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 pt-4">
      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        <StatusBar />

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1">
            <CustomText size="xxl" className="mb-2 mt-10">
              Verify your phone number
            </CustomText>
            <CustomText secondary className="mb-8">
              We’ve sent a 6-digit code to {phone ? phone : "your phone"}.
            </CustomText>

            <OtpInput
              digitCount={6}
              value={otp}
              onChange={setOtp}
              error={!!errorMessage}
              autoFocus
              secure={false}
            />

            {errorMessage ? (
              <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
                {errorMessage}
              </CustomText>
            ) : null}

            <InfoText
              text={`Code not received? ${canResend ? "Send again" : `Resend in ${remainingTime}s`
                }`}
              actionText={canResend ? "Send again" : ""}
              onPress={canResend ? handleResendClick : undefined}
              disabled={!canResend}
            />
          </View>
        </ScrollView>

        <View className="px-6 pb-6 pt-2">
          <Button
            title="Verify"
            variant="primary"
            onPress={handleVerify}
            disabled={otp.trim().length < 6 || isSubmitting}
            className="w-full"
          />
        </View>

        {/* Resend Option Modal (SMS or WhatsApp) */}
        <Modal
          visible={resendModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setResendModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-primary-100 rounded-t-3xl p-6 border-t border-primary-300">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-bold">Resend OTP via</Text>
                <TouchableOpacity onPress={() => setResendModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="flex-row items-center p-4 bg-primary-200 rounded-xl mb-3 border border-primary-300"
                onPress={() => handleConfirmResend("sms")}
              >
                <Ionicons name="chatbox-ellipses-outline" size={24} color="#fff" />
                <View className="ml-3">
                  <Text className="text-white font-semibold text-base">Send via SMS</Text>
                  <Text className="text-accent-100 text-xs">Receive standard text message OTP</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 bg-primary-200 rounded-xl border border-primary-300"
                onPress={() => handleConfirmResend("whatsapp")}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <View className="ml-3">
                  <Text className="text-white font-semibold text-base">Send via WhatsApp</Text>
                  <Text className="text-accent-100 text-xs">Receive verification code on WhatsApp</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyPhoneOtpScreen;
