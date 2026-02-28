import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/lib/store";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import ReceiverCard from "@/app/components/home/cards/receiver-card";
import Button from "@/app/components/Button";
import Header from "@/app/components/header-back";
import AmountInput from "@/app/components/inputs/AmountInput";
import Loading from "@/app/components/Loading";
import { validateNipAccount } from "@/app/lib/thunks/accountThunks";
import { clearValidation } from "@/app/lib/slices/accountSlice";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

interface Beneficiary {
  id: number;
  name: string;
  bank: string;
  accountNumber: string;
}

export default function TransferDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState((params?.amount as string) || "");
  const [addAsBeneficiary, setAddAsBeneficiary] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const validationResult = useSelector(
    (state: RootState) => state.accounts.validationResult
  );
  const validationError = useSelector(
    (state: RootState) => state.accounts.error
  );
  const user = useAppSelector((state) => state.auth.user);
  const incomingGift = params?.gift === "true";
  const incomingAmountGrams = params?.amount_grams as string | undefined;
  const goldBalance = useAppSelector((state: any) => state.gold.dashboard?.wallet?.balance_grams ?? 0);

  const accountNumber = params.accountNumber as string;
  const bank = params.bank as string;
  const bankCode = params.bankCode as string;
  console.log("Bank Code:", bankCode);
  const accountName = params.accountName as string;
  const beneficiaryJson = params.beneficiary as string;
  let beneficiary: Beneficiary | null = null;
  const accountInfo = useSelector(
    (state: RootState) => state.accounts.accountInfo
  );
  console.log(accountInfo);
  if (beneficiaryJson) {
    try {
      beneficiary = JSON.parse(beneficiaryJson);
    } catch (e) {
      beneficiary = null;
    }
  }

  const [receiverName, setReceiverName] = useState(
    beneficiary
      ? beneficiary.name
      : accountName
      ? accountName
      : `Account • ${accountNumber}`
  );
  const receiverAccountNumber = beneficiary
    ? beneficiary.accountNumber
    : accountNumber;
  const receiverBank = beneficiary ? beneficiary.bank : bank;

  useEffect(() => {
    if (!beneficiary && !accountName && bankCode && accountNumber) {
      setIsValidating(true);
      dispatch(validateNipAccount({ accountNumber, bankCode }));
    }
  }, [dispatch, bankCode, accountNumber, beneficiary, accountName]);

  useEffect(() => {
    if (validationResult && validationResult.accountNumber === accountNumber) {
      setReceiverName(validationResult.accountName);
      setIsValidating(false);
      dispatch(clearValidation());
    }
  }, [validationResult, accountNumber, dispatch]);

  useEffect(() => {
    if (validationError) {
      setReceiverName(`Account • ${accountNumber}`);
      setIsValidating(false);
      dispatch(clearValidation());
    }
  }, [validationError, accountNumber, dispatch]);

  const balanceStr = String(accountInfo?.accountBalance || "0");
  const balance = parseFloat(balanceStr.replace(/,/g, ""));
  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;

  const canContinue = amountNum >= 100 && amountNum <= balance;

  let validationMessage = "Enter an amount above ₦100";
  if (amountNum > 0) {
    if (amountNum < 100) {
      validationMessage = "Enter an amount above ₦100";
    } else if (amountNum > balance) {
      validationMessage = `Enter an amount less than or equal to your balance (₦${balance.toLocaleString()})`;
    } else {
      validationMessage = `Minimum amount is ₦100. Available balance: ₦${balance.toLocaleString()}`;
    }
  }

  const handleContinue = () => {
    if (canContinue) {
      router.push({
        pathname: "/(root)/transfer/confirm-transfer",
        params: {
          accountNumber: receiverAccountNumber,
          bank: receiverBank,
          bankCode,
          receiverName:
            receiverName !== `Account • ${accountNumber}` ? receiverName : "",
          ...(beneficiary && { beneficiary: JSON.stringify(beneficiary) }),
          amount,
          addAsBeneficiary: addAsBeneficiary.toString(),
          ...(incomingGift && { gift: "true" }),
          ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
          ...(params?.remark && { remark: params.remark }),
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Loading visible={isValidating} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Header title="Amount" />

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SenderCard />

          {incomingGift && (
            <View className="mb-4">
              <Text className="text-sm text-white/60">Gold balance</Text>
              <Text className="text-white font-semibold">{Number(goldBalance).toFixed(8)} g</Text>
            </View>
          )}

          <ReceiverCard
            receiverName={receiverName}
            receiverBank={receiverBank}
            receiverAccountNumber={receiverAccountNumber}
            addAsBeneficiary={addAsBeneficiary}
            setAddAsBeneficiary={setAddAsBeneficiary}
          />

          {incomingGift && incomingAmountGrams && (
            <View className="mb-4">
              <Text className="text-sm text-white/60 mb-2">Gold to gift</Text>
              <View className="rounded-2xl bg-[#4a4a28] px-4 py-3">
                <Text className="text-white font-semibold">{Number(incomingAmountGrams).toFixed(8)} g</Text>
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-sm text-white/70 mb-3">Add amount</Text>

            <AmountInput value={amount} onChange={setAmount} />

            <Text className="text-xs text-white/50 mt-2">
              {validationMessage}
            </Text>
          </View>
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              disabled={!canContinue}
              className={`mt-6 w-full ${
                canContinue ? "bg-[#5a5a35]" : "bg-[#4a4a28] opacity-50"
              }`}
            />
        </ScrollView>

        <View className="px-6 pb-6"></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
