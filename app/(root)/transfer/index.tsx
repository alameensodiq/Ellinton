import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Pressable
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
  type Beneficiary as ApiBeneficiary
} from "@/app/lib/thunks/beneficiaryThunks";
import {
  validateEllingtonAccount,
  fetchBanks,
  validateNipAccount
} from "@/app/lib/thunks/accountThunks";
import { clearError, clearValidation } from "@/app/lib/slices/accountSlice";

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
  accountNumber: api.account_number
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
  const [selectedBankellington, setSelectedBankellington] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [bankSheetOpenellington, setBankSheetOpenellington] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [banktype, setbankType] = useState(false);

  const beneficiariesData = useSelector(
    (state: RootState) => state.beneficiaries.beneficiaries
  );
  console.log(beneficiariesData)
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
  const validationError = useSelector(
    (state: RootState) => state.accounts.error
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
  console.log(filteredBeneficiaries);
  const filteredBanks = useMemo(() => {
    if (!banks) return [];
    return banks.filter((b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [banks, bankSearch]);

  console.log(filteredBanks);

  useEffect(() => {
    dispatch(clearValidation());
    dispatch(clearError());
    dispatch(fetchBeneficiaries());
    dispatch(fetchBanks());
  }, [dispatch]);
  useEffect(() => {
    if (accountNumber.length === 10 && !banktype) {
      dispatch(validateEllingtonAccount({ accountNumber }));
    } else {
      dispatch(clearValidation());
      dispatch(clearError());
      setSelectedBank("");
      setSelectedBankellington("");
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
          ...(incomingRemark && { remark: incomingRemark })
        }
      });
    }, 1200);
  };

  const handleBeneficiarySelectEllington = (beneficiary: Beneficiary) => {
    setLoading(true);
    setTimeout(() => {
      setAccountNumber(beneficiary.accountNumber);
      setLoading(false);
      const bankObj = banks?.find((b) => b.name === "Ellington Bank");
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
          ...(incomingRemark && { remark: incomingRemark })
        }
      });
    }, 1200);
  };

  const handleBankSelect = async (bankName: string) => {
    setBankSheetOpen(false);
    setSelectedBank(bankName);
    dispatch(clearValidation());
    dispatch(clearError());

    const bankObj = banks?.find((b) => b.name === bankName);
    const bankCode = bankObj?.code || "";

    if (!bankCode || accountNumber.length !== 10) {
      return;
    }

    setLoading(true);

    try {
      const validation = await dispatch(
        validateNipAccount({ accountNumber, bankCode })
      ).unwrap();

      setSelectedBank(bankName);
      router.push({
        pathname: "/(root)/transfer/details",
        params: {
          accountNumber,
          bank: bankName,
          bankCode,
          accountName: validation.accountName,
          ...(incomingGift && { gift: "true" }),
          ...(incomingAmount && { amount: incomingAmount }),
          ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
          ...(incomingRemark && { remark: incomingRemark })
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelectEllington = async (bankName: string) => {
    setBankSheetOpenellington(false);
    setSelectedBankellington("Ellington Bank");
    dispatch(clearValidation());
    dispatch(clearError());

    const bankObj = banks?.find((b) => b.name === bankName);
    const bankCode = bankObj?.code || "";

    if (accountNumber.length !== 10) {
      return;
    }

    setLoading(true);

    console.log(accountNumber)

    try {
      const validation = await dispatch(
        validateEllingtonAccount({ accountNumber })
      ).unwrap();

      setSelectedBankellington(bankName);
      router.push({
        pathname: "/(root)/transfer/details",
        params: {
          accountNumber,
          bank: bankName,
          bankCode,
          accountName: validation.accountName,
          ...(incomingGift && { gift: "true" }),
          ...(incomingAmount && { amount: incomingAmount }),
          ...(incomingAmountGrams && { amount_grams: incomingAmountGrams }),
          ...(incomingRemark && { remark: incomingRemark })
        }
      });
    } finally {
      setLoading(false);
    }
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
        ...(incomingRemark && { remark: incomingRemark })
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#3d3d1f]">
      <StatusBar barStyle="light-content" />
      <Loading visible={loading} />
      <Header title="Transfer" showCancel />
      <ScrollView className="px-4 py-6" showsVerticalScrollIndicator={false}>
        <SenderCard />

        <View className="flex flex-row gap-8 mb-8">
          <Pressable
            onPress={() => {
              setbankType(false);
              setAccountNumber("");
              setSearchQuery("")
            }}
          >
            <View
              className={`${!banktype ? "border-b-2 border-[#FFFFFF] py-2" : "py-2"}`}
            >
              <Text
                className={`${!banktype ? "text-white" : "text-primary-600"}`}
              >
                Ellington Bank
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              setbankType(true);
              setAccountNumber("");
              setSearchQuery("")
            }}
          >
            <View
              className={`${banktype ? "border-b-2 border-[#FFFFFF] py-2" : "py-2"}`}
            >
              <Text
                className={`${banktype ? "text-white" : "text-primary-600"}`}
              >
                Other Bank
              </Text>
            </View>
          </Pressable>
        </View>
        <TextInputField
          label="Receiver account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="0000000000"
          keyboardType="number-pad"
          maxLength={10}
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        {banktype ? (
          <>
            {accountNumber.length === 10 && (
              <View className="mt-4">
                {accountsLoading ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white/50 mt-2">
                      Validating account...
                    </Text>
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity
                      onPress={() => setBankSheetOpen(true)}
                      className="bg-[#4a4a28] rounded-3xl px-5 py-5 flex-row justify-between items-center"
                    >
                      <Text
                        className={
                          selectedBank ? "text-white" : "text-white/40"
                        }
                      >
                        {selectedBank || "Select bank"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="rgba(255,255,255,0.5)"
                      />
                    </TouchableOpacity>

                    {!!selectedBank && !!validationError && (
                      <Text className="text-red-300 text-sm mt-2 px-1">
                        {validationError}
                      </Text>
                    )}
                  </View>
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
                  filteredBeneficiaries
                    .filter((b) => b.bank !== "Ellington MFB")
                    .map((b, index) => (
                      <TouchableOpacity
                        key={`${b.accountNumber}-${b.bank}-${index}`}
                        onPress={() => handleBeneficiarySelect(b)}
                        className="bg-[#4a4a28] rounded-3xl p-5 flex-row justify-between mb-3"
                      >
                        <View>
                          <Text className="text-white font-semibold">
                            {b.name}
                          </Text>
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
          </>
        ) : (
          <>
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
                  <View>
                    <TouchableOpacity
                      onPress={() =>
                        handleBankSelectEllington("Ellington Bank")
                      }
                      className="py-4 bg-primary-200 rounded-sm w-full justify-center items-center"
                    >
                      <Text className="text-base text-white">
                        Validate
                      </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                      onPress={() => setBankSheetOpenellington(true)}
                      className="bg-[#4a4a28] rounded-3xl px-5 py-5 flex-row justify-between items-center"
                    >
                      <Text
                        className={
                          selectedBankellington ? "text-white" : "text-white/40"
                        }
                      >
                        {selectedBankellington || "Select bank"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="rgba(255,255,255,0.5)"
                      />
                    </TouchableOpacity> */}

                    {!!selectedBankellington && !!validationError && (
                      <Text className="text-red-300 text-sm mt-2 px-1">
                        {validationError}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
            {accountNumber.length < 10 && !loading && !banktype && (
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
                  filteredBeneficiaries
                    .filter((b) => b.bank === "Ellington MFB")
                    .map((b, index) => (
                      <TouchableOpacity
                        key={`${b.accountNumber}-${b.bank}-${index}`}
                        onPress={() => handleBeneficiarySelectEllington(b)}
                        className="bg-[#4a4a28] rounded-3xl p-5 flex-row justify-between mb-3"
                      >
                        <View>
                          <Text className="text-white font-semibold">
                            {b.name}
                          </Text>
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
          </>
        )}
      </ScrollView>
      <Sheet visible={bankSheetOpen} onClose={() => setBankSheetOpen(false)}>
        <View style={{ height: 560 }}>
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
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredBanks.map((bank, index) => (
              <TouchableOpacity
                key={`${bank.name}-${bank.code ?? "no-code"}-${index}`}
                onPress={() => handleBankSelect(bank.name)}
                className="py-4 "
              >
                <Text className="text-base text-white">{bank.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Sheet>
      <Sheet
        visible={bankSheetOpenellington}
        onClose={() => setBankSheetOpenellington(false)}
      >
        <View style={{ height: 560 }}>
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
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => handleBankSelectEllington("Ellington Bank")}
              className="py-4"
            >
              <Text className="text-base text-white">Ellington Bank</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
