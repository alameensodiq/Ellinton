import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import AmountCard from "@/app/components/home/cards/AmountCard";
import TransferSummaryCard from "@/app/components/TransferSummaryCard";
import ScheduleTransaction from "@/app/components/ScheduleTransaction";
import { dayOptions, frequencyOptions } from "@/app/lib/utils";
import { svgIcons } from "@/app/assets/icons/icons";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store";
import {
  fetchTransferFee,
  performInterBankTransfer,
  performIntraBankTransfer,
  InterBankTransferPayload,
  TransferPayload,
} from "@/app/lib/thunks/transferThunks";
import { clearGoldError } from "@/app/lib/slices/goldSlice";
import { clearError, clearTransfer } from "@/app/lib/slices/transferSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
const TRANS_PIN_KEY = "transBiometricPin";

const numberToWords = (num: number): string => {
  if (num === 0) return "zero naira";

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];

  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  const scales = ["", "thousand", "million", "billion"];

  const convertChunk = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? " " + ones[one] : "");
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return (
      ones[hundred] + " hundred" + (rest ? " and " + convertChunk(rest) : "")
    );
  };

  const chunks: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk);
      const scale = scales[scaleIndex];
      chunks.unshift(chunkWords + (scale ? " " + scale : ""));
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return chunks.join(", ") + " naira";
};

