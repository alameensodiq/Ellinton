import React, { useState } from "react";
import { View, Pressable, Image, Text } from "react-native";
import { ServiceItem } from "./types";
import CustomText from "../../CustomText";

interface Props {
  items: ServiceItem[];
  onItemPress?: (item: ServiceItem) => boolean;
}

const BillPaymentSection: React.FC<Props> = ({ items, onItemPress }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

const handlePress = (item: ServiceItem) => {
    // 1. If a navigation handler exists, check if it handles this item
    if (onItemPress) {
      const hasRoute = onItemPress(item);

      // 2. ONLY show "Coming soon" if it explicitly returns false
      if (!hasRoute) {
        triggerComingSoon(item.id);
      }
    } else {
      // 3. Fallback if no handler is provided at all
      triggerComingSoon(item.id);
    }
  };

  // Helper function to handle the "Coming soon" timeout logic cleanly
  const triggerComingSoon = (itemId: string) => {
    setActiveId(itemId);
    setTimeout(() => {
      setActiveId((prev) => (prev === itemId ? null : prev));
    }, 2000); // Kept it at a clean 2 seconds
  };

  return (
    <View className="mb-6 px-4">
      <View className="flex-row justify-between items-center mb-4 px-2">
        <CustomText size="lg" weight="bold">
          Bill Payment
        </CustomText>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {items.map((item) => (
          <View
            key={item.id}
            className="relative items-center mb-6"
            style={{ width: "22.6%", aspectRatio: 1 }}
          >
            <Pressable
              key={item.id}
              // onPress={() => onItemPress?.(item)}
              onPress={() => handlePress(item)}
              className="items-center mb-1"
              // style={{ width: "22.6%" }}
            >
              <View
                className="bg-primary-300 rounded-2xl items-center justify-center"
                style={{ width: 70, height: 70 }}
              >
                <Image
                  source={item.icon}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </View>
              <CustomText
                size="sm"
                weight="medium"
                className="text-center mt-1"
                numberOfLines={2}
              >
                {item.label}
              </CustomText>
            </Pressable>
            {activeId === item.id && (
              <View className="absolute -right-1 top-1 bg-primary-200 px-2 py-1 rounded-full">
                <Text className="text-white text-xs">Coming soon</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default BillPaymentSection;
