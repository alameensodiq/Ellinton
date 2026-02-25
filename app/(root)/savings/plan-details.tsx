import React, { useMemo, useState } from "react";
import { View, ScrollView, StatusBar, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { createSaving } from "@/app/lib/thunks/savingsThunks";

const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const prettyType = (t: string) => {
  const map: Record<string, string> = {
    basic: "Basic savings",
    target: "Target savings",
    group: "Group savings",
    fixed: "Fixed deposit",
  };
  return map[(t || "").toLowerCase()] || "Savings";
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// YYYY-MM-DD
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const toISOFromPretty = (value?: string) => {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return undefined;

  const day = Number(m[1]);
  const monthName = m[2].toLowerCase();
  const year = Number(m[3]);

  const months: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const month = months[monthName];
  if (!month || day < 1 || day > 31) return undefined;

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

type Participant = {
  userId: string;
  accountNumber: string;
  userName: string;
};

const parseParticipants = (raw: any): Participant[] | undefined => {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw as Participant[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Participant[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeDayOfWeek = (raw?: string) => {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  const allowed = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return allowed.includes(v) ? v : undefined;
};

export default function PlanDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();
  const dispatch = useAppDispatch();

  const [submitting, setSubmitting] = useState(false);

  const amount = Number(params.amount || params.targetAmount || 0);
  const tenure = Number(params.tenure || params.productTenure || 0);

  const planName = String(params.planName || "Your plan");
  const planType = String(params.type || "basic");
  const productCode = String(params.productCode || "");
  const frequency = String(params.frequency || "once");

  const dayOfWeek = useMemo(
    () =>
      normalizeDayOfWeek(
        params.dayOfWeek ? String(params.dayOfWeek) : undefined
      ),
    [params.dayOfWeek]
  );

  const dateInMonth = params.dateInMonth
    ? Number(params.dateInMonth)
    : undefined;

  const debitSource = String(params.debitSource || "BANK_ACCOUNT");
  const maturityAction = String(params.maturityAction || "TRANSFER_TO_ACCOUNT");

  const targetAmount = params.targetAmount
    ? Number(params.targetAmount)
    : undefined;

  const participants = useMemo(
    () => parseParticipants(params.participants),
    [params.participants]
  );

  const startDate = useMemo(() => {
    const fromParams = toISOFromPretty(
      params.startDate ? String(params.startDate) : undefined
    );
    return fromParams || toISODate(new Date());
  }, [params.startDate]);

  const endDate = useMemo(() => {
    const fromParams =
      toISOFromPretty(params.endDate ? String(params.endDate) : undefined) ||
      toISOFromPretty(
        params.maturity_date ? String(params.maturity_date) : undefined
      );

    return fromParams || toISODate(addDays(new Date(), tenure || 0));
  }, [params.endDate, params.maturity_date, tenure]);

  const frequencyText = useMemo(() => {
    if (frequency === "weekly") return `Weekly / ${dayOfWeek || "—"}`;
    if (frequency === "monthly")
      return `Monthly / ${dateInMonth ? `${dateInMonth}th` : "—"}`;
    if (frequency === "daily") return "Daily";
    return "Once";
  }, [frequency, dayOfWeek, dateInMonth]);

  const onCreatePlan = async () => {
    if (submitting) return;

    if (!planName.trim())
      return Alert.alert("Missing", "Plan name is required.");
    if (!productCode)
      return Alert.alert("Missing", "Product code is required.");
    if (!amount || amount <= 0)
      return Alert.alert("Missing", "Amount is required.");
    if (!tenure || tenure <= 0)
      return Alert.alert("Missing", "Tenure is required.");

    if (frequency === "weekly" && !dayOfWeek) {
      return Alert.alert(
        "Invalid day",
        "Day of week must be: sunday, monday, tuesday, wednesday, thursday, friday, saturday."
      );
    }
    if (frequency === "monthly" && !dateInMonth) {
      return Alert.alert("Missing", "Please pick a day of the month.");
    }

    setSubmitting(true);
    try {
      const payload = {
        name: planName,
        productCode,
        amount,
        frequency,
        tenure,
        startDate,
        endDate,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dateInMonth: frequency === "monthly" ? dateInMonth : undefined,
        debitSource,
        maturityAction,
        targetAmount,
        participants: participants?.length ? participants : undefined,
      };

      await dispatch(createSaving(payload as any)).unwrap();

      router.replace({
        pathname: "/(root)/savings/success",
        params: {
          type: planType, 
          amount: String(amount),
          description: "Savings plan",
        },
      } as any);
    } catch (e: any) {
      Alert.alert("Create failed", String(e || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <CustomText size="sm" weight="bold">
            View plan details
          </CustomText>

          <View style={{ width: 34 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#212207", "#515220"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18, overflow: "hidden" }}
        >
          <View className="bg-primary-400/60 border border-white/10 rounded-2xl p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <View className="w-10 h-10 rounded-full bg-primary-300 items-center justify-center mb-4">
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                </View>

                <CustomText size="xl" weight="bold">
                  {planName}
                </CustomText>
                <CustomText size="sm" secondary className="mt-1">
                  {prettyType(planType)}
                </CustomText>
              </View>

              <View className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 items-center justify-center">
                <CustomText size="xxl" weight="bold" className="text-white/10">
                  ₦
                </CustomText>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="mt-5 bg-primary-400 rounded-2xl border border-white/10 overflow-hidden">
          {[
            { label: "Amount", value: money(amount) },
            { label: "Duration", value: tenure ? `${tenure} day(s)` : "—" },
            { label: "Frequency", value: frequencyText },
            { label: "Start date", value: startDate },
            { label: "Maturity date", value: endDate },
            {
              label: "Goal amount",
              value: targetAmount ? money(targetAmount) : "—",
            },
            { label: "Payment Type", value: debitSource },
            { label: "Maturity Action", value: maturityAction },
            ...(participants?.length
              ? [
                  {
                    label: "Participants",
                    value: `${participants.length} member(s)`,
                  },
                ]
              : []),
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
      </ScrollView>

      <View className="px-5 pb-10 absolute w-full bottom-0 bg-primary-100">
        <Button
          title={submitting ? "Creating..." : "Create plan"}
          variant="primary"
          onPress={onCreatePlan}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
}
