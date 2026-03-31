import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StatusBar, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";

import { applyForLoan } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import Loading from "@/app/components/Loading";

export default function AuthorizeLoan() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // ✅ lock to prevent double submit
  const submittingRef = useRef(false);

  // ✅ pull primitive params out (don’t depend on the whole params object)
  const productCode = String(params.productCode ?? "");
  const bankCode = String(params.bankCode ?? "");
  const bankName = String(params.bankName ?? "");
  const accountNumber = String(params.accountNumber ?? "");
  const accountName = String(params.accountName ?? "");
  const address = String(params.address ?? "");
  const state = String(params.state ?? "");
  const lga = String(params.lga ?? "");
  const creditCheckStr = String(params.creditCheck ?? "");
  const calcStr = String(params.calc ?? "");

  const creditCheck = useMemo(() => {
    try {
      return creditCheckStr ? JSON.parse(creditCheckStr) : null;
    } catch {
      return null;
    }
  }, [creditCheckStr]);

  const calc = useMemo(() => {
    try {
      return calcStr ? JSON.parse(calcStr) : null;
    } catch {
      return null;
    }
  }, [calcStr]);

  const getReadableError = (err: any) => {
    const msg =
      err?.message ||
      err?.error ||
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.payload ||
      (typeof err === "string" ? err : "") ||
      "Transaction failed. Please try again.";
    return String(msg);
  };

  useEffect(() => {
    // reset lock when user edits pin
    if (passcode.length < 4) {
      submittingRef.current = false;
      return;
    }

    if (passcode.length !== 4) return;

    // ✅ prevents second call
    if (submittingRef.current) return;
    submittingRef.current = true;

    setLoading(true);

    const assessment = creditCheck?.assessment ?? creditCheck?.data?.assessment;
    const loanAmount = Number(assessment?.maxLoanLimit ?? 0);
    const interestRate = Number(assessment?.interestRatePerMonth ?? 0);
    const selectedTenure = Number(params.tenure ?? 0);
    const tenureInDays =
      selectedTenure > 0
        ? selectedTenure
        : Number(assessment?.tenorDays ?? assessment?.tenure ?? 0);
    const repaymentFrequency = String(
      assessment?.repaymentFrequency ?? ""
    );

    const lastSchedule =
      Array.isArray(calc) && calc.length > 0 ? calc[calc.length - 1] : null;

    const totalFromCalc = Number(
      lastSchedule?.cumulativeTotal ??
        lastSchedule?.repaymentAmountInNaira ??
        lastSchedule?.total ??
        0
    );

    const badNumber = (n: number) => !Number.isFinite(n);

    if (badNumber(loanAmount) || loanAmount <= 0) {
      setError(true);
      setErrorMessage("Invalid loan amount. Please try again.");
      Vibration.vibrate(300);
      setPasscode("");
      setLoading(false);
      submittingRef.current = false; // allow retry
      return;
    }

    const payload = {
      productCode,
      loanAmount,
      interestRate,
      tenorInDays: tenureInDays,
      repaymentFrequency,
      address: {
        address,
        state: state.toLowerCase(),
        lga,
      },
      account: {
        bankName,
        accountNumber,
        accountName,
      },
      accountNumber,
      bankCode,
      transactionPin: passcode,
    };

    dispatch(applyForLoan(payload as any))
      .unwrap()
      .then((res: any) => {
        const id = String(res?.data?.id ?? res?.id ?? "");
        const submittedAmount = String(
          res?.data?.amount ?? res?.amount ?? loanAmount
        );

        router.replace({
          pathname: "/(root)/loans/success",
          params: {
            amount: submittedAmount,
            loanId: id,
          },
        });
      })
      .catch((err) => {
        submittingRef.current = false; // allow retry
        const msg = getReadableError(err);
        setError(true);
        setErrorMessage(msg);
        Vibration.vibrate(400);
        setPasscode("");
      })
      .finally(() => setLoading(false));
  }, [
    passcode,
    creditCheck,
    calc,
    dispatch,
    router,
    productCode,
    bankCode,
    bankName,
    accountNumber,
    accountName,
    address,
    state,
    lga,
    creditCheckStr,
    calcStr,
  ]);

  const handleNumberPress = (num: string) => {
    if (loading) return;
    if (passcode.length < 4) {
      setPasscode((prev) => prev + num);
      setError(false);
      setErrorMessage("");
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPasscode((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage("");
  };

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
              // keep if you need it; otherwise remove to avoid double sources of truth
              setPasscode(value.slice(0, 4));
              setError(false);
              setErrorMessage("");
            }}
            error={error}
            autoFocus={false}
            secure={true}
            inputStyle="w-20 h-20"
          />

          {error && (
            <Text className="text-red-500 text-sm mt-4">
              {errorMessage || "Transaction failed. Please try again."}
            </Text>
          )}
        </View>

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}
