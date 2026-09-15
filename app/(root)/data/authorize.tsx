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

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { payBill } from "@/app/lib/thunks/billsThunks";
import { clearError } from "@/app/lib/slices/billsSlice";

const getParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param ?? "";

export default function AuthorizeDataPayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const amount = getParam(params.amount);
  const phone = getParam(params.phone);
  const provider = getParam(params.provider);
  const billerSlug = getParam(params.billerSlug);

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleNumberPress = (num: string) => {
    if (passcode.length < 4 && !loading) {
      dispatch(clearError());
      setError(null);
      setPasscode((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (!loading) {
      dispatch(clearError());
      setError(null);
      setPasscode((prev) => prev.slice(0, -1));
    }
  };


  useEffect(() => {
    if (passcode.length === 4) {
      handlePay();
    }
  }, [passcode]);

  const normalizeAirtimeProvider = (value: string) => {
    const v = value.toLowerCase();

    if (v.includes("mtn")) return "MTN_VTU";
    if (v.includes("airtel")) return "AIRTEL_VTU";
    if (v.includes("glo")) return "GLO_VTU";
    if (v.includes("9mobile")) return "9MOBILE_VTU";

    return value;
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    dispatch(clearError());

    try {
      const payload = {
        type: "data",
        provider: normalizeAirtimeProvider(provider),
        amount: Number(amount),
        bundleSlug: billerSlug,
        customerId: phone,
        transactionPin: passcode,
      };

      const result = await dispatch(payBill(payload)).unwrap();

      dispatch(clearError());

      router.replace({
        pathname: "/(root)/data/success",
        params: {
          ...params,
          reference: result?.reference,
          status: "success",
        },
      });
    } catch (err: any) {
      const msg =
        typeof err === "string" && err.trim()
          ? err
          : err?.message ||
            err?.data?.message ||
            "Service not available at this time, please try again later";
      setError(msg);
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
                dispatch(clearError());
                setError(null);
                setPasscode(value.slice(0, 4));
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
