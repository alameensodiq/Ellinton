import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
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
      setShowDropdown(true);
    }
  };

  const handleClose = () => {
    setShowDropdown(false);
    setSearchQuery("");
  };

  const renderOption = ({ item, index }: { item: DropdownOption; index: number }) => {
    const isLast = index === filteredOptions.length - 1;
    const isSelected = item.value === selectedValue;

    return (
      <Pressable
        key={`${item.value}-${index}`}
        onPress={() => {
          onSelect(item.value);
          handleClose();
        }}
        className={`flex-row items-center justify-between py-4 px-4 rounded-xl active:bg-primary-300 ${
          isSelected ? "bg-accent-100/20" : ""
        } ${!isLast ? "border-b border-primary-300/40" : ""}`}
      >
        <Text
          className={`text-base flex-1 ${
            isSelected ? "text-accent-100 font-semibold" : "text-white"
          }`}
        >
          {item.label}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={20} color="#D4FF00" />}
      </Pressable>
    );
  };

  return (
    <View className="mb-6">
      {label ? <Text className="text-white text-md mb-3">{label}</Text> : null}

      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className={`flex-row items-center justify-between bg-primary-400 rounded-xl p-4 py-6 border-2 ${
          disabled ? "opacity-50 bg-primary-300" : ""
        } ${error ? "border-red-500" : "border-primary-100"}`}
      >
        <Text
          className={`text-base flex-1 mr-2 ${
            selectedOption ? "text-white" : "text-accent-100"
          }`}
          numberOfLines={1}
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
            name="chevron-down"
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

      <Modal
        visible={showDropdown && !disabled}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-end">
            <Pressable className="flex-1" onPress={handleClose} />
            <View className="bg-primary-100 rounded-t-3xl border-t border-primary-300 h-[70%] p-4 pb-8">
              <View className="flex-row items-center justify-between py-3 px-2 border-b border-primary-300 mb-3">
                <Text className="text-white text-lg font-bold">
                  {label || placeholder}
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  className="p-1 rounded-full bg-primary-400"
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {searchable && (
                <View className="bg-primary-400 rounded-xl py-3 px-4 border border-primary-300 mb-4 flex-row items-center">
                  <Ionicons name="search" size={20} color="#9ca3af" />
                  <TextInput
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 text-white ml-2 text-base"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                renderItem={renderOption}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View className="py-8 px-4 items-center">
                    <Text className="text-white/60 text-center text-base">
                      No options found
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

