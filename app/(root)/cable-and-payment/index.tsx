import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import BundleCard from "@/app/components/home/biils/BundleCard";
import AmountInput from "@/app/components/inputs/AmountInput";
import Loading from "@/app/components/Loading";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  getBillerProviders,
  getPackages,
  validateBillCustomer
} from "@/app/lib/thunks/billsThunks";
import {
  clearError,
  clearPackages,
  clearProviders
} from "@/app/lib/slices/billsSlice";

export default function CablePayment() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const providers = useAppSelector((state) => state.bills.providers);
  const packages = useAppSelector((state) => state.bills.packages);
  const providersStatus = useAppSelector(
    (state) => state.bills.providersStatus
  );
  const packagesStatus = useAppSelector((state) => state.bills.packagesStatus);
  const errorFromStore = useAppSelector((state) => state.bills.error);

  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const safeProviders = useMemo(() => providers ?? [], [providers]);
  // const safePackages = useMemo(() => packages ?? [], [packages]);

  const safeProviders = useMemo(
    () => (Array.isArray(providers) ? providers : []),
    [providers]
  );

  const safePackages = useMemo(
    () => (Array.isArray(packages) ? packages : []),
    [packages]
  );
  const isLoadingGlobal =
    providersStatus === "loading" || packagesStatus === "loading";

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearProviders());
    dispatch(clearPackages());

    setSelectedService("");
    setSelectedProduct("");
    setAmount("");
    setAccountId("");

    dispatch(getBillerProviders({ type: "cable" })).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedService) {
      dispatch(clearPackages());
      setSelectedProduct("");
      setAmount("");
      dispatch(getPackages({ slug: selectedService })).catch(() => {});
    }
  }, [selectedService, dispatch]);



  const selectedProviderData = useMemo(
    () => safeProviders.find((p) => p.slug === selectedService),
    [safeProviders, selectedService]
  );

  const selectedPackageData = useMemo(
    () => safePackages.find((p) => p.slug === selectedProduct),
    [safePackages, selectedProduct]
  );

  useEffect(() => {
    if (selectedPackageData?.amount) {
      setAmount(String(selectedPackageData.amount));
    }
  }, [selectedPackageData]);

  const isFormValid =
    accountId &&
    selectedService &&
    selectedProduct &&
    amount &&
    Number(amount) >= 100;

  const handleContinue = async () => {
    if (!selectedProviderData || !selectedPackageData || !isFormValid) return;

    try {
      setIsLoading(true);
      setError(null);

      await dispatch(
        validateBillCustomer({
          customerId: accountId,
          productName: selectedPackageData.slug,
          billerSlug: selectedProviderData.slug
        })
      ).unwrap();

      router.push({
        pathname: "/(root)/cable-and-payment/confirm",
        params: {
          service: selectedService,
          product: selectedProduct,
          accountId,
          amount,
          providerId: String(selectedProviderData.id),
          providerName: selectedProviderData.name,
          providerSlug: selectedProviderData.slug,
          packageId: String(selectedPackageData.id),
          packageName: selectedPackageData.name,
          packageSlug: selectedPackageData.slug
        }
      });
    } catch (err: any) {
      setError(err?.message || "Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const serviceOptions = safeProviders.map((p) => ({
    label: p.name,
    value: p.slug
  }));
  const productOptions = safePackages.map((p) => ({
    label: p.name,
    value: p.slug
  }));

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Cable TV payment" showClose showBack={false} />
      <Loading visible={isLoading || isLoadingGlobal} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1">
              {(error || errorFromStore) && (
                <View className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4">
                  <Text className="text-red-500 text-sm">
                    {error || errorFromStore}
                  </Text>
                </View>
              )}

              <Dropdown
                label="Select service item"
                options={serviceOptions}
                selectedValue={selectedService}
                onSelect={setSelectedService}
                searchable
              />

              <Dropdown
                label="Select product"
                options={productOptions}
                selectedValue={selectedProduct}
                onSelect={setSelectedProduct}
                disabled={!selectedService || packagesStatus === "loading"}
              />

              <TextInputField
                label="Enter Account ID/User ID"
                value={accountId}
                onChangeText={setAccountId}
                keyboardType="default"
                placeholder="Enter Account ID/User ID"
              />

              {selectedPackageData?.amount ? (
                <BundleCard price={String(selectedPackageData.amount)} />
              ) : (
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="Enter amount"
                />
              )}

              <Text className="text-white/60 text-sm italic pl-1 mt-2 mb-6">
                ❔ Amount must be above ₦100
              </Text>

              <View className="mt-auto pb-4">
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
