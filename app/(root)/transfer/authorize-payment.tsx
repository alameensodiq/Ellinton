import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StatusBar, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/app/lib/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import Numpad from "@/app/components/inputs/Numpad";
import Loading from "@/app/components/Loading";
import ErrorModal from "@/app/components/ErrorModal";

import {
  performInterBankTransfer,
  performIntraBankTransfer,
  InterBankTransferPayload,
  TransferPayload,
} from "@/app/lib/thunks/transferThunks";
import { clearError, clearTransfer } from "@/app/lib/slices/transferSlice";

type TransferRouteData = {
  accountNumber: string;
  bank?: string;
  bankCode?: string;
  amount: number;
  receiverName: string;
  addAsBeneficiary?: boolean;
  remark?: string;
  narration?: string;
  amount_grams?: number;
  gift?: boolean;
  isScheduled?: boolean;
  frequency?: string;
  scheduleType?: string;
  dayOfWeek?: string;
  dateOfTransfer?: string;
  dateOfMonth?: number;
  startDate?: string;
  endDate?: string;
  scheduleName?: string;
};

const getParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param ?? "";

const getTransferErrorMessage = (error: unknown) => {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    if (typeof err.message === "string" && err.message.trim()) {
      return err.message;
    }

    const data = err.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const nestedMessage = (data as Record<string, unknown>).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }
    }
  }

  return "Transfer failed. Please try again.";
};

