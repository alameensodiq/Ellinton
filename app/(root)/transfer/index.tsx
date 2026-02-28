import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import Header from "@/app/components/header-back";
import TextInputField from "@/app/components/inputs/TextInputField";
import Loading from "@/app/components/Loading";
import Sheet from "@/app/components/Sheet";
import SenderCard from "@/app/components/home/cards/sender-card.tsx";
import type { AppDispatch, RootState } from "@/app/lib/store";
import {
  fetchBeneficiaries,
  type Beneficiary as ApiBeneficiary,
} from "@/app/lib/thunks/beneficiaryThunks";
import {
  validateEllingtonAccount,
  fetchBanks,
} from "@/app/lib/thunks/accountThunks";
import { clearValidation } from "@/app/lib/slices/accountSlice";

interface Beneficiary {
  id: number;
  name: string;
  bank: string;
  accountNumber: string;
}
const mapApiBeneficiary = (api: ApiBeneficiary, id: number): Beneficiary => ({
  id,
  name: api.account_name,
  bank: api.bank_name,
  accountNumber: api.account_number,
});
export default function TransferScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const incomingGift = params?.gift === "true";
  const incomingAmount = params?.amount || "";
  const incomingAmountGrams = params?.amount_grams || "";
  const incomingRemark = params?.remark || "";

  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const beneficiariesData = useSelector(
    (state: RootState) => state.beneficiaries.beneficiaries
  );
  const isFetchingBeneficiaries = useSelector(
    (state: RootState) => state.beneficiaries.isLoading
  );
  const beneficiariesError = useSelector(
    (state: RootState) => state.beneficiaries.error
  );
  const banks = useSelector((state: RootState) => state.accounts.banks);
  const validationResult = useSelector(
    (state: RootState) => state.accounts.validationResult
  );
  const accountsLoading = useSelector(
    (state: RootState) => state.accounts.isLoading
  );

  const beneficiaries: Beneficiary[] = useMemo(() => {
    if (!beneficiariesData) return [];
    return beneficiariesData.map((b, i) => mapApiBeneficiary(b, i + 1));
  }, [beneficiariesData]);
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [beneficiaries, searchQuery]);
  const filteredBanks = useMemo(() => {
    if (!banks) return [];
    return banks.filter((b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [banks, bankSearch]);

  useEffect(() => {
    dispatch(clearValidation());
    dispatch(fetchBeneficiaries());
    dispatch(fetchBanks());
  }, [dispatch]);
  useEffect(() => {
    if (accountNumber.length === 10) {
      dispatch(validateEllingtonAccount({ accountNumber }));
    } else {
      dispatch(clearValidation());
    }
  }, [accountNumber, dispatch]);

  const handleBeneficiarySelect = (beneficiary: Beneficiary) => {
    setLoading(true);
    setTimeout(() => {
      setAccountNumber(beneficiary.accountNumber);
      setLoading(false);
      const bankObj = banks?.find((b) => b.name === beneficiary.bank);
      const bankCode = bankObj?.code || "";
      router.push({
        pathname: "/(root)/transfer/details",
        params: {
          accountNumber: beneficiary.accountNumber,
          bank: beneficiary.bank,
          bankCode,
          beneficiary: JSON.stringify(beneficiary),
          ...(incomingGift && { gift: "true" }),
          ...(incomingAmount && { amount: incomingAmount }),
          ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
          ...(incomingRemark && { remark: incomingRemark }),
        },
      });
    }, 1200);
  };
  const handleBankSelect = (bankName: string) => {
    setBankSheetOpen(false);
    setTimeout(() => {
      setSelectedBank(bankName);
      const bankObj = banks?.find((b) => b.name === bankName);
      const bankCode = bankObj?.code || "";
      router.push({
        pathname: "/(root)/transfer/details",
        params: {
          accountNumber,
          bank: bankName,
          bankCode,
          ...(incomingGift && { gift: "true" }),
          ...(incomingAmount && { amount: incomingAmount }),
          ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
          ...(incomingRemark && { remark: incomingRemark }),
        },
      });
    }, 300);
  };

  const handleEllingtonSelect = () => {
    const bank = "Ellington Bank";
    const bankObj = banks?.find((b) => b.name === bank);
    const bankCode = bankObj?.code || "";
    router.push({
      pathname: "/(root)/transfer/details",
      params: {
        accountNumber,
        bank,
        bankCode,
        accountName: validationResult?.accountName,
        ...(incomingGift && { gift: "true" }),
        ...(incomingAmount && { amount: incomingAmount }),
        ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
        ...(incomingRemark && { remark: incomingRemark }),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#3d3d1f]">
      <StatusBar barStyle="light-content" />
      <Loading visible={loading} />
      <Header title="Transfer" showCancel />
      <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
        <SenderCard />
        <TextInputField
          label="Receiver account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="0000000000"
          keyboardType="number-pad"
          maxLength={10}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        {accountNumber.length === 10 && (
          <View className="mt-4">
            {accountsLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#fff" />
                <Text className="text-white/50 mt-2">
                  Validating account...
                </Text>
              </View>
            ) : validationResult ? (
              <TouchableOpacity
                onPress={handleEllingtonSelect}
                className="bg-[#4a4a28] rounded-3xl p-5 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-white font-semibold">
                    {validationResult.accountName}
                  </Text>
                  <Text className="text-white/60 mt-1">
                    Ellington Bank • {accountNumber}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setBankSheetOpen(true)}
                className="bg-[#4a4a28] rounded-3xl px-5 py-5 flex-row justify-between items-center"
              >
                <Text className={selectedBank ? "text-white" : "text-white/40"}>
                  {selectedBank || "Select bank"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {accountNumber.length < 10 && !loading && (
          <View className="mt-6">
            <Text className="text-white/90 mb-3">Beneficiaries</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search beneficiary"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="bg-[#4a4a28] text-white rounded-3xl px-5 py-5 mb-4"
            />
            {isFetchingBeneficiaries ? (
              <ActivityIndicator color="#fff" />
            ) : beneficiariesError ? (
              <Text className="text-red-300 text-center">
                {beneficiariesError}
              </Text>
            ) : (
              filteredBeneficiaries.map((b) => (
                <TouchableOpacity
                  key={`${b.accountNumber}-${b.bank}`}
                  onPress={() => handleBeneficiarySelect(b)}
                  className="bg-[#4a4a28] rounded-3xl p-5 flex-row justify-between mb-3"
                >
                  <View>
                    <Text className="text-white font-semibold">{b.name}</Text>
                    <Text className="text-white/60 mt-1">
                      {b.bank} • {b.accountNumber}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
      <Sheet visible={bankSheetOpen} onClose={() => setBankSheetOpen(false)}>
        <Text className="text-lg font-semibold mb-4 text-white">
          Select Bank
        </Text>
        <View className="bg-[#4a4a28] rounded-2xl px-4 py-4 flex-row items-center mb-4">
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            value={bankSearch}
            onChangeText={setBankSearch}
            placeholder="Search banks"
            placeholderTextColor="#999"
            className="ml-3 flex-1 text-white"
          />
        </View>
        <ScrollView style={{ maxHeight: 400 }}>
          {filteredBanks.map((bank) => (
            <TouchableOpacity
              key={`${bank.name}-${bank.code ?? "no-code"}`}
              onPress={() => handleBankSelect(bank.name)}
              className="py-4 "
            >
              <Text className="text-base text-white">{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Sheet>
    </SafeAreaView>
  );
}
