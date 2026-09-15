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
  const generateDateOptions = (daysCount: number, offsetDays: number = 0): Option[] => {
    const options: Option[] = [];
    const today = new Date();
    for (let i = offsetDays; i < daysCount + offsetDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      options.push({ value: dateStr, label: dateStr });
    }
    return options;
  };

  const startDateOptions = React.useMemo(() => generateDateOptions(30, 0), []);
  const endDateOptions = React.useMemo(() => generateDateOptions(90, 1), []);

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
            options={startDateOptions}
            selectedValue={startDate}
            onSelect={setStartDate}
            searchable
          />

          <Dropdown
            label="End date"
            placeholder="Select date"
            options={endDateOptions}
            selectedValue={endDate}
            onSelect={setEndDate}
            searchable
          />
        </View>
      )}
    </View>
  );
}
