import React, { useMemo, useEffect, useState } from "react";
import { View, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { svgIcons } from "@/app/assets/icons/icons";

import { calculateLoan } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const ApplyLoan = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<Record<string, string>>();

  // icons
  const LoanApprove = svgIcons.loanApprove;
  const Condition1 = svgIcons.loanCondtion1;
  const Condition2 = svgIcons.loanCondtion2;
  const Condition3 = svgIcons.loanCondtion3;
  const Condition4 = svgIcons.loanCondtion4;
  const Condition5 = svgIcons.loanCondtion5;
  const CalendarPay = svgIcons.calenderPay;

  const [calc, setCalc] = useState<any[] | null>(null);
  const [calcLoading, setCalcLoading] = useState(false); 

  // creditCheck comes as a string
  const creditCheck = useMemo(() => {
    try {
      return params.creditCheck ? JSON.parse(params.creditCheck) : null;
    } catch (e) {
      return null;
    }
  }, [params.creditCheck]);

  // values from credit check
  const offer = creditCheck?.data?.loanOffer ?? "Loan offer details";
  const amount = creditCheck?.data?.approvedLoanAmount ?? 0;
  const tenure = creditCheck?.data?.loanTenure ?? 0;
  const interest = creditCheck?.data?.interestRate ?? 0;
  const annualInterest = creditCheck?.data?.annualInterestRate ?? 0;
  const repaymentFrequency = creditCheck?.data?.repaymentFrequency ?? "";
  const loanReference = creditCheck?.data?.loanReference ?? "";

  useEffect(() => {
    if (!creditCheck?.data) return;

    const payload = {
      loanAmount: Number(amount),
      tenureInDays: Number(tenure),
      interestRate: Number(interest),
      repaymentFrequency: String(repaymentFrequency),
    };


    setCalcLoading(true); 
    dispatch(calculateLoan(payload))
      .unwrap()
      .then((res) => {
        setCalc(res);
      })
      .catch((err) => {})
      .finally(() => {
        setCalcLoading(false); 
      });
  }, [
    dispatch,
    creditCheck?.data,
    amount,
    tenure,
    interest,
    repaymentFrequency,
  ]);

  const Row = ({
    Icon,
    title,
    desc,
  }: {
    Icon: any;
    title: string;
    desc: string;
  }) => (
    <View className="flex-row items-start mb-4">
      <View className="bg-primary-300 w-10 h-10 rounded-full items-center justify-center mr-3">
        <Icon width={18} height={18} />
      </View>

      <View className="flex-1">
        <CustomText weight="bold" className="text-white">
          {title}
        </CustomText>
        <CustomText
          size="xs"
          secondary
          className="text-white/75 mt-1 leading-4"
        >
          {desc}
        </CustomText>
      </View>
    </View>
  );

  const PlaceholderRow = () => (
    <View className="flex-row justify-between mb-2">
      <View className="h-4 w-32 rounded bg-white/10" />
      <View className="h-4 w-24 rounded bg-white/10" />
    </View>
  );

  const canAccept = !calcLoading && !!calc?.[0];

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Loan offer" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4">
          {/* Header area */}
          <View className="items-center mb-4">
            <View className="w-34 h-34 rounded-full items-center justify-center">
              <LoanApprove width={90} height={90} />
            </View>

            <CustomText
              weight="bold"
              size="lg"
              className="text-center text-white mb-2"
            >
              You’ve been approved
            </CustomText>

            <CustomText
              size="sm"
              secondary
              className="text-center text-white/80 leading-5"
            >
              {offer}
            </CustomText>
          </View>

          <View className="bg-primary-400 rounded-2xl p-5 mb-6 border border-white/5">
            <View className="mt-4">
              {!!amount && (
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-white">
                    Approved Amount
                  </CustomText>
                  <CustomText weight="bold" className="text-white">
                    ₦{amount}
                  </CustomText>
                </View>
              )}

              {!!tenure && (
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-white">Tenure</CustomText>
                  <CustomText weight="bold" className="text-white">
                    {tenure} days
                  </CustomText>
                </View>
              )}

              {!!interest && (
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-white">Interest Rate</CustomText>
                  <CustomText weight="bold" className="text-white">
                    {interest}%
                  </CustomText>
                </View>
              )}

              {!!annualInterest && (
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-white">
                    Annual Interest
                  </CustomText>
                  <CustomText weight="bold" className="text-white">
                    {annualInterest}%
                  </CustomText>
                </View>
              )}

              {!!repaymentFrequency && (
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-white">Repayment</CustomText>
                  <CustomText weight="bold" className="text-white">
                    {repaymentFrequency}
                  </CustomText>
                </View>
              )}

              {calcLoading && (
                <>
                  <View className="h-[1px] bg-white/10 my-3" />
                  <PlaceholderRow />
                  <PlaceholderRow />
                  <PlaceholderRow />
                  <PlaceholderRow />
                  <PlaceholderRow />
                </>
              )}

              {calc?.[0] && !calcLoading && (
                <>
                  <View className="h-[1px] bg-white/10 my-3" />

                  <View className="flex-row justify-between mb-2">
                    <CustomText className="text-white">
                      Total Repayment
                    </CustomText>
                    <CustomText weight="bold" className="text-white">
                      ₦{calc[0].repaymentAmountInNaira}
                    </CustomText>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <CustomText className="text-white">Interest</CustomText>
                    <CustomText weight="bold" className="text-white">
                      ₦{calc[0].interest}
                    </CustomText>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <CustomText className="text-white">Principal</CustomText>
                    <CustomText weight="bold" className="text-white">
                      ₦{calc[0].principal}
                    </CustomText>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <CustomText className="text-white">Due Date</CustomText>
                    <CustomText weight="bold" className="text-white">
                      {String(calc[0].paymentDueDate).slice(0, 10)}
                    </CustomText>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <CustomText className="text-white">
                      Repayment Date
                    </CustomText>
                    <CustomText weight="bold" className="text-white">
                      {String(calc[0].repaymentDate).slice(0, 10)}
                    </CustomText>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Conditions */}
          <View className="bg-primary-400 rounded-2xl p-5 border border-white/5">
            <CustomText weight="bold" className="text-white mb-4">
              Conditions
            </CustomText>

            <Row
              Icon={Condition1}
              title="Repay on time"
              desc="Make sure you repay on or before your due date to keep your account in good standing."
            />
            <Row
              Icon={Condition2}
              title="One active loan at a time"
              desc="You may not be able to apply for another loan while one is still active."
            />
            <Row
              Icon={Condition3}
              title="Fees & interest apply"
              desc="Interest is charged based on your approved offer and tenure."
            />
            <Row
              Icon={Condition4}
              title="Auto reminders"
              desc="We’ll send reminders before your repayment date so you don’t miss it."
            />
            <Row
              Icon={Condition5}
              title="Account must be funded"
              desc="Ensure your account has enough funds for repayment on the due date."
            />

            <View className="h-[1px] bg-white/10 my-4" />

            <View className="flex-row items-center">
              <View className="bg-primary-300 w-10 h-10 rounded-full items-center justify-center mr-3">
                <CalendarPay width={18} height={18} />
              </View>

              <View className="flex-1">
                <CustomText weight="bold" className="text-white">
                  Repayment schedule
                </CustomText>
                <CustomText size="xs" secondary className="text-white/75 mt-1">
                  View your repayment date and plan ahead before accepting.
                </CustomText>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View className="mt-6">
            <Button
              title={calcLoading ? "Loading..." : "Accept offer"}
              onPress={() =>
                router.push({
                  pathname: "/(root)/loans/repayment-schedule",
                  params: {
                    ...params,
                    calc: JSON.stringify(calc ?? []),
                  },
                })
              }
              variant="primary"
              disabled={!canAccept} 
            />

            <View className="mt-3">
              <Button
                title="Decline"
                onPress={() => router.back()}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ApplyLoan;
