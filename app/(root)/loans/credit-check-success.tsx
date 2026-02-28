import { View, StatusBar } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useLocalSearchParams, useRouter } from "expo-router";
import Sheet from "@/app/components/Sheet";

const CreditSuccess = () => {
  const LoanIcon = svgIcons.loanfail;
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  const [open, setOpen] = useState(false);

  let approvedLoanAmount: number | null = null;

  try {
    const parsed = params.creditCheck ? JSON.parse(params.creditCheck) : null;
    const amount =
      parsed?.data?.approvedLoanAmount ?? parsed?.approvedLoanAmount ?? null;

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
    setOpen(false);
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
          Congratulations! You have been pre-approved 
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
          onPress={() => setOpen(true)}
          variant="primary"
        />
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <OfferLetter onAccept={goLoans} approvedAmount={formattedAmount} />
      </Sheet>
    </SafeAreaView>
  );
};

export default CreditSuccess;

const OfferLetter = ({
  onAccept,
  approvedAmount,
}: {
  onAccept: () => void;
  approvedAmount: string | null;
}) => {
  return (
    <View className="-mt-6 mb-4">
      <CustomText
        weight="bold"
        size="lg"
        className="text-white text-center mb-2"
      >
        Offer letter
      </CustomText>

      {approvedAmount && (
        <CustomText weight="bold" className="text-white text-center mb-4">
          Approved amount: {approvedAmount}
        </CustomText>
      )}

      <CustomText secondary className="mb-4">
        YOUR DATA IS PROTECTED {"\n"}
        All our banking and investment procedures happen through encrypted
        technology and robust firewalls that ensure the protection of your data
      </CustomText>

      <CustomText secondary className="mb-4">
        YOUR RIGHTS ARE SERVED {"\n"}
        We ensure that you are enjoying all the personal and financial rights in
        banking regarding the service you prefer.
      </CustomText>

      <CustomText secondary className="text-white/80 mb-4">
        YOU WILL BE INFORMED {"\n"}
        You will be updated on every transaction within your account, along with
        inbox, offers, and promotions. Real-time alerts on security and policy
        changes will be sent to you.
      </CustomText>

      <CustomText secondary className="text-white/80 mb-4">
        THE CONTROLS IN YOUR HANDS {"\n"}
        Complete control of your banking will be in your hands while we make it
        easier for you. Timely notifications on every action happening will be
        sent to you, and you can use multiple platforms to manage the account.
      </CustomText>

      <CustomText secondary className="text-white/80 mb-6">
        YOUR MONEY AND DATA ARE INTACT {"\n"}
        Your hard-earned savings and personal data are secured with the utmost
        care. The latest encryption technology and protocols are implemented to
        avoid unauthorized access from fraudsters.
      </CustomText>

      <Button
        title="Accept and continue"
        onPress={onAccept}
        variant="primary"
      />
    </View>
  );
};
