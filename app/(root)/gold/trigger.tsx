import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Platform, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import AmountInput from "@/app/components/inputs/AmountInput";
import Button from "@/app/components/Button";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchGoldPrice, createGoldTrigger } from "@/app/lib/thunks/goldThunks";
import { useRouter } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  AreaChart,
  LineChart,
  Grid,
  YAxis,
} from "react-native-svg-charts";
import { Defs, LinearGradient, Stop } from "react-native-svg";

type RangeKey = "1D" | "7D" | "1M";

export default function GoldTriggerScreen() {
  const [amountText, setAmountText] = useState("75,000");
  const [amountRaw, setAmountRaw] = useState<number>(75000);
  const [range] = useState<RangeKey>("7D"); // keep for later, but no UI now
  const dispatch = useAppDispatch();
  const gold = useAppSelector((s: any) => s.gold);
  const router = useRouter();

  // Show current price from store (fallback)
  const pricePerGramNgn = Number(gold?.price?.data?.pricePerGramNgn || 5680);

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    // fetch initial and poll every 60s
    if (!gold?.price) dispatch(fetchGoldPrice());
    const id = setInterval(() => dispatch(fetchGoldPrice()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  const toNumber = (s: string) => Number((s || "").replace(/,/g, "")) || 0;

  // compute grams from the typed amount for immediate feedback while typing
  const gramsText = useMemo(() => {
    const a = toNumber(amountText);
    if (!pricePerGramNgn || a <= 0) return "0.00";
    return (a / pricePerGramNgn).toFixed(2);
  }, [amountText, pricePerGramNgn]);

  const chartData = useMemo(() => {
    // Prefer API-driven data (usd values) when available
    const p = gold?.price?.data;
    if (p) {
      const low = Number(p.lowUsd || p.low || 0);
      const high = Number(p.highUsd || p.high || 0);
      if (low && high) {
        const mid = (low + high) / 2;
        // create a small series from low->mid->high for the chart
        return [low, low + (mid - low) / 2, mid, mid + (high - mid) / 2, high];
      }
    }

    if (range === "1D") return [520, 610, 580, 700, 860];
    if (range === "7D") return [520, 560, 600, 640, 700, 760, 820];
    return [520, 560, 590, 650, 700, 740, 780, 820, 850, 880];
  }, [range, gold?.price]);

  

  const onConfirm = () => {
    // enforce min buy/sell amount of ₦50,000
    if (amountRaw < 50000) {
      Alert.alert("Minimum amount", "Minimum amount for triggers is ₦50,000");
      return;
    }

    // route to authorize screen so user can enter PIN and confirm trigger
    const targetPrice = Math.round(Number(gold?.price?.data?.pricePerGramNgn || 0));
    router.push({
      pathname: "/(root)/gold/authorize",
      params: {
        amount: String(amountRaw),
        amountRaw: String(amountRaw),
        grams: String(gramsText),
        type: "buy",
        trigger: "true",
        target_price_ngn: String(targetPrice),
        expires_at: selectedDate.toISOString().slice(0, 10),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4A4B1A]">
      <Header title="ElliStrike" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pb-10">
          {/* Buy Amount */}
          <CustomText size="lg" weight="bold" className="text-white mt-4 mb-2">
            Buy Amount
          </CustomText>

          <AmountInput
            value={amountText}
            onChange={setAmountText}
            onChangeValue={setAmountRaw}
            sign="₦"
            placeholder="0"
          />

          <View className="flex-row items-center mt-2">
            <View className="w-5 h-5 rounded-full border border-white/30 items-center justify-center mr-2">
              <CustomText size="xs" className="text-white/70">
                ?
              </CustomText>
            </View>
            <CustomText size="sm" className="text-white/70">
              Minimum amount should be $100
            </CustomText>
          </View>

          {/* Buy Grams */}
          <CustomText size="lg" weight="bold" className="text-white mt-6 mb-2">
            Buy Grams
          </CustomText>

          <View
            className={`relative border border-[#6a6a3a] bg-[#4a4a28] rounded-3xl flex-row items-center ${
              Platform.OS === "ios" ? "px-3 py-1 pb-2" : "px-3"
            }`}
          >
            <View className="w-10 items-center justify-center border-r border-[#6a6a3a]">
              <CustomText size="lg" weight="bold" className="text-white">
                ✳︎
              </CustomText>
            </View>

            <View
              className={`flex-1 px-4 ${
                Platform.OS === "ios" ? "py-4" : "py-3"
              }`}
            >
              <CustomText size="xxl" weight="bold" className="text-white">
                {gramsText} g
              </CustomText>
            </View>
          </View>

          {/* Investment Graph */}
          <CustomText size="lg" weight="bold" className="text-white mt-7 mb-3">
            Investment Graph
          </CustomText>

          <View className="bg-[#3B3C16] rounded-3xl p-4 border border-white/10">
            <View className=" rounded-3xl overflow-hidden p-4">
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="rgba(220, 255, 120, 0.30)" />
                  <Stop offset="60%" stopColor="rgba(220, 255, 120, 0.10)" />
                  <Stop offset="100%" stopColor="rgba(220, 255, 120, 0.00)" />
                </LinearGradient>
              </Defs>

              <View className="flex-row">
                <YAxis
                  data={chartData}
                  min={500}
                  max={1000}
                  numberOfTicks={6}
                  contentInset={{ top: 18, bottom: 18 }}
                  svg={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
                  formatLabel={(v) =>
                    `₦${Math.round(v).toLocaleString("en-NG")}`
                  }
                  style={{ marginRight: 10 }}
                />

                <View className="flex-1">
                  <View style={{ height: 200 }}>
                    <AreaChart
                      style={{ height: 200 }}
                      data={chartData}
                      contentInset={{ top: 18, bottom: 18 }}
                      svg={{ fill: "url(#areaGradient)" }}
                    >
                      <Grid
                        direction={Grid.Direction.VERTICAL}
                        svg={{ strokeOpacity: 0.18 }}
                      />
                    </AreaChart>

                    <LineChart
                      style={{
                        height: 200,
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                      }}
                      data={chartData}
                      contentInset={{ top: 18, bottom: 18 }}
                      svg={{
                        strokeWidth: 3,
                        stroke: "rgba(220, 255, 120, 0.70)",
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Tooltip pill */}
              <View className="absolute right-8 top-24 bg-[#2B2C11] border border-white/10 px-4 py-3 rounded-2xl">
                <CustomText size="sm" weight="bold" className="text-[#D9FF85]">
                  ₦13.21
                </CustomText>
                <CustomText size="xs" className="text-white/60 mt-1">
                  20 Feb
                </CustomText>
              </View>
            </View>
          </View>

          <Button
            title=" Confirm ElliStrike"
            onPress={onConfirm}
            variant="primary"
            className="mt-4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
