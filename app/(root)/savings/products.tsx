import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchSavingsProducts } from "@/app/lib/thunks/savingsThunks";
import Loading from "@/app/components/Loading";

type PlanType = "basic" | "target" | "group" | "fixed";

interface Product {
  tenure: number;
  code: string;
  rate: number;
  name: string;
}

export default function ProductsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ type?: string }>();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, isLoading } = useAppSelector((state) => state.savings);

  const planType: PlanType = React.useMemo(() => {
    const t = (params.type || "").toLowerCase();
    if (t === "target" || t === "group" || t === "fixed" || t === "basic")
      return t as PlanType;
    return "basic";
  }, [params.type]);

  // Fetch savings products on mount
  useEffect(() => {
    const typeMap: Record<PlanType, string> = {
      basic: "basic",
      target: "fixed",
      group: "fixed",
      fixed: "fixed",
    };
    dispatch(fetchSavingsProducts({ type: typeMap[planType] }));
  }, [dispatch, planType]);

  const getPlanTitle = (type: PlanType): string => {
    const titles: Record<PlanType, string> = {
      basic: "Basic savings",
      target: "Target savings",
      group: "Group savings",
      fixed: "Fixed deposit",
    };
    return titles[type];
  };

  const handleContinue = () => {
    if (!selectedProduct) return;

    router.push({
      pathname: "/(root)/savings/plan-name",
      params: {
        type: planType,
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        productRate: selectedProduct.rate,
        productTenure: selectedProduct.tenure,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 p-4">
      <ProgressBar currentStep={1} totalSteps={4} />

      <CustomText size="lg" weight="bold" className="mt-4">
        Select a {getPlanTitle(planType).toLowerCase()}
      </CustomText>

      <CustomText size="sm" secondary className="mt-2 mb-4">
        Choose from available savings products
      </CustomText>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Loading visible={true} />
        </View>
      ) : products.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {products.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => setSelectedProduct(item)}
              className={`p-4 rounded-2xl mb-3 border-2 transition ${
                selectedProduct?.code === item.code
                  ? "bg-primary-300 border-primary-200"
                  : "bg-primary-400 border-primary-300"
              }`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <CustomText size="lg" weight="bold">
                    {item.name}
                  </CustomText>
                  <View className="mt-3 gap-2">
                    <View className="flex-row justify-between">
                      <CustomText size="sm" secondary>
                        Tenure:
                      </CustomText>
                      <CustomText size="sm" weight="bold">
                        {item.tenure} days
                      </CustomText>
                    </View>
                    <View className="flex-row justify-between">
                      <CustomText size="sm" secondary>
                        Rate:
                      </CustomText>
                      <CustomText size="sm" weight="bold">
                        {item.rate}% p.a.
                      </CustomText>
                    </View>
                  </View>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center flex-shrink-0 ${
                    selectedProduct?.code === item.code
                      ? "bg-primary-200 border-primary-200"
                      : "border-primary-200"
                  }`}
                >
                  {selectedProduct?.code === item.code && (
                    <View className="w-3 h-3 bg-primary-100 rounded-full" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <CustomText size="sm" secondary className="text-center mt-8">
          No products available
        </CustomText>
      )}

      <View className="absolute bottom-10 left-0 right-0 bg-primary-100 p-4 border-t border-primary-400">
        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={!selectedProduct || isLoading}
        />
      </View>
    </SafeAreaView>
  );
}
