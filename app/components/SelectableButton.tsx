import React from "react";
import { Pressable, View } from "react-native";
import CustomText from "@/app/components/CustomText";

interface SelectableButtonProps<T = string> {
  item: {
    value: T;
    label: string;
    icon?: string | React.ReactNode;
  };
  selected: boolean;
  onPress: (value: T) => void;
  className?: string;
  disabled?: boolean; 
}

const SelectableButton = <T extends string>({
  item,
  selected,
  onPress,
  className = "",
  disabled = false, 
}: SelectableButtonProps<T>) => {
  return (
    <Pressable
      className={`p-3 px-6 rounded-lg flex-row items-center 
        ${
          selected
            ? "border-2 border-primary-300 bg-primary-400"
            : "bg-primary-400"
        } 
        ${disabled ? "opacity-50" : ""} ${className}`}
      onPress={() => !disabled && onPress(item.value)}
    >
      {item.icon && (
        <View className="pr-3">
          {typeof item.icon === "string" ? (
            <CustomText size="lg">{item.icon}</CustomText>
          ) : (
            item.icon
          )}
        </View>
      )}
      <CustomText size="base">{item.label}</CustomText>
    </Pressable>
  );
};

export default SelectableButton;
