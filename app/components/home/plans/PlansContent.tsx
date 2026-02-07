import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import CustomText from "../../CustomText";
import { svgIcons } from "@/app/assets/icons/icons";

const plans = [
  {
    id: "basic",
    title: "Basic savings",
    desc: "Your regular savings with interest, you can withdraw anytime with no charges",
    icon: svgIcons.fixed_savings,
  },
  {
    id: "target",
    title: "Target savings",
    desc: "Save money for life's important goals. Minimum period of 3 months with amazing return",
    icon: svgIcons.target_savings,
  },
  {
    id: "group",
    title: "Group Saving",
    desc: "Save money for life's important goals. Minimum period of 3 months with amazing return",
    icon: svgIcons.group_savings,
  },
  {
    id: "fixed",
    title: "Fixed deposit",
    desc: "Lock your money for higher returns",
    icon: svgIcons.basic_savings,
  },
];

export default function PlansContent({ onSelect }: { onSelect: () => void }) {
  const router = useRouter();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-4 mt-2">
        <CustomText size="lg" weight="bold">
          Pick a plan
        </CustomText>

        <CustomText size="sm" style={{ marginBottom: 12 }}>
          You can create more than one plan
        </CustomText>

        {plans.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              onSelect();

              router.push({
                pathname: "/(root)/savings",
                params: { type: item.id },
              });
            }}
            className="bg-primary-300 p-4 rounded-2xl relative overflow-hidden"
          >
            <item.icon width={36} height={36} />

            <View className="mt-4">
              <CustomText size="lg" weight="bold">
                {item.title}
              </CustomText>
              <CustomText size="sm" secondary>
                {item.desc}
              </CustomText>
            </View>

            <View className="absolute -right-2 -top-6 opacity-10">
              <item.icon width={60} height={60} />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
