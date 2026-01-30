import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";

import { fetchLoanById } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const LoanDetails = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { id } = useLocalSearchParams<{ id?: string }>();

  const { selectedLoan, isLoading } = useAppSelector((s) => s.loans);

  const [hideAmount, setHideAmount] = useState(false);

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

  const loadLoan = async () => {
    if (!id) return;
    await dispatch(fetchLoanById(String(id)) as any)
      .unwrap()
      .catch(() => null);
  };

  useEffect(() => {
    loadLoan();
  }, [id]);

  const loan = selectedLoan;

  const status = String(loan?.status || "active");
  const statusLabel =
    status === "active"
      ? "Active"
      : status === "pending_disbursement"
      ? "Pending"
      : status;

  const productName = loan?.product_name || loan?.product_name || "Payday loan";
  const amount = formatMoney((loan as any)?.amount);
  const interestRate = formatMoney((loan as any)?.interest_rate).replace(
    /,/g,
    ""
  );
  const totalExpected = formatMoney((loan as any)?.total_repayment_expected);

  const schedules = Array.isArray((loan as any)?.schedules)
    ? (loan as any).schedules
    : [];

  const dueDate =
    schedules?.[0]?.paymentDueDate ||
    schedules?.[0]?.repaymentDate ||
    (loan as any)?.updated_at;

  const appliedDate = (loan as any)?.created_at;

  const bankName = "Ellington Bank";

  const isLoanCompleted =
    String(loan?.status || "").toLowerCase() === "completed";

  const SkeletonLine = ({ w = "w-24" }: { w?: string }) => (
    <View className={`${w} h-4 rounded-full bg-white/10`} />
  );

  const SkeletonSmall = ({ w = "w-16" }: { w?: string }) => (
    <View className={`${w} h-3 rounded-full bg-white/10`} />
  );

  const SkeletonCard = () => (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="rounded-3xl mt-4 overflow-hidden">
        <LinearGradient
          colors={["#333419", "#333419"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center justify-between">
            <SkeletonSmall w="w-20" />
            <View className="h-6 w-20 rounded-full bg-white/10" />
          </View>

          <View className="flex-row items-center mt-3">
            <View className="h-8 w-40 rounded-full bg-white/10" />
            <View className="ml-3 h-6 w-6 rounded-full bg-white/10" />
          </View>

          <View className="mt-3">
            <SkeletonSmall w="w-28" />
          </View>

          <View className="mt-5">
            <View className="flex-row justify-between">
              <View className="flex-1 pr-4">
                <SkeletonSmall w="w-24" />
                <View className="mt-2">
                  <SkeletonLine w="w-16" />
                </View>
              </View>

              <View className="flex-1 items-end">
                <SkeletonSmall w="w-28" />
                <View className="mt-2">
                  <SkeletonLine w="w-24" />
                </View>
              </View>
            </View>

            <View className="h-[1px] bg-white/10 my-4" />

            <View className="flex-row justify-between">
              <View className="flex-1 pr-4">
                <SkeletonSmall w="w-16" />
                <View className="mt-2">
                  <SkeletonLine w="w-28" />
                </View>
              </View>

              <View className="flex-1 items-end">
                <SkeletonSmall w="w-16" />
                <View className="mt-2">
                  <SkeletonLine w="w-24" />
                </View>
              </View>
            </View>

            <View className="mt-4">
              <SkeletonSmall w="w-16" />
              <View className="mt-2">
                <SkeletonLine w="w-24" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View className="mt-4">
        <SkeletonLine w="w-40" />
        <View className="mt-4">
          <View className="bg-primary-500 rounded-3xl p-5 border border-white/5 mb-3">
            <View className="flex-row items-center justify-between">
              <SkeletonLine w="w-24" />
              <View className="h-6 w-20 rounded-full bg-white/10" />
            </View>
            <View className="mt-3">
              <SkeletonSmall w="w-32" />
            </View>
          </View>

          <View className="bg-primary-500 rounded-3xl p-5 border border-white/5 mb-3">
            <View className="flex-row items-center justify-between">
              <SkeletonLine w="w-24" />
              <View className="h-6 w-20 rounded-full bg-white/10" />
            </View>
            <View className="mt-3">
              <SkeletonSmall w="w-32" />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />

      <Header
        title="Loan details"
        rightIconName="time-outline"
        onRightPress={() => router.push("/(root)/loans/loan-history")}
      />

      {!id ? (
        <View className="flex-1 items-center justify-center">
          <CustomText className="text-white/80">Loan not found</CustomText>
        </View>
      ) : isLoading && !loan ? (
        <SkeletonCard />
      ) : !loan ? (
        <View className="flex-1 items-center justify-center">
          <CustomText className="text-white/80">Loan not found</CustomText>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top card */}
          <View className="rounded-3xl mt-4 overflow-hidden">
            <LinearGradient
              colors={["#333419", "#333419"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <CustomText size="sm" className="text-white/70">
                  Active loan
                </CustomText>

                <View className="bg-green-500/20 px-3 py-1 rounded-full">
                  <CustomText size="xs" className="text-green-300">
                    {statusLabel}
                  </CustomText>
                </View>
              </View>

              <View className="flex-row items-center mt-2">
                <CustomText weight="bold" size="xl" className="text-white">
                  {hideAmount ? "****" : `₦${amount}`}
                </CustomText>

                <TouchableOpacity
                  className="ml-3"
                  onPress={() => setHideAmount((p) => !p)}
                >
                  <Ionicons
                    name={hideAmount ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              <CustomText size="sm" className="text-white/70 mt-1">
                {productName}
              </CustomText>

              {/* details grid */}
              <View className="mt-5">
                <View className="flex-row justify-between">
                  <View className="flex-1 pr-4">
                    <CustomText size="xs" className="text-white/60">
                      Interest Rate
                    </CustomText>
                    <CustomText weight="bold" className="text-white mt-1">
                      {interestRate}%
                    </CustomText>
                  </View>

                  <View className="flex-1 items-end">
                    <CustomText size="xs" className="text-white/60">
                      Total Repayment
                    </CustomText>
                    <CustomText weight="bold" className="text-white mt-1">
                      ₦{totalExpected}
                    </CustomText>
                  </View>
                </View>

                <View className="h-[1px] bg-white/10 my-4" />

                <View className="flex-row justify-between">
                  <View className="flex-1 pr-4">
                    <CustomText size="xs" className="text-white/60">
                      Bank
                    </CustomText>
                    <CustomText weight="bold" className="text-white mt-1">
                      {bankName}
                    </CustomText>
                  </View>

                  <View className="flex-1 items-end">
                    <CustomText size="xs" className="text-white/60">
                      Applied
                    </CustomText>
                    <CustomText weight="bold" className="text-white mt-1">
                      {formatDate(appliedDate)}
                    </CustomText>
                  </View>
                </View>

                <View className="mt-4">
                  <CustomText size="xs" className="text-white/60">
                    Due date
                  </CustomText>
                  <CustomText weight="bold" className="text-white mt-1">
                    {formatDate(dueDate)}
                  </CustomText>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Repayment schedule */}
          {schedules.length > 0 && (
            <View className="mt-4">
              <CustomText weight="bold" className="text-white mb-4">
                Repayment Schedule
              </CustomText>

              {schedules.map((sch: any, idx: number) => {
                const amountToPay = Number(
                  sch?.repaymentAmountInNaira ?? sch?.total ?? 0
                );
                const due = sch?.paymentDueDate || sch?.repaymentDate;

                const isPaid = isLoanCompleted;
                const isPending = !isPaid;

                return (
                  <View
                    key={`${idx}`}
                    className="flex-row bg-primary-500 rounded-3xl p-5 border border-white/5 mb-3"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <CustomText weight="bold" className="text-white">
                          ₦{formatMoney(amountToPay)}
                        </CustomText>

                        {isPaid ? (
                          <View className="bg-[#21D1841A] px-3 py-1 rounded-full">
                            <CustomText size="xs" className="text-[#21D184]">
                              Paid
                            </CustomText>
                          </View>
                        ) : (
                          <View className="bg-[#FBCD58] px-3 py-1 rounded-full">
                            <CustomText size="xs" className="text-yellow-300">
                              {isPending ? "Pending" : "Pending"}
                            </CustomText>
                          </View>
                        )}
                      </View>

                      <CustomText size="xs" className="text-white/60 mt-1">
                        Due: {formatDate(due)}
                      </CustomText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default LoanDetails;
