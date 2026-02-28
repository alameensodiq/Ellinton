import React, { useState, useEffect } from "react";
import { View, Text, StatusBar, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/lib/store";
import {
  requestVirtualCard,
  RequestVirtualCardPayload,
} from "@/app/lib/thunks/virtualCardsThunks";
import { unwrapResult } from "@reduxjs/toolkit";
import Loading from "@/app/components/Loading";

export default function AuthorizePayment() {
  const params = useLocalSearchParams();
  const {
    currency = "USD",
    amount = "0",
    icon = "mastercard",
    color = "gold",
  } = params;

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const billingStreet = user?.address_1 || "";
  const billingCity = user?.state || "";
  const billingState = user?.state || "";
  const billingCountry = user?.country_code || "";
  const billingPostalCode = user?.country_code || "";

  const apiTypeMap: Record<string, "VISA" | "MASTERCARD"> = {
    visa: "VISA",
    mastercard: "MASTERCARD",
  };

  const apiColorMap: Record<
    string,
    "Gold" | "Silver" | "Platinum" | "Titanium" | "Classic" | "White"
  > = {
    gold: "Gold",
    silver: "Silver",
    platinum: "Platinum",
    titanium: "Titanium",
    classic: "Classic",
    white: "White",
  };

  const resetError = () => {
    setError(false);
    setErrorMessage("");
  };

  const handleNumberPress = (num: string) => {
    if (passcode.length < 4 && !loading) {
      setPasscode((prev) => {
        const next = prev + num;
        resetError();
        return next;
      });
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setPasscode((prev) => prev.slice(0, -1));
      resetError();
    }
  };

  useEffect(() => {
    if (passcode.length !== 4) return;

    const processRequest = async () => {
      setLoading(true);

      const payload: RequestVirtualCardPayload = {
        amount: Number(amount),
        type: apiTypeMap[icon as string] || "MASTERCARD",
        color: apiColorMap[color as string] || "Gold",
        billingStreet,
        billingCity,
        billingState,
        billingCountry,
        billingPostalCode,
        transactionPin: passcode, 
      };

      try {
        const actionResult = await dispatch(requestVirtualCard(payload));
        unwrapResult(actionResult);

        router.push({
          pathname: "/(root)/cards/virtual-card/success",
          params,
        });
      } catch (err: any) {
        const msg =
          typeof err === "string"
            ? err
            : err?.message ||
              "Failed to request virtual card. Please try again.";

        setError(true);
        setErrorMessage(msg);
        Vibration.vibrate(400);
        setPasscode("");
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(processRequest, 300);
    return () => clearTimeout(t);
  }, [passcode]);

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
              resetError();
            }}
            error={error}
            autoFocus={false}
            secure={true}
            inputStyle="w-20 h-20"
          />

          {error && (
            <Text className="text-red-500 text-sm mt-4">{errorMessage}</Text>
          )}
        </View>

        <Numpad onPress={handleNumberPress} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}
