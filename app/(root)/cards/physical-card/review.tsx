import React, { useEffect, useState } from "react";
import { View, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import images from "@/app/assets/images";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { fetchDeliveryQuote } from "@/app/lib/thunks/cardsThunks";


export default function Review() {
  const params = useLocalSearchParams();
  const {
    firstName,
    lastName,
    brand,
    country,
    state,
    city,
    address1,
    selectedColor,
  } = params;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const toString = (val: string | string[]) =>
    Array.isArray(val) ? val[0] || "" : val || "";

  const firstNameStr = toString(firstName);
  const lastNameStr = toString(lastName);
  const brandStr = toString(brand);
  const countryStr = toString(country);
  const stateStr = toString(state);
  const cityStr = toString(city);
  const address1Str = toString(address1);
  const selectedColorStr = toString(selectedColor);
  const deliveryAddress = [address1Str, cityStr, stateStr, "Nigeria"]
    .filter(Boolean)
    .join(", ");

  const [showModal, setShowModal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isFetchingDeliveryFee, setIsFetchingDeliveryFee] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getDeliveryQuote = async () => {
      if (!deliveryAddress) {
        if (isMounted) setIsFetchingDeliveryFee(false);
        return;
      }

      try {
        const quote = await dispatch(fetchDeliveryQuote(deliveryAddress)).unwrap();
        if (isMounted) setDeliveryFee(quote.deliveryFee);
      } catch (error) {
        console.log("Failed to fetch delivery quote:", error);
      } finally {
        if (isMounted) setIsFetchingDeliveryFee(false);
      }
    };

    getDeliveryQuote();

    return () => {
      isMounted = false;
    };
  }, [deliveryAddress, dispatch]);

  const PhysicalCard1 = images.physical_card_1;
  const PhysicalCard2 = images.physical_card_2;
  const PhysicalCard3 = images.physical_card_3;

  const cardImageMap: Record<string, any> = {
    gold: PhysicalCard1,
    white: PhysicalCard2,
    black: PhysicalCard3,
  };

  const cardImage = cardImageMap[selectedColorStr || "gold"];

  const handleConfirm = () => {
    setShowModal(false);
    router.push({
      pathname: "/(root)/cards/physical-card/authorize",
      params: { selectedColor: selectedColorStr, ...params },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4"
          showsVerticalScrollIndicator={false}
        >
          <ProgressBar currentStep={2} totalSteps={2} />
          <CustomText size="xl" className="mb-10">
            Design
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
          <CustomText size="lg" className="mb-4">
            Delivery details
          </CustomText>
          <View className="bg-primary-400 p-6 rounded-xl mb-4">
            <View className="flex-row justify-between border-b border-primary-300 pb-4 mb-4">
              <CustomText size="sm">Delivery to</CustomText>
              <CustomText size="sm">
                {firstNameStr} {lastNameStr}
              </CustomText>
            </View>
            <View className="flex-row justify-between border-b border-primary-300 pb-4 mb-4">
              <CustomText size="sm">Card Brand</CustomText>
              <CustomText size="sm">{brandStr?.toUpperCase()}</CustomText>
            </View>
            <View className="flex-row justify-between gap-2 ">
              <CustomText size="sm">Delivery Address</CustomText>
              <CustomText size="sm" className="max-w-44">{`${address1Str}, ${cityStr}, ${stateStr}`}</CustomText>
            </View>
          </View>
          <CustomText size="lg" className="mt-4 mb-4">
            One Time Fee
          </CustomText>
          <View className="bg-primary-400 p-6 rounded-xl mb-10">
            <View className="flex-row justify-between border-b border-primary-300 pb-4 mb-4">
              <CustomText className="w-32" size="sm">
                Card Processing Fee
              </CustomText>
              <CustomText>₦2,000</CustomText>
            </View>
            <View className="flex-row justify-between">
              <CustomText className="w-32" size="sm">
                Delivery Fee
              </CustomText>
              <CustomText>
                {isFetchingDeliveryFee
                  ? "Calculating..."
                  : deliveryFee !== null
                  ? `₦${deliveryFee.toLocaleString()}`
                  : "Unavailable"}
              </CustomText>
            </View>
          </View>
          <Button
            title="Pay"
            variant="primary"
            onPress={() => setShowModal(true)}
          />
        </ScrollView>
      </View>

      <ConfirmationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirmation"
        message="You are about to request for a physical card"
      />
    </SafeAreaView>
  );
}
