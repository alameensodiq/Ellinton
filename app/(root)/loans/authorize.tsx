import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StatusBar, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";

import {
  applyForLoan,
  sendLoanDisbursementWebhook,
} from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import Loading from "@/app/components/Loading";

export default function AuthorizeLoan() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const creditCheck = useMemo(() => {
    try {
      return params.creditCheck ? JSON.parse(params.creditCheck) : null;
    } catch (e) {
      console.log("❌ Failed to parse creditCheck:", e);
      return null;
    }
  }, [params.creditCheck]);

  const calc = useMemo(() => {
    try {
      return params.calc ? JSON.parse(params.calc) : null;
    } catch (e) {
      console.log("❌ Failed to parse calc:", e);
      return null;
    }
  }, [params.calc]);

  const handleNumberPress = (num: string) => {
    if (loading) return;
    if (passcode.length < 4) {
      setPasscode((prev) => {
        const next = prev + num;
        setError(false);
        return next;
      });
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (passcode.length !== 4) return;

    const t = setTimeout(() => {
      setLoading(true);

      const loanAmount = Number(creditCheck?.data?.approvedLoanAmount || 0);
      const interestRate = Number(creditCheck?.data?.interestRate || 0);
      const tenureInDays = Number(creditCheck?.data?.loanTenure || 0);
      const repaymentFrequency = String(
        creditCheck?.data?.repaymentFrequency || ""
      );

      const schedule = calc?.[0];
      const totalFromCalc = Number(
        schedule?.repaymentAmountInNaira ??
          schedule?.cumulativeTotal ??
          schedule?.total ??
          0
      );

      const proratedInterest = Math.round(
        loanAmount * (interestRate / 100) * (tenureInDays / 30)
      );
      const computedTotal = Math.round(loanAmount + proratedInterest);

      const totalRepaymentExpected =
        totalFromCalc && totalFromCalc > 0 ? totalFromCalc : computedTotal;

      const payload = {
        productCode: params.productCode,
        productName: params.name,

        loanAmount,
        interestRate,
        tenureInDays,
        loanTenure: tenureInDays,
        repaymentFrequency,

        totalRepaymentExpected,

        networkProvider: params.provider,
        loanDetails: "Business expansion",

        consentApproved: true,
        recoveryConsentApproved: true,

        transactionPin: passcode,
      };

      console.log("➡️ APPLY LOAN PAYLOAD:", payload);

      if (
        !payload.totalRepaymentExpected ||
        payload.totalRepaymentExpected < 1
      ) {
        console.log(
          "❌ totalRepaymentExpected invalid:",
          payload.totalRepaymentExpected
        );
        setError(true);
        Vibration.vibrate(300);
        setPasscode("");
        setLoading(false);
        return;
      }

      dispatch(applyForLoan(payload as any))
        .unwrap()
        .then(async (res) => {
          console.log("✅ APPLY LOAN SUCCESS:", res);

          // ✅ call webhook AFTER apply success
          const loanReference = String(creditCheck?.data?.loanReference || "");
          const webhookPayload = {
            loanReference,
            status: "Disbursed",
            success: true,
            transactionReference: loanReference || `TXN-DISB-${Date.now()}`,
            disbursedAmount: loanAmount,
            disbursementDate: new Date().toISOString(),
            message: "Loan disbursed successfully",
          };

          console.log("➡️ DISBURSEMENT WEBHOOK PAYLOAD:", webhookPayload);

        //   try {
        //     const webhookRes = await dispatch(
        //       sendLoanDisbursementWebhook(webhookPayload as any)
        //     ).unwrap();

        //     console.log("✅ DISBURSEMENT WEBHOOK SUCCESS:", webhookRes);
        //   } catch (e) {
        //     console.log("❌ DISBURSEMENT WEBHOOK ERROR:", e);
        //   }

          // ✅ go success page (pass amount)
          router.replace({
            pathname: "/(root)/loans/success",
            params: {
              ...params,
              amount: String(loanAmount),
            },
          });
        })
        .catch((err) => {
          console.log("❌ APPLY LOAN ERROR:", err);
          setError(true);
          Vibration.vibrate(400);
          setPasscode("");
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(t);
  }, [passcode, creditCheck, calc]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Authorize" />

      <Loading visible={loading} />

      <View className="flex-1 justify-between px-6 pb-12">
        <View className="mt-12">
          <Text className="text-white text-base mb-8">Enter your Pin</Text>

          <OtpInput
            digitCount={4}
            value={passcode}
            onChange={(value) => {
              setPasscode(value.slice(0, 4));
              setError(false);
            }}
            error={error}
            autoFocus={false}
            secure={true}
            inputStyle="w-20 h-20"
          />

          {error && (
            <Text className="text-red-500 text-sm mt-4">
              Transaction failed. Please try again.
            </Text>
          )}
        </View>

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}
