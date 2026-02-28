import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Vibration,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/lib/store";

import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import Loading from "@/app/components/Loading";

import {
  performInterBankTransfer,
  performIntraBankTransfer,
  InterBankTransferPayload,
  TransferPayload,
} from "@/app/lib/thunks/transferThunks";

export default function AuthorizePayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const hasHandledResponse = useRef(false);

  const {
    isLoading,
    error: transferError,
    transferResult,
  } = useSelector((state: RootState) => state.transfers);

  let transferData;
  try {
    transferData = JSON.parse(params.transferData as string);
  } catch {
    transferData = null;
  }

  useEffect(() => {
    if (hasHandledResponse.current) return;

    if (transferResult) {
      hasHandledResponse.current = true;
      setIsVerifying(false);

      const transferResultString = JSON.stringify(transferResult);
      console.log(transferData)

      router.replace({
        pathname: "/(root)/transfer/transfer-success",
        params: {
          amount: transferData.amount,
          receiver: transferData.receiverName,
          accountNumber: transferData.accountNumber,
          transferResult: transferResultString, // Pass the full API response
        },
      });
    }

    if (transferError && !isLoading) {
      hasHandledResponse.current = true;
      setIsVerifying(false);

      Alert.alert("Transfer Failed", String(transferError), [
        { text: "OK", onPress: () => (hasHandledResponse.current = false) },
      ]);
    }
  }, [transferResult, transferError, isLoading]);

  useEffect(() => {
    if (passcode.length === 4 && !isVerifying && !isLoading) {
      setIsVerifying(true);
      setError(false);
      hasHandledResponse.current = false;

      setTimeout(() => {
        if (!transferData) {
          setIsVerifying(false);
          Alert.alert("Error", "Missing transfer data");
          return;
        }

        const payloadBase: any = {
          beneficiaryAccountNumber: transferData.accountNumber,
          amount: transferData.amount,
          narration: transferData.remark || transferData?.narration || "transfer",
          ...(transferData.amount_grams && { amount_grams: transferData.amount_grams }),
          ...(transferData.gift && { gift: true }),
          transactionPin: passcode,
          uniqueReference: `TXN_${Date.now()}`,
          isScheduled: transferData.isScheduled || false,
          saveBeneficiary: transferData.addAsBeneficiary || false,
        };

        const action = transferData.bankCode
          ? performInterBankTransfer({
              ...payloadBase,
              beneficiaryBankName: transferData.bank,
              beneficiaryBankCode: transferData.bankCode,
              beneficiaryName: transferData.receiverName,
            } as InterBankTransferPayload)
          : performIntraBankTransfer(payloadBase as TransferPayload);

        dispatch(action);
      }, 300);
    }
  }, [passcode]);

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
            digitCount={4}
            value={passcode}
            onChange={(v) => !isVerifying && !isLoading && setPasscode(v)}
            error={error}
            secure={true}
            inputStyle="w-20 h-20"
            showSoftInputOnFocus={false}
            caretHidden={true}
          />

          {error && (
            <Text className="text-red-500 text-sm mt-4">
              Incorrect passcode. Try again.
            </Text>
          )}
        </View>

        <Numpad
          onPress={(n) =>
            !isVerifying &&
            !isLoading &&
            passcode.length < 4 &&
            setPasscode(passcode + n)
          }
          onDelete={() =>
            !isVerifying && !isLoading && setPasscode(passcode.slice(0, -1))
          }
          disabled={isVerifying || isLoading}
        />
      </View>

      <Loading visible={isVerifying || isLoading} />
    </SafeAreaView>
  );
}
