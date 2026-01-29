import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/lib/store";
import { withdrawVirtualCard } from "@/app/lib/thunks/virtualCardsThunks";

export default function AuthorizeWithdrawal() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse amount
  const rawAmount = Array.isArray(params.amount)
    ? params.amount[0]
    : params.amount;
  const amount = Number(String(rawAmount).replace(/,/g, ""));

  // Parse cardId and ensure number
  const rawCardId = Array.isArray(params.cardId)
    ? params.cardId[0]
    : params.cardId;
  const cardId = Number(rawCardId);

  const handleNumberPress = (num: string) => {
    if (passcode.length < 4) setPasscode((prev) => prev + num);
    setError(null);
  };

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError(null);
  };

  useEffect(() => {
    if (passcode.length === 4) {
      const t = setTimeout(async () => {
        // Validate amount and cardId
        if (!amount || isNaN(cardId)) {
          setError("Invalid card or amount");
          return;
        }

        setLoading(true);
        setError(null);

        try {
          await dispatch(
            withdrawVirtualCard({
              cardId,
              amount,
              transactionPin: passcode,
            })
          ).unwrap();

          router.replace({
            pathname: "/(root)/withdraw/success",
            params: { amount },
          });
        } catch (err: any) {
          console.error("Withdrawal failed:", err);
          setError(err || "Unable to complete withdrawal");
          Vibration.vibrate(400);
        } finally {
          setLoading(false);
          setPasscode("");
        }
      }, 300);

      return () => clearTimeout(t);
    }
  }, [passcode, amount, cardId, dispatch, router]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Authorize Withdrawal" />

      <View className="flex-1 justify-between px-6 pb-12">
        <View className="mt-12">
          <Text className="text-white text-base mb-8">
            Enter your Transaction Pin
          </Text>

          <OtpInput
            value={passcode}
            onChange={setPasscode}
            error={!!error}
            secure
            autoFocus={false}
            showSoftInputOnFocus={false}
            caretHidden
            inputStyle="w-20 h-20"
            digitCount={4}
          />

          {error && <Text className="text-red-500 text-sm mt-4">{error}</Text>}
          {loading && (
            <View className="mt-4 flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFD700" />
              <Text className="text-white ml-2">Processing...</Text>
            </View>
          )}
        </View>

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}
