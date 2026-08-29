import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "@/app/components/Button";
import Header from "@/app/components/header-back";
import AmountInput from "@/app/components/inputs/AmountInput";
import TextInputField from "@/app/components/inputs/TextInputField";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import BundleCard from "@/app/components/home/biils/BundleCard";
import Loading from "@/app/components/Loading";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  getBillerProviders,
  getPackages,
  validateBillCustomer,
} from "@/app/lib/thunks/billsThunks";
import { useRouter } from "expo-router";
import {
  clearError,
  clearPackages,
  clearProviders,
} from "@/app/lib/slices/billsSlice";

export default function UtilityBillPayment() {
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
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Reset everything on mount and fetch providers
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearProviders());
    dispatch(clearPackages());

    setSelectedService("");
    setSelectedProduct("");
    setAmount("");
    setMeterNumber("");

    dispatch(getBillerProviders({ type: "electricity" })).catch(() => {});
  }, [dispatch]);

  // When user selects a service, fetch its packages
  useEffect(() => {
    if (selectedService) {
      dispatch(clearPackages());
      setSelectedProduct("");
      setAmount("");

      dispatch(getPackages({ slug: selectedService })).catch(() => {});
    }
  }, [selectedService, dispatch]);

  // Auto-select the first provider only
  useEffect(() => {
    if (safeProviders.length && !selectedService) {
      setSelectedService(safeProviders[0].slug);
    }
  }, [safeProviders]);

  const selectedProviderData = useMemo(
    () => safeProviders.find((p) => p.slug === selectedService),
    [safeProviders, selectedService]
  );

  const selectedPackageData = useMemo(
    () => safePackages.find((p) => p.slug === selectedProduct),
    [safePackages, selectedProduct]
  );

  // Set amount when a product is selected
  useEffect(() => {
    if (selectedPackageData?.amount) {
      setAmount(String(selectedPackageData.amount));
    }
  }, [selectedPackageData]);

  const predefinedAmount = selectedPackageData?.amount
    ? String(selectedPackageData.amount)
    : "";

  const cleanAmount = useMemo(() => {
    const rawAmount = predefinedAmount || amount;
    return rawAmount.replace(/,/g, "");
  }, [predefinedAmount, amount]);

  const parsedAmount = Number(cleanAmount);

  const isFormValid =
    meterNumber &&
    selectedService &&
    selectedProduct &&
    (predefinedAmount || amount) &&
    !isNaN(parsedAmount) &&
    parsedAmount >= 100;

  const handleContinue = async () => {
    if (!selectedProviderData || !selectedPackageData || !isFormValid) return;

    try {
      setIsLoading(true);
      setError(null);

      const validationResult = await dispatch(
        validateBillCustomer({
          customerId: meterNumber,
          productName: selectedPackageData.slug,
          billerSlug: selectedProviderData.slug,
        })
      ).unwrap();

      router.push({
        pathname: "/(root)/utility/confirm",
        params: {
          service: selectedService,
          product: selectedProduct,
          meterNumber,
          amount: cleanAmount,
          providerId: String(selectedProviderData.id),
          providerName: selectedProviderData.name,
          providerSlug: selectedProviderData.slug,
          packageId: String(selectedPackageData.id),
          packageName: selectedPackageData.name,
          packageSlug: selectedPackageData.slug,
          validationResult: JSON.stringify(validationResult),
        },
      });
    } catch (err: any) {
      setError(err?.message || "Validation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const serviceOptions = safeProviders.map((p) => ({
    label: p.name,
    value: p.slug,
  }));

  const productOptions = safePackages.map((p) => ({
    label: p.name,
    value: p.slug,
  }));

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Utility bills payment" showClose showBack={false} />
      <Loading visible={isLoading || isLoadingGlobal} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
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
            label="Enter meter number"
            value={meterNumber}
            onChangeText={setMeterNumber}
            keyboardType="number-pad"
            placeholder="Enter meter number"
          />

          {predefinedAmount ? (
            <BundleCard price={predefinedAmount} />
          ) : (
            <AmountInput value={amount} onChange={setAmount} placeholder="0" />
          )}

          <Text className="text-white/60 text-sm italic pl-1 mt-2 mb-6">
            ❔ Enter an amount above ₦100
          </Text>

          <View className="mt-auto pb-4">
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              disabled={!isFormValid || isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
