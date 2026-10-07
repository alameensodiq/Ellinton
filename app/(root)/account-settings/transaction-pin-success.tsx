import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import CustomText from "@/app/components/CustomText";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const TransactionSuccessScreen = () => {
  const router = useRouter();
  const firstname = useAppSelector((state) => state.auth.user?.first_name);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <View className="flex-row justify-start items-center pt-4 pb-6">
        <TouchableOpacity onPress={() => router.replace("/(root)/(tabs)")}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center space-y-6">
        <Text className="text-8xl">🎉</Text>

        <CustomText size="xxxl" className="mb-6 text-center">
          Transaction pin updated successfully
        </CustomText>

        <CustomText size="lg" className="mb- text-center" secondary>
          {firstname}, your pin has been updated

        </CustomText>
      </View>

      <View className="pb-6">
        <Button
          title="Continue"
          variant="primary"
          onPress={() => {
            router.replace("/(root)/(tabs)");
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default TransactionSuccessScreen;
