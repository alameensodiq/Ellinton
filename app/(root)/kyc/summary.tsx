import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store";
import { getKycSummary, submitKyc } from "@/app/lib/thunks/kycThunks";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";

const SummaryReviewScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isMountedRef = useRef(true);

  const { summary } = useSelector((state: RootState) => state.kyc);
  const [isFetchingSummary, setIsFetchingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setIsFetchingSummary(true);
      setSummaryError(null);
      await dispatch(getKycSummary()).unwrap();
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      const errorMessage =
        typeof err === "string"
          ? err
          : err?.message || "Unable to load your KYC summary.";
      setSummaryError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsFetchingSummary(false);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSubmit = async () => {
    if (submitLoading || isFetchingSummary) {
      return;
    }

    if (!summary?.next_of_kin) {
      Alert.alert(
        "Error",
        "Next of kin information is missing. Please go back and complete it."
      );
      return;
    }

    setSubmitLoading(true);

    try {
      await dispatch(submitKyc()).unwrap();
      if (!isMountedRef.current) {
        return;
      }
      router.replace({
        pathname: "/(root)/kyc/utility-bills",
      });
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      const errorMessage =
        typeof err === "string"
          ? err
          : err?.message || "KYC submission failed. Please try again.";
      Alert.alert(
        "Submission Failed",
        errorMessage
      );
      console.error("KYC submission failed:", err);
    } finally {
      if (isMountedRef.current) {
        setSubmitLoading(false);
      }
    }
  };

  const handleExit = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(root)/(tabs)");
  };

  if (isFetchingSummary) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 px-4 pt-4">
        <View className="flex-row items-center justify-between pb-6">
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <ProgressBar currentStep={4} totalSteps={4} />
          </View>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color="#fff" />
          <CustomText secondary size="sm" className="text-center mt-4">
            Loading your KYC summary...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  if (summaryError) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 px-4 pt-4">
        <View className="flex-row items-center justify-between pb-6">
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <ProgressBar currentStep={4} totalSteps={4} />
          </View>
        </View>

        <View className="flex-1 justify-center px-2">
          <CustomText size="xl" className="mb-3">
            We couldn&apos;t load your summary
          </CustomText>
          <CustomText secondary size="sm" className="mb-6">
            {summaryError}
          </CustomText>
          <Button
            title="Retry"
            variant="primary"
            onPress={loadSummary}
            className="w-full mb-4"
          />
          <Button
            title="Go Back"
            variant="secondary"
            onPress={handleExit}
            className="w-full"
          />
        </View>
      </SafeAreaView>
    );
  }

  const nin = summary?.nin_details?.nin || "";
  const nextOfKin = summary?.next_of_kin;

  if (!nin || !nextOfKin) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 justify-center items-center px-4">
        <Text className="text-white text-center">
          Incomplete KYC data. Please go back and complete all steps.
        </Text>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={handleExit}
          className="mt-6 w-full"
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-primary-100">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-row items-center justify-between px-4 pt-4 pb-4">
            <TouchableOpacity onPress={handleExit}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1 ml-4">
              <ProgressBar currentStep={4} totalSteps={4} />
            </View>
          </View>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "space-between",
              paddingHorizontal: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <CustomText size="xxl" className="mb-10">
                Summary
              </CustomText>

              <View className="mb-6">
                <CustomText size="sm" secondary>
                  NIN details
                </CustomText>

                <View className="bg-primary-400 rounded-2xl p-4 py-6">
                  <View className="flex-row justify-between">
                    <Text className="text-white/70 text-sm">NIN</Text>
                    <Text className="text-white text-base font-medium">
                      {nin}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mb-6">
                <CustomText size="sm" secondary>
                  Next of kin
                </CustomText>
                <View className="bg-primary-400 rounded-2xl p-4 ">
                  <View className="space-y-3">
                    <View className="flex-row justify-between mb-4 border-b-[0.2px] border-primary-300 py-2">
                      <CustomText size="sm" secondary>
                        First name
                      </CustomText>
                      <CustomText size="sm">{nextOfKin.first_name}</CustomText>
                    </View>
                    <View className="flex-row justify-between mb-4 border-b-[0.2px] border-primary-300 py-2">
                      <CustomText size="sm" secondary>
                        Last name
                      </CustomText>
                      <CustomText size="sm">{nextOfKin.last_name}</CustomText>
                    </View>
                    <View className="flex-row justify-between mb-2 border-b-[0.2px] border-primary-300 py-2">
                      <CustomText size="sm" secondary>
                        Relationship
                      </CustomText>
                      <CustomText size="sm">
                        {nextOfKin.relationship}
                      </CustomText>
                    </View>
                    <View className="flex-row justify-between mb-2 border-b-[0.2px] border-primary-300 py-2">
                      <CustomText size="sm" secondary>
                        Phone
                      </CustomText>
                      <CustomText size="sm">{nextOfKin.phone}</CustomText>
                    </View>
                    <View className="flex-row justify-between mb-2 border-b-[0.2px] border-primary-300 py-2">
                      <CustomText size="sm" secondary>
                        Email
                      </CustomText>
                      <CustomText size="sm">{nextOfKin.email}</CustomText>
                    </View>
                    <View className="flex-row justify-between mb-2  py-2">
                      <CustomText size="sm" secondary>
                        Gender
                      </CustomText>
                      <CustomText size="sm">{nextOfKin.gender}</CustomText>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Button
                title={submitLoading ? "Submitting..." : "Submit"}
                variant="primary"
                onPress={handleSubmit}
                className="w-full"
                disabled={submitLoading}
                icon={
                  submitLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : null
                }
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default SummaryReviewScreen;
