import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";

import Button from "@/app/components/Button";
import Header from "@/app/components/header-back";
import ProviderSelector from "@/app/components/home/biils/ProviderSelector";
import TextInputField from "@/app/components/inputs/TextInputField";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import BundleCard from "@/app/components/home/biils/BundleCard";
import Loading from "@/app/components/Loading";
import BottomSheet from "@/app/components/BottomSheet";
import CustomText from "@/app/components/CustomText";

import { formatNigerianPhone, providers } from "@/app/lib/utils";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store";
import {
  fetchBillerOptions,
} from "@/app/lib/thunks/billsThunks";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

export default function BuyData() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const [selectedProvider, setSelectedProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(
    user?.phone ? formatNigerianPhone(user.phone) : "+234"
  );
  const [selectedBundle, setSelectedBundle] = useState<string>("");

  const {
    options: dataBundles,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.bills);

  const [contactsSheetVisible, setContactsSheetVisible] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (selectedProvider) {
      setSelectedBundle("");
      dispatch(fetchBillerOptions({ type: "data", provider: selectedProvider }));
    }
  }, [dispatch, selectedProvider]);

  const openContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        setContacts(data);
        setContactsSheetVisible(true);
      }
    }
  };

  const selectContactNumber = (number: string) => {
    setPhoneNumber(formatNigerianPhone(number));
    setContactsSheetVisible(false);
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
  };

  const handlePhoneNumberBlur = () => {
    if (phoneNumber && phoneNumber !== "+234") {
      setPhoneNumber(formatNigerianPhone(phoneNumber));
    }
  };

  const currentBundle = dataBundles?.find(
    (bundle) => bundle.slug === selectedBundle
  );

  const handleContinue = async () => {
    if (!currentBundle) return;

    const formattedPhone = formatNigerianPhone(phoneNumber);

    router.push({
      pathname: "/(root)/data/confirm",
      params: {
        provider: selectedProvider,
        phone: formattedPhone,
        bundle: selectedBundle,
        amount: currentBundle.amount.toString(),
        productName: currentBundle.name,
        billerSlug: currentBundle.slug,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Buy data" showClose showBack={false} />
      <Loading visible={validating} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View className="bg-red-500/10 border border-red-500 rounded-lg p-3 mb-4">
              <Text className="text-red-500 text-sm">{error}</Text>
            </View>
          )}

          <Text className="text-white text-base font-medium mb-3">
            Select network provider
          </Text>

          <ProviderSelector
            providers={providers}
            selected={selectedProvider}
            onSelect={setSelectedProvider}
          />

          <TextInputField
            label="Phone number"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            onBlur={handlePhoneNumberBlur}
            keyboardType="phone-pad"
            placeholder="+234 801 234 5678"
            rightIcon={
              <Ionicons name="person-circle" size={24} color="white" />
            }
            onRightIconPress={openContacts}
          />

          {isLoading ? (
            <Loading visible />
          ) : (
            <Dropdown
              label="Select data bundle"
              placeholder="Select a bundle"
              options={
                dataBundles?.map((bundle) => ({
                  value: bundle.slug,
                  label: `${bundle.name}`,
                  price: bundle.amount.toString(),
                })) || []
              }
              selectedValue={selectedBundle}
              onSelect={setSelectedBundle}
              searchable
              searchPlaceholder="Search bundles..."
            />
          )}

          {currentBundle && (
            <BundleCard price={currentBundle.amount.toString()} />
          )}

          <View className="mt-20 mb-8">
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              disabled={
                !selectedProvider ||
                !phoneNumber ||
                phoneNumber.trim() === "+234" ||
                !selectedBundle ||
                !currentBundle
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={contactsSheetVisible}
        onClose={() => setContactsSheetVisible(false)}
        title="Select Contact"
        hideshowButton={true}
      >
        {contacts
          .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c, index) => {
            const number = c.phoneNumbers?.[0]?.number;
            if (!number) return null;

            return (
              <Pressable
                key={index}
                onPress={() => selectContactNumber(number)}
                className="py-3 border-b border-primary-400"
              >
                <CustomText>{c.name ?? "Unknown"}</CustomText>
                <CustomText secondary>{formatNigerianPhone(number)}</CustomText>
              </Pressable>
            );
          })}
      </BottomSheet>
    </SafeAreaView>
  );
}
