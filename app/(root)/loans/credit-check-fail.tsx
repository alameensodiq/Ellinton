import { View, Text, StatusBar } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useRouter } from "expo-router";

const Loans = () => {
  const LoanIcon = svgIcons.loanfail;
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header showClose showCancel title="" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6">
          <LoanIcon width={90} height={90} />
        </View>

        <CustomText
          weight="bold"
          size="xl"
          className="text-center text-white mb-2"
        >
          Try again next time
        </CustomText>

        <CustomText size="sm" secondary className="text-center text-white/80 mb-10">
          Sorry, we can no longer continue with your application.
        </CustomText>
      </View>

      <View className="px-6 pb-6">
        <Button
          title="Ok"
          onPress={() => router.push("/(root)/loans")}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default Loans;
