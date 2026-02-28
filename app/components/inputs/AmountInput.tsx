import { View, Text, TextInput, Platform } from "react-native";
import React from "react";

interface AmountInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  sign?: string;

  // ✅ NEW: raw number output for other pages
  onChangeValue?: (value: number) => void;
}

export default function AmountInput({
  value,
  onChange,
  placeholder = "0",
  sign = "₦",
  onChangeValue,
}: AmountInputProps) {
  const formatNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toNumber = (text: string) => Number(text.replace(/[^0-9]/g, "")) || 0;

  const handleChange = (text: string) => {
    const raw = toNumber(text);
    const formatted = formatNumber(text);

    onChange(formatted);
    onChangeValue?.(raw); // ✅ raw number for other screens
  };

  return (
    <View
      className={`relative border border-[#6a6a3a] bg-[#4a4a28] rounded-3xl flex-row items-center ${
        Platform.OS === "ios" ? "px-3 py-1 pb-2" : "px-3"
      }`}
    >
      <View className="w-10 items-center justify-center border-r border-[#6a6a3a]">
        <Text className="text-white font-semibold text-lg">{sign}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={handleChange}
        keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        className={`flex-1 text-white px-4 text-2xl font-bold ${
          Platform.OS === "ios" ? "py-4" : "py-3"
        }`}
      />
    </View>
  );
}
