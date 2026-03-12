// app/(root)/savings/topup-withdraw.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import AmountInput from "@/app/components/inputs/AmountInput";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import {
  topUpSaving,
  withdrawFromSaving,
} from "@/app/lib/thunks/savingsThunks";

const makeRef = () =>
  `ELL-${Date.now()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

const money = (n: number) =>
  `₦${Math.round(Number(n || 0)).toLocaleString("en-NG")}`;

type Mode = "topup" | "withdraw";

type Saving = {
  id: number;
  name: string;
  amount?: number;
  amount_saved?: number;
  savings_type?: string;
  interest_rate?: number;
};

export default function TopUpWithdrawScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    mode?: string;
    savingsId?: string;
    saving?: string;
  }>();

  const mode =
    (String(params.mode || "topup").toLowerCase() as Mode) || "topup";
  const savingsId = Number(params.savingsId || 0);

  const saving: Saving | null = useMemo(() => {
    try {
      if (!params.saving) return null;
      return JSON.parse(String(params.saving));
    } catch {
      return null;
    }
  }, [params.saving]);

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountNumber = useMemo(() => {
    const cleaned = String(amount || "").replace(/[^\d]/g, "");
    return Number(cleaned || 0);
  }, [amount]);

  const title = mode === "withdraw" ? "Withdraw" : "Top up";
  const subtitle =
    mode === "withdraw"
      ? "Enter how much you want to withdraw."
      : "Enter how much you want to add.";

  const onSubmit = async () => {
    if (submitting) return;
    if (!savingsId) return;
    if (!amountNumber || amountNumber <= 0) return;

    setSubmitting(true);
    try {
      const payload = {
        savingsId,
        amount: amountNumber,
        uniqueRef: makeRef(),
      };

      if (mode === "withdraw") {
        await dispatch(withdrawFromSaving(payload as any)).unwrap();
      } else {
        await dispatch(topUpSaving(payload as any)).unwrap();
      }

      router.back();
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const BOTTOM = 110;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-primary-100">
        <StatusBar barStyle="light-content" />
        <Header title={title} />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View className="flex-1 px-4 pt-3" style={{ paddingBottom: BOTTOM }}>
            <View className="rounded-3xl border border-white/10 bg-primary-400 p-5">
              <View className="flex-row items-center justify-between">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-300">
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                </View>

                <CustomText size="sm" secondary>
                  {saving?.name || "Savings plan"}
                </CustomText>
              </View>

              <View className="mt-4 flex-row justify-between">
                <View>
                  <CustomText size="xs" secondary>
                    Saved
                  </CustomText>
                  <CustomText size="lg" weight="bold" className="mt-1">
                    {money(saving?.amount_saved ?? 0)}
                  </CustomText>
                </View>

                <View className="items-end">
                  <CustomText size="xs" secondary>
                    Rate
                  </CustomText>
                  <CustomText size="lg" weight="bold" className="mt-1">
                    {Number(saving?.interest_rate ?? 0)}%
                  </CustomText>
                </View>
              </View>
            </View>

            <CustomText size="lg" weight="bold" className="mt-6">
              {title} amount
            </CustomText>
            <CustomText size="sm" secondary className="mb-5 mt-1">
              {subtitle}
            </CustomText>

            <AmountInput value={amount} onChange={setAmount} placeholder="0" />

            {mode === "withdraw" ? (
              <CustomText size="sm" secondary className="mt-3">
                You can only withdraw based on your plan rules.
              </CustomText>
            ) : (
              <CustomText size="sm" secondary className="mt-3">
                Your top up will reflect in your plan balance.
              </CustomText>
            )}
          </View>

          <View className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-primary-100 px-4 pb-8 pt-3">
            <Button
              title={submitting ? "Please wait..." : title}
              variant="primary"
              onPress={onSubmit}
              disabled={submitting || !amountNumber || !savingsId}
              className="rounded-full"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
