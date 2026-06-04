import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import BundleCard from "@/app/components/home/biils/BundleCard";
import AmountInput from "@/app/components/inputs/AmountInput";
import Loading from "@/app/components/Loading";
import BottomSheet from "@/app/components/BottomSheet";
import CustomText from "@/app/components/CustomText";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { getBillerProviders, getPackages } from "@/app/lib/thunks/billsThunks";
import {
  clearError,
  clearPackages,
  clearProviders,
} from "@/app/lib/slices/billsSlice";

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

  const [contactsVisible, setContactsVisible] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

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
    dispatch(clearProviders());
    dispatch(clearPackages());

    setSelectedService("");
    setSelectedProduct(""); 
    setAccountId("");
    setCustomAmount("");

    dispatch(getBillerProviders({ type: "internet" })).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedService) {
      dispatch(clearPackages());
      setSelectedProduct(""); 
      setCustomAmount(""); 
      dispatch(getPackages({ slug: selectedService })).catch(() => {});
    }
  }, [selectedService, dispatch]);

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

  const hasPackageAmount = useMemo(
    () => selectedPackageData?.amount != null && selectedPackageData.amount > 0,
    [selectedPackageData]
  );

  const amount = useMemo(() => {
    if (hasPackageAmount) return String(selectedPackageData?.amount ?? "");
    return customAmount.replace(/,/g, "");
  }, [selectedPackageData, customAmount, hasPackageAmount]);

  /* ---------------- Contacts logic ---------------- */
  const openContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        setContacts(data);
        setContactsVisible(true);
      }
    }
  };

  const selectContact = (contact: Contacts.Contact) => {
    const value = contact.phoneNumbers?.[0]?.number || contact.name || "";
    setAccountId(value);
    setContactsVisible(false);
  };

  const isFormValid =
    accountId &&
    selectedService &&
    selectedProduct &&
    amount &&
    Number(amount) >= 100;

  const handleContinue = () => {
    if (!selectedProviderData || !selectedPackageData || !accountId) return;

    router.push({
      pathname: "/(root)/internet/confirm",
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
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Internet services" showClose showBack={false} />
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
                  options={safeProviders.map((p) => ({
                    label: p.name,
                    value: p.slug,
                  }))}
                  selectedValue={selectedService}
                  onSelect={setSelectedService}
                  searchable
                />

                <Dropdown
                  label="Select product"
                  options={safePackages.map((p) => ({
                    label: p.name,
                    value: p.slug,
                  }))}
                  selectedValue={selectedProduct}
                  onSelect={setSelectedProduct}
                  disabled={!selectedService || packagesStatus === "loading"}
                />

                <TextInputField
                  label="Enter Account ID / User ID"
                  value={accountId}
                  onChangeText={setAccountId}
                  placeholder="Enter Account ID / User ID"
                  rightIcon={
                    <Ionicons name="person-circle" size={24} color="white" />
                  }
                  onRightIconPress={openContacts}
                />

                {hasPackageAmount ? (
                  <BundleCard
                    price={String(selectedPackageData?.amount ?? "")}
                  />
                ) : (
                  <View className="mb-4">
                    <Text className="text-white/60 text-sm mb-2 pl-1">
                      Enter Amount
                    </Text>
                    <AmountInput
                      value={customAmount}
                      onChange={setCustomAmount}
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

      <BottomSheet
        visible={contactsVisible}
        onClose={() => setContactsVisible(false)}
        title="Select Contact"
        hideshowButton
      >
        {contacts
          .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c, index) => {
            const number = c.phoneNumbers?.[0]?.number;
            if (!number) return null;

            return (
              <Pressable
                key={index}
                onPress={() => selectContact(c)}
                className="py-3 border-b border-primary-400"
              >
                <CustomText>{c.name ?? "Unknown"}</CustomText>
                <CustomText secondary>{number}</CustomText>
              </Pressable>
            );
          })}
      </BottomSheet>
    </SafeAreaView>
  );
}
