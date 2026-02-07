import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "react-native";
import { CardData } from "./cardsData";
import { useRouter } from "expo-router";

interface CardProps {
  card: CardData;
  showBalance: boolean;
  onToggleBalance: (cardId: number) => void;
  onCopyCard: (cardNumber: string) => void;
  onOpenAccounts?: () => void;
  onOpenPlanSheet?: () => void;
}

export default function Card({
  card,
  showBalance,
  onToggleBalance,
  onCopyCard,
  onOpenAccounts,
  onOpenPlanSheet

}: CardProps) {
  const maskedBalance = "••••••";
  const router = useRouter();
  return (
    <View style={{ width: "100%" }} className="px-1">
      <View className="rounded-3xl overflow-hidden">
        <LinearGradient
          colors={card.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`"h-72 ${
            Platform.OS == "ios" ? "px-8" : "py-0"
          } px-2  justify-between"`}
        >
          <View className="flex-row justify-between items-start mb-6 p-4">
            <View className="flex-col">
              <Text className="text-white text-sm font-medium opacity-90 mb-2">
                {card.title}
              </Text>

              <TouchableOpacity
                onPress={() => onToggleBalance(card.id)}
                className="flex-row items-center gap-2"
              >
                <Text className="text-white text-xl font-bold">
                  {showBalance ? card.balance : maskedBalance}
                </Text>
                <Ionicons
                  name={showBalance ? "eye" : "eye-off"}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {card.displayCardNumber && card.cardNumber && (
              <View className="flex-row items-center bg-white/12 border border-white/10 rounded-xl px-3 py-2 gap-2">
                <MaterialIcons name="payment" size={16} color="white" />
                <Text className="text-white text-xs font-semibold tracking-wide">
                  {card.displayCardNumber}
                </Text>
                <TouchableOpacity
                  onPress={() => onCopyCard(card.cardNumber!)}
                  className="p-2"
                >
                  <MaterialIcons name="content-copy" size={14} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {card.actions && card.actions.length > 0 && (
            <View className="flex-row gap-4 p-4 mt-10">
              {card.actions.map((action, index) => (
                <View
                  key={index}
                  className="flex flex-col items-center justify-center gap-2"
                >
                  <TouchableOpacity
                    className="flex-col items-center gap-2 px-6 py-6 bg-primary-500 border border-white/10 rounded-xl"
                    onPress={() => {
                      if (action.label === "Accounts") {
                        onOpenAccounts?.();
                      } else if (action.label === "Transfer") {
                        router.push("/transfer");
                      } else if (action.label === "Create Plan") {
                        onOpenPlanSheet?.();
                        return 
                      } else {
                        action.onPress?.();
                      }
                    }}
                  >
                    {action.iconLibrary === "Ionicons" ? (
                      <Ionicons
                        name={action.icon as any}
                        size={24}
                        color="white"
                      />
                    ) : (
                      <MaterialIcons
                        name={action.icon as any}
                        size={24}
                        color="white"
                      />
                    )}
                  </TouchableOpacity>
                  <Text className="text-white text-xs font-semibold">
                    {action.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Image
            source={card.image}
            className={`absolute right-0 ${
              card.imagePosition === "top-right" ? "top-0" : "bottom-0"
            }`}
            resizeMode="cover"
          />
        </LinearGradient>
      </View>
    </View>
  );
}
