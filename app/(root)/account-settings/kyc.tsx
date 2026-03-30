import { View, Pressable } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import CustomText from "@/app/components/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  formatNairaLimit,
  getKycUpgradeRoute,
  getMaxAccountBalance,
  getTransferTierLimit,
} from "@/app/lib/kyc";

const tiers = [1, 2, 3] as const;

const kyc = () => {
  const { user } = useAppSelector((state) => state.auth);
  const handleKycPress = () => {
    const upgradeRoute = getKycUpgradeRoute(user?.kyc_level);
    if (upgradeRoute) router.push(upgradeRoute);
  };

  return (
    <SafeAreaView className="bg-primary-100 flex-1 px-2">
      <Header title="KYC Level" />
      <View className="px-4">
        <View className="bg-primary-400 rounded-full w-16 h-16 justify-center items-center mx-auto border border-primary-300">
          <CustomText className="text-center" size="xxl">
            {user?.kyc_level}
          </CustomText>
        </View>
        <CustomText className="text-center mt-4" size="xxl">
          Level {user?.kyc_level}
        </CustomText>

        <View className="flex-row items-center justify-between bg-primary-400 rounded-2xl p-4 mt-2">
          <Pressable onPress={handleKycPress}>
            <CustomText>Complete your KYC verification</CustomText>
            <CustomText
              secondary
              size="sm"
              className="text-accent-100 mt-2 max-w-72"
            >
              To access all features it’s essential to verify your identity.
            </CustomText>
          </Pressable>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
        <CustomText className="my-4">Level Benefit</CustomText>
        <View className="bg-primary-400 rounded-2xl p-4">
          {tiers.map((tier, index) => {
            const isLastTier = index === tiers.length - 1;

            return (
              <View key={tier} className="p-4">
                <View className="flex-row gap-4 ">
                  <CustomText>Tier {tier}</CustomText>
                  {user?.kyc_level === tier && (
                    <CustomText className="bg-yellow rounded-full text-black px-2">
                      Current
                    </CustomText>
                  )}
                </View>
                <View className={isLastTier ? "" : "border-b border-primary-300"}>
                  <View className="flex-row justify-between">
                    <CustomText secondary>Daily transaction limit</CustomText>
                    <CustomText secondary>Max account Balance</CustomText>
                  </View>
                  <View className="flex-row justify-between">
                    <CustomText>
                      {formatNairaLimit(getTransferTierLimit(tier))}
                    </CustomText>
                    <CustomText>
                      {formatNairaLimit(getMaxAccountBalance(tier))}
                    </CustomText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default kyc;
