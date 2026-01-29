
import React, { useEffect, useState } from "react";
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
import { fetchVirtualCard } from "@/app/lib/thunks/virtualCardsThunks";

export default function AuthorizeCardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useLocalSearchParams();

  const cardId = Array.isArray(params.cardId)
    ? params.cardId[0]
    : params.cardId;

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumberPress = (num: string) => {
    if (passcode.length < 4) setPasscode((prev) => prev + num);
    setError(null);
  };

  const handleDelete = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setError(null);
  };

  useEffect(() => {
    if (passcode.length !== 4) return;

    const t = setTimeout(async () => {
      if (!cardId) {
        setError("Missing card ID");
        setPasscode("");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await dispatch(
          fetchVirtualCard({ id: String(cardId), transactionPin: passcode })
        ).unwrap();

        router.back(); 
      } catch (err: any) {
        if (typeof err === "string") setError(err);
        else if (err?.message) setError(err.message);
        else setError("Unable to fetch card. Try again.");

        Vibration.vibrate(400);
      } finally {
        setLoading(false);
        setPasscode("");
      }
    }, 250);

    return () => clearTimeout(t);
  }, [passcode, cardId, dispatch, router]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Authorize" />

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
            caretHidden={true}
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
