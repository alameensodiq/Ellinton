import React, { useState, useEffect } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
} from "react-native";
import { Tab, TabBar } from "@/app/components/tabs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import CardHeader from "@/app/components/cards/CardHeader";
import VirtualCardSection from "@/app/components/cards/VirtualCardSection";
import CardSwitch from "@/app/components/cards/CardSwitch";
import CardContent from "@/app/components/cards/CardContent";
import { SafeAreaView } from "react-native-safe-area-context";
import CardActions from "@/app/components/cards/CardAction";
import { TransactionHistory } from "@/app/components/cards/Transactions";
import BottomSheet from "@/app/components/BottomSheet";
import WithdrawalContent from "@/app/components/cards/WithdrawalContent";
import BlockCardContent from "@/app/components/cards/lockCardContent";
import FundWalletContent from "@/app/components/cards/FundWallet";
import MoreInfoContent from "@/app/components/cards/MoreInfoContent";
import images from "@/app/assets/images";
import ChangePin from "@/app/components/cards/ChangePinContent";
import CardActivation from "@/app/components/cards/CardActivation";
import { fetchPhysicalCards, PhysicalCard } from "@/app/lib/thunks/cardsThunks";
import {
  fetchVirtualCards,
  VirtualCardListItem,
} from "@/app/lib/thunks/virtualCardsThunks";
import { RootState, AppDispatch } from "@/app/lib/store";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const EMPTY_ARR: any[] = [];

const selectPhysicalCards = (state: RootState) =>
  state.cards.physicalCards ?? EMPTY_ARR;

const selectVirtualCards = (state: RootState) => {
  const cards = state.virtualCards?.cards;
  return Array.isArray(cards) ? cards : EMPTY_ARR;
};
const user = useAppSelector((state) => state.auth.user);

const selectVirtualLoading = (state: RootState) =>
  state.virtualCards?.isLoading ?? false;

const selectSelectedVirtualCard = (state: RootState) =>
  state.virtualCards?.selectedCard ?? null;

