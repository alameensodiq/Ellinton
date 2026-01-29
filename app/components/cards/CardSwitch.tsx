import React from "react";
import { View, Switch } from "react-native";
import CustomText from "@/app/components/CustomText";

interface CardSwitchProps {
  value: boolean;
  onChange: (val: boolean) => void;
}

const CardSwitch: React.FC<CardSwitchProps> = ({ value, onChange }) => {
  return (
    <View className="mb-6 flex-row justify-between items-center px-1 -mt-2">
      <CustomText size="sm">Show card details</CustomText>

      <View className="rounded-2xl border border-primary-200 bg-transparent justify-center h-8">
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "transparent", true: "transparent" }}
          thumbColor="#FFF"
          ios_backgroundColor="transparent"
        />
      </View>
    </View>
  );
};

export default CardSwitch;
