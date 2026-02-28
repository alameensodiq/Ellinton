import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchSavingsProducts } from "@/app/lib/thunks/savingsThunks";

type PlanType = "basic" | "target" | "group" | "fixed";

interface Product {
  tenure: number; // days
  code: string;
  rate: number;
  name: string;
  description?: string; // if your API has it
}

const addDays = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const formatPrettyDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const tenureToLabel = (days: number) => {
  if (!days) return `${days} days`;
  if (days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? "s" : ""}`;
  if (days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? "s" : ""}`;
  if (days % 7 === 0) return `${days / 7} week${days / 7 > 1 ? "s" : ""}`;
  return `${days} days`;
};

// optional: a nice subtitle like your screenshot (fallbacks if API doesn't provide one)
const buildSubtitle = (p: Product) => {
  if (p.description) return p.description;

  const m = tenureToLabel(p.tenure);
  // simple default that feels like your screenshot
  return `${p.rate}% interest rate for ${m.toLowerCase()} savings`;
};

export default function ProductsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ type?: string }>();
  console.log(params);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, isLoading } = useAppSelector((state) => state.savings);

  

  useEffect(() => {
    
    dispatch(fetchSavingsProducts({ type: params.type }));
  }, [dispatch]);

  const handleContinue = () => {
    if (!selectedProduct) return;

    router.push({
      pathname: "/(root)/savings/plan-name",
      params: {
        type: params.type,
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        productRate: String(selectedProduct.rate),
        productTenure: String(selectedProduct.tenure),
      },
    });
  };

  const BOTTOM_BAR = 110;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="px-4 pt-4">
        <ProgressBar currentStep={1} totalSteps={4} />

        <CustomText size="lg" weight="bold" className="mt-2">
          How long do you want to save?
        </CustomText>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Loading visible />
        </View>
      ) : products.length > 0 ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: BOTTOM_BAR }}
        >
          {products.map((item: Product) => {
            const active = selectedProduct?.code === item.code;

            const monthsLabel = tenureToLabel(item.tenure);
            const maturity = formatPrettyDate(
              addDays(new Date(), Number(item.tenure || 0))
            );
            const subtitle = buildSubtitle(item);

            return (
              <Pressable
                key={item.code}
                onPress={() => setSelectedProduct(item)}
                className={`rounded-3xl mb-4 px-5 py-5 border ${
                  active
                    ? "bg-primary-400 border-primary-200"
                    : "bg-primary-400 border-white/10"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <CustomText size="lg" weight="bold">
                      {monthsLabel}
                    </CustomText>

                    <CustomText size="sm" secondary className="mt-2 leading-5">
                      {subtitle}
                    </CustomText>

                    <View className="mt-5 flex-row justify-between">
                      <View>
                        <CustomText size="xs" secondary>
                          Maturity date
                        </CustomText>
                        <CustomText size="sm" weight="bold" className="mt-1">
                          {maturity}
                        </CustomText>
                      </View>

                      <View className="items-end">
                        <CustomText size="xs" secondary>
                          Rate
                        </CustomText>
                        <CustomText size="sm" weight="bold" className="mt-1">
                          {item.rate}%
                        </CustomText>
                      </View>
                    </View>
                  </View>

                  {/* radio */}
                  <View
                    className={`w-7 h-7 rounded-full border items-center justify-center mt-1 ${
                      active ? "border-primary-200" : "border-white/20"
                    }`}
                  >
                    {active && (
                      <View className="w-3.5 h-3.5 rounded-full bg-primary-200" />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <CustomText size="sm" secondary className="text-center">
            No products available
          </CustomText>
        </View>
      )}

      <View className="absolute left-0 right-0 bottom-5 px-4 pb-8 pt-3 bg-primary-100">
        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={!selectedProduct || isLoading}
          className="rounded-full"
        />
      </View>
    </SafeAreaView>
  );
}
