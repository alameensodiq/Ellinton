import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { ServiceItem } from "./types";
import { SERVICE_ICONS } from "./service-icons";

import BillPaymentSection from "./BillPaymentSection";
import OtherServicesSection from "./OtherServicesSection";
import WealthManagementSection from "./WealthManagementSection";
import { billPaymentServices, otherServices, wealthManagement } from "@/app/lib/utils";

export default function ServicesSection() {
  const router = useRouter();

  const handleItemPress = (item: ServiceItem) => {
    
    if (item.id === "1") router.push("/(root)/airtime");
    if (item.id === "2") router.push("/(root)/utility");
    if (item.id === "3") router.push("/(root)/data");
    if (item.id === "4") router.push("/(root)/betting");
    if (item.id === "5") router.push("/(root)/cable-and-payment");
    if (item.id === "6") router.push("/(root)/travel-&-hotel-payment");
    if (item.id === "7") router.push("/(root)/internet");
    // if (item.id === "8") router.push("/(root)/other-bills");
    // if (item.id === "9") router.push("/(root)/loans");
  };



  return (
    <View className="w-full mt-6">
      <BillPaymentSection
        items={billPaymentServices}
        onItemPress={handleItemPress}
      />
      <OtherServicesSection
        items={otherServices}
        onItemPress={handleItemPress}
      />
      <WealthManagementSection
        items={wealthManagement}
        // onItemPress={handleItemPress}
      />
    </View>
  );
}