export default function AuthorizePayment() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [passcode, setPasscode] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const isMountedRef = useRef(true);

  const rawTransferData = getParam(params.transferData);

  const transferData = useMemo<TransferRouteData | null>(() => {
    if (!rawTransferData) return null;

    try {
      return JSON.parse(rawTransferData) as TransferRouteData;
    } catch {
      return null;
    }
  }, [rawTransferData]);

  useEffect(() => {
    dispatch(clearTransfer());
    dispatch(clearError());

    return () => {
      isMountedRef.current = false;
    };
  }, [dispatch]);

  const clearLocalErrorState = useCallback(() => {
    setPinError(false);
    setErrorMessage("");
    setShowErrorModal(false);
  }, []);

  const handleDismissError = useCallback(() => {
    clearLocalErrorState();
    dispatch(clearError());
  }, [clearLocalErrorState, dispatch]);

  const handleTransfer = useCallback(async (overridePin?: string) => {
    const pinToUse = overridePin || passcode;
    if (pinToUse.length !== 4 || isVerifying) {
      return;
    }

    if (!transferData) {
      setPinError(true);
      setPasscode("");
      setErrorMessage("Missing transfer data. Please restart the transfer.");
      setShowErrorModal(true);
      return;
    }

    setIsVerifying(true);
    setPinError(false);
    setErrorMessage("");
    setShowErrorModal(false);
    dispatch(clearTransfer());
    dispatch(clearError());

    const uniqueReference = `TXN_${Date.now()}`;

    const userRemark = (
      transferData.remark ||
      transferData.narration ||
      ""
    ).trim();

    const payloadBase: TransferPayload = {
      beneficiaryAccountNumber: transferData.accountNumber,
      amount: transferData.amount,
      ...(userRemark ? { narration: userRemark } : {}),
      transactionPin: pinToUse,
      uniqueReference,
      isScheduled: transferData.isScheduled || false,
      saveBeneficiary: transferData.addAsBeneficiary || false,
      ...(transferData.scheduleType || transferData.frequency
        ? {
          scheduleType:
            transferData.scheduleType || transferData.frequency,
        }
        : {}),
      ...(transferData.dayOfWeek && { dayOfWeek: transferData.dayOfWeek }),
      ...(transferData.dateOfTransfer && {
        dateOfTransfer: transferData.dateOfTransfer,
      }),
      ...(typeof transferData.dateOfMonth === "number" && {
        dateOfMonth: transferData.dateOfMonth,
      }),
      ...(transferData.startDate && { startDate: transferData.startDate }),
      ...(transferData.endDate && { endDate: transferData.endDate }),
      ...(transferData.scheduleName && {
        scheduleName: transferData.scheduleName,
      }),
    };

    const action = transferData.bankCode
      ? performInterBankTransfer({
        ...payloadBase,
        beneficiaryBankName: transferData.bank || "",
        beneficiaryBankCode: transferData.bankCode,
        beneficiaryName: transferData.receiverName,
        ...(transferData.amount_grams && {
          amount_grams: transferData.amount_grams,
        }),
        ...(transferData.gift && { gift: true }),
      } as InterBankTransferPayload)
      : performIntraBankTransfer({
        ...payloadBase,
        ...(transferData.amount_grams && {
          amount_grams: transferData.amount_grams,
        }),
        ...(transferData.gift && { gift: true }),
      } as TransferPayload);

    try {
      const result = await dispatch(action).unwrap();

      if (!isMountedRef.current) {
        return;
      }

      const receiptPayload = {
        amount: result.amount ?? transferData.amount,
        status: result.status ?? "SUCCESSFUL",
        sender: result.sender,
        senderBank: result.senderBank ?? "Ellington Bank",
        beneficiaryName: result.beneficiaryName ?? transferData.receiverName,
        beneficiaryAccount:
          result.beneficiaryAccount ?? transferData.accountNumber,
        beneficiaryBankName: result.beneficiaryBankName ?? transferData.bank,
        remark:
          result.remark ||
          transferData.remark ||
          transferData.narration ||
          "",
        transactionReference:
          result.transactionReference ??
          result.reference ??
          result.ReferenceID ??
          uniqueReference,
        date:
          result.date ??
          result.TransactionDate ??
          new Date().toISOString(),
        currency: result.currency ?? "NGN",
      };

      setPasscode("");
      dispatch(clearTransfer());
      dispatch(clearError());

      router.replace({
        pathname: "/(root)/transfer/transfer-success",
        params: {
          amount: String(transferData.amount),
          receiverName: transferData.receiverName,
          accountNumber: transferData.accountNumber,
          receiptData: JSON.stringify(receiptPayload),
          transferResult: JSON.stringify(result),
        },
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      const message = getTransferErrorMessage(error);
      dispatch(clearTransfer());
      dispatch(clearError());
      setPinError(true);
      setPasscode("");
      setErrorMessage(message);
      setShowErrorModal(true);
      Vibration.vibrate(300);
    } finally {
      if (isMountedRef.current) {
        setIsVerifying(false);
      }
    }
  }, [dispatch, isVerifying, passcode, router, transferData]);




  useEffect(() => {
    if (passcode.length === 4) {
      handleTransfer();
    }
  }, [handleTransfer, passcode]);

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
            onChange={(value) => {
              if (!isVerifying) {
                clearLocalErrorState();
                dispatch(clearError());
                setPasscode(value.slice(0, 4));
              }
            }}
            error={pinError}
            secure={true}
            inputStyle="w-20 h-20"
            showSoftInputOnFocus={false}
            caretHidden={true}
          />

          {pinError && !showErrorModal && (
            <Text className="text-red-500 text-sm mt-4">
              Transfer failed. Try again.
            </Text>
          )}
        </View>

        <Numpad
          onPress={(n) => {
            if (!isVerifying) {
              clearLocalErrorState();
              dispatch(clearError());
              setPasscode((current) =>
                current.length < 4 ? current + n : current
              );
            }
          }}
          onDelete={() => {
            if (!isVerifying) {
              clearLocalErrorState();
              dispatch(clearError());
              setPasscode((current) => current.slice(0, -1));
            }
          }}
          disabled={isVerifying}
        />
      </View>

      <Loading visible={isVerifying} />
      <ErrorModal
        visible={showErrorModal}
        title="Transfer Failed"
        message={errorMessage || "Transfer failed. Please try again."}
        onDismiss={handleDismissError}
      />
    </SafeAreaView>
  );
}
