import React from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextInputField from "@/app/components/inputs/TextInputField";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";

interface Option {
  value: string;
  label: string;
}

interface ScheduleTransactionProps {
  scheduleEnabled: boolean;
  setScheduleEnabled: (value: boolean) => void;

  scheduleName: string;
  setScheduleName: (value: string) => void;

  frequency: string;
  setFrequency: (value: string) => void;

  dayOfWeek: string;
  setDayOfWeek: (value: string) => void;

  startDate: string;
  setStartDate: (value: string) => void;

  endDate: string;
  setEndDate: (value: string) => void;

  frequencyOptions: Option[];
  dayOptions: Option[];
}

export default function ScheduleTransaction({
  scheduleEnabled,
  setScheduleEnabled,
  scheduleName,
  setScheduleName,
  frequency,
  setFrequency,
  dayOfWeek,
  setDayOfWeek,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  frequencyOptions,
  dayOptions,
}: ScheduleTransactionProps) {
  return (
    <View className="mt-4">
      {/* Toggle */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 12 }}
          />
          <Text className="text-white">Schedule this transaction</Text>
        </View>
        <Switch
          value={scheduleEnabled}
          onValueChange={setScheduleEnabled}
          trackColor={{ false: "#767577", true: "#9da855" }}
          thumbColor="#fff"
          ios_backgroundColor="#767577"
        />
      </View>

      {/* Fields */}
      {scheduleEnabled && (
        <View>
          <TextInputField
            label="Schedule name"
            value={scheduleName}
            onChangeText={setScheduleName}
            placeholder="Mr Shittu salary"
          />

          <View className="mb-6">
            <Text className="text-white text-sm mb-3">Choose frequency</Text>
            <View className="flex-row flex-wrap gap-2">
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setFrequency(option.value)}
                  className={`px-6 py-4 rounded-xl ${
                    frequency === option.value
                      ? "bg-primary-300"
                      : "bg-primary-400"
                  }`}
                >
                  <Text className="font-medium text-white">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {frequency === "weekly" && (
            <Dropdown
              label="Days of week"
              placeholder="Select day"
              options={dayOptions}
              selectedValue={dayOfWeek}
              onSelect={setDayOfWeek}
            />
          )}

          <Dropdown
            label="Start date"
            placeholder="Select date"
            options={[
              { value: "2025-11-25", label: "2025-11-25" },
              { value: "2025-11-26", label: "2025-11-26" },
            ]}
            selectedValue={startDate}
            onSelect={setStartDate}
          />

          <Dropdown
            label="End date"
            placeholder="Select date"
            options={[
              { value: "2025-12-25", label: "2025-12-25" },
              { value: "2025-12-26", label: "2025-12-26" },
            ]}
            selectedValue={endDate}
            onSelect={setEndDate}
          />
        </View>
      )}
    </View>
  );
}
