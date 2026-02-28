import React, { useEffect, useState } from "react";
import { View, StatusBar, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import Loading from "@/app/components/Loading";
import CustomText from "@/app/components/CustomText";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { buyGold, sellGold, withdrawGold, createGoldTrigger } from "@/app/lib/thunks/goldThunks";

const toNumber = (s: string) => Number((s || "").replace(/,/g, "")) || 0;

export default function AuthorizeGold() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const gold = useAppSelector((s: any) => s.gold);

  const transactionType =
    params.type === "sell"
      ? "sell"
      : params.type === "withdraw"
      ? "withdraw"
      : "buy";
  const isSell = transactionType === "sell";
  const isWithdraw = transactionType === "withdraw";
  const isTrigger = params.trigger === "true" || params.trigger === "1";

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (passcode.length !== 4) return;

    const t = setTimeout(() => {
      setLoading(true);
      setError(false);
      setErrorMessage("");

      const baseAmountNgn = toNumber(params.amountRaw || params.amount || "0");
      const gramsVal = Number(params.grams || 0);

      // IMPORTANT: backend requires exactly ONE of amount_ngn or amount_grams
      // Decide which one to send based on whether grams is a valid > 0 number.
      const hasGrams = Number.isFinite(gramsVal) && gramsVal > 0;

      const payload: any = {
        transaction_pin: passcode,
      };

      // If this flow is creating a trigger, build trigger payload instead
      if (isTrigger) {
        const baseAmountNgn = toNumber(params.amountRaw || params.amount || "0");
        const targetPrice = Number(params.target_price_ngn) || Number(gold?.price?.data?.pricePerGramNgn || 0);

        const triggerPayload: any = {
          trigger_type: params.trigger_type || "buy_at_price",
          target_price_ngn: Math.round(targetPrice),
          amount_ngn: baseAmountNgn,
          expires_at: params.expires_at,
          transaction_pin: passcode,
        };

        dispatch(createGoldTrigger(triggerPayload) as any)
          .unwrap()
          .then(() => {
            router.replace({ pathname: "/(root)/gold/success", params: { amount: String(params.amount || String(baseAmountNgn)), type: "buy" } });
          })
          .catch((err: any) => {
            setError(true);
            setErrorMessage(err?.message || String(err) || "Create trigger failed");
            Vibration.vibrate(400);
            setPasscode("");
          })
          .finally(() => setLoading(false));

        return;
      }

      // If grams is provided (>0), send amount_grams only. Otherwise send amount_ngn only.
      if (hasGrams) {
        if (gramsVal > 1000) {
          setError(true);
          setErrorMessage("Amount in grams cannot exceed 1,000");
          Vibration.vibrate(400);
          setPasscode("");
          setLoading(false);
          return;
        }
        payload.amount_grams = gramsVal;
      } else {
        payload.amount_ngn = baseAmountNgn;
      }

      if (params.delivery_address)
        payload.delivery_address = params.delivery_address;

      const goldAction = isWithdraw
        ? withdrawGold(payload)
        : isSell
        ? sellGold(payload)
        : buyGold(payload);

      dispatch(goldAction as any)
        .unwrap()
        .then(() => {
          router.replace({
            pathname: "/(root)/gold/success",
            params: {
              amount: String(params.amount || "0"),
              type: String(transactionType),
            },
          });
        })
        .catch((err: any) => {
          setError(true);
          setErrorMessage(err?.message || String(err) || "Transaction failed");
          Vibration.vibrate(400);
          setPasscode("");
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(t);
  }, [
    passcode,
    dispatch,
    router,
    params.amount,
    params.amountRaw,
    params.grams,
    params.delivery_address,
    isSell,
    isWithdraw,
    transactionType,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Authorize" />

      <Loading visible={loading} />

      <View className="flex-1 justify-between px-6 pb-12">
        <View className="mt-12">
          <CustomText size="base" className="mb-8">
            Enter your PIN
          </CustomText>

          <OtpInput
            digitCount={4}
            value={passcode}
            onChange={(value) => setPasscode(value.slice(0, 4))}
            error={error}
            autoFocus={false}
            secure={true}
            inputStyle="w-20 h-20"
          />

          {error ? (
            <CustomText
              className="text-red-500 mt-4 mb-0"
              size="sm"
              weight="medium"
            >
              {errorMessage || "Transaction failed. Please try again."}
            </CustomText>
          ) : null}
        </View>

        <Numpad
          onPress={(n) => {
            if (loading) return;
            if (passcode.length < 4) setPasscode((p) => p + n);
          }}
          onDelete={() => setPasscode((p) => p.slice(0, -1))}
        />
      </View>
    </SafeAreaView>
  );
}
