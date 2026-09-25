import React, { useState } from "react";
import { View, Platform, KeyboardAvoidingView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import SelectableButton from "@/app/components/SelectableButton";
import Button from "@/app/components/Button";
import { colorGradients, colorOptions } from "@/app/lib/utils";
import ColoredDot from "@/app/components/cards/ColoredDot";
import images from "@/app/assets/images";

export default function PhysicalCardCreateStep2() {
  const params = useLocalSearchParams();
  const {
    firstName,
    lastName,
    brand,
    country,
    state,
    city,
    address1,
  } = params;
  const router = useRouter();
console.log(brand)
  const [selectedColor, setSelectedColor] = useState("gold");

  const PhysicalCard1 = images.physical_card_1;
  const PhysicalCard2 = images.physical_card_2;
  const PhysicalCard3 = images.physical_card_3;

  const cardImageMap: Record<string, any> = {
    gold: PhysicalCard1,
    white: PhysicalCard2,
    black: PhysicalCard3,
  };

  const cardImage = cardImageMap[selectedColor];

  const handleRequestCard = () => {

    router.push({
      pathname: "/(root)/cards/physical-card/review",
      params: {
        firstName,
        lastName,
        brand,
        country,
        state,
        city,
        address1,
        selectedColor,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.select({ ios: "padding", android: "padding" })}
        >
          <View className="p-4 flex-1">
            <ProgressBar currentStep={2} totalSteps={2} />
            <CustomText size="xl" className="mb-10">
              Choose your design
            </CustomText>

            <View className="w-full items-center mb-8">
              <Image
                source={cardImage}
                style={{
                  width: "100%",
                  height: 220,
                  resizeMode: "contain",
                }}
              />
            </View>

            <View className="mb-6">
              <CustomText size="lg" className="mb-3">
                Choose color
              </CustomText>

              <View className="flex-row  gap-4 flex-wrap">
                {colorOptions.map((opt) => (
                  <SelectableButton
                    key={opt.value}
                    item={{
                      value: opt.value,
                      label: opt.label,
                      icon: (
                        <ColoredDot
                          gradient={opt.gradient}
                          selected={selectedColor === opt.value}
                        />
                      ),
                    }}
                    selected={selectedColor === opt.value}
                    onPress={setSelectedColor}
                  />
                ))}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <View className="p-4 bg-primary-100">
        <Button
          title="Request physical card"
          variant="primary"
          onPress={handleRequestCard}
        />
      </View>
    </SafeAreaView>
  );
}
