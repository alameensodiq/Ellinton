import React from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { svgIcons } from "@/app/assets/icons/icons";
import InfoRow from "./InfoRow";
import FreezeCardToggle from "./FreezeCardToggle";
import {
  freezeVirtualCard,
  unfreezeVirtualCard,
  VirtualCardListItem,
  VirtualCardDetails,
} from "@/app/lib/thunks/virtualCardsThunks";
import { RootState, AppDispatch } from "@/app/lib/store";
import CustomText from "@/app/components/CustomText";

const {
  zip_code: ZipCode,
  name: Name,
  billing_address: BillingAddress,
  card_number: CardNumber,
  expiry_date: ExpiryDate,
  security_code: SecurityCode,
} = svgIcons;

const MoreInfoContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // list (to find active id for freeze/unfreeze)
  const virtualCards: VirtualCardListItem[] = useSelector(
    (state: RootState) => state.virtualCards.cards || []
  );

  // details (already fetched AFTER authorize)
  const selectedCard: VirtualCardDetails | null = useSelector(
    (state: RootState) => state.virtualCards.selectedCard
  );

  const activeVirtualCard =
    virtualCards.find((c) => c.status === "Active") ?? null;

  // If no details, user has not authorized yet
  if (!selectedCard?.id) {
    return (
      <View className="bg-primary-100">
        <CustomText className="text-white opacity-80">
          Authorize to view card details.
        </CustomText>
      </View>
    );
  }

  const isFrozen = selectedCard?.status === "DISABLED";

  const handleFreezeChange = async (newValue: boolean) => {
    const cardId = activeVirtualCard?.id;
    if (!cardId) return;

    try {
      if (newValue) {
        await dispatch(freezeVirtualCard(cardId)).unwrap();
      } else {
        await dispatch(unfreezeVirtualCard(cardId)).unwrap();
      }

      // IMPORTANT:
      // Do NOT refetchVirtualCard here anymore (it needs transactionPin).
      // Just rely on the freeze/unfreeze response or let user re-authorize later if needed.
    } catch (error) {
      console.error("Error toggling card freeze:", error);
    }
  };

  const cardName = selectedCard?.name || "••••";
  const cardNumber = selectedCard?.card_number || "•••• •••• •••• ••••";
  const expiry = selectedCard?.expiry || "••/••";
  const cvv = selectedCard?.cvv || "•••";

  const billingAddress = selectedCard?.address
    ? `${selectedCard.address.street}, ${selectedCard.address.city}, ${selectedCard.address.state}, ${selectedCard.address.country}`
    : "••••";

  const zipCode = selectedCard?.address?.postal_code || "••••";

  return (
    <View className="space-y-4 bg-primary-100">
      <InfoRow
        label="Name on card"
        value={cardName}
        icon={<Name width={20} height={20} />}
      />

      <InfoRow
        label="Card number"
        value={cardNumber}
        icon={<CardNumber width={20} height={20} />}
      />

      <View className="flex-row gap-4">
        <View className="flex-1">
          <InfoRow
            label="Expiry date"
            value={expiry}
            icon={<ExpiryDate width={20} height={20} />}
          />
        </View>

        <View className="flex-1">
          <InfoRow
            label="Security code"
            value={cvv}
            icon={<SecurityCode width={20} height={20} />}
          />
        </View>
      </View>

      <InfoRow
        label="Billing address"
        value={billingAddress}
        icon={<BillingAddress width={20} height={20} />}
      />

      <InfoRow
        label="Zip code"
        value={zipCode}
        icon={<ZipCode width={20} height={20} />}
      />

      <FreezeCardToggle value={isFrozen} onChange={handleFreezeChange} />
    </View>
  );
};

export default MoreInfoContent;
