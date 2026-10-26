import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Country {
  code: string;
  flag: string;
  dialCode: string;
  name: string;
}

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  countries: Country[];
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  error,
  countries,
  selectedCountry,
  onSelectCountry,
  disabled = false,
}) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="mb-6">
      <Text className="text-white text-md mb-3">Phone number</Text>

      <View
        className={`flex-row items-center bg-primary-400 rounded-xl p-4  border-2 border-primary-300 ${
          error ? "border-red-500" : "border-transparent"
        }`}
      >
        <TouchableOpacity
          onPress={() => {
            if (!disabled) {
              setShowCountryPicker(!showCountryPicker);
            }
          }}
          disabled={disabled} 
          className="flex-row items-center pr-3 border-r border-primary-300"
        >
          <Text className="text-2xl mr-2">{selectedCountry.flag}</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color="#fff"
            style={{ opacity: disabled ? 0.5 : 1 }}
          />
        </TouchableOpacity>

        <TextInput
          value={`${selectedCountry.dialCode} ${value}`}
          onChangeText={(text) => {
            const cleaned = text.replace(selectedCountry.dialCode, "").trim();
            onChangeText(cleaned);
          }}
          placeholder={selectedCountry.dialCode}
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          maxLength={selectedCountry.dialCode.length + 1 + 11}
          className="flex-1 text-white text-base ml-3"
        />

        {error && <Ionicons name="alert-circle" size={20} color="#D20202" />}
      </View>

      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="close-circle" size={16} color="#ef4444" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}

      {showCountryPicker && (
        <View className="bg-primary-400 rounded-xl py-4 mt-3">
          <View className=" rounded-lg  py-2 border-b border-primary-300">
            <View className="flex-row items-center px-2">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                placeholder="Search for country"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white ml-2"
              />
            </View>
          </View>

          <ScrollView className="max-h-64">
            {filteredCountries.map((country, index) => {
              const isLast = index === filteredCountries.length - 1;
              return (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => {
                    onSelectCountry(country);
                    setShowCountryPicker(false);
                    setSearchQuery("");
                  }}
                  className={`flex-row items-center py-3 px-2   rounded-lg active:bg-primary-400 ${
                    !isLast ? "border-b border-primary-300" : ""
                  }`}
                >
                  <Text className="text-2xl mr-3">{country.flag}</Text>
                  <Text className="text-white flex-1">
                    {country.name} ({country.dialCode})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
