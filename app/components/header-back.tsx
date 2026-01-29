import { View, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomText from "./CustomText";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showClose?: boolean;
  showCancel?: boolean;

  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export default function Header({
  title,
  showBack = true,
  showClose = false,
  showCancel = false,
  rightIconName,
  onRightPress,
}: HeaderProps) {
  const router = useRouter();

  const handleLeftPress = () => {
    router.back();
  };

  const leftIconName =
    showCancel || showClose ? "close" : showBack ? "chevron-back" : null;

  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      {/* Left icon */}
      {leftIconName ? (
        <TouchableOpacity onPress={handleLeftPress} className="p-2">
          <Ionicons name={leftIconName} size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}

      {/* Title */}
      <CustomText weight="medium" size="lg">
        {title}
      </CustomText>

      {/* Right icon (optional) */}
      {rightIconName ? (
        <TouchableOpacity onPress={onRightPress} className="p-2">
          <Ionicons name={rightIconName} size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
