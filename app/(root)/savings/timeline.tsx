// app/(root)/timeline.tsx
// ✅ Weekly + Monthly now open your BottomSheet dropdown
// ✅ Selecting shows: "Weekly / Wednesday" and "Monthly / 15th" (example)
// ✅ Start/End date fields show calendar icon on the right
// ✅ Tapping the field OR the icon opens the same BottomSheet date picker
// ✅ No other UI changes

import React, { useMemo, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { Ionicons } from "@expo/vector-icons";
import TextInputField from "@/app/components/inputs/TextInputField";
import { useRouter } from "expo-router";
import BottomSheet from "@/app/components/BottomSheet";
import DateTimePicker from "@react-native-community/datetimepicker";

const frequencies = [
  { key: "once", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

const durations = [
  { key: "3m", label: "3 months", days: "90 days" },
  { key: "6m", label: "6 months", days: "180 days" },
  { key: "9m", label: "9 months", days: "270 days" },
  { key: "1y", label: "1 year", days: "365 days" },
] as const;

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type FrequencyKey = (typeof frequencies)[number]["key"];
type DurationKey = (typeof durations)[number]["key"];
type WeekDay = (typeof weekDays)[number];

type SheetType = null | "weekly" | "monthly" | "startDate" | "endDate";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suf = s[(v - 20) % 10] || s[v] || s[0];
  return `${n}${suf}`;
};

export default function Timeline() {
  const [frequency, setFrequency] = useState<FrequencyKey>("weekly");
  const [duration, setDuration] = useState<DurationKey>("3m");

  // dropdown selections
  const [weeklyDay, setWeeklyDay] = useState<WeekDay>("Wednesday");
  const [monthlyDay, setMonthlyDay] = useState<number>(1);

  // bottomsheet control
  const [sheet, setSheet] = useState<SheetType>(null);

  // temp picks (so user can cancel)
  const [tempWeeklyDay, setTempWeeklyDay] = useState<WeekDay>(weeklyDay);
  const [tempMonthlyDay, setTempMonthlyDay] = useState<number>(monthlyDay);

  // custom dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);

  // temp date for date sheet
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const router = useRouter();

  const weeklyLabel = useMemo(() => {
    return frequency === "weekly" ? `Weekly / ${weeklyDay}` : "Weekly";
  }, [frequency, weeklyDay]);

  const monthlyLabel = useMemo(() => {
    return frequency === "monthly"
      ? `Monthly / ${ordinal(monthlyDay)}`
      : "Monthly";
  }, [frequency, monthlyDay]);

  const openWeekly = () => {
    setFrequency("weekly");
    setTempWeeklyDay(weeklyDay);
    setSheet("weekly");
  };

  const openMonthly = () => {
    setFrequency("monthly");
    setTempMonthlyDay(monthlyDay);
    setSheet("monthly");
  };

  const openStartDate = () => {
    setTempDate(startDateObj ?? new Date());
    setSheet("startDate");
  };

  const openEndDate = () => {
    setTempDate(endDateObj ?? startDateObj ?? new Date());
    setSheet("endDate");
  };

  const monthlyDaysList = useMemo(
    () => Array.from({ length: 28 }, (_, i) => i + 1),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar currentStep={3} totalSteps={4} />

          <CustomText size="lg" weight="bold">
            Set your timeline
          </CustomText>
          <CustomText size="sm" secondary className="mt-1 mb-10">
            Choose how long you want to save
          </CustomText>

          <CustomText size="lg" weight="bold" className="mb-4">
            How often do you want to save?
          </CustomText>

          <View className="flex-row mb-8 flex-wrap gap-4">
            {frequencies.map((freq) => {
              const isSelected = frequency === freq.key;
              const showDropdown =
                freq.key === "weekly" || freq.key === "monthly";

              const label =
                freq.key === "weekly"
                  ? weeklyLabel
                  : freq.key === "monthly"
                  ? monthlyLabel
                  : freq.label;

              const onPress = () => {
                if (freq.key === "weekly") return openWeekly();
                if (freq.key === "monthly") return openMonthly();
                setFrequency(freq.key);
              };

              return (
                <Pressable
                  key={freq.key}
                  onPress={onPress}
                  className={`flex-row items-center gap-2 p-4 px-6 rounded-xl ${
                    isSelected ? "bg-primary-300" : "bg-primary-400"
                  }`}
                >
                  <CustomText size="sm">{label}</CustomText>
                  {showDropdown && (
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </View>

          <CustomText size="lg" weight="bold" className="mb-4">
            How long do you want to save?
          </CustomText>

          <View className="flex-row flex-wrap gap-4 justify-center mb-4">
            {durations.map((dur) => (
              <Pressable
                key={dur.key}
                onPress={() => setDuration(dur.key)}
                className={`p-4 px-16 rounded-xl ${
                  duration === dur.key ? "bg-primary-300" : "bg-primary-400"
                }`}
              >
                <CustomText size="sm" weight="bold">
                  {dur.label}
                </CustomText>
                <CustomText size="xs" secondary>
                  {dur.days}
                </CustomText>
              </Pressable>
            ))}
          </View>

          {/* Custom Duration */}
          <CustomText size="sm" className="mb-4" secondary>
            Let me decide
          </CustomText>

          <TextInputField
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Custom duration"
            showSoftInputOnFocus={false}
            caretHidden
            onFocus={openStartDate}
            rightIcon={
              <Ionicons name="calendar-outline" size={20} color="#fff" />
            }
            onRightIconPress={openStartDate}
          />

          <TextInputField
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="Custom duration"
            showSoftInputOnFocus={false}
            caretHidden
            onFocus={openEndDate}
            rightIcon={
              <Ionicons name="calendar-outline" size={20} color="#fff" />
            }
            onRightIconPress={openEndDate}
          />

          <View className="flex-1 mt-4" />
          <Button
            title="Continue"
            variant="primary"
            onPress={() => router.push("/(root)/savings/estimated-outcome")}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WEEKLY dropdown */}
      <BottomSheet
        visible={sheet === "weekly"}
        onClose={() => setSheet(null)}
        title="Choose day"
        buttonText="Continue"
        onConfirm={() => {
          setWeeklyDay(tempWeeklyDay);
          setSheet(null);
        }}
      >
        <CustomText size="lg" weight="bold" className="mb-2">
          What day of the week works for you?
        </CustomText>
        <CustomText size="sm" secondary className="mb-6">
          Choose your preferred day
        </CustomText>

        <View className="flex-row flex-wrap gap-3">
          {weekDays.map((d) => (
            <Pressable
              key={d}
              onPress={() => setTempWeeklyDay(d)}
              className={`px-5 py-4 rounded-xl ${
                tempWeeklyDay === d ? "bg-primary-300" : "bg-primary-400"
              }`}
            >
              <CustomText size="sm">{d}</CustomText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* MONTHLY dropdown */}
      <BottomSheet
        visible={sheet === "monthly"}
        onClose={() => setSheet(null)}
        title="Choose day"
        buttonText="Continue"
        onConfirm={() => {
          setMonthlyDay(tempMonthlyDay);
          setSheet(null);
        }}
      >
        <CustomText size="lg" weight="bold" className="mb-2">
          What day of the month works for you?
        </CustomText>
        <CustomText size="sm" secondary className="mb-6">
          Choose your preferred day
        </CustomText>

        <View className="flex-row flex-wrap gap-3">
          {monthlyDaysList.map((n) => (
            <Pressable
              key={n}
              onPress={() => setTempMonthlyDay(n)}
              className={`px-5 py-4 rounded-xl ${
                tempMonthlyDay === n ? "bg-primary-300" : "bg-primary-400"
              }`}
            >
              <CustomText size="sm">{ordinal(n)}</CustomText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* START DATE picker */}
      <BottomSheet
        visible={sheet === "startDate"}
        onClose={() => setSheet(null)}
        title="Choose date"
        buttonText="Done"
        onConfirm={() => {
          setStartDateObj(tempDate);
          setStartDate(formatDate(tempDate));

          // if end date is before start date, clear it
          if (endDateObj && endDateObj.getTime() < tempDate.getTime()) {
            setEndDateObj(null);
            setEndDate("");
          }

          setSheet(null);
        }}
      >
        <CustomText size="lg" weight="bold" className="mb-2">
          Select start date
        </CustomText>
        <CustomText size="sm" secondary className="mb-6">
          Choose your preferred date
        </CustomText>

        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => d && setTempDate(d)}
          minimumDate={new Date()}
        />
      </BottomSheet>

      {/* END DATE picker */}
      <BottomSheet
        visible={sheet === "endDate"}
        onClose={() => setSheet(null)}
        title="Choose date"
        buttonText="Done"
        onConfirm={() => {
          setEndDateObj(tempDate);
          setEndDate(formatDate(tempDate));
          setSheet(null);
        }}
      >
        <CustomText size="lg" weight="bold" className="mb-2">
          Select end date
        </CustomText>
        <CustomText size="sm" secondary className="mb-6">
          Choose your preferred date
        </CustomText>

        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => d && setTempDate(d)}
          minimumDate={startDateObj ?? new Date()}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}
