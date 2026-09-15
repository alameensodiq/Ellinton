import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import ProviderSelector from "@/app/components/home/biils/ProviderSelector";
import AmountInput from "@/app/components/inputs/AmountInput";
import TextInputField from "@/app/components/inputs/TextInputField";
import BottomSheet from "@/app/components/BottomSheet";
import CustomText from "@/app/components/CustomText";
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import { providers, formatNigerianPhone } from "@/app/lib/utils";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

export default function BuyAirtime() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);


  const [selectedProvider, setSelectedProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ? formatNigerianPhone(user.phone) : "+234");
  const [amount, setAmount] = useState("");

  const parsedAmount = Number(amount.replace(/,/g, ""));
  const isFormValid =
    !!selectedProvider &&
    !!phoneNumber &&
    phoneNumber.trim() !== "+234" &&
    !isNaN(parsedAmount) &&
    parsedAmount >= 100;

  const [contactsSheetVisible, setContactsSheetVisible] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);

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

  const handlePhoneBlur = () => {
    if (phoneNumber && phoneNumber !== "+234") {
      setPhoneNumber(formatNigerianPhone(phoneNumber));
    }
  };

  const handleContinue = () => {
    if (!isFormValid) return;
    router.push({
      pathname: "/(root)/airtime/confirm",
      params: {
        provider: selectedProvider,
        phone: formatNigerianPhone(phoneNumber),
        amount,
      },
    });
  };
return (
  <SafeAreaView className="flex-1 bg-primary-100">
    <Header title="Buy airtime" showClose showBack={false} />

    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 p-4">
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
            onChangeText={setPhoneNumber}
            onBlur={handlePhoneBlur}
            keyboardType="phone-pad"
            placeholder="+234 801 234 5678"
            rightIcon={
              <Ionicons name="person-circle" size={24} color="white" />
            }
            onRightIconPress={openContacts}
          />

          <AmountInput value={amount} onChange={setAmount} placeholder="0" />

          <Text className="text-white/60 text-sm italic pl-1 mt-2 mb-6">
            ❔ Enter an amount above ₦100
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>

    <BottomSheet
      visible={contactsSheetVisible}
      onClose={() => setContactsSheetVisible(false)}
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
