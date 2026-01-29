import React, { useState } from "react";
import { View, Pressable, Image, Text } from "react-native";
import { ServiceItem } from "./types";
import CustomText from "../../CustomText";

interface Props {
  items: ServiceItem[];
  onItemPress?: (item: ServiceItem) => void;
}

const OtherServicesSection: React.FC<Props> = ({ items, onItemPress }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handlePress = (item: ServiceItem) => {
    setActiveId(item.id);
console.log("Pressed:", item.id, item.label); // 👈 DEBUG

    // trigger navigation
    onItemPress?.(item);

    setTimeout(() => {
      setActiveId((prev) => (prev === item.id ? null : prev));
    }, 1000);
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
