import React from "react";
import { View, ColorValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";

import CustomText from "@/app/components/CustomText";
import { getBrandLogo } from "@/app/lib/utils";
import { svgIcons } from "../assets/icons/icons";
import { RootState } from "@/app/lib/store";
import { VirtualCardDetails } from "@/app/lib/thunks/virtualCardsThunks";

interface VirtualCardPreviewProps {
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  icon?: string;
  textColor?: ColorValue;
  amount?: string;
  symbol?: string;
  activeTab?: string;
  showDetails?: boolean;
}

export default function VirtualCardPreview({
  gradientColors,
  icon,
  textColor,
  amount,
  symbol,
  activeTab,
  showDetails = false,
}: VirtualCardPreviewProps) {
  const selectedCard: VirtualCardDetails | null = useSelector(
    (state: RootState) => state.virtualCards.selectedCard
  );

  const CardLogo = svgIcons.card_logo;

  const finalGradientColors =
    gradientColors ||
    (activeTab === "virtual" ? ["#1A1A1A", "#88894B"] : ["#181818", "#434343"]);

  const finalIcon = icon || selectedCard?.issuer?.toLowerCase?.() || "visa";

  const finalTextColor = textColor || "white";

  const finalCurrency = selectedCard?.currency || "NGN";
  const finalSymbol = symbol || (finalCurrency === "USD" ? "$" : "₦");

  const finalAmount =
    amount ??
    (selectedCard?.balance != null ? String(selectedCard.balance) : "0");

  const finalCardNumber = showDetails
    ? selectedCard?.card_number || "•••• •••• •••• ••••"
    : "•••• •••• •••• ••••";

  const finalExpiry = showDetails ? selectedCard?.expiry || "••••" : "••••";
  const finalCvv = showDetails ? selectedCard?.cvv || "•••" : "•••";

  const isBlack = finalTextColor === "black";

  return (
    <View className="mb-6 rounded-3xl overflow-hidden">
      <LinearGradient
        colors={finalGradientColors}
        style={{ padding: 20 }}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1.3, y: 0.5 }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <CardLogo fill={finalTextColor} />

          <View>
            <CustomText
              size="xs"
              className={isBlack ? "text-black" : "text-white"}
            >
              Balance
            </CustomText>

            <CustomText
              size="xl"
              className={`font-medium ${isBlack ? "text-black" : "text-white"}`}
            >
              {finalSymbol}
              {finalAmount}
            </CustomText>
          </View>
        </View>

        <View className="mb-1">
          <CustomText
            size="xs"
            className={`opacity-70 mb-1 ${
              isBlack ? "text-black" : "text-white"
            }`}
          >
            Card Number
          </CustomText>

          <CustomText
            size="xl"
            className={`tracking-widest ${
              isBlack ? "text-black" : "text-white"
            }`}
            weight="bold"
          >
            {finalCardNumber}
          </CustomText>
        </View>

        <View className="flex-row justify-between items-end">
          <View className="flex-1">
            <CustomText
              size="xs"
              className={`opacity-70 mb-1 ${
                isBlack ? "text-black" : "text-white"
              }`}
            >
              Expiry
            </CustomText>

            <CustomText
              className={isBlack ? "text-black" : "text-white"}
              size="xl"
              weight="bold"
            >
              {finalExpiry}
            </CustomText>
          </View>

          <View className="flex-1 items-center">
            <CustomText
              size="xs"
              className={`opacity-70 mb-1 ${
                isBlack ? "text-black" : "text-white"
              }`}
            >
              CVV
            </CustomText>

            <CustomText
              className={isBlack ? "text-black" : "text-white"}
              size="xl"
              weight="bold"
            >
              {finalCvv}
            </CustomText>
          </View>

          <View className="flex-1 items-end">
            {getBrandLogo(finalIcon, 40, finalTextColor)}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
