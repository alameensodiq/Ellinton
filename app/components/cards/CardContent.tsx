import React from "react";
import { View, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import CardFeatures from "./CardFeatures";
import images from "@/app/assets/images";
import { useRouter } from "expo-router";

type CardType = "virtual" | "physical";

interface CardContentProps {
  buttonTitle: string;
  sectionTitle: string;
  cardType: CardType;
}


const featuresData = [
  {
    icon: "cash-outline",
    title: "ATM Access",
    desc: "Enables cash withdrawals from any ATM locally or internationally.",
  },
  {
    icon: "card-outline",
    title: "POS Payments",
    desc: "Allows you to pay at stores, restaurants, and petrol stations using card machines.",
  },
  {
    icon: "airplane-outline",
    title: "Travel Convenience",
    desc: "Essential for travel where physical card presentation is mandatory (e.g., hotels, rentals).",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Backup for Online Issues",
    desc: "Useful when digital wallets or virtual cards are not accepted.",
  },
];

const CardContent: React.FC<CardContentProps> = ({
  buttonTitle,
  sectionTitle,
  cardType,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (cardType === "virtual") router.push("/cards/virtual-card");
    else router.push("/cards/physical-card");
  };

  return (
    <View className="px-4 mt-6">
      <View className="h-80 relative mb-5 rounded-3xl overflow-hidden">
        <LinearGradient colors={["#3F401B", "#3F401B00"]} style={{ flex: 1 }}>
          <ImageBackground
            source={images.card_card_bg}
            resizeMode="cover"
            style={{ flex: 1 }}
          />
        </LinearGradient>

        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <Button
            title={buttonTitle}
            onPress={handlePress}
            variant="primary"
            className="w-full"
          />
        </View>
      </View>

      <View className="mt-6">
        <CustomText size="lg">{sectionTitle}</CustomText>
        <CardFeatures features={featuresData} />
      </View>
    </View>
  );
};


export default CardContent;
