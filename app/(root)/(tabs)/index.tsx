"use client";

import { useState, useEffect } from "react";
import { ScrollView, View, RefreshControl } from "react-native"; 
import SliderCard from "@/app/components/SliderCard";
import BottomMenu from "@/app/components/BottomMenu";
import HomeHeader from "@/app/components/HomeHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import ServicesSection from "@/app/components/ServiceSection";
import InfoBanner from "@/app/components/InfoBanner";
import { useRouter } from "expo-router";
import AccountDetailsModal from "@/app/components/home/modals/account-details";
import { StatusBar } from "react-native";
import images from "@/app/assets/images";
import { getUserProfile } from "@/app/lib/thunks/authThunks";
import { fetchAccountInfo } from "@/app/lib/thunks/accountThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const HomeScreen = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 

  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(getUserProfile());
    dispatch(fetchAccountInfo());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getUserProfile()).unwrap(),
        dispatch(fetchAccountInfo()).unwrap(),
      ]);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const showKycBanner = user?.kyc_level === 1;
  const showKycBanner2 = user?.kyc_level === 2;

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <HomeHeader
        onMenuPress={() => setMenuVisible(true)}
        username={user?.full_name}
        avatar={user?.passport}
      />
      <ScrollView
        className="flex-1 -mb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SliderCard onOpenAccounts={() => setModalVisible(true)} />
        {showKycBanner && (
          <InfoBanner
            title="Complete your KYC verification"
            description="To access all features it’s essential to verify your identity."
            icon={images.landing_kyc_icon}
            onPress={() => router.push("/(root)/kyc")}
          />
        )}
        {showKycBanner2 && (
          <InfoBanner
            title="Complete your KYC verification"
            description="To access all features it’s essential to verify your identity."
            icon={images.landing_kyc_icon}
            onPress={() => router.push("/(root)/kyc/utility-bills")}
          />
        )}
        <View className="mb-10">
          <ServicesSection />
        </View>
        <InfoBanner
          title="Refer & earn"
          description="Receive N300 for every new person you refer. Plus, earn N10 on every transaction they make."
          icon={images.landing_refer}
          onPress={() => router.push("/(root)/referral")}
          backgroundColor="#313215"
          imageHeight={50}
          imageWidth={50}
        />
      </ScrollView>

      <BottomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        version="2.0.0"
        user={{
          name: user?.full_name || user?.name || "User",
          email: user?.email || "",
          avatar: user?.passport || "https://i.pravatar.cc/100",
        }}
      />

      <AccountDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
