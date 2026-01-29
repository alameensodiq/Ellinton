import React from "react";
import { View } from "react-native";
import CustomText from "../CustomText";
import AmountInput from "../inputs/AmountInput";
import { svgIcons } from "@/app/assets/icons/icons";
import BalanceInfoCard from "../home/BalanceInfo";
import { useSelector } from "react-redux";
import { RootState } from "@/app/lib/store";
import { VirtualCardDetails } from "@/app/lib/thunks/virtualCardsThunks";

interface WithdrawalContentProps {
  amount: string;
  setAmount: (value: string) => void;
}

const WithdrawalContent: React.FC<WithdrawalContentProps> = ({
  amount,
  setAmount,
}) => {
  const accountInfo = useSelector(
    (state: RootState) => state.accounts.accountInfo
  );
   const virtualCards = useSelector(
     (state: RootState) => state.virtualCards.cards || []
   );
  console.log(virtualCards)
  const selectedCard: VirtualCardDetails | null = useSelector(
    (state: RootState) => state.virtualCards.selectedCard
  );

  return (
    <View className="space-y-4 bg-primary-100">
      <View>
        <BalanceInfoCard
          title="Wallet Balance"
          balance={`$${selectedCard?.balance ?? "0.00"}`}
          icon={svgIcons.wallet}
        />
      </View>
      <View>
        <CustomText size="sm" weight="medium" className="mb-4">
          Enter amount
        </CustomText>
        <AmountInput value={amount} onChange={setAmount} placeholder="0" />

        <CustomText secondary size="sm" weight="medium" className="mb-20 mt-4">
          ❔ Enter an amount above ₦100
        </CustomText>
      </View>
    </View>
  );
};

export default WithdrawalContent;
