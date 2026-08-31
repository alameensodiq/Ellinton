import React from "react";
import { View, Switch } from "react-native";
import CustomText from "../CustomText";

interface FreezeCardToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

const FreezeCardToggle: React.FC<FreezeCardToggleProps> = ({
  value,
  onChange,
}) => (
  <View className="flex-row justify-between items-center">
    <CustomText className="text-white">Freeze card</CustomText>

    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#6B6D33", true: "#88894B" }}
      thumbColor="#FFF"
      ios_backgroundColor="#6B6D33"
    />
  </View>
);

export default FreezeCardToggle;
