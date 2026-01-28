import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import Loading from "@/app/components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store";
import { verifyNin } from "@/app/lib/thunks/kycThunks";

const NINIdentityScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [nin, setNin] = useState("");
  const [ninError, setNinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const validateNIN = (value: string) => /^\d{11}$/.test(value);

  const handleContinue = async () => {
    if (!nin) return setNinError("NIN is required");
    if (!validateNIN(nin)) return setNinError("NIN must be 11 digits");

    setIsLoading(true);
    setNinError("");

    try {
      const result = await dispatch(verifyNin({ nin })).unwrap();

      if (result.nin_verified) {
        router.push({ pathname: "/(root)/kyc/next-of-kin", params: { nin } });
      } else {
        setNinError(
          "NIN verification failed. Please check the number and try again."
        );
      }
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err?.message || err?.data?.message || err;
      setNinError(errorMessage || "NIN verification failed. Please try again.");
      console.error("NIN verification error:", err);
      // DO NOT navigate here!
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1 bg-primary-100">
          <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>

              <Text className="text-white text-sm">2/2</Text>
            </View>

            <ScrollView
              className="flex-1 px-6"
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-2xl font-bold text-white mb-8">
                ID verification
              </Text>

              <TextInputField
                label="NIN Number"
                value={nin}
                onChangeText={(text) => {
                  setNin(text.replace(/\D/g, ""));
                  setNinError(
                    text && !validateNIN(text.replace(/\D/g, ""))
                      ? "NIN must be 11 digits"
                      : ""
                  );
                }}
                placeholder="01123456789"
                keyboardType="numeric"
                maxLength={11}
                error={ninError}
              />

              {/* Removed unused {error ? ...} block */}
            </ScrollView>
            <View className="px-4">
              <Button
                title="Submit"
                variant="primary"
                onPress={handleContinue}
                className="w-full mb-10"
                disabled={isLoading}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <Loading visible={isLoading} />
    </>
  );
};

export default NINIdentityScreen;
