import React, { useState, useEffect } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CustomText from "@/app/components/CustomText";
import Header from "@/app/components/header-back";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import {
  fetchGoldDashboard,
  fetchGoldTransactions,
} from "@/app/lib/thunks/goldThunks";

export default function GoldDashboard() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const dispatch = useAppDispatch();

  const { dashboard, transactions, isLoading } = useAppSelector(
    (state: any) => state.gold
  );

  useEffect(() => {
    dispatch(fetchGoldDashboard());
    dispatch(fetchGoldTransactions());
  }, [dispatch]);

  const wallet = dashboard?.wallet;
  const livePrice = dashboard?.live_price;
  const skr = dashboard?.skr;

  const grams = wallet ? wallet.balance_grams.toFixed(2) : "0.00";
  const unit = "Gram";

  return (
    <SafeAreaView className="flex-1 bg-[#4A4B1A]">
      <Header title="Gold" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pb-10">
          {/* Wallet Card */}
          <View className="bg-[#2E2F12] rounded-3xl p-5">
            <CustomText size="base" weight="medium" className="text-white/80">
              Gold Wallet
            </CustomText>

            <View className="mt-2 flex-row items-center">
              <CustomText size="xxxl" weight="bold" className="text-white">
                {hidden ? "•••••" : `${grams} ${unit}`}
              </CustomText>

              <Pressable
                onPress={() => setHidden((p) => !p)}
                className="ml-3 w-10 h-10 rounded-full items-center justify-center bg-white/10"
                hitSlop={10}
              >
                <Ionicons
                  name={hidden ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.75)"
                />
              </Pressable>
            </View>

            <View className="mt-4 flex-row justify-between">
              <View>
                <CustomText size="sm" className="text-white/60">
                  Balance (Grams)
                </CustomText>
                <CustomText size="lg" weight="bold" className="text-white">
                  {hidden ? "••••" : grams}
                </CustomText>
              </View>

              <View className="items-end">
                <CustomText size="sm" className="text-white/60">
                  Current Value
                </CustomText>
                <CustomText size="lg" weight="bold" className="text-white">
                  {hidden
                    ? "••••••"
                    : `₦${
                        wallet?.current_value_ngn.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "0.00"
                      }`}
                </CustomText>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-6 flex-row justify-between">
              <ActionTile
                label="Buy"
                iconName="cart-outline"
                onPress={() =>
                  router.push({ pathname: "/gold", params: { type: "buy" } })
                }
              />
              <ActionTile
                label="Sell"
                iconName="pricetag-outline"
                onPress={() =>
                  router.push({ pathname: "/gold", params: { type: "sell" } })
                }
              />

              <ActionTile
                label="Gift"
                iconName="gift-outline"
                onPress={() =>
                  router.push({
                    pathname: "/(root)/transfer",
                    params: {
                      gift: "true",
                      // pass current wallet values as defaults
                      amount_grams: String(wallet?.balance_grams ?? 0),
                      amount: String(
                        Math.round(wallet?.current_value_ngn ?? 0)
                      ),
                    },
                  })
                }
              />
            </View>
          </View>

          {/* Trigger Card */}
          <Pressable
            onPress={() => router.push("/gold/trigger")}
            className="mt-5 bg-[#5A5B1F] rounded-3xl p-5 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-4">
              <CustomText size="lg" weight="bold" className="text-white">
                Set Your Gold Trigger
              </CustomText>
              <CustomText size="sm" className="text-white/80 mt-1 leading-5">
                Buy gold now at the best price. Set a trigger to sell
                automatically when rates peak—secure profits at the highest
                value
              </CustomText>
            </View>

            <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center">
              <Ionicons name="radio-outline" size={26} color="#fff" />
            </View>
          </Pressable>

          {/* Total Invested */}
          <CustomText size="lg" weight="bold" className="text-white mt-8 mb-3">
            Investment Summary
          </CustomText>

          {/* List Rows */}
          <View className="bg-[#5A5B1F] rounded-3xl overflow-hidden">
            <InvestedRow
              title="Total Invested"
              subtitle={`₦${
                wallet?.total_invested_ngn.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }`}
              rightTop={`₦${
                wallet?.current_value_ngn.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }`}
              rightBottom={`${wallet?.profit_loss_percent >= 0 ? "+" : ""}${
                wallet?.profit_loss_percent || 0
              }% (₦${
                wallet?.profit_loss_ngn.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              })`}
              rightBottomPositive={wallet?.profit_loss_ngn >= 0}
              iconName="bar-chart-outline"
            />

            <View className="h-[1px] bg-white/10" />

            <InvestedRow
              title="Live Gold Price"
              subtitle={`₦${
                livePrice?.price_per_gram_ngn.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }/gram`}
              rightTop={`$${
                livePrice?.price_per_toz_usd.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }`}
              rightBottom={`${livePrice?.change_percent >= 0 ? "+" : ""}${
                livePrice?.change_percent || 0
              }% ($${
                livePrice?.change_usd.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              })`}
              rightBottomPositive={livePrice?.change_percent >= 0}
              iconName="stats-chart-outline"
            />

            <View className="h-[1px] bg-white/10" />

            <InvestedRow
              title="SGR Certificate"
              subtitle={`Weight: ${skr?.weight_grams.toFixed(8) || "0"} grams`}
              rightTop={`₦${
                skr?.current_valuation_ngn.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }`}
              rightBottom={skr?.storage_location || "Dubai Vault"}
              rightBottomPositive
              iconName="shield-outline"
            />
          </View>

          {/* History */}
          <CustomText size="lg" weight="bold" className="text-white mt-8 mb-3">
            Recent Transactions
          </CustomText>

          {transactions && transactions.length > 0 ? (
            <View className="gap-3">
              {transactions.slice(0, 5).map((transaction: any) => (
                <Pressable
                  key={transaction.id}
                  onPress={() =>
                    router.push(`/gold/transactions/${transaction.id}`)
                  }
                >
                  <HistoryItem
                    id={transaction.id}
                    type={
                      transaction.type === "buy"
                        ? "Gold Purchase"
                        : transaction.type === "sell"
                        ? "Gold Sale"
                        : "Transfer"
                    }
                    from={`Ref: ${transaction.reference}`}
                    amount={
                      transaction.type === "buy"
                        ? `-₦${parseFloat(
                            transaction.amount_ngn
                          ).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : `+₦${parseFloat(
                            transaction.amount_ngn
                          ).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                    }
                    amountPositive={transaction.type === "sell"}
                    amountGrams={`${parseFloat(
                      transaction.amount_grams
                    ).toFixed(8)} grams`}
                    date={new Date(transaction.created_at).toLocaleDateString(
                      "en-NG"
                    )}
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <CustomText size="base" className="text-white/60 text-center py-6">
              No transactions yet
            </CustomText>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionTile({
  label,
  iconName,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center w-[23%]">
      <View className="w-16 h-16 rounded-2xl bg-white/10 items-center justify-center">
        <Ionicons name={iconName} size={22} color="#fff" />
      </View>
      <CustomText size="sm" weight="medium" className="text-white mt-2">
        {label}
      </CustomText>
    </Pressable>
  );
}

function InvestedRow({
  title,
  subtitle,
  rightTop,
  rightBottom,
  rightBottomPositive,
  iconName,
}: {
  title: string;
  subtitle: string;
  rightTop: string;
  rightBottom: string;
  rightBottomPositive?: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="px-5 py-4 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mr-3">
          <Ionicons name={iconName} size={20} color="#fff" />
        </View>

        <View>
          <CustomText size="base" weight="bold" className="text-white">
            {title}
          </CustomText>
          <CustomText size="sm" className="text-white/70 mt-1">
            {subtitle}
          </CustomText>
        </View>
      </View>

      <View className="items-end">
        <CustomText size="base" weight="bold" className="text-white">
          {rightTop}
        </CustomText>

        <CustomText
          size="sm"
          weight="bold"
          className={
            rightBottomPositive ? "text-green-400 mt-1" : "text-white/70 mt-1"
          }
        >
          {rightBottom}
        </CustomText>
      </View>
    </View>
  );
}

function HistoryItem({
  id,
  type,
  from,
  amount,
  amountPositive,
  amountGrams,
  date,
}: {
  id?: string;
  type: string;
  from: string;
  amount: string;
  amountPositive: boolean;
  amountGrams?: string;
  date?: string;
}) {
  const amountColor = amountPositive ? "text-green-400" : "text-red-400";
  const iconName: keyof typeof Ionicons.glyphMap = amountPositive
    ? "arrow-down-outline"
    : "arrow-up-outline";

  return (
    <View className="bg-[#5A5B1F] rounded-2xl px-5 py-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1 pr-3">
          <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-3 mt-0.5">
            <Ionicons name={iconName} size={18} color="#fff" />
          </View>

          <View className="flex-1">
            <CustomText size="base" weight="bold" className="text-white">
              {type}
            </CustomText>
            <CustomText size="xs" className="text-white/60 mt-1">
              {from}
            </CustomText>
            {amountGrams && (
              <CustomText size="xs" className="text-white/50 mt-1">
                {amountGrams}
              </CustomText>
            )}
            {date && (
              <CustomText size="xs" className="text-white/50 mt-1">
                {date}
              </CustomText>
            )}
          </View>
        </View>

        <CustomText size="base" weight="bold" className={amountColor}>
          {amount}
        </CustomText>
      </View>
    </View>
  );
}
