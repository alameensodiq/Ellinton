import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AmountCard from "@/app/components/home/cards/AmountCard";

const prettyType = (t?: string) => {
  const map: Record<string, string> = {
    basic: "Basic saving",
    target: "Target saving",
    group: "Group saving",
    fixed: "Fixed saving",
  };
  return map[String(t || "").toLowerCase()] || "Saving";
};

const Success = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawAmount = Array.isArray(params.amount)
    ? params.amount[0]
    : params.amount || "0";
  const description =
    (Array.isArray(params.description)
      ? params.description[0]
      : params.description) || "Savings plan";
  const type = Array.isArray(params.type) ? params.type[0] : params.type;

  const title = useMemo(
    () => `${prettyType(String(type))} created successful`,
    [type]
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <View className="flex-row justify-start items-center pt-4 pb-6">
        <TouchableOpacity onPress={() => router.replace("/(root)/(tabs)")}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center space-y-6">
        <AmountCard
          amount={String(rawAmount)}
          description={String(description)}
        />

        <Text className="text-8xl text-center mt-10">🎉</Text>

        <Text className="text-3xl font-bold text-white leading-normal text-center mt-4">
          {title}
        </Text>

        <Text className="text-accent-100 text-center text-base leading-relaxed mt-4">
          Your plan has been created successfully
        </Text>
      </View>

      <View className="pb-6">
        <Button
          title="Done"
          variant="primary"
          onPress={() => router.replace("/(root)/(tabs)")}
        />
      </View>
    </SafeAreaView>
  );
};

export default Success;
