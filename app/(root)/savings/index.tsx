import React, { useMemo, useState, useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { svgIcons } from "@/app/assets/icons/icons";
import TextInputField from "@/app/components/inputs/TextInputField";
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

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ type?: string }>();

  const [planName, setPlanName] = useState("");
  const [planNameError, setPlanNameError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [step, setStep] = useState<"products" | "name">("products");

  const { products, isLoading } = useAppSelector((state) => state.savings);

  const planType = useMemo<PlanType>(() => {
    const t = (params.type || "").toLowerCase();
    if (t === "target" || t === "group" || t === "fixed" || t === "basic")
      return t;
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

  const planMeta = useMemo(() => {
    const meta: Record<PlanType, any> = {
      basic: {
        title: "Basic savings",
        desc: "Your regular savings with no interest, you can withdraw anytime with no charges",
        bullets: [
          { icon: svgIcons.fixed_savings, text: "Save anytime you want" },
          {
            icon: svgIcons.basic_savings,
            text: "Withdraw anytime with no charges",
          },
          { icon: svgIcons.fixed_savings, text: "Simple and flexible" },
        ],
        nextRoute: "/(root)/savings/target", 
      },
      target: {
        title: "Target savings",
        desc: "Save money for important goals. Minimum period of 3 months with amazing returns",
        bullets: [
          { icon: svgIcons.target_savings, text: "Minimum of 3 months" },
          {
            icon: svgIcons.basic_savings,
            text: "Save for long-term goals (allowances, family, business, vacation)",
          },
          { icon: svgIcons.fixed_savings, text: "Earn amazing returns" },
        ],
        nextRoute: "/(root)/savings/target",
      },
      group: {
        title: "Group savings",
        desc: "Save with friends or family towards a shared goal with clear tracking",
        bullets: [
          { icon: svgIcons.group_savings, text: "Save as a group" },
          {
            icon: svgIcons.basic_savings,
            text: "Track everyone’s contributions",
          },
          {
            icon: svgIcons.fixed_savings,
            text: "Build towards one goal together",
          },
        ],
        nextRoute: "/(root)/savings/target",
      },
      fixed: {
        title: "Fixed deposit",
        desc: "Lock your money for higher returns until your chosen end date",
        bullets: [
          { icon: svgIcons.fixed_savings, text: "Lock funds for a period" },
          {
            icon: svgIcons.basic_savings,
            text: "No early withdrawal (usually)",
          },
          { icon: svgIcons.fixed_savings, text: "Higher returns" },
        ],
        nextRoute: "/(root)/savings/target",
      },
    };

    return meta[planType];
  }, [planType]);

  const handleContinue = () => {
    // Step 1: Select a product
    if (step === "products") {
      if (!selectedProduct) {
        return;
      }
      setStep("name");
      return;
    }

    // Step 2: Enter plan name and continue
    const name = planName.trim();

    if (!name) {
      setPlanNameError("Plan name is required");
      return;
    }

    setPlanNameError("");

    router.push({
      pathname: planMeta.nextRoute,
      params: {
        type: planType,
        planName: name,
        productCode: selectedProduct?.code,
        productRate: selectedProduct?.rate,
        productTenure: selectedProduct?.tenure,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 p-4">
      <ProgressBar 
        currentStep={step === "products" ? 1 : 2} 
        totalSteps={4} 
      />

      {step === "products" ? (
        // Step 1: Product Selection
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <CustomText size="lg" weight="bold">
            Select a savings plan
          </CustomText>

          <CustomText size="sm" secondary className="mt-1 mb-4">
            Choose from available savings products
          </CustomText>

          {isLoading ? (
            <Loading visible={true} />
          ) : products.length > 0 ? (
            <View>
              {products.map((item, index) => (
                <Pressable
                  key={item.code}
                  onPress={() => setSelectedProduct(item)}
                  className={`p-4 rounded-2xl mb-3 border-2 ${
                    selectedProduct?.code === item.code
                      ? "bg-primary-300 border-primary-200"
                      : "bg-primary-400 border-primary-300"
                  }`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <CustomText size="lg" weight="bold">
                        {item.name}
                      </CustomText>
                      <CustomText size="sm" secondary className="mt-1">
                        Tenure: {item.tenure} days
                      </CustomText>
                      <CustomText size="sm" secondary>
                        Rate: {item.rate}% p.a.
                      </CustomText>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-3 ${
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
            </View>
          ) : (
            <CustomText size="sm" secondary className="text-center mt-4">
              No products available
            </CustomText>
          )}

          <View className="gap-3 mt-6">
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              disabled={!selectedProduct || isLoading}
            />
          </View>
        </ScrollView>
      ) : (
        // Step 2: Plan Name Entry
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <CustomText size="lg" weight="bold">
            Name your plan
          </CustomText>

          <CustomText size="sm" secondary className="mt-1 mb-4">
            Give your savings plan a meaningful name
          </CustomText>

          <TextInputField
            label="Plan name"
            value={planName}
            onChangeText={(t) => {
              setPlanName(t);
              if (planNameError) setPlanNameError("");
            }}
            placeholder="Plan name"
            error={planNameError}
          />

          <CustomText size="sm" secondary className="mt-2 mb-4">
            A descriptive name makes savings interesting
          </CustomText>

          <View className="mt-4 bg-primary-400 rounded-2xl p-4">
            <CustomText size="sm" weight="bold" className="mb-3">
              {selectedProduct?.name}
            </CustomText>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <CustomText size="sm" secondary>
                  Tenure
                </CustomText>
                <CustomText size="sm" weight="bold">
                  {selectedProduct?.tenure} days
                </CustomText>
              </View>
              <View className="flex-row justify-between">
                <CustomText size="sm" secondary>
                  Interest Rate
                </CustomText>
                <CustomText size="sm" weight="bold">
                  {selectedProduct?.rate}%
                </CustomText>
              </View>
            </View>
          </View>

          <View className="gap-3 flex-row mt-8">
            <Button
              title="Back"
              variant="secondary"
              onPress={() => {
                setStep("products");
                setPlanName("");
                setPlanNameError("");
              }}
              className="flex-1"
            />
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              className="flex-1"
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
