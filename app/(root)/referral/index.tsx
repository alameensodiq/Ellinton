import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import Sheet from "@/app/components/Sheet";
import AmountInput from "@/app/components/inputs/AmountInput";
import { Tab, TabBar } from "@/app/components/tabs";
import { svgIcons } from "@/app/assets/icons/icons";
import icons from "@/app/assets/icons/icons";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchAccountInfo } from "@/app/lib/thunks/accountThunks";
import {
  fetchBonusWalletBalance,
  withdrawBonusWallet,
} from "@/app/lib/thunks/walletThunks";

const ReferralScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("home");
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const GiftIcon = svgIcons.gift;
  const user = useAppSelector((state) => state.auth.user);
  const accountInfo = useAppSelector((state) => state.accounts.accountInfo);
  const bonusBalance = useAppSelector((state) => state.wallet.bonusBalance);
  const walletLoading = useAppSelector((state) => state.wallet.isLoading);
  const walletWithdrawing = useAppSelector((state) => state.wallet.withdrawing);
  const walletError = useAppSelector((state) => state.wallet.error);
  const totalEarned = Number(bonusBalance?.balance ?? 0);
  const referralCode = bonusBalance?.walletNumber || "";
  const appName = "Ellington MFB Personal";
  const iosAppLink =
    "https://apps.apple.com/us/app/ellington-mfb-personal/id6742980740";
  const androidAppLink =
    "https://play.google.com/store/apps/details?id=com.ellingtonmfb.app";
  const inviteMessage = `Join me on ${appName} and use my referral code ${referralCode} to get started! Earn free ₦300.

Download on iPhone: ${iosAppLink}
Download on Android: ${androidAppLink}`;
  const tabs: Tab[] = [
    { label: "Home", value: "home" },
    { label: "Details", value: "details" },
  ];
  const rawTransferAmount = Number(transferAmount.replace(/,/g, "")) || 0;
  const canProceed =
    rawTransferAmount >= 100 &&
    rawTransferAmount <= totalEarned &&
    !walletWithdrawing;

  useEffect(() => {
    if (!accountInfo) {
      dispatch(fetchAccountInfo());
    }
  }, [accountInfo, dispatch]);

  useEffect(() => {
    dispatch(fetchBonusWalletBalance());
  }, [dispatch]);

  useEffect(() => {
    if (params.tab === "details") {
      setActiveTab("details");
      return;
    }

    if (params.tab === "home") {
      setActiveTab("home");
    }
  }, [params.tab]);

  const copyToClipboard = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("Copied!", "Referral code copied to clipboard");
  };

  const shareReferral = async () => {
    try {
      await Share.share({ message: inviteMessage });
    } catch (error) {
      console.log(error);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(inviteMessage);
    Linking.openURL(`whatsapp://send?text=${message}`).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed");
    });
  };

  const openSMS = () => {
    const message = encodeURIComponent(inviteMessage);
    Linking.openURL(`sms:?body=${message}`).catch(() => {
      Alert.alert("Error", "Cannot open SMS");
    });
  };

  const handleProceedTransfer = () => {
    if (!canProceed) return;
    const reference = `wd-${user?.id || "user"}-${Date.now()}`;

    dispatch(
      withdrawBonusWallet({
        amount: rawTransferAmount,
        reference,
      })
    )
      .unwrap()
      .then(() => {
        setTransferSheetOpen(false);
        router.push({
          pathname: "/(root)/referral/transfer-success",
          params: {
            amount: transferAmount,
            receiverName:
              accountInfo?.accountName ||
              user?.full_name ||
              user?.name ||
              "Sabra",
            status: "success",
            message: `Your transfer of ₦${transferAmount} to ${
              accountInfo?.accountName || user?.full_name || user?.name || "Sabra"
            } was successful`,
          },
        });
      })
      .catch((error: any) => {
        setTransferSheetOpen(false);
        router.push({
          pathname: "/(root)/referral/transfer-success",  
          params: {
            amount: transferAmount,
            receiverName:
              accountInfo?.accountName ||
              user?.full_name ||
              user?.name ||
              "Sabra",
            status: "failed",
            message:
              error?.message ||
              error?.payload ||
              "Point transfer failed",
          },
        });
      });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#3D4020" }}>
      {/* Header */}
      <View className="px-4 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() =>
              activeTab === "details" ? setActiveTab("home") : router.back()
            }
          >
            <Ionicons
              name={activeTab === "details" ? "chevron-back" : "close"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
          <CustomText weight="medium" size="lg" className="text-white mb-0">
            {activeTab === "details" ? "View plan details" : "Referral"}
          </CustomText>
          <View style={{ width: 28 }} />
        </View>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "home" ? (
          <>
            <View className="mb-2 mt-2">
              <LinearGradient
                colors={["#2C2F1A", "#1A1C10"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 24,
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <CustomText className="mb-2 py-6 text-[4rem]" size="xxxl">
                  🎁
                </CustomText>
                <CustomText
                  weight="bold"
                  className="text-white text-center mb-3"
                  style={{ fontSize: 24 }}
                >
                  Earn free ₦300
                </CustomText>
                <CustomText
                  className="text-center"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  Receive ₦300 for every new person you refer. Plus, earn ₦10 on
                  every transaction they make.
                </CustomText>
              </LinearGradient>
            </View>

            <View className="rounded-2xl mt-2 mb-6">
              <CustomText weight="medium" className="text-white mb-4">
                Referral code
              </CustomText>
              <TouchableOpacity
                className="flex-row items-center justify-center gap-4 rounded-xl p-4 border border-primary-300"
                onPress={copyToClipboard}
              >
                <CustomText
                  weight="bold"
                  className="text-white mb-0"
                  style={{ fontSize: 18, letterSpacing: 1 }}
                >
                  {referralCode || "--"}
                </CustomText>
                <Ionicons name="copy-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <CustomText className="text-center tex-sm text-accent-100 mt-2">
                Click to copy
              </CustomText>
            </View>

            <View className="mb-6">
              <CustomText weight="medium" className="text-white mb-4">
                Share with
              </CustomText>
              <View className="flex-row justify-between ">
                <TouchableOpacity
                  onPress={openWhatsApp}
                  className="items-center"
                  style={{ width: 70 }}
                >
                  <View
                    className="items-center justify-center mb-2 bg-primary-300"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                  </View>
                  <CustomText size="sm" className="color-accent-100 mb-0">
                    WhatsApp
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openSMS}
                  className="items-center"
                  style={{ width: 70 }}
                >
                  <View
                    className="items-center justify-center mb-2 bg-primary-300"
                    style={{
                      width: 60,
                      height: 60,

                      borderRadius: 16,
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <CustomText size="sm" className="color-accent-100 mb-0">
                    SMS
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shareReferral}
                  className="items-center"
                  style={{ width: 70 }}
                >
                  <View
                    className="items-center justify-center mb-2 bg-primary-300"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                    }}
                  >
                    <Ionicons name="share-outline" size={24} color="#fff" />
                  </View>
                  <CustomText size="sm" className="color-accent-100 mb-0">
                    Share
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={copyToClipboard}
                  className="items-center"
                  style={{ width: 70 }}
                >
                  <View
                    className="items-center justify-center mb-2 bg-primary-300"
                    style={{
                      width: 60,
                      height: 60,

                      borderRadius: 16,
                    }}
                  >
                    <Ionicons name="link-outline" size={24} color="#fff" />
                  </View>
                  <CustomText size="sm" className="color-accent-100 mb-0">
                    Copy
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-8">
              <CustomText
                className="text-center mb-4"
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: 14,
                }}
              >
                Need to see how you've performed?
              </CustomText>

              <Button
                title=" View referral details"
                variant="primary"
                onPress={() => setActiveTab("details")}
              />
            </View>
          </>
        ) : (
          <View className="pt-6">
            <View
              className="rounded-3xl overflow-hidden mb-5"
              style={{ backgroundColor: "#27280F", minHeight: 268 }}
            >
              <LinearGradient
                colors={["#27280F", "#1F210C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, minHeight: 268 }}
              >
                <View
                  style={{
                    position: "absolute",
                    right: -8,
                    top: 6,
                    opacity: 0.7,
                  }}
                >
                  <GiftIcon width={126} height={126} />
                </View>

                <CustomText secondary>
                  {walletLoading ? "Loading wallet..." : "Total Earned"}
                </CustomText>
                <CustomText weight="bold" className=" mb-10" size="xxl">
                  ₦{totalEarned}
                </CustomText>

                <TouchableOpacity
                  onPress={() => setTransferSheetOpen(true)}
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <CustomText weight="medium">Transfer</CustomText>
              </LinearGradient>
            </View>

            <View
              className="rounded-3xl px-5 py-6"
              style={{ backgroundColor: "rgba(150, 152, 65, 0.35)" }}
            >
              {[
                { label: "Wallet Number", value: bonusBalance?.walletNumber || "--" },
                { label: "Currency", value: bonusBalance?.currency || "NGN" },
                { label: "Available Bonus", value: `₦${totalEarned.toLocaleString()}` },
              ].map((item, index, arr) => (
                <View key={item.label}>
                  <View className="flex-row items-center justify-between py-3">
                    <CustomText
                      style={{
                        color: "rgba(255,255,255,0.82)",
                        fontSize: 17,
                        marginBottom: 0,
                      }}
                    >
                      {item.label}
                    </CustomText>
                    <CustomText
                      weight="medium"
                      style={{
                        color: "#FFFFFF",
                        fontSize: 18,
                        marginBottom: 0,
                      }}
                    >
                      {item.value}
                    </CustomText>
                  </View>
                  {index !== arr.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Sheet visible={transferSheetOpen} onClose={() => setTransferSheetOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={24}
          >
            <View style={{ paddingTop: 8, paddingBottom: 24 }}>
          <CustomText
            weight="medium"
            size="lg"
            className="text-white text-center mb-10"
          >
            Point transfer
          </CustomText>

          <CustomText weight="bold" size="xl" className="text-white mb-2">
            Cashout Rewards
          </CustomText>
          <CustomText className="text-white/70 leading-6 mb-6">
            your reward will be transfered to you bank
          </CustomText>

          <LinearGradient
            colors={["#515220", "#212207"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, marginBottom: 24 }}
          >
            <View className="flex-row items-center justify-between p-4 py-5">
              <View>
                <CustomText weight="medium" className="text-white mb-1">
                  {accountInfo?.accountName ||
                    user?.full_name ||
                    user?.name ||
                    ""}
                </CustomText>
                <CustomText size="sm" className="text-white/60 mb-0">
                  Ellington Bank • {accountInfo?.accountNumber || "5372915793"}
                </CustomText>
                <CustomText size="sm" className="text-primary-200 mt-2 mb-0">
                  Point balance: ₦{totalEarned.toLocaleString()}
                </CustomText>
              </View>

              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full overflow-hidden -mr-4">
                  <Image
                    source={{ uri: user?.passport || "https://i.pravatar.cc/100" }}
                    className="w-full h-full"
                  />
                </View>

                <View className="w-12 h-12 rounded-full bg-primary-400 items-center justify-center z-10 overflow-hidden">
                  <Image
                    source={icons.sender_card}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </LinearGradient>

          <CustomText weight="medium" className="text-white mb-3">
            Add amount
          </CustomText>

          <AmountInput
            value={transferAmount}
            onChange={setTransferAmount}
            placeholder="0"
          />

          <View className="flex-row items-center mt-3 mb-8">
            <Ionicons
              name="help-circle-outline"
              size={16}
              color="rgba(255,255,255,0.6)"
            />
            <CustomText size="sm" className="text-white/60 ml-1 mb-0">
              {walletError
                ? walletError
                : rawTransferAmount > totalEarned
                ? "Amount exceeds available point balance"
                : "Enter an amount above ₦100"}
            </CustomText>
          </View>

          <Button
            title={walletWithdrawing ? "Processing..." : "Proceed"}
            variant="primary"
            onPress={handleProceedTransfer}
            disabled={!canProceed}
          />
        </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Sheet>
    </SafeAreaView>
  );
};

export default ReferralScreen;
export { TabBar };
