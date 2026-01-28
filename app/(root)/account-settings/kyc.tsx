import { View, Text, Pressable } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import CustomText from "@/app/components/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const kyc = () => {
  const { user } = useAppSelector((state) => state.auth);
  const handleKycPress = () => {
    // Handle KYC verification navigation or action here
    if (user?.kyc_level === 1) {
      //navigate to kyc level 2
      router.push("/kyc/next-of-kin");
    } else if (user?.kyc_level === 2) {
      // router.push("/kyc/utility-bills");
      return;
    }
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
          <View className=" p-4">
            <View className="flex-row gap-4 ">
              <CustomText>Tier 1</CustomText>
              {user?.kyc_level === 1 && (
                <CustomText className="bg-yellow rounded-full text-black px-2">
                  Current
                </CustomText>
              )}
            </View>
            <View className="border-b border-primary-300 ">
              <View className="flex-row justify-between">
                <CustomText secondary>Daily transaction limit</CustomText>
                <CustomText secondary>Max account Balance</CustomText>
              </View>
              <View className="flex-row justify-between">
                <CustomText>₦5,500</CustomText>
                <CustomText>₦500,000</CustomText>
              </View>
            </View>
          </View>
          <View className=" p-4">
            <View className="flex-row gap-4 ">
              <CustomText>Tier 2</CustomText>
              {user?.kyc_level === 2 && (
                <CustomText className="bg-yellow rounded-full text-black px-2">
                  Current
                </CustomText>
              )}
            </View>
            <View className="border-b border-primary-300 ">
              <View className="flex-row justify-between">
                <CustomText secondary>Daily transaction limit</CustomText>
                <CustomText secondary>Max account Balance</CustomText>
              </View>
              <View className="flex-row justify-between">
                <CustomText>₦5,500</CustomText>
                <CustomText>₦1,000,000</CustomText>
              </View>
            </View>
          </View>
          <View className=" p-4">
            <View className="flex-row gap-4 ">
              <CustomText>Tier 3</CustomText>
              {user?.kyc_level === 3 && (
                <CustomText className="bg-yellow rounded-full text-black px-2">
                  Current
                </CustomText>
              )}
            </View>
            <View>
              <View className="flex-row justify-between">
                <CustomText secondary>Daily transaction limit</CustomText>
                <CustomText secondary>Max account Balance</CustomText>
              </View>
              <View className="flex-row justify-between">
                <CustomText>₦5,500</CustomText>
                <CustomText>₦5,000,000</CustomText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default kyc;
