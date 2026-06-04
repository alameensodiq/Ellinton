import React, { useState } from "react";
import { View, Pressable, Image, Text } from "react-native";
import { ServiceItem } from "./types";
import CustomText from "../../CustomText";

interface Props {
  items: ServiceItem[];
  onItemPress?: (item: ServiceItem) => boolean;
}

const OtherServicesSection: React.FC<Props> = ({ items, onItemPress }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  //   const handlePress = (item: ServiceItem) => {
  //     setActiveId(item.id);
  // console.log("Pressed:", item.id, item.label); // 👈 DEBUG

  //     // trigger navigation
  //     onItemPress?.(item);

  //     setTimeout(() => {
  //       setActiveId((prev) => (prev === item.id ? null : prev));
  //     }, 1000);
  //   };

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
      <CustomText size="lg" weight="bold" className="mb-4">
        Other Services
      </CustomText>

      <View className="flex-row flex-wrap gap-4">
        {items.map((item) => (
          <View
            key={item.id}
            className="relative"
            style={{ width: "30%", aspectRatio: 1 }}
          >
            <Pressable
              onPress={() => handlePress(item)}
              className="bg-primary-300 rounded-2xl p-4 items-center justify-center h-full"
            >
              <Image
                source={item.icon}
                style={{ width: 20, height: 44, marginBottom: 8 }}
                resizeMode="contain"
              />

              <CustomText
                size="sm"
                weight="medium"
                className="text-center"
                numberOfLines={2}
              >
                {item.label}
              </CustomText>
            </Pressable>

            {activeId === item.id && (
              <View className="absolute -right-2 top-2 bg-primary-200 px-2 py-1 rounded-full">
                <Text className="text-white text-xs">Coming soon</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default OtherServicesSection;
