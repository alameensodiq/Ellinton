import { View, Text, TextInput, Platform } from "react-native";
import React, { useState } from "react";

interface AmountInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  sign?: string;
}

export default function AmountInput({
  value,
  onChange,
  placeholder = "0",
  sign = "₦",
}: AmountInputProps) {
  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) return "";

    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleChange = (text: string) => {
    const formatted = formatNumber(text);
    onChange(formatted);
  };

  return (
    <View
      className={`relative border border-[#6a6a3a] bg-[#4a4a28] rounded-3xl  flex-row items-center ${
        Platform.OS === "ios" ? " px-3 py-1 pb-2 " : " px-3 "
      }`}
    >
      <View className="w-10 items-center justify-center border-r border-[#6a6a3a]">
        <Text className="text-white font-semibold text-lg">{sign}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        className={`flex-1 text-white px-4 text-2xl font-bold h-full mb-2 pt-6  ${
          Platform.OS === "ios" && "pt-0"
        }`}
      />
    </View>
  );
}
