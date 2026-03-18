import { View, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useLocalSearchParams, useRouter } from "expo-router";

const CreditSuccess = () => {
  const LoanIcon = svgIcons.loanfail;
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  let approvedLoanAmount: number | null = null;
  let approvalMessage: string | null = null;

  try {
    const parsed = params.creditCheck ? JSON.parse(params.creditCheck) : null;
    const amount =
      parsed?.assessment?.maxLoanLimit ??
      parsed?.data?.assessment?.maxLoanLimit ??
      parsed?.data?.approvedLoanAmount ??
      parsed?.approvedLoanAmount ??
      null;
    approvalMessage =
      parsed?.message ??
      parsed?.data?.message ??
      "Congratulations! You have been pre-approved";

    if (amount !== null && amount !== undefined) {
      approvedLoanAmount = Number(amount);
    }
  } catch (e) {
    approvedLoanAmount = null;
  }

  const formattedAmount =
    approvedLoanAmount !== null && !Number.isNaN(approvedLoanAmount)
      ? `₦${approvedLoanAmount.toLocaleString()}`
      : null;

  const goLoans = () => {
    router.replace({
      pathname: "/(root)/loans/apply-loan",
      params: { ...params },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Credit Appraisal" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6">
          <LoanIcon width={90} height={90} />
        </View>

        <CustomText
          weight="bold"
          size="xl"
          className="text-center text-white mb-2"
        >
          Credit assessment successful
        </CustomText>

        <CustomText
          size="sm"
          secondary
          className="text-center text-white/80 mb-3"
        >
          {approvalMessage || "Congratulations! You have been pre-approved"}
        </CustomText>

        {formattedAmount && (
          <CustomText
            weight="bold"
            size="lg"
            className="text-center text-white"
          >
            Approved amount: {formattedAmount}
          </CustomText>
        )}
      </View>

      <View className="px-6 pb-6">
        <Button
          title="Continue"
          onPress={goLoans}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default CreditSuccess;
