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
  const [errorMessage, setErrorMessage] = useState("");

  const { loans, isLoading } = useAppSelector((s: any) => s.loans);

  console.log(loans)

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

  // ✅ if all loans are "failed", treat as "no loan available"
  const activeLoan = useMemo(() => {
    if (!loans || loans.length === 0) return null;

    const validLoans = loans.filter(
      (l: any) => String(l?.status || "").toLowerCase() !== "failed"
    );

    if (validLoans.length === 0) return null;

    return (
      validLoans.find(
        (l: any) => String(l?.status || "").toLowerCase() === "active"
      ) || validLoans[0]
    );
  }, [loans]);

  const disbursedLoan = useMemo(() => {
    if (!loans || loans.length === 0) return null;

    // Find first loan with status "disbursed"
    return loans.find(
      (l: any) => String(l?.status || "").toLowerCase() === "initiated"
    ) || null;
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

  // ✅ if no valid loan (or only failed loans), show empty state
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
  const normalizedStatus = String(status).toLowerCase();
  const statusLabel =
    normalizedStatus === "active"
      ? "Active"
      : normalizedStatus === "pending_disbursement"
        ? "Pending disbursement"
        : normalizedStatus === "completed"
          ? "Completed"
          : normalizedStatus === "overdue"
            ? "Overdue"
            : status;

  const totalExpected = Number(activeLoan.total_repayment_expected || 0);
  const schedules = Array.isArray(activeLoan?.schedules)
    ? activeLoan.schedules
    : [];
  const totalPaid =
    normalizedStatus === "completed" ? totalExpected : 0;
  const remaining = Math.max(totalExpected - totalPaid, 0);
  const nextSchedule = schedules[0];
  const nextDueDate =
    nextSchedule?.dueDate ||
    nextSchedule?.paymentDueDate ||
    nextSchedule?.repaymentDate;
  const nextRepaymentAmount = Number(
    nextSchedule?.amount ??
    nextSchedule?.repaymentAmountInNaira ??
    nextSchedule?.total ??
    0
  );
  const showRepaymentProgress = normalizedStatus !== "pending_disbursement";
  const offerAmount =
    Number(activeLoan.amount || 0) > 0
      ? Number(activeLoan.amount)
      : Number(activeLoan.total_repayment_expected || 0);
  const offerInterest = Number(activeLoan.interest_rate || 0);

  const progressPct =
    totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  const isLoanCompleted =
    normalizedStatus === "completed";

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />

      <Header
        showClose
        title="Loan"
        rightIconName="refresh-outline"
        onRightPress={() => router.push("/(root)/loans/loan-history")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-3xl mt-4 bg-[#27280F] px-4 py-5 pb-10">
          <View className="flex-row items-start justify-between">
            <View>
              <CustomText size="sm" className="text-white/70 mb-1">
                Active loan
              </CustomText>
              <View className="flex-row items-center">
                <CustomText weight="bold" size="xl" className="text-white mb-0">
                  {hideAmount ? "****" : `₦${amount}`}
                </CustomText>

                <TouchableOpacity
                  className="ml-2"
                  onPress={() => setHideAmount((p) => !p)}
                >
                  <Ionicons
                    name={hideAmount ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <CustomText size="sm" className="text-white/70 mt-1 mb-0">
                {productName}
              </CustomText>
            </View>

            <View className="bg-green-500/20 px-3 py-1 rounded-full">
              <CustomText size="xs" className="text-green-300 mb-0">
                {statusLabel}
              </CustomText>
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(root)/loans/loan-details",
                params: { id: String(activeLoan.id) },
              })
            }
            className="mt-12 bg-[#313214] rounded-full py-4 items-center"
          >
            <CustomText weight="medium" className="text-white mb-0">
              View details
            </CustomText>
          </TouchableOpacity>

          <View className="mt-6">
            <View className="flex-row justify-between items-center mb-2">
              <CustomText size="sm" className="text-white/80 mb-0">
                Repayment progress
              </CustomText>
              <CustomText size="sm" className="text-white/80 mb-0">
                {showRepaymentProgress ? `${progressPct}%` : "0%"}
              </CustomText>
            </View>

            <View className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <View
                className="h-full bg-primary-200"
                style={{ width: `${showRepaymentProgress ? progressPct : 0}%` }}
              />
            </View>

            <View className="flex-row justify-between mt-4">
              <View>
                <CustomText size="sm" className="text-white/70 mb-1">
                  Total paid
                </CustomText>
                <CustomText weight="bold" className="text-white mb-0">
                  ₦{formatMoney(totalPaid)}
                </CustomText>
              </View>

              <View className="items-end">
                <CustomText size="sm" className="text-white/70 mb-1">
                  Remaining
                </CustomText>
                <CustomText weight="bold" className="text-white mb-0">
                  ₦
                  {formatMoney(
                    remaining || nextRepaymentAmount || totalExpected
                  )}
                </CustomText>
              </View>
            </View>
          </View>
        </View>

        <View className="-mt-5 mb-4 bg-[#575823] rounded-3xl px-5 py-5">
          <View className="flex-row items-start">
            <View className="w-6 h-6 rounded-full border border-white/40 items-center justify-center mr-3 mt-1">
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="white"
              />
            </View>

            <CustomText
              size="sm"
              className="text-white/90 flex-1 leading-6 mb-0"
            >
              Complete your current loan and get higher offer on your next loan
            </CustomText>
          </View>

          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <CustomText size="sm" className="text-white/70 mb-2">
                Next loan offer
              </CustomText>
              <CustomText weight="bold" size="xl" className="text-white mb-1">
                ₦{formatMoney(offerAmount)}
              </CustomText>
              <CustomText weight="bold" size="sm" className="text-white mb-0">
                {offerInterest}%
              </CustomText>
            </View>

            <View className="w-12 h-12 rounded-full border border-white/20 items-center justify-center">
              <svgIcons.loanCondtion1 width={20} height={20} />
            </View>
          </View>
        </View>
        <Button
          title={"Repayment"}
          onPress={() => {
            if (disbursedLoan) {
              router.push({
                pathname: "/(root)/loans/repayment",
                params: { loanId: disbursedLoan.id }
              });
            } else{
              setErrorMessage("No Disbursed Loan that require Repayment")
            }
          }}
          variant="primary"
        />
        {errorMessage && (
          <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
            {errorMessage}
          </CustomText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Loans;
