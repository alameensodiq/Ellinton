import React from "react";
import { View, Pressable } from "react-native";
import CustomText from "../CustomText";
import { ServiceItem } from "../home/Services/types";
import { svgIcons } from "@/app/assets/icons/icons";

interface Props {
  onItemPress?: (item: ServiceItem) => void;
  physical?: boolean;
}

const items: ServiceItem[] = [
  { id: "fund", label: "Fund card" },
  { id: "withdrawal", label: "Withdrawal" },
  // { id: "block", label: "Block" },
  // { id: "pin", label: "Change PIN" },
  { id: "more", label: "More info" },
];

const iconMap = {
  fund: svgIcons.plus,
  withdrawal: svgIcons.withdrawal,
  block: svgIcons.ban,
  pin: svgIcons.passsword,
  more: svgIcons.menu_dot,
};

const CardActions: React.FC<Props> = ({ onItemPress, physical = false }) => {
  let filteredItems: ServiceItem[];

  if (physical) {
    // Physical card → ONLY Block + Change PIN
    filteredItems = items.filter((item) => ["block", "pin"].includes(item.id));
  } else {
    // Virtual card → show everything EXCEPT PIN
    filteredItems = items.filter((item) => item.id !== "pin");
  }

  return (
    <View className="mb-6">
      <View
        className="rounded-2xl flex-row gap-4 items-center"
        style={{ height: 70 }}
      >
        {filteredItems.map((item) => {
          const IconComponent = iconMap[item.id as keyof typeof iconMap];
          return (
            <Pressable
              key={item.id}
              onPress={() => onItemPress?.(item)}
              className="items-center flex-1 justify-center bg-primary-400 p-6 rounded-2xl"
            >
              {IconComponent ? (
                <IconComponent width={24} height={24} fill="#FFFFFF" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row justify-around mt-2">
        {filteredItems.map((item) => (
          <CustomText
            key={item.id}
            size="sm"
            weight="medium"
            className="text-center flex-1 px-1"
            numberOfLines={2}
          >
            {item.label}
          </CustomText>
        ))}
      </View>
    </View>
  );
};

export default CardActions;
