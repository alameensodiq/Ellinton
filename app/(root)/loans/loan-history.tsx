import React, { useEffect, useMemo, useState } from "react";
import { View, StatusBar, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import { fetchUserLoans } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const LoanHistory = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { loans, isLoading } = useAppSelector((s) => s.loans);

  const [tab, setTab] = useState<"active" | "past">("active");
  const [filter, setFilter] = useState<string>("all");

  const formatMoney = (val: any) => {
    const n = Number(val || 0);
    if (Number.isNaN(n)) return "0";
    return n.toLocaleString();
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const loadLoans = async () => {
    await dispatch(fetchUserLoans({ page: 1, limit: 50 }) as any)
      .unwrap()
      .catch(() => []);
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const activeStatuses = ["active", "overdue", "pending_disbursement"];
  const pastStatuses = ["completed", "failed", "cancelled", "rejected"];

  const activeLoans = useMemo(() => {
    if (!Array.isArray(loans)) return [];
    return loans.filter((l: any) =>
      activeStatuses.includes(String(l?.status || "").toLowerCase())
    );
  }, [loans]);

  const pastLoans = useMemo(() => {
    if (!Array.isArray(loans)) return [];
    const lower = (s: any) => String(s || "").toLowerCase();
    const isActiveBucket = (s: any) => activeStatuses.includes(lower(s));
    return loans.filter((l: any) => {
      const st = lower(l?.status);
      if (pastStatuses.includes(st)) return true;
      return !isActiveBucket(st);
    });
  }, [loans]);

  const visibleLoans = useMemo(() => {
    const base = tab === "active" ? activeLoans : pastLoans;
    if (filter === "all") return base;
    return base.filter(
      (l: any) => String(l?.status || "").toLowerCase() === filter
    );
  }, [tab, filter, activeLoans, pastLoans]);

  const activeCount = activeLoans.length;
  const pastCount = pastLoans.length;

  const pillOptions =
    tab === "active"
      ? [
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "overdue", label: "Overdue" },
        ]
      : [
          { key: "all", label: "All" },
          { key: "completed", label: "Completed" },
          { key: "failed", label: "Failed" },
        ];

  const badgeStyle = (statusRaw: any) => {
    const st = String(statusRaw || "").toLowerCase();

    if (st === "active")
      return {
        wrap: "bg-green-500/20",
        text: "text-green-300",
        label: "Active",
      };

    if (st === "overdue")
      return { wrap: "bg-red-500/20", text: "text-red-300", label: "Overdue" };

    if (st === "pending_disbursement")
      return {
        wrap: "bg-[#FBCD58]/20",
        text: "text-yellow-300",
        label: "Pending",
      };

    if (st === "completed")
      return { wrap: "bg-green-500/20", text: "text-green-300", label: "Paid" };

    if (st === "failed")
      return { wrap: "bg-red-500/20", text: "text-red-300", label: "Failed" };

    return {
      wrap: "bg-white/10",
      text: "text-white/70",
      label: String(statusRaw || "Status"),
    };
  };

  const SkeletonCard = () => (
    <View className="bg-primary-400 rounded-3xl p-4 border border-white/5 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="h-4 w-24 rounded-full bg-white/10" />
        <View className="h-6 w-20 rounded-full bg-white/10" />
      </View>

      <View className="mt-4">
        <View className="h-4 w-28 rounded-full bg-white/10" />
        <View className="mt-3 h-7 w-32 rounded-full bg-white/10" />
      </View>

      <View className="mt-4 flex-row justify-between">
        <View className="h-3 w-20 rounded-full bg-white/10" />
        <View className="h-3 w-24 rounded-full bg-white/10" />
      </View>
    </View>
  );

  const isFirstLoad = isLoading && (!loans || loans.length === 0);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />

      <Header showClose title="History" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <View className="flex-row items-center justify-center mt-2 border-b-primary-400 border-b">
          <TouchableOpacity
            onPress={() => {
              setTab("active");
              setFilter("all");
            }}
            className="px-4 "
          >
            <CustomText
              weight="bold"
              className={tab === "active" ? "text-white" : "text-white/60"}
            >
              Active ({activeCount})
            </CustomText>
            {tab === "active" && (
              <View className="h-[2px] bg-white/70 rounded-full mt-2" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setTab("past");
              setFilter("all");
            }}
            className="px-4"
          >
            <CustomText
              weight="bold"
              className={tab === "past" ? "text-white" : "text-white/60"}
            >
              Past ({pastCount})
            </CustomText>
            {tab === "past" && (
              <View className="h-[2px] bg-white/70 rounded-full mt-2" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter row */}
        <View className="flex-row items-center mt-4">
          <View className="flex-row items-center">
            <Ionicons name="options-outline" size={16} color="white" />
            <CustomText className="text-white ml-2">Filter</CustomText>
          </View>
        </View>

        {/* Filter pills */}
        <View className="flex-row items-center mt-3">
          {pillOptions.map((p) => {
            const selected = filter === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setFilter(p.key)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  selected
                    ? "bg-primary-400 border-white/10"
                    : "bg-transparent border-white/10"
                }`}
              >
                <CustomText
                  className={selected ? "text-white" : "text-white/70"}
                >
                  {p.label}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        <View className="mt-4">
          {isFirstLoad ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : visibleLoans.length === 0 ? (
            <View className="items-center justify-center mt-10">
              <CustomText className="text-white/70">No loans found</CustomText>
            </View>
          ) : (
            visibleLoans.map((l: any) => {
              const productName = l?.product_name || "Payday loan";
              const amount = formatMoney(l?.amount);
              const dateApplied = formatDate(l?.created_at);
              const badge = badgeStyle(l?.status);

              return (
                <Pressable
                  key={String(l?.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/loans/loan-details",
                      params: { id: String(l?.id) },
                    })
                  }
                  className="bg-[#555625] rounded-3xl p-4 border border-white/5 mb-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="bg-primary-300/40 w-9 h-9 rounded-full items-center justify-center mr-3">
                        <Ionicons name="cash-outline" size={16} color="white" />
                      </View>
                      <CustomText weight="bold" className="text-white">
                        {productName}
                      </CustomText>
                    </View>

                    <View className={`${badge.wrap} px-3 py-1 rounded-full`}>
                      <CustomText size="xs" className={badge.text}>
                        {badge.label}
                      </CustomText>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-end justify-between">
                    <View>
                      <CustomText size="xs" className="text-white/60">
                        Amount
                      </CustomText>
                      <CustomText weight="bold" className="text-white mt-1">
                        ₦{amount}
                      </CustomText>
                    </View>

                    <View className="items-end">
                      <CustomText size="xs" className="text-white/60">
                        Date applied
                      </CustomText>
                      <CustomText weight="bold" className="text-white mt-1">
                        {dateApplied}
                      </CustomText>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

export default LoanHistory;
