// app/(root)/savings/my-plan-details.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StatusBar,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import CustomText from "@/app/components/CustomText";
import Header from "@/app/components/header-back";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { fetchSavingsTransactions } from "@/app/lib/thunks/savingsThunks";

const money = (n: number) =>
  `₦${Math.round(Number(n || 0)).toLocaleString("en-NG")}`;

type Saving = {
  id: number;
  name: string;
  interest_rate: number;
  tenure: number;
  amount: number;
  amount_saved?: number;
  savings_type: string;
  target_amount: number | null;
  status: string;
  saving_interval: string;
  start_date: string;
  end_date: string; // YYYY-MM-DD
  savings_account: string;
};

type Txn = {
  id: number;
  type: string;
  narration: string;
  amount: number;
  status: string;
  transaction_date: string;
  other_account?: string;
  other_bank?: string;
};

const ActionButton = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className={`flex-1 items-center justify-center rounded-2xl py-4 border ${
      disabled
        ? "bg-primary-400/40 border-white/5"
        : "bg-primary-400 border-white/10"
    }`}
  >
    <Ionicons name={icon} size={22} color="#fff" />
    <CustomText
      size="sm"
      weight="bold"
      className={`mt-2 ${disabled ? "text-white/40" : ""}`}
    >
      {label}
    </CustomText>
  </Pressable>
);

const TxnSkeleton = () => (
  <View className="bg-primary-400 rounded-3xl p-5 mb-4 border border-white/10">
    <View className="h-4 w-28 bg-white/10 rounded mb-3" />
    <View className="h-5 w-40 bg-white/10 rounded mb-2" />
    <View className="h-3 w-24 bg-white/10 rounded" />
  </View>
);

