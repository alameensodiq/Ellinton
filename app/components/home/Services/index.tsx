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
    if (item.id === "1") { router.push("/(root)/airtime"); return true; }
    if (item.id === "2") { router.push("/(root)/utility"); return true; }
    if (item.id === "3") { router.push("/(root)/data"); return true; }
    if (item.id === "4") { router.push("/(root)/betting"); return true; }
    if (item.id === "5") { router.push("/(root)/cable-and-payment"); return true; }
    if (item.id === "6") { router.push("/(root)/travel-&-hotel-payment"); return true; }
    if (item.id === "7") { router.push("/(root)/internet"); return true; }
    // if (item.id === "8") { router.push("/(root)/other-bills"); return true; }
    if (item.id === "9") { router.push("/(root)/loans"); return true; }

    // Savings/Wealth Management routes
    if (item.id === "12") { router.push({ pathname: "/(root)/savings", params: { type: "basic" } }); return true; }
    if (item.id === "13") { router.push({ pathname: "/(root)/savings", params: { type: "target" } }); return true; }
    if (item.id === "14") { router.push({ pathname: "/(root)/savings", params: { type: "group" } }); return true; }
    if (item.id === "15") { router.push({ pathname: "/(root)/savings", params: { type: "fixed" } }); return true; }

    if (item.id === "17") { router.push("/(root)/gold/dashboard"); return true; }

    // If it didn't hit any of the IDs above, it's a "Coming Soon" item
    return false;
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
        onItemPress={handleItemPress}
      />
    </View>
  );
}
