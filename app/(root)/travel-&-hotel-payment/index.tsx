import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
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
  validateBillCustomer,
} from "@/app/lib/thunks/billsThunks";
import { clearError, clearPackages, clearProviders } from "@/app/lib/slices/billsSlice";

export default function InternetServicesPayment() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const providers = useAppSelector((state) => state.bills.providers);
  const packages = useAppSelector((state) => state.bills.packages);
  const providersStatus = useAppSelector(
    (state) => state.bills.providersStatus
  );
  const packagesStatus = useAppSelector((state) => state.bills.packagesStatus);
  const error = useAppSelector((state) => state.bills.error);

  const [selectedService, setSelectedService] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [accountId, setAccountId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [validating, setValidating] = useState(false);

  // const safeProviders = useMemo(() => providers ?? [], [providers]);
  // const safePackages = useMemo(() => packages ?? [], [packages]);

  const safeProviders = useMemo(() => 
  Array.isArray(providers) ? providers : [], 
[providers]);

const safePackages = useMemo(() => 
  Array.isArray(packages) ? packages : [], 
[packages]);

  const isLoading =
    providersStatus === "loading" || packagesStatus === "loading";

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
     dispatch(clearProviders());
     dispatch(clearPackages());
    dispatch(getBillerProviders({ type: "travel" })).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedService) {
      dispatch(clearPackages());
      setSelectedProduct("");
      setCustomAmount("");
      dispatch(getPackages({ slug: selectedService })).catch(() => {});
    }
  }, [selectedService, dispatch]);

  const serviceOptions = useMemo(
    () =>
      safeProviders.map((p) => ({
        label: p.name,
        value: p.slug,
      })),
    [safeProviders]
  );

  const productOptions = useMemo(
    () =>
      safePackages.map((p) => ({
        label: p.name,
        value: p.slug,
      })),
    [safePackages]
  );

  const selectedProviderData = useMemo(
    () => safeProviders.find((p) => p.slug === selectedService),
    [safeProviders, selectedService]
  );

  const selectedPackageData = useMemo(
    () => safePackages.find((p) => p.slug === selectedProduct),
    [safePackages, selectedProduct]
  );

  const hasPackageAmount = useMemo(
    () => selectedPackageData?.amount != null && selectedPackageData.amount > 0,
    [selectedPackageData]
  );

  const amount = useMemo(() => {
    if (hasPackageAmount) {
      return String(selectedPackageData.amount);
    }
    // Remove commas from customAmount for numeric value
    return customAmount.replace(/,/g, "");
  }, [selectedPackageData, customAmount, hasPackageAmount]);

  const handleAccountIdChange = (text: string) => {
    setAccountId(text);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleContinue = async () => {
    if (!selectedProviderData || !selectedPackageData || !accountId) return;

    setValidating(true);
    try {
      await dispatch(
        validateBillCustomer({
          customerId: accountId,
          productName: selectedPackageData.slug,
          billerSlug: selectedProviderData.slug,
        })
      ).unwrap();

      router.push({
        pathname: "/(root)/travel-&-hotel-payment/confirm",
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
          packageSlug: selectedPackageData.slug,
        },
      });
    } catch (error) {
    } finally {
      setValidating(false);
    }
  };

  const isFormValid =
    accountId &&
    selectedService &&
    selectedProduct &&
    amount &&
    Number(amount) >= 100;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Travel & hotel payment" showClose showBack={false} />
      <Loading visible={isLoading} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-1 p-4">
                {error && (
                  <View className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4">
                    <Text className="text-red-500 text-sm">{error}</Text>
                  </View>
                )}

                <Dropdown
                  label="Select service item"
                  options={serviceOptions}
                  selectedValue={selectedService}
                  onSelect={handleServiceChange}
                  searchable
                />

                <Dropdown
                  label="Select product"
                  options={productOptions}
                  selectedValue={selectedProduct}
                  onSelect={handleProductChange}
                  disabled={!selectedService || packagesStatus === "loading"}
                />

                <TextInputField
                  label="Enter Account ID/User ID"
                  value={accountId}
                  onChangeText={handleAccountIdChange}
                  keyboardType="default"
                  placeholder="Enter Account ID/User ID"
                />

                {hasPackageAmount ? (
                  <BundleCard price={String(selectedPackageData.amount)} />
                ) : (
                  <View className="mb-4">
                    <Text className="text-white/60 text-sm mb-2 pl-1">
                      Enter Amount
                    </Text>
                    <AmountInput
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="0"
                    />
                  </View>
                )}

                <Text className="text-white/60 text-sm italic pl-1 mt-2 mb-6">
                  ❔ {hasPackageAmount ? "Select" : "Enter"} a bundle above ₦100
                </Text>

                <View className="mt-auto pb-4">
                  <Button
                    title="Continue"
                    variant="primary"
                    onPress={handleContinue}
                    disabled={!isFormValid}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


