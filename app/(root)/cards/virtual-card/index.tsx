import React, { useState } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import AmountInput from "@/app/components/inputs/AmountInput";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import SelectableButton from "@/app/components/SelectableButton";
import { svgIcons } from "@/app/assets/icons/icons";
import { useRouter } from "expo-router";

export const currencies = [
  { value: "NGN", label: "NGN", flag: "🇳🇬" },
  { value: "USD", label: "USD", flag: "🇺🇸" },
  { value: "GBP", label: "GBP", flag: "🇬🇧" },
];

export const brands = [
  {
    value: "mastercard",
    label: "Mastercard",
    icon: svgIcons.master_card,
    selected: true,
  },
  {
    value: "visa",
    label: "Visa",
    icon: svgIcons.visa,
    selected: false,
  },
  // {
  //   value: "verve",
  //   label: "Verve",
  //   icon: svgIcons.verve,
  //   selected: false,
  // },
];

export default function VirtualCardCreateStep1() {
  // 🔒 USD locked as default
  const [selectedCurrency] = useState<"USD">("USD");

  const [selectedBrand, setSelectedBrand] = useState("mastercard");
  const [amount, setAmount] = useState("5");
  const router = useRouter();

  const handleContinue = () => {
    const selectedBrandObj = brands.find((b) => b.value === selectedBrand);

    router.push({
      pathname: "/(root)/cards/virtual-card/step2",
      params: {
        currency: selectedCurrency,
        amount,
        icon: selectedBrandObj?.value || "mastercard",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.select({ ios: "padding", android: "padding" })}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ProgressBar currentStep={1} totalSteps={2} />

            <CustomText size="xl" className="mb-10">
              Choose card type
            </CustomText>

            {/* Currency Selector */}
            <View className="mb-6">
              <CustomText size="lg">Select currency</CustomText>
              <View className="flex-row justify-between">
                {currencies.map((currency) => {
                  const isUSD = currency.value === "USD";

                  return (
                    <SelectableButton
                      key={currency.value}
                      item={{ ...currency, icon: currency.flag }}
                      selected={isUSD}
                      onPress={() => {}}
                      disabled={!isUSD}
                    />
                  );
                })}
              </View>

              <CustomText secondary size="sm" className="mt-2">
                💡 More currencies coming soon
              </CustomText>
            </View>

            {/* Brand Selector */}
            <View className="mb-6">
              <CustomText size="lg">Select brand</CustomText>
              <View className="flex-row flex-wrap gap-4">
                {brands.map((brand) => {
                  const BrandIcon = brand.icon;
                  return (
                    <SelectableButton
                      key={brand.value}
                      item={{
                        value: brand.value,
                        label: brand.label,
                        icon: <BrandIcon width={24} height={24} />,
                      }}
                      selected={selectedBrand === brand.value}
                      onPress={setSelectedBrand}
                    />
                  );
                })}
              </View>
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <CustomText size="lg" className="mb-3">
                Enter amount
              </CustomText>
              <AmountInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                sign="$"
              />
              <CustomText secondary size="sm" className="mt-3">
                ❔ Enter an amount above $5
              </CustomText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Footer Button */}
      <View className="p-4 bg-primary-100">
        <Button title="Continue" variant="primary" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}
