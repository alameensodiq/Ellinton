import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Platform,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TextInputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  error,
  disabled = false,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  return (
    <View className="mb-6">
      <Text className="text-white text-sm mb-3">{label}</Text>
      <View
        className={`flex-row items-center bg-primary-400 rounded-2xl px-4 ${
          Platform.OS === "ios" ? "py-3.5" : "py-2"
        } border-2 ${error ? "border-error" : "border-transparent"} ${
          disabled ? "opacity-50 bg-primary-300" : ""
        }`}
      >
        <TextInput
          {...props}
          editable={!disabled}
          placeholderTextColor="#999999"
          className="flex-1 text-white text-base font-bold py-1"
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} className="ml-2">
            {rightIcon}
          </Pressable>
        )}
        {error && <Ionicons name="alert-circle" size={20} color="#D20202" />}
      </View>

      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="close-circle" size={16} color="#D20202" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}
    </View>
  );
};

export default TextInputField;
