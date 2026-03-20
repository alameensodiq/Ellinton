"use client";
import {
  View,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../lib/store";
import { getCardsData } from "./home/cards/cardsData";
import Card from "./home/cards/card";
import SlideIndicators from "./home/cards/SlideIndicators";
import { fetchAccountInfo } from "../lib/thunks/accountThunks";
import BottomSheet from "./BottomSheet";
import PlansContent from "./home/plans/PlansContent";

import { fetchOverdraftPosition } from "../lib/thunks/overdraftThunks";
import { fetchUserSavings } from "../lib/thunks/savingsThunks";
import { fetchBonusWalletBalance } from "../lib/thunks/walletThunks";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 20;

interface ShowBalanceState {
  [key: number]: boolean;
}

interface Props {
  onOpenAccounts?: () => void;
  onOpenPlanSheet?: () => void;
}

export default function BalanceCardSlider({
  onOpenAccounts,
  onOpenPlanSheet,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const accountInfo = useSelector(
    (state: RootState) => state.accounts.accountInfo
  );

  const overdraftPosition = useSelector(
    (state: RootState) => (state as any).overdraft?.position
  );

  // ✅ overall savings total (computed in savingsSlice)
  const savingsTotal = useSelector(
    (state: RootState) => (state as any).savings?.totals?.overall ?? 0
  );
  const pointBalance = useSelector(
    (state: RootState) => (state as any).wallet?.bonusBalance?.balance ?? 0
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBalance, setShowBalance] = useState<ShowBalanceState>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [planSheetVisible, setPlanSheetVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchAccountInfo());
    dispatch(fetchOverdraftPosition() as any);
    dispatch(fetchBonusWalletBalance() as any);

    // ✅ load all savings types so totals become correct
    ["BASIC", "TARGET", "GROUP", "FIXED"].forEach((type) => {
      dispatch(fetchUserSavings({ page: 1, limit: 500, type }) as any);
    });
  }, [dispatch]);

  // ✅ pass savingsTotal into your cards builder
  const cardsData = getCardsData(accountInfo, savingsTotal, pointBalance);

  const toggleBalance = (cardId: number) => {
    setShowBalance((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const copyCardNumber = (cardNumber: string) => {
    Share.share({
      message: cardNumber,
      title: "Card Number",
    }).catch(() => Alert.alert("Copy", "Card number ready to share"));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View className="w-full mb-6 mt-1">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {cardsData.map((card) => (
          <View key={card.id} style={{ width: CARD_WIDTH }}>
            <Card
              card={card}
              showBalance={showBalance[card.id] || false}
              onToggleBalance={toggleBalance}
              onCopyCard={copyCardNumber}
              onOpenAccounts={onOpenAccounts}
              onOpenPlanSheet={() => {
                setPlanSheetVisible(true);
                onOpenPlanSheet?.();
              }}
              overdraftBalance={overdraftPosition?.balance}
            />
          </View>
        ))}
      </ScrollView>

      <SlideIndicators currentIndex={currentIndex} total={cardsData.length} />

      <BottomSheet
        visible={planSheetVisible}
        onClose={() => setPlanSheetVisible(false)}
        hideshowButton={true}
        title="Plans"
      >
        <PlansContent onSelect={() => setPlanSheetVisible(false)} />
      </BottomSheet>
    </View>
  );
}
