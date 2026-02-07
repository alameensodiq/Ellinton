import React, { useMemo, useState } from "react";
import { View } from "react-native";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { svgIcons } from "@/app/assets/icons/icons";
import TextInputField from "@/app/components/inputs/TextInputField";
import { useLocalSearchParams, useRouter } from "expo-router";

type PlanType = "basic" | "target" | "group" | "fixed";

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();

  const [planName, setPlanName] = useState("");
  const [planNameError, setPlanNameError] = useState("");

  const planType = useMemo<PlanType>(() => {
    const t = (params.type || "").toLowerCase();
    if (t === "target" || t === "group" || t === "fixed" || t === "basic")
      return t;
    return "basic";
  }, [params.type]);

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
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 p-4">
      <ProgressBar currentStep={1} totalSteps={4} />

      <CustomText size="lg" weight="bold">
        Name your plan
      </CustomText>

      <CustomText size="sm" secondary className="mt-1">
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

      <CustomText size="sm" secondary>
        A descriptive name makes savings interesting
      </CustomText>

      <View className="flex-1" />

      <CustomText size="sm" weight="bold" className="mb-2">
        {planMeta.title}
      </CustomText>

      <CustomText size="sm" secondary className="mb-4">
        {planMeta.desc}
      </CustomText>

      <View className="mb-4 bg-primary-400 rounded-2xl p-4">
        {planMeta.bullets.map((b: any, idx: number) => {
          const Icon = b.icon;
          const showBorder = idx !== planMeta.bullets.length - 1;

          return (
            <View
              key={idx}
              className={`flex-row gap-4 items-center py-4 ${
                showBorder ? "border-b border-primary-300" : ""
              }`}
            >
              <Icon width={24} height={24} />
              <CustomText size="sm">{b.text}</CustomText>
            </View>
          );
        })}
      </View>

      <Button title="Continue" variant="primary" onPress={handleContinue} />
    </SafeAreaView>
  );
}
