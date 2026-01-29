import { View, Text, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useRouter } from "expo-router";

const Loans = () => {
  const LoanIcon = svgIcons.loans;
  const ChipIcon = svgIcons.chip;
const router = useRouter()
  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header
        showClose
        title="Loan"
        rightIconName="time-outline"
        onRightPress={() => router.push("/(root)/loans/step1")}
      />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6">
          <LoanIcon width={90} height={90} />
        </View>

        <CustomText
          weight="bold"
          size="xl"
          className="text-center text-white mb-2"
        >
          Get a loan that treats{"\n"}you right
        </CustomText>

        <CustomText size="sm" className="text-center text-white/80 mb-10">
          Achieve that goal and feel in{"\n"}control with a loan.
        </CustomText>
      </View>

      <View className="px-6 pb-6">
        <View className="w-full bg-primary-400 rounded-2xl p-4 flex-row mb-8 items-center">
          <View className="mr-3 mt-1 bg-primary-300 p-2 rounded-full">
            <ChipIcon width={24} height={24} />
          </View>

          <CustomText size="sm" className="text-white/90 flex-1">
            Get instant credit up to 3X your transaction usable only within
            Ellington Bank. Repay over 3 to 12 months at just 1.2% monthly
            interest with no hidden fees.
          </CustomText>
        </View>
        <Button
          title="Apply now"
          onPress={() => router.push("/(root)/loans/step1")}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default Loans;
