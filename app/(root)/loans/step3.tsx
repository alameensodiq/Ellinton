import { View, StatusBar, Pressable, Image } from "react-native";
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";

import mtnPng from "@/app/assets/icons/mtn.png";
import airtelPng from "@/app/assets/icons/airtel.png";
import gloPng from "@/app/assets/icons/airtel.png";
import nineMobilePng from "@/app/assets/icons/airtel.png";

type NetworkChoice = "mtn" | "airtel" | "glo" | "9mobile" | null;

const ChooseNetwork = () => {
  const [choice, setChoice] = useState<NetworkChoice>(null);

  const canContinue = useMemo(() => choice !== null, [choice]);

  const Card = ({
    value,
    title,
    icon,
  }: {
    value: Exclude<NetworkChoice, null>;
    title: string;
    icon: any;
  }) => {
    const isSelected = choice === value;

    return (
      <Pressable
        onPress={() => setChoice(value)}
        className={`mb-4 rounded-2xl p-4 bg-primary-400 border ${
          isSelected ? "border-primary-600" : "border-transparent"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {/* Left icon bubble */}
            <View className="bg-primary-300 w-12 h-12 rounded-full items-center justify-center mr-3">
              <Image
                source={icon}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </View>

            <View className="flex-1">
              <CustomText weight="bold" className="text-white">
                {title}
              </CustomText>
            </View>
          </View>

          {/* Right radio */}
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected ? "border-primary-600" : "border-white/30"
            }`}
          >
            {isSelected && (
              <View className="w-3.5 h-3.5 rounded-full bg-primary-600" />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Choose Your Network" />

      <View className="px-6 mb-6">
        <CustomText size="base">
          Select your network provider to proceed with the loan application for
          salah loan
        </CustomText>
      </View>

      <View className="px-6 flex-1">
        <Card value="mtn" title="MTN" icon={mtnPng} />
        <Card value="airtel" title="Airtel" icon={airtelPng} />
        <Card value="glo" title="Glo" icon={gloPng} />
        <Card value="9mobile" title="9mobile" icon={nineMobilePng} />
      </View>

      <View className="px-6 pb-6">
        <Button
          title="Continue"
          disabled={!canContinue}
          onPress={() => {
            console.log("Selected network:", choice);
            // navigate to next screen with `choice`
          }}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default ChooseNetwork;
