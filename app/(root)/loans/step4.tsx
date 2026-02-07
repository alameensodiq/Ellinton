import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StatusBar,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import Sheet from "@/app/components/Sheet";

import { fetchLoanBanks } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import TextInputField from "@/app/components/inputs/TextInputField";

type BankItem = {
  id: number;
  cbnCode: string;
  institutionName: string;
  shortName?: string | null;
  status: string;
};

const Step4 = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<Record<string, string>>();

  const banks = useAppSelector((s: any) => s.loans?.banks || []);
  const banksLoading = useAppSelector((s: any) => s.loans?.banksLoading);
  const banksError = useAppSelector((s: any) => s.loans?.banksError);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [selectedBank, setSelectedBank] = useState<BankItem | null>(null);
  const [accountNumber, setAccountNumber] = useState("");

  const [bankError, setBankError] = useState("");
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    dispatch(fetchLoanBanks());
  }, [dispatch]);

  const bankList = useMemo(() => (banks || []) as BankItem[], [banks]);

  const canContinue = useMemo(() => {
    return !!selectedBank && accountNumber.trim().length === 10;
  }, [selectedBank, accountNumber]);

  const validate = () => {
    let ok = true;

    if (!selectedBank) {
      setBankError("Select a bank");
      ok = false;
    } else {
      setBankError("");
    }

    const acc = accountNumber.trim();
    if (!acc) {
      setAccountError("Enter account number");
      ok = false;
    } else if (acc.length !== 10) {
      setAccountError("Account number must be 10 digits");
      ok = false;
    } else {
      setAccountError("");
    }

    return ok;
  };

  const handleContinue = () => {
    if (!validate()) return;

    router.push({
      pathname: "/(root)/loans/credit-check",
      params: {
        ...params,
        preferredRepaymentBankCBNCode: selectedBank!.cbnCode,
        preferredRepaymentAccount: accountNumber.trim(),
      },
    });
  };

  const BankRow = ({ item }: { item: BankItem }) => {
    const active = selectedBank?.cbnCode === item.cbnCode;

    return (
      <Pressable
        onPress={() => {
          setSelectedBank(item);
          setBankError("");
          setSheetOpen(false);
        }}
        className={`px-4 py-3 rounded-2xl mb-3 border ${
          active
            ? "border-primary-600 bg-primary-400"
            : "border-white/10 bg-primary-400"
        }`}
      >
        <CustomText weight="bold" className="text-white">
          {item.shortName || item.institutionName}
        </CustomText>

        <CustomText size="sm" className="text-white/70">
          {item.institutionName} 
        </CustomText>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Repayment Bank" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-6 mb-4">
          <CustomText size="base">
            Select your repayment bank and enter the account number.
          </CustomText>
        </View>

        <View className="px-6 flex-1">
          {/* Bank Picker */}
          <Pressable onPress={() => setSheetOpen(true)}>
            <View pointerEvents="none">
              <TextInputField
                label="Preferred Bank"
                value={
                  selectedBank
                    ? `${
                        selectedBank.shortName || selectedBank.institutionName
                      } (${selectedBank.cbnCode})`
                    : banksLoading
                    ? "Loading banks..."
                    : ""
                }
                placeholder={banksLoading ? "Loading..." : "Select bank"}
                onChangeText={() => {}}
                error={bankError || banksError}
              />
            </View>
          </Pressable>

          {/* Account Number */}
          <TextInputField
            label="Preferred Repayment Account"
            value={accountNumber}
            onChangeText={(t) => {
              const cleaned = t.replace(/\D/g, "").slice(0, 10);
              setAccountNumber(cleaned);
              setAccountError("");
            }}
            placeholder="0123456789"
            keyboardType="number-pad"
            error={accountError}
            maxLength={10}
          />
        </View>

        <View className="px-6 pb-6">
          <Button
            title="Continue"
            disabled={!canContinue}
            onPress={handleContinue}
            variant="primary"
          />
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={{ maxHeight: 520 }}>
          <CustomText weight="bold" size="lg" className="text-white mb-3">
            Select Bank
          </CustomText>

          {banksLoading ? (
            <CustomText className="text-white/70">Loading...</CustomText>
          ) : (
            <FlatList
              data={bankList}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <BankRow item={item} />}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Sheet>
    </SafeAreaView>
  );
};

export default Step4;
