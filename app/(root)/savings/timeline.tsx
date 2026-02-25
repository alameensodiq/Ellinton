import React, { useMemo, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomSheet from "@/app/components/BottomSheet";

const frequencies = [
  { key: "once", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
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
type WeekDay = (typeof weekDays)[number];
type SheetType = null | "weekly" | "monthly";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const addDays = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suf = s[(v - 20) % 10] || s[v] || s[0];
  return `${n}${suf}`;
};

export default function Timeline() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();

  const [frequency, setFrequency] = useState<FrequencyKey>("weekly");

  // dropdown selections
  const [weeklyDay, setWeeklyDay] = useState<WeekDay>("Wednesday");
  const [monthlyDay, setMonthlyDay] = useState<number>(1);

  // bottomsheet control
  const [sheet, setSheet] = useState<SheetType>(null);

  // temp picks (so user can cancel)
  const [tempWeeklyDay, setTempWeeklyDay] = useState<WeekDay>(weeklyDay);
  const [tempMonthlyDay, setTempMonthlyDay] = useState<number>(monthlyDay);

  const productTenureDays = useMemo(() => {
    const t = Number(params.productTenure || params.tenure || 0);
    return t > 0 ? t : 0;
  }, [params.productTenure, params.tenure]);

  const startDateObj = useMemo(() => new Date(), []);
  const maturityDateObj = useMemo(
    () => addDays(startDateObj, productTenureDays),
    [startDateObj, productTenureDays]
  );

  const startDateText = useMemo(() => formatDate(startDateObj), [startDateObj]);
  const maturityDateText = useMemo(
    () => formatDate(maturityDateObj),
    [maturityDateObj]
  );

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

  const monthlyDaysList = useMemo(
    () => Array.from({ length: 28 }, (_, i) => i + 1),
    []
  );

  const onContinue = () => {
    if (!productTenureDays) return;

    router.push({
      pathname: "/(root)/savings/estimated-outcome",
      params: {
        ...params,
        frequency,
        tenure: String(productTenureDays),

        // keep these for display and API if needed
        startDate: startDateText,
        endDate: maturityDateText,
        maturity_date: maturityDateText,

        dayOfWeek: frequency === "weekly" ? weeklyDay : undefined,
        dateInMonth: frequency === "monthly" ? String(monthlyDay) : undefined,

        amount: params.targetAmount || params.amount || undefined,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar currentStep={3} totalSteps={4} />

        <CustomText size="lg" weight="bold">
          Set your timeline
        </CustomText>
        <CustomText size="sm" secondary className="mt-1 mb-10">
          Choose how often you want to save (duration is based on the product).
        </CustomText>

        <CustomText size="lg" weight="bold" className="mb-4">
          How often do you want to save?
        </CustomText>

        <View className="flex-row mb-10 flex-wrap gap-4">
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

        {/* Read-only duration summary (from product) */}
        <View className="bg-primary-400 rounded-2xl border border-white/10 overflow-hidden">
          {[
            { label: "Duration", value: `${productTenureDays} days` },
            { label: "Start date", value: startDateText },
            { label: "Maturity date", value: maturityDateText },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View className="flex-row items-center justify-between px-5 py-5">
                <CustomText size="sm" secondary>
                  {row.label}
                </CustomText>
                <CustomText size="sm" weight="bold">
                  {row.value}
                </CustomText>
              </View>
              {idx !== arr.length - 1 && (
                <View className="h-[1px] bg-white/10 mx-5" />
              )}
            </View>
          ))}
        </View>

        <View className="h-10" />
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-5 px-4 pb-6 pt-3 bg-primary-100 border-t border-white/10">
        <Button
          title="Continue"
          variant="primary"
          onPress={onContinue}
          disabled={!productTenureDays}
        />
      </View>

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
    </SafeAreaView>
  );
}
