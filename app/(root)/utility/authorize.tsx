import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  Vibration,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { payBill } from "@/app/lib/thunks/billsThunks";
import { clearError } from "@/app/lib/slices/billsSlice";

const getParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : (param ?? "");

export default function AuthorizeUtilityPayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  console.log(params);

  const amount = getParam(params.amount);
  const meterNumber = getParam(params.meterNumber);
  const service = getParam(params.service);
  const product = getParam(params.product);

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumberPress = (num: string) => {
    if (passcode.length < 4 && !loading) {
      setPasscode((prev) => {
        setError(null);
        return prev + num;
      });
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setPasscode((prev) => prev.slice(0, -1));
      setError(null);
    }
  };

  useEffect(() => {
    if (passcode.length === 4) {
      handlePay();
    }
  }, [passcode]);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const cleanedAmount = amount.replace(/[₦,\s]/g, "");
      const numericAmount = Number(cleanedAmount);

      if (isNaN(numericAmount)) {
        throw new Error("Invalid amount");
      }

      const payload = {
        type: "electricity",
        provider: service,
        amount: numericAmount,
        bundleSlug: product,
        customerId: meterNumber,
        transactionPin: passcode
      };

      console.log("PayBill payload:", payload);

      const result = await dispatch(payBill(payload)).unwrap();

      router.replace({
        pathname: "/(root)/utility/success",
        params: {
          ...params,
          reference: result?.reference,
          status: "success"
        }
      });
      // dispatch(clearError());
    } catch (err: any) {
      console.log("PayBill error full object:", JSON.stringify(err, null, 2));
      console.log("Error type:", typeof err);
      console.log("Error keys:", err ? Object.keys(err) : "null");

      const errorMessage =
        (typeof err === "string" && err.trim() ? err : null) ||
        err?.message ||
        err?.data?.message ||
        err?.error ||
        "Service not available at this time, please try again later";

      setError(errorMessage);
      Vibration.vibrate(400);
      setPasscode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Authorize" />

      <View className="flex-1 justify-between px-6 pb-12">
        <View className="mt-12">
          <Text className="text-white text-base mb-8">
            Enter your transaction PIN
          </Text>

          <OtpInput
            digitCount={4}
            value={passcode}
            onChange={(value) => {
              if (!loading) {
                setPasscode(value.slice(0, 4));
                setError(null);
              }
            }}
            error={!!error}
            secure
            inputStyle="w-20 h-20"
            autoFocus={false}
          />

          {loading && <ActivityIndicator className="mt-6" color="#fff" />}

          {error && (
            <Text className="text-red-500 text-sm mt-4 text-center">
              {error}
            </Text>
          )}
        </View>

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}