export default function Card() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const TAG = "[CARDS]";

  const [activeTab, setActiveTab] = useState("virtual");
  const [showCardDetails, setShowCardDetails] = useState(false);

  const [showWithdrawalSheet, setShowWithdrawalSheet] = useState(false);
  const [showFundSheet, setShowFundSheet] = useState(false);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [showPinSheet, setShowPinSheet] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // ✅ NEW: remember what the user wanted to do after authorize
  const [pendingAction, setPendingAction] = useState<"more" | null>(null);

  const [amount, setAmount] = useState("");
  const [fundSource, setFundSource] = useState<string | null>(null);

  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  const physicalCards: PhysicalCard[] = useSelector(selectPhysicalCards);
  const virtualCards: VirtualCardListItem[] = useSelector(selectVirtualCards);
  const virtualLoading = useSelector(selectVirtualLoading);
  const selectedCard = useSelector(selectSelectedVirtualCard);

  const { selectedColor } = useLocalSearchParams();

  const tabs: Tab[] = [
    { label: "Virtual Card", value: "virtual" },
    { label: "Physical Card", value: "physical" },
  ];

  const hasCardphysical = physicalCards.length > 0;
  const activePhysicalCard = physicalCards.find((c) => c.status === "Active");
  const isActivated = !!activePhysicalCard;

  // ✅ ONLY ACTIVE virtual card
  const activeVirtualCard =
    virtualCards.find((c) => c.status === "Active") ?? null;

  // ✅ "has virtual" means "has ACTIVE virtual"
  const hasCardvirtual = !!activeVirtualCard;

  // If details arrive (after authorize), keep switch ON
  useEffect(() => {
    if (selectedCard?.id) setShowCardDetails(true);
  }, [selectedCard?.id]);

  // ✅ If user wanted "more", open it after authorize is done
  useEffect(() => {
    if (pendingAction === "more" && selectedCard?.id) {
      setShowMore(true);
      setPendingAction(null);
    }
  }, [pendingAction, selectedCard?.id]);

  const selectedColorStr = Array.isArray(selectedColor)
    ? selectedColor[0]
    : selectedColor;

  const PhysicalCard1 = images.physical_card_1;
  const PhysicalCard2 = images.physical_card_2;
  const PhysicalCard3 = images.physical_card_3;

  const cardImageMap: Record<string, any> = {
    gold: PhysicalCard1,
    white: PhysicalCard2,
    black: PhysicalCard3,
  };

  const cardImage = cardImageMap[(selectedColorStr as string) || "gold"];

  // ✅ Fetch lists only
  useEffect(() => {
    console.log(TAG, "fetchPhysicalCards()");
    dispatch(fetchPhysicalCards({}));
  }, [dispatch]);

  useEffect(() => {
    console.log(TAG, "fetchVirtualCards()");
    dispatch(fetchVirtualCards());
  }, [dispatch]);

  // Debug logs
  useEffect(() => {
    console.log(
      TAG,
      "virtualCards:",
      virtualCards.map((v) => ({ id: v.id, status: v.status }))
    );
  }, [virtualCards]);

  useEffect(() => {
    console.log(TAG, "activeVirtualCard:", activeVirtualCard);
  }, [activeVirtualCard?.id]);

  useEffect(() => {
    console.log(TAG, "selectedCard(details):", selectedCard);
  }, [selectedCard?.id]);

  // Default tab based on physical
  useEffect(() => {
    if (hasCardphysical) setActiveTab("physical");
  }, [hasCardphysical]);

  const handleToggleDetails = (val: boolean) => {
    console.log(TAG, "Switch:", val);
    setShowCardDetails(val);

    if (!val) return;

    // Turning ON: go authorize to collect PIN
    if (activeVirtualCard?.id) {
      router.push({
        pathname: "/(root)/cards/authorize-details",
        params: { cardId: activeVirtualCard.id, next: "details" },
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowCardDetails(false);

    if (tab === "virtual" && !virtualLoading) {
      console.log(TAG, "refetchVirtualCards()");
      dispatch(fetchVirtualCards());
    }
  };

  const handleItemPress = (item: any) => {
    switch (item.id) {
      case "withdrawal":
        setShowWithdrawalSheet(true);
        break;

      case "fund":
        setShowFundSheet(true);
        break;

      case "block":
        setShowBlockSheet(true);
        break;

        // case "pin":
        //   setShowPinSheet(true);
        break;

      case "more":
        // ✅ AUTHORIZE BEFORE OPENING MODAL
        if (selectedCard?.id) {
          setShowMore(true);
          return;
        }

        if (activeVirtualCard?.id) {
          setPendingAction("more");
          router.push({
            pathname: "/(root)/cards/authorize-details",
            params: { cardId: activeVirtualCard.id, next: "more" },
          });
        }
        break;
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!withdrawalAmount || !activeVirtualCard?.id) return;

    router.push({
      pathname: "/(root)/withdraw/authorize",
      params: { amount: withdrawalAmount, cardId: activeVirtualCard.id },
    });

    setShowWithdrawalSheet(false);
    setWithdrawalAmount("");
  };

  const handleCloseWithdrawal = () => {
    setShowWithdrawalSheet(false);
    setWithdrawalAmount("");
  };

  const handleConfirmFund = () => {
    if (!amount || !fundSource) return;

    router.push({
      pathname: "/(root)/fund-wallet/authorize",
      params: { amount, source: fundSource },
    });

    setShowFundSheet(false);
    setAmount("");
  };

  const handleCloseFund = () => {
    setShowFundSheet(false);
    setAmount("");
  };

  const handleConfirmBlock = () => {
    router.push("/(root)/block-card/authorize");
    setShowBlockSheet(false);
  };

  const handleCloseBlock = () => setShowBlockSheet(false);

  // const handleConfirmPin = () => {
  //   router.push("/(root)/cards/physical-card/pin/authorize");
  //   setShowPinSheet(false);
  // };

  const handleClosePin = () => setShowPinSheet(false);

  const handleCloseMore = () => setShowMore(false);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 -mb-12">
      <CardHeader title="My Cards" />

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "virtual" ? (
            hasCardvirtual ? (
              <>
                <VirtualCardSection
                  activeTab="virtual"
                  showCardDetails={showCardDetails}
                />

                <CardSwitch
                  value={showCardDetails}
                  onChange={handleToggleDetails}
                />

                <CardActions onItemPress={handleItemPress} />
                <TransactionHistory />
              </>
            ) : (
              <CardContent
                buttonTitle="Request virtual card"
                buttonRoute={
                  user?.kyc_level === 3 ? "/(root)/cards/virtual-card" : ""
                }
                sectionTitle="Why a Virtual Card?"
              />
            )
          ) : activeTab === "physical" ? (
            hasCardphysical ? (
              isActivated ? (
                <>
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

                  <CardActions onItemPress={handleItemPress} physical={true} />
                </>
              ) : (
                <CardActivation
                  cardImage={cardImage}
                  selectedColor={selectedColorStr}
                />
              )
            ) : (
              <CardContent
                buttonTitle="Request physical card"
                buttonRoute={
                  user?.kyc_level === 3 ? "/(root)/cards/physical-card" : ""
                }
                sectionTitle="Track your physical card"
              />
            )
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showWithdrawalSheet}
        onClose={handleCloseWithdrawal}
        onConfirm={handleConfirmWithdrawal}
        title="Withdraw Money"
        buttonText="Confirm"
      >
        <WithdrawalContent
          amount={withdrawalAmount}
          setAmount={setWithdrawalAmount}
        />
      </BottomSheet>

      <BottomSheet
        visible={showFundSheet}
        onClose={handleCloseFund}
        onConfirm={handleConfirmFund}
        title="Fund Wallet"
        buttonText="Top Up"
      >
        <FundWalletContent
          selectedSource={fundSource}
          onSelectSource={setFundSource}
          amount={amount}
          setAmount={setAmount}
          onClose={handleCloseFund}
        />
      </BottomSheet>

      <BottomSheet
        visible={showMore}
        onClose={handleCloseMore}
        title="Card details"
        hideshowButton
      >
        <MoreInfoContent />
      </BottomSheet>

      <BottomSheet
        visible={showBlockSheet}
        onClose={handleCloseBlock}
        onConfirm={handleConfirmBlock}
        title="Block Card"
        buttonText="Continue"
      >
        <BlockCardContent onContinue={() => {}} />
      </BottomSheet>

      {/* <BottomSheet
        visible={showPinSheet}
        onClose={handleClosePin}
        onConfirm={handleConfirmPin}
        title="Change Pin"
        buttonText="Continue"
      >
        <ChangePin onContinue={() => {}} />
      </BottomSheet> */}
    </SafeAreaView>
  );
}
