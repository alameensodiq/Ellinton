import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store";
import { getKycSummary, submitKyc } from "@/app/lib/thunks/kycThunks";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Loading from "@/app/components/Loading";

const SummaryReviewScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const {
    summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useSelector((state: RootState) => state.kyc);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  useEffect(() => {
    dispatch(getKycSummary());
  }, [dispatch]);

  const handleSubmit = async () => {
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
      router.push({
        pathname: "/(root)/kyc/utility-bills",
      });
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err.message || "KYC submission failed. Please try again."
      );
      console.error("KYC submission failed:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (summaryLoading) {
    return <Loading visible={true} />;
  }

  const nin = summary?.nin_details?.nin || "";
  const nextOfKin = summary?.next_of_kin;

  if (!nin || !nextOfKin) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100 justify-center items-center px-4">
        <Text className="text-white text-center">
          Incomplete KYC data. Please go back and complete all steps.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-accent-100">Go Back</Text>
        </TouchableOpacity>
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
            <ProgressBar currentStep={4} totalSteps={4} />
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
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Loading visible={submitLoading} />
    </>
  );
};

export default SummaryReviewScreen;
