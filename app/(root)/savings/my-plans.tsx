import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Pressable,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import CustomText from "@/app/components/CustomText";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchUserSavings } from "@/app/lib/thunks/savingsThunks";
import Header from "@/app/components/header-back";
import { TabBar } from "../referral";

type TabValue = "basic" | "target" | "group" | "fixed";

type Saving = {
  id: number;
  name: string;
  interest_rate: number;
  tenure: number;
  amount: number;
  amount_saved?: number;
  savings_type: string;
  target_amount: number | null;
  status: "ACTIVE" | "MATURED" | string;
  saving_interval: string;
  start_date: string;
  end_date: string;
  savings_account: string;
};

const money = (n: number) =>
  `₦${Math.round(Number(n || 0)).toLocaleString("en-NG")}`;

const calcInterest = (amount: number, rate: number, tenureDays: number) =>
  Math.round(amount * (rate / 100) * (tenureDays / 365));

const LoadingCard = () => (
  <View className="bg-primary-400 rounded-3xl p-5 mb-4 border border-white/10">
    <View className="flex-row items-center justify-between">
      <View className="w-10 h-10 rounded-full bg-white/10" />
      <View className="w-20 h-8 rounded-full bg-white/10" />
    </View>
    <View className="h-5 w-40 bg-white/10 rounded-md mt-4" />
    <View className="flex-row justify-between mt-6">
      <View>
        <View className="h-3 w-20 bg-white/10 rounded-md mb-2" />
        <View className="h-5 w-24 bg-white/10 rounded-md" />
      </View>
      <View className="items-end">
        <View className="h-3 w-24 bg-white/10 rounded-md mb-2" />
        <View className="h-5 w-28 bg-white/10 rounded-md" />
      </View>
    </View>
  </View>
);

export default function MyPlansScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userSavings, isLoading } = useAppSelector((s: any) => s.savings);

  const [activeTab, setActiveTab] = useState<TabValue>("basic");
  const [refreshing, setRefreshing] = useState(false);

  const tabs = useMemo(
    () => [
      { label: "Basic", value: "basic" },
      { label: "Target", value: "target" },
      { label: "Group", value: "group" },
      { label: "Fixed", value: "fixed" },
    ],
    []
  );

  const load = async () => {
    await dispatch(
      fetchUserSavings({
        page: 1,
        limit: 20,
        type: activeTab.toUpperCase(),
      }) as any
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const items: Saving[] = Array.isArray(userSavings?.data)
    ? userSavings.data
    : [];

  const renderItem = ({ item }: { item: Saving }) => {
    const isActive = item.status === "ACTIVE";
    const interest = calcInterest(item.amount, item.interest_rate, item.tenure);

    return (
      <Pressable
        onPress={() => {
          router.push({
            pathname: "/(root)/savings/my-plan-details",
            params: {
              saving: JSON.stringify(item),
            },
          });
        }}
        className="bg-primary-400 rounded-3xl p-5 mb-4 border border-white/10"
      >
        <View className="flex-row items-center justify-between">
          <View className="w-10 h-10 rounded-full bg-primary-300 items-center justify-center">
            <Ionicons name="refresh-circle" size={20} color="#fff" />
          </View>

          <View
            className={`px-4 py-2 rounded-full ${
              isActive ? "bg-green-900/40" : "bg-white/10"
            }`}
          >
            <CustomText
              size="sm"
              weight="medium"
              className={isActive ? "text-green-400" : ""}
            >
              {isActive ? "Active" : "Matured"}
            </CustomText>
          </View>
        </View>

        <CustomText size="lg" weight="bold" className="mt-4">
          {item.name}
        </CustomText>

        <View className="flex-row justify-between mt-6">
          <View>
            <CustomText size="sm" secondary>
              Balance
            </CustomText>
            <CustomText size="lg" weight="bold" className="mt-1">
              {money(item.amount_saved ?? 0)}
            </CustomText>
          </View>

          <View className="items-end">
            <CustomText size="sm" secondary>
              Total Interest
            </CustomText>
            <CustomText size="sm" weight="bold" className="mt-2">
              {money(interest)}{" "}
              <CustomText size="sm" secondary>
                at ({item.interest_rate}% p.a)
              </CustomText>
            </CustomText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="My Plans" showCancel />

      {/* ✅ TABS BACK */}
      <View className="px-4 mt-2">
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(v) => setActiveTab(v as TabValue)}
        />
      </View>

      <View className="flex-1 px-4 mt-4">
        {isLoading ? (
          <View>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View className="mt-10">
                <CustomText size="sm" secondary className="text-center">
                  No plans found
                </CustomText>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
