import { View, Text, Switch } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

interface ReceiverProps {
  receiverName: string;
  receiverBank: string;
  receiverAccountNumber: string;
  addAsBeneficiary: boolean;
  setAddAsBeneficiary: (value: boolean) => void;
}

export default function ReceiverCard({
  receiverName,
  receiverBank,
  receiverAccountNumber,
  addAsBeneficiary,
  setAddAsBeneficiary,
}: ReceiverProps) {
  return (
    <View className="mb-6">
      <LinearGradient
        colors={["#515220", "#212207"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 10 }}
      >
        <Text className="text-sm text-white/70 text-center mt-4">
          You are sending to
        </Text>

        <View className="p-4 py-5">
          <View className="items-center">
            <View className="w-14 h-14 rounded-full bg-primary-400 items-center justify-center">
              <MaterialIcons
                name="account-balance"
                size={30}
                color="rgba(255,255,255,0.7)"
              />
            </View>

            <View>
              <Text className="text-lg text-white font-medium text-center mt-2">
                {receiverName}
              </Text>
              <Text className="text-sm text-accent-100 mt-2">
                {receiverBank} • {receiverAccountNumber}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-lg text-accent-100">Add as beneficiary</Text>

        <Switch
          value={addAsBeneficiary}
          onValueChange={setAddAsBeneficiary}
          trackColor={{
            false: "rgba(255,255,255,0.2)",
            true: "#5a5a35",
          }}
          thumbColor={addAsBeneficiary ? "white" : "rgba(255,255,255,0.5)"}
          ios_backgroundColor="rgba(255,255,255,0.2)"
        />
      </View>
    </View>
  );
}
