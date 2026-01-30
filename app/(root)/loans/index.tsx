import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { fetchUserLoans } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const Loans = () => {
  const LoanIcon = svgIcons.loans;
  const ChipIcon = svgIcons.chip;

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { loans, isLoading } = useAppSelector((s) => s.loans);

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

  const loadLoans = async () => {
    // 1) try active
    const active = await dispatch(
      fetchUserLoans({ status: "active", page: 1, limit: 20 }) as any
    )
      .unwrap()
      .catch(() => []);

    // 2) if no active, load all loans
    if (!active || active.length === 0) {
      await dispatch(fetchUserLoans({ page: 1, limit: 20 }) as any)
        .unwrap()
        .catch(() => []);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const activeLoan = useMemo(() => {
    if (!loans || loans.length === 0) return null;
    return loans.find((l: any) => l.status === "active") || loans[0];
  }, [loans]);

  // ✅ placeholder loading (while fetching loans)
  const SkeletonLine = ({ w = "w-24" }: { w?: string }) => (
    <View className={`${w} h-4 rounded-full bg-white/10`} />
  );
  const SkeletonSmall = ({ w = "w-16" }: { w?: string }) => (
    <View className={`${w} h-3 rounded-full bg-white/10`} />
  );

  const LoansSkeleton = () => (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />

      <Header
        showClose
        title="Loan"
        rightIconName="time-outline"
        onRightPress={() => router.push("/(root)/loans/loan-history")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top card skeleton */}
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

            <View className="mt-5 h-12 rounded-full bg-white/10" />

            <View className="mt-6">
              <View className="flex-row justify-between mb-2">
                <SkeletonSmall w="w-32" />
                <SkeletonSmall w="w-10" />
              </View>

              <View className="h-2 rounded-full bg-white/10 overflow-hidden" />

              <View className="flex-row justify-between mt-4">
                <View>
                  <SkeletonSmall w="w-16" />
                  <View className="mt-2">
                    <SkeletonLine w="w-20" />
                  </View>
                </View>

                <View className="items-end">
                  <SkeletonSmall w="w-16" />
                  <View className="mt-2">
                    <SkeletonLine w="w-20" />
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Schedule skeleton */}
        <View className="mt-4">
          <SkeletonLine w="w-44" />
          <View className="mt-4">
            <View className="flex-row bg-primary-500 rounded-3xl p-5 border border-white/5 mb-3">
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <SkeletonLine w="w-24" />
                  <View className="h-6 w-20 rounded-full bg-white/10" />
                </View>
                <View className="mt-3">
                  <SkeletonSmall w="w-32" />
                </View>
              </View>
            </View>

            <View className="flex-row bg-primary-500 rounded-3xl p-5 border border-white/5">
              <View className="flex-1">
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ✅ show placeholder while loading and we don't have loans yet
  if (isLoading && (!loans || loans.length === 0)) {
    return <LoansSkeleton />;
  }

  if (!activeLoan) {
    return (
      <SafeAreaView className="flex-1 bg-primary-100">
        <StatusBar barStyle="light-content" />

        <Header
          showClose
          title="Loan"
          rightIconName="time-outline"
          onRightPress={() => router.push("/(root)/loans/loan-history")}
        />

        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6">
            <LoanIcon width={90} height={90} />
          </View>

          <CustomText
            weight="bold"
            size="xl"
            className="text-center text-white mb-2"
          >
            Get a loan that treats{"\n"}you right
          </CustomText>

          <CustomText size="sm" className="text-center text-white/80 mb-10">
            Achieve that goal and feel in{"\n"}control with a loan.
          </CustomText>
        </View>

        <View className="px-6 pb-6">
          <View className="w-full bg-primary-400 rounded-2xl p-4 flex-row mb-8 items-center">
            <View className="mr-3 mt-1 bg-primary-300 p-2 rounded-full">
              <ChipIcon width={24} height={24} />
            </View>

            <CustomText size="sm" className="text-white/90 flex-1">
              Get instant credit up to 3X your transaction usable only within
              Ellington Bank. Repay over 3 to 12 months at just 1.2% monthly
              interest with no hidden fees.
            </CustomText>
          </View>

          <Button
            title={isLoading ? "Loading..." : "Apply now"}
            onPress={() => router.push("/(root)/loans/step1")}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE LOAN DESIGN
  const productName = activeLoan.product_name || "Payday loan";
  const amount = formatMoney(activeLoan.amount);
  const status = activeLoan.status || "active";
  const statusLabel =
    status === "active"
      ? "Active"
      : status === "pending_disbursement"
      ? "Pending"
      : status;

  const totalExpected = Number(activeLoan.total_repayment_expected || 0);
  const paid = 0;
  const remaining = totalExpected > 0 ? totalExpected - paid : 0;

  const progressPct =
    totalExpected > 0 ? Math.round((paid / totalExpected) * 100) : 0;

  const schedules = Array.isArray(activeLoan?.schedules)
    ? activeLoan.schedules
    : [];

  const isLoanCompleted =
    String(activeLoan?.status || "").toLowerCase() === "completed";

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />

      <Header
        showClose
        title="Loan"
        rightIconName="time-outline"
        onRightPress={() => router.push("/(root)/loans/loan-history")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top card (Gradient) */}
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

              <View className="flex-row items-center space-x-2">
                <View className="bg-green-500/20 px-3 py-1 rounded-full">
                  <CustomText size="xs" className="text-green-300">
                    {statusLabel}
                  </CustomText>
                </View>
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

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(root)/loans/loan-details",
                  params: { id: String(activeLoan.id) },
                })
              }
              className="mt-5 bg-primary-300/40 rounded-full py-3 items-center"
            >
              <CustomText className="text-white">View details</CustomText>
            </TouchableOpacity>

            {/* Progress */}
            <View className="mt-6">
              <View className="flex-row justify-between mb-2">
                <CustomText size="sm" className="text-white/70">
                  Repayment progress
                </CustomText>
                <CustomText size="sm" className="text-white/70">
                  {progressPct}%
                </CustomText>
              </View>

              <View className="h-2 rounded-full bg-white/10 overflow-hidden">
                <View
                  className="h-full bg-accent-100"
                  style={{ width: `${progressPct}%` }}
                />
              </View>

              <View className="flex-row justify-between mt-4">
                <View>
                  <CustomText size="xs" className="text-white/60">
                    Total paid
                  </CustomText>
                  <CustomText weight="bold" className="text-white mt-1">
                    ₦{formatMoney(paid)}
                  </CustomText>
                </View>

                <View className="items-end">
                  <CustomText size="xs" className="text-white/60">
                    Remaining
                  </CustomText>
                  <CustomText weight="bold" className="text-white mt-1">
                    ₦{formatMoney(remaining)}
                  </CustomText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {schedules.length > 0 && (
          <View className=" mt-4">
            <CustomText weight="bold" className="text-white mb-4">
              Repayment Schedule
            </CustomText>

            {schedules.map((sch: any, idx: number) => {
              const amountToPay = Number(
                sch?.repaymentAmountInNaira ?? sch?.total ?? 0
              );
              const due = sch?.paymentDueDate || sch?.repaymentDate;
              const isPaid = isLoanCompleted;

              return (
                <View
                  key={`${idx}`}
                  className="flex-row bg-primary-500 rounded-3xl p-5  border border-white/5"
                >
                  <View className="flex-1 ">
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
                            Pending
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
    </SafeAreaView>
  );
};

export default Loans;