const formatDayTitle = (isoOrDate: string) => {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatPrettyDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const canWithdrawFixed = (endDateISO?: string) => {
  if (!endDateISO) return false;
  const maturity = new Date(`${endDateISO}T00:00:00`);
  if (Number.isNaN(maturity.getTime())) return false;
  return new Date().getTime() >= maturity.getTime();
};

const groupByDate = (txns: Txn[]) => {
  const map = new Map<string, Txn[]>();
  txns.forEach((t) => {
    const key = (t.transaction_date || "").slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });

  const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
  return keys.map((k) => ({ date: k, data: map.get(k)! }));
};

export default function MyPlanDetailsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ saving?: string }>();

  const saving: Saving | null = useMemo(() => {
    try {
      const raw = params.saving;
      if (!raw) return null;
      return JSON.parse(String(raw));
    } catch {
      return null;
    }
  }, [params.saving]);

  const [txLoading, setTxLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [txns, setTxns] = useState<Txn[]>([]);

  const loadTransactions = useCallback(async () => {
    if (!saving?.savings_account) return;

    try {
      const res = await dispatch(
        fetchSavingsTransactions({
          page: 1,
          limit: 50,
          accountNumber: saving.savings_account,
        }) as any
      ).unwrap();

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];

      setTxns(list);
    } catch {
      setTxns([]);
    }
  }, [dispatch, saving?.savings_account]);

  useEffect(() => {
    const run = async () => {
      if (!saving?.savings_account) {
        setTxLoading(false);
        return;
      }
      setTxLoading(true);
      await loadTransactions();
      setTxLoading(false);
    };
    run();
  }, [saving?.savings_account, loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const saved = Number(saving?.amount_saved ?? 0);
  const target = Number(saving?.target_amount ?? 0);

  const achievedPct = useMemo(() => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((saved / target) * 100));
  }, [saved, target]);

  const interestText = useMemo(() => {
    const rate = Number(saving?.interest_rate ?? 0);
    return `${money(0)} at (${rate}% p.a)`;
  }, [saving?.interest_rate]);

  const autosaveText = useMemo(() => {
    const interval = String(saving?.saving_interval || "").toLowerCase();
    const amt = money(saving?.amount ?? 0);
    if (!interval) return "—";
    return `${amt} ${interval}`;
  }, [saving?.saving_interval, saving?.amount]);

  const sections = useMemo(() => groupByDate(txns), [txns]);

  const isFixed = String(saving?.savings_type || "").toUpperCase() === "FIXED";
  const withdrawAllowed = isFixed ? canWithdrawFixed(saving?.end_date) : true;
  const withdrawDisabled = !withdrawAllowed;

  if (!saving) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100">
        <StatusBar barStyle="light-content" />
        <Header title="Plan" />
        <View className="flex-1 items-center justify-center px-6">
          <CustomText size="sm" secondary className="text-center">
            Could not load plan details
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title={saving.name} />

      <FlatList
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="px-4">
            <View className="rounded-3xl overflow-hidden mt-3">
              <LinearGradient
                colors={["#212207", "#515220"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-start justify-between">
                  <View>
                    <CustomText size="sm" secondary>
                      Saved
                    </CustomText>

                    <View className="flex-row items-center gap-2 mt-1">
                      <CustomText size="xl" weight="bold">
                        {money(saved)}
                      </CustomText>
                      <Ionicons name="eye-off" size={18} color="#fff" />
                    </View>
                  </View>

                  <View className="items-end">
                    <CustomText size="sm" secondary>
                      My target
                    </CustomText>
                    <CustomText size="base" weight="bold" className="mt-1">
                      {target ? money(target) : "—"}
                    </CustomText>
                  </View>
                </View>

                <View className="mt-6">
                  <View className="flex-row justify-between mb-2">
                    <CustomText size="sm" secondary>
                      {achievedPct}% achieved
                    </CustomText>
                    <CustomText size="sm" secondary>
                      {saving.status === "ACTIVE" ? "Active" : saving.status}
                    </CustomText>
                  </View>

                  <View className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <View
                      style={{ width: `${achievedPct}%` }}
                      className="h-2 bg-primary-200"
                    />
                  </View>
                </View>

                <View className="flex-row justify-between mt-6">
                  <View>
                    <CustomText size="sm" secondary>
                      Total Interest
                    </CustomText>
                    <CustomText size="sm" weight="bold" className="mt-1">
                      {interestText}
                    </CustomText>
                  </View>

                  <View className="items-end">
                    <CustomText size="sm" secondary>
                      Autosave
                    </CustomText>
                    <CustomText size="sm" weight="bold" className="mt-1">
                      {autosaveText}
                    </CustomText>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View className="flex-row gap-4 mt-6">
              <ActionButton
                icon="add"
                label="Top up"
                onPress={() => {
                  router.push({
                    pathname: "/(root)/savings/topup-withdraw",
                    params: {
                      mode: "topup",
                      savingsId: String(saving.id),
                      saving: JSON.stringify(saving),
                    },
                  });
                }}
              />
              <ActionButton
                icon="arrow-down"
                label="Withdraw"
                disabled={withdrawDisabled}
                onPress={() => {
                  if (withdrawDisabled) return;
                  router.push({
                    pathname: "/(root)/savings/topup-withdraw",
                    params: {
                      mode: "withdraw",
                      savingsId: String(saving.id),
                      saving: JSON.stringify(saving),
                    },
                  });
                }}
              />
            </View>

            {isFixed && withdrawDisabled ? (
              <CustomText size="sm" secondary className="mt-3">
                Withdraw available on {formatPrettyDate(saving.end_date)}
              </CustomText>
            ) : null}

            <CustomText size="lg" weight="bold" className="mt-8 mb-3">
              History
            </CustomText>

            {txLoading ? (
              <View>
                <TxnSkeleton />
                <TxnSkeleton />
                <TxnSkeleton />
              </View>
            ) : null}

            {!txLoading && txns.length === 0 ? (
              <View className="mt-6">
                <CustomText size="sm" secondary>
                  No transactions yet
                </CustomText>
              </View>
            ) : null}
          </View>
        }
        data={txLoading ? [] : sections}
        keyExtractor={(s) => s.date}
        renderItem={({ item }) => (
          <View className="px-4">
            <CustomText size="sm" secondary className="mt-5 mb-3">
              {formatDayTitle(item.date)}
            </CustomText>

            {item.data.map((t) => {
              const isPlus =
                String(t.type || "").includes("TOP_UP") ||
                String(t.type || "").includes("AUTO_SAVE");
              const amountText = `${isPlus ? "+" : ""}${money(t.amount)}`;

              return (
                <View
                  key={t.id}
                  className="bg-primary-400 rounded-3xl p-5 mb-4 border border-white/10"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <CustomText size="base" weight="bold">
                        {t.type === "SAVINGS_AUTO_SAVE"
                          ? "Autosave"
                          : t.type?.includes("WITHDRAW")
                          ? "Withdraw"
                          : "Top up"}
                      </CustomText>
                      <CustomText size="sm" secondary className="mt-1">
                        {t.narration || "Transaction"}
                      </CustomText>
                      <CustomText size="xs" secondary className="mt-2">
                        {formatTime(t.transaction_date)}
                      </CustomText>
                    </View>

                    <CustomText
                      size="base"
                      weight="bold"
                      className={isPlus ? "text-green-400" : ""}
                    >
                      {amountText}
                    </CustomText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
