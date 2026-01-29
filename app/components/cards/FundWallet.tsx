import React, { useEffect } from "react";
import { View, Pressable } from "react-native";
import CustomText from "../CustomText";
import AmountInput from "../inputs/AmountInput";
import { svgIcons } from "@/app/assets/icons/icons";
import { useSelector } from "react-redux";
import { RootState } from "@/app/lib/store";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useRouter } from "expo-router";

interface FundWalletContentProps {
  amount: string;
  setAmount: (value: string) => void;
  onSelectSource: (type: string) => void;
  selectedSource?: string | null;

  // ✅ add this so the content can close the modal
  onClose?: () => void;
}

const WithdrawalIcon = svgIcons.withdrawal;
const MasterCardIcon = svgIcons.master_card;
const VisaIcon = svgIcons.visa;
const PlusIcon = svgIcons.plus;

const FundWalletContent: React.FC<FundWalletContentProps> = ({
  amount,
  setAmount,
  onSelectSource,
  selectedSource,
  onClose,
}) => {
  const router = useRouter();

  const virtualCards = useSelector(
    (state: RootState) => state.virtualCards.cards || []
  );

  const user = useAppSelector((state) => state.auth.user);

  const accountInfo = useSelector(
    (state: RootState) => state.accounts.accountInfo
  );

  // Only show Active cards
  const activeVirtualCards = virtualCards.filter(
    (card) => card.status === "Active"
  );

  // ✅ Select first active card by default (only if none selected)
  useEffect(() => {
    if (!selectedSource && activeVirtualCards.length > 0) {
      onSelectSource(`virtual-${activeVirtualCards[0].id}`);
    }
  }, [selectedSource, activeVirtualCards, onSelectSource]);

  // Helper to select icon based on card type
  const getCardIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "MASTERCARD":
        return MasterCardIcon;
      case "VISA":
        return VisaIcon;
      default:
        return null;
    }
  };

  const handleNewCard = () => {
    // ✅ close the modal first (if provided)
    onClose?.();

    // ✅ then navigate
    router.push("/(root)/cards/virtual-card");
  };

  return (
    <View className="space-y-6 bg-primary-100">
      <View>
        <CustomText size="sm" weight="medium" className="mb-3">
          Enter amount
        </CustomText>

        <AmountInput value={amount} onChange={setAmount} placeholder="0" />

        <CustomText secondary size="sm" weight="medium" className="mt-3 mb-6">
          ❔ Enter an amount above ₦100
        </CustomText>

        <CustomText secondary size="sm" weight="medium">
          Choose source
        </CustomText>
      </View>

      {/* Wallet source (NOT selectable) */}
      <View className="rounded-xl p-4 flex-row items-center space-x-4 bg-primary-100 border border-[#88894B]">
        <View className="w-12 h-12 rounded-full bg-primary-200 items-center justify-center mr-4">
          <WithdrawalIcon width={28} height={28} />
        </View>

        <View className="flex-1">
          <CustomText weight="medium" secondary>
            {user?.first_name} {user?.last_name} • {user?.account_number}
          </CustomText>
          <CustomText size="lg" weight="bold">
            ₦{accountInfo?.accountBalance}
          </CustomText>
        </View>
      </View>

      {/* Active Virtual cards (ONLY these are selectable) */}
      {activeVirtualCards.map((card) => {
        const CardIcon = getCardIcon(card.card_type);
        const sourceKey = `virtual-${card.id}`;
        const isSelected = selectedSource === sourceKey;

        return (
          <Pressable
            key={card.id}
            onPress={() => onSelectSource(sourceKey)}
            className={`rounded-xl p-4 flex-row items-center space-x-4 mt-4 bg-primary-400 ${
              isSelected
                ? "border-2 border-primary-500"
                : "border border-transparent"
            }`}
          >
            <View className="w-12 h-12 rounded-full bg-primary-300 items-center justify-center mr-4">
              {CardIcon ? (
                <CardIcon width={24} height={24} />
              ) : (
                <CustomText>💳</CustomText>
              )}
            </View>

            <View className="flex-1">
              <CustomText weight="medium" secondary>
                {card.card_type || "Virtual Card"}
              </CustomText>
              <CustomText className="mt-1">
                {card.card_pan
                  ? `${card.card_pan.slice(
                      0,
                      4
                    )} **** **** ${card.card_pan.slice(-4)}`
                  : "•••• •••• •••• ••••"}
              </CustomText>
            </View>
          </Pressable>
        );
      })}

      {/* Add new card (NAVIGATE + CLOSE MODAL) */}
      <Pressable
        onPress={handleNewCard}
        className="rounded-xl py-5 items-center flex-row justify-center gap-2 mt-4 bg-primary-400 border border-transparent"
      >
        <PlusIcon width={16} height={16} />
        <CustomText weight="medium">New Card</CustomText>
      </Pressable>
    </View>
  );
};

export default FundWalletContent;
