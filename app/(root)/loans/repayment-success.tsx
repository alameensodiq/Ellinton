import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AmountCard from "@/app/components/home/cards/AmountCard";

const LoanSuccess = () => {
    const router = useRouter();
    const { amount, status, message, oustanding } = useLocalSearchParams<{
        amount?: string;
        status?: string;
        message?: string;
        oustanding?: string;
    }>();

    const rawAmount = Array.isArray(amount) ? amount[0] : amount || "0";
    const rawOutstanding = Array.isArray(oustanding) ? oustanding[0] : oustanding || "0";
    const rawStatus = Array.isArray(status) ? status[0] : status || "success";
    const rawMessage = Array.isArray(message) ? message[0] : message || "";
    const isFailed = rawStatus.toLowerCase() === "failed";

    return (
        <SafeAreaView className="flex-1 bg-primary-100 px-6">
            <View className="flex-row justify-start items-center pt-4 pb-6">
                <TouchableOpacity onPress={() => router.replace("/(root)/(tabs)")}>
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 justify-center space-y-6">
                <AmountCard
                    amount={rawAmount}
                    description={"Loan Repayment"}
                />
                <Text className="text-8xl text-center mt-10">
                    { "🎉"}
                </Text>

                <Text className="text-3xl font-bold text-white leading-normal text-center mt-4">
                    {"Loan Repayment successful"}
                </Text>

                <Text className="text-accent-100 text-center text-base leading-relaxed mt-4">
                    {
                        `Your loan repayment for ₦${rawAmount} was submitted successfully with an outstanding balance of ₦${rawOutstanding}.`}
                </Text>
            </View>

            <View className="pb-6">
                <Button
                    title={"Done"}
                    variant="primary"
                    onPress={() =>
                        router.replace("/(root)/(tabs)")
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default LoanSuccess;
