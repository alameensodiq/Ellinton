import Button from "@/app/components/Button";
import Header from "@/app/components/header-back";
import AmountInput from "@/app/components/inputs/AmountInput";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import TextInputField from "@/app/components/inputs/TextInputField";
import {
  eventServiceTypes,
  eventServiceItems,
  eventProductOptions,
} from "@/app/lib/utils";
import { useRouter } from "expo-router";

import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GeneralBillPayment() {
  const [selectedServiceType, setSelectedServiceType] =
    useState("event_tickets");
  const [selectedService, setSelectedService] = useState("africkets");
  const [selectedProduct, setSelectedProduct] = useState("africkets_orders");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("5500");
  const router = useRouter();

  const handleContinue = () => {
    router.push({
      pathname: "/(root)/other-bills/confirm",
      params: {
        serviceType: selectedServiceType,
        service: selectedService,
        product: selectedProduct,
        email,
        amount,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="General bill payments" showClose showBack={false} />

      <View className="flex-1 p-4">
        <Dropdown
          label="Select service type"
          placeholder="Select a service type"
          options={eventServiceTypes}
          selectedValue={selectedServiceType}
          onSelect={setSelectedServiceType}
        />

        <Dropdown
          label="Select service item"
          placeholder="Select a service"
          options={eventServiceItems}
          selectedValue={selectedService}
          onSelect={setSelectedService}
          searchable
          searchPlaceholder="Search services..."
        />

        <Dropdown
          label="Select product"
          placeholder="Select product type"
          options={eventProductOptions}
          selectedValue={selectedProduct}
          onSelect={setSelectedProduct}
        />

        <TextInputField
          label="Enter email address (registered with Africkets)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Enter email address (registered with Africkets)"
        />

        <AmountInput value={amount} onChange={setAmount} placeholder="0" />

        <Text className="text-white/60 text-sm italic pl-1 mt-2 mb-6">
          ❔ Enter an amount above ₦100
        </Text>

        <View className="mt-auto pb-4">
          <Button title="Continue" variant="primary" onPress={handleContinue} />
        </View>
      </View>
    </SafeAreaView>
  );
}