export default function ConfirmTransfer() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  console.log(params);
  const accountNumber = params.accountNumber as string;
  const bank = params.bank as string;
  const amount = params.amount as string;
  const receiverNameParam = params.receiverName as string;
  const addAsBeneficiaryParam = params.addAsBeneficiary as string;
  const beneficiaryJson = params.beneficiary as string;
  const bankCodeParam = params.bankCode as string;

  const addAsBeneficiary = addAsBeneficiaryParam === "true";

  let beneficiary = null;
  if (beneficiaryJson) {
    try {
      beneficiary = JSON.parse(beneficiaryJson);
    } catch (e) {
      beneficiary = null;
    }
  }

  const receiverName =
    receiverNameParam ||
    (beneficiary ? beneficiary.name : `Account • ${accountNumber}`);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const numericAmount = parseFloat(amount.replace(/,/g, ""));
  console.log(numericAmount)

  useEffect(() => {
    if (amount && bank) {
      dispatch(fetchTransferFee({
        amount: numericAmount, transferType: bank === 'Ellington MFB' ? 'intra_bank' : 'inter_bank'
      }));
    }
  }, [dispatch, amount, bank]);


  const transferfee = useSelector(
    (state: RootState) => state.transfers.transferfee
  );
  console.log(transferfee)

  // const fee = 10;
  const fee = transferfee?.fee ?? 0;
  // const totalDebit = numericAmount + fee;
  const totalDebit = numericAmount + (transferfee?.fee ?? 0);

  const goldBalance = useAppSelector((s: any) => s.gold.dashboard?.wallet?.balance_grams ?? 0);
  const amountGramsParam = params.amount_grams as string | undefined;

  const amountInWords = useMemo(() => {
    const num = Math.floor(numericAmount);
    const words = numberToWords(num);
    return words.charAt(0).toUpperCase() + words.slice(1);
  }, [numericAmount]);

  const buildTransferData = () => {
    return {
      accountNumber,
      bankCode: bankCodeParam || undefined,
      bank,
      amount: numericAmount,
      receiverName,
      addAsBeneficiary,
      remark,
      ...(amountGramsParam && { amount_grams: Number(amountGramsParam) }),
      ...(params?.gift && { gift: params.gift === "true" }),
      isScheduled: scheduleEnabled,
      ...(scheduleEnabled && {
        scheduleName,
        frequency,
        dayOfWeek,
        startDate,
        endDate,
      }),
    };
  };

  const navigateToAuthorize = () => {
    const transferData = buildTransferData();
    router.push({
      pathname: "/(root)/transfer/authorize-payment",
      params: {
        ...params,
        transferData: JSON.stringify(transferData),
      },
    });
  };

  const handlePay = async () => {
    if (
      scheduleEnabled &&
      (!scheduleName || !frequency || !startDate || !endDate)
    ) {
      Alert.alert("Incomplete Schedule", "Please fill all schedule details");
      return;
    }
    if (scheduleEnabled && frequency === "weekly" && !dayOfWeek) {
      Alert.alert("Incomplete Schedule", "Please select day of week");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const storedBiometric = await AsyncStorage.getItem(TRANS_BIOMETRIC_KEY);
      const storedPin = await AsyncStorage.getItem(TRANS_PIN_KEY);

      let isBiometricEnabled = false;
      if (storedBiometric) {
        try {
          isBiometricEnabled = JSON.parse(storedBiometric) === true;
        } catch {
          isBiometricEnabled = storedBiometric === "true";
        }
      }

      // If biometric is NOT enabled, go straight to authorize (PIN entry)
      if (!isBiometricEnabled || !storedPin || storedPin.length !== 4) {
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Biometric IS enabled — check hardware support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Trigger biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to complete transfer",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });

      if (!authResult.success) {
        // Biometric cancelled/failed — fall back to authorize (PIN entry)
        setLoading(false);
        navigateToAuthorize();
        return;
      }

      // Biometric succeeded — call transfer API directly, skip authorize
      const transferData = buildTransferData();
      const uniqueReference = `TXN_${Date.now()}`;

      const payloadBase: TransferPayload = {
        beneficiaryAccountNumber: transferData.accountNumber,
        amount: transferData.amount,
        narration: transferData.remark || "transfer",
        transactionPin: storedPin,
        uniqueReference,
        isScheduled: transferData.isScheduled || false,
        saveBeneficiary: transferData.addAsBeneficiary || false,
        ...(transferData.frequency
          ? { scheduleType: transferData.frequency }
          : {}),
        ...(transferData.dayOfWeek && { dayOfWeek: transferData.dayOfWeek }),
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

      const result = await dispatch(action).unwrap();

      const receiptPayload = {
        amount: result.amount ?? transferData.amount,
        status: result.status ?? "SUCCESSFUL",
        sender: result.sender,
        senderBank: result.senderBank ?? "Ellington Bank",
        beneficiaryName: result.beneficiaryName ?? transferData.receiverName,
        beneficiaryAccount:
          result.beneficiaryAccount ?? transferData.accountNumber,
        beneficiaryBankName: result.beneficiaryBankName ?? transferData.bank,
        remark: result.remark ?? transferData.remark ?? "transfer",
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
    } catch (err: any) {
      console.log("Biometric transfer error:", err);
      const message =
        typeof err === "string" && err.trim()
          ? err
          : err?.message || "Transfer failed. Please try again.";
      setError(message);
      Vibration.vibrate(400);
    } finally {
      setLoading(false);
    }
  };

  const Transfer = svgIcons.chip;
  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Confirm payment" />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <AmountCard amount={amount} description={amountInWords} />
        <Text className="text-sm text-white/60 mt-3">Sending to</Text>
        <View className="flex-row items-start justify-between mb-4 bg-primary-400 rounded-xl p-4 mt-4">
          <View className="flex-1">
            <Text className="text-white font-semibold mb-1">
              {receiverName}
            </Text>
            <Text className="text-sm text-white/60">
              {bank} • {accountNumber}
            </Text>
          </View>
          <View className=" bg-primary-300 p-3 rounded-full">
            <Transfer />
          </View>
        </View>
        <TransferSummaryCard
          amount={amount}
          fee={fee}
          totalDebit={totalDebit}
        />
        <TextInputField
          label="Remark"
          value={remark}
          onChangeText={setRemark}
          placeholder="Enter a remark"
        />
        <ScheduleTransaction
          scheduleEnabled={scheduleEnabled}
          setScheduleEnabled={setScheduleEnabled}
          scheduleName={scheduleName}
          setScheduleName={setScheduleName}
          frequency={frequency}
          setFrequency={setFrequency}
          dayOfWeek={dayOfWeek}
          setDayOfWeek={setDayOfWeek}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          frequencyOptions={frequencyOptions}
          dayOptions={dayOptions}
        />

        {error && (
          <Text className="text-red-500 text-sm mb-4 text-center">
            {error}
          </Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" className="my-4" />
        ) : (
          <Button
            title="Authorize Payment"
            variant="primary"
            onPress={handlePay}
            className="bg-accent-100 w-full"
          />
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
