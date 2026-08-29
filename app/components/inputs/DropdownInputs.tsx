import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  label: string;
  placeholder?: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = "Select",
  options,
  selectedValue,
  onSelect,
  error,
  searchable = false,
  searchPlaceholder = "Search...",
  disabled = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handlePress = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  const renderOption = (option: DropdownOption, index: number) => {
    const isLast = index === filteredOptions.length - 1;
    const isSelected = option.value === selectedValue;

    if (isSelected) {
      return (
        <View
          key={`${option.value}-${index}`}
          className={`flex-row items-center justify-between py-4 px-4 rounded-lg bg-accent-100/20 ${
            !isLast ? "border-b border-primary-300" : ""
          }`}
        >
          <Text className="text-base text-accent-100 font-semibold">
            {option.label}
          </Text>
          <Ionicons name="checkmark" size={20} color="#D4FF00" />
        </View>
      );
    }

    return (
      <Pressable
        key={`${option.value}-${index}`}
        onPress={() => {
          onSelect(option.value);
          setShowDropdown(false);
          setSearchQuery("");
        }}
        className={`flex-row items-center justify-between py-3 px-4 rounded-lg active:bg-primary-400 ${
          !isLast ? "border-b border-primary-300" : ""
        }`}
      >
        <Text className="text-base text-white">{option.label}</Text>
      </Pressable>
    );
  };

  return (
    <View className="mb-6">
      <Text className="text-white text-md mb-3">{label}</Text>

      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className={`flex-row items-center justify-between bg-primary-400 rounded-xl p-4 py-6 border-2 ${
          disabled ? "opacity-50 bg-primary-300" : ""
        } ${error ? "border-red-500" : "border-primary-100"}`}
      >
        <Text
          className={`text-base ${
            selectedOption ? "text-white" : "text-accent-100"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <View className="flex-row items-center">
          {error && (
            <Ionicons
              name="alert-circle"
              size={20}
              color="#D20202"
              style={{ marginRight: 8 }}
            />
          )}
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            color="#fff"
          />
        </View>
      </Pressable>

      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="close-circle" size={16} color="#D20202" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}

      {showDropdown && !disabled && (
        <View
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
          className="bg-primary-400 rounded-xl py-4"
        >
          {searchable && (
            <View className="rounded-lg py-3  border-b border-primary-300">
              <View className="flex-row items-center px-4">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-white ml-2"
                />
              </View>
            </View>
          )}

          <ScrollView
            nestedScrollEnabled={true}
            className="max-h-64"
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((option, index) =>
              renderOption(option, index)
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
