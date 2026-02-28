
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import AmountInput from "@/app/components/inputs/AmountInput";
import Button from "@/app/components/Button";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchGoldPrice } from "@/app/lib/thunks/goldThunks";
import { useRouter } from "expo-router";

import DateTimePicker from "@react-native-community/datetimepicker";

import { AreaChart, LineChart, Grid, YAxis } from "react-native-svg-charts";
import { Defs, LinearGradient, Stop } from "react-native-svg";

type RangeKey = "1D" | "7D" | "1M";

export default function GoldTriggerScreen() {
  const dispatch = useAppDispatch();
  const gold = useAppSelector((s: any) => s.gold);
  const router = useRouter();

  const [range] = useState<RangeKey>("7D");

  // ✅ user types only NGN
  const [amountText, setAmountText] = useState("50,000");

  // ✅ stronger parser (handles commas, spaces, ₦, etc.)
  const toNumber = (s: string) => Number((s || "").replace(/[^\d.]/g, "")) || 0;

  // price per gram (support both shapes)
  const pricePerGramNgn = Number(
    gold?.price?.data?.pricePerGramNgn ?? gold?.price?.pricePerGramNgn ?? 0
  );

  // ✅ expiry date picker
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ✅ temp date for iOS modal
  const [tempDate, setTempDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    if (!gold?.price) dispatch(fetchGoldPrice());
    const id = setInterval(() => dispatch(fetchGoldPrice()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  // ✅ amountRaw is always NGN
  const amountRaw = useMemo(() => {
    return Math.round(toNumber(amountText));
  }, [amountText]);

  // ✅ grams derived from NGN (don’t show fake 0 if price not loaded)
  const gramsText = useMemo(() => {
    if (!pricePerGramNgn) return "--";
    if (amountRaw <= 0) return "0.00";
    return (amountRaw / pricePerGramNgn).toFixed(2);
  }, [amountRaw, pricePerGramNgn]);

  // ✅ chart uses your API correctly:
  // NGN/gram = (USD/TOz ÷ 31.1034768) × usdToNgnRate
  const chartData = useMemo(() => {
    const p = gold?.price?.data ?? gold?.price;

    const usdToNgnRate = Number(p?.usdToNgnRate || 0);
    const lowUsdToz = Number(p?.lowUsd || 0);
    const highUsdToz = Number(p?.highUsd || 0);
    const midNgnPerGram = Number(p?.pricePerGramNgn || 0);

    if (usdToNgnRate && lowUsdToz && highUsdToz && midNgnPerGram) {
      const lowNgnPerGram = (lowUsdToz / 31.1034768) * usdToNgnRate;
      const highNgnPerGram = (highUsdToz / 31.1034768) * usdToNgnRate;

      return [
        lowNgnPerGram,
        (lowNgnPerGram + midNgnPerGram) / 2,
        midNgnPerGram,
        (midNgnPerGram + highNgnPerGram) / 2,
        highNgnPerGram,
      ];
    }

    if (midNgnPerGram) {
      return [
        midNgnPerGram * 0.985,
        midNgnPerGram * 0.995,
        midNgnPerGram,
        midNgnPerGram * 1.005,
        midNgnPerGram * 1.015,
      ];
    }

    if (range === "1D") return [520, 610, 580, 700, 860];
    if (range === "7D") return [520, 560, 600, 640, 700, 760, 820];
    return [520, 560, 590, 650, 700, 740, 780, 820, 850, 880];
  }, [range, gold?.price]);

  const yMin = useMemo(() => Math.min(...chartData) * 0.98, [chartData]);
  const yMax = useMemo(() => Math.max(...chartData) * 1.02, [chartData]);

  const pillPrice = useMemo(() => {
    const v = Number(gold?.price?.data?.pricePerGramNgn || 0);
    return v ? `₦${Math.round(v).toLocaleString("en-NG")}` : "₦0";
  }, [gold?.price]);

  const pillDate = useMemo(() => {
    const ts = gold?.price?.data?.timestamp;
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }, [gold?.price]);

  const onConfirm = () => {
    if (!pricePerGramNgn) {
      Alert.alert("Price not ready", "Gold price is still loading. Try again.");
      return;
    }

    if (amountRaw < 50000) {
      Alert.alert("Minimum amount", "Minimum amount for triggers is ₦50,000");
      return;
    }

    const targetPrice = Math.round(
      Number(
        gold?.price?.data?.pricePerGramNgn ?? gold?.price?.pricePerGramNgn ?? 0
      )
    );

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

  const onPickDate = (_event: any, date?: Date) => {
    // Android popup -> set and close
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (date) setSelectedDate(date);
      return;
    }

    // iOS modal -> update temp only
    if (date) setTempDate(date);
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
            onChangeValue={() => {}}
            sign="₦"
            placeholder="0"
          />

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

          {/* Expiry Date */}
          <CustomText size="lg" weight="bold" className="text-white mt-6 mb-2">
            Expiry Date
          </CustomText>

          <Pressable
            onPress={() => {
              setTempDate(selectedDate);
              setShowDatePicker(true);
            }}
            className="rounded-3xl border border-[#6a6a3a] bg-[#4a4a28] px-4 py-5"
          >
            <CustomText size="lg" weight="bold" className="text-white">
              {selectedDate.toLocaleDateString("en-GB")}
            </CustomText>
          </Pressable>

          {/* ✅ Android: native popup */}
          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onPickDate}
              minimumDate={new Date()}
            />
          )}

          {/* ✅ iOS: modal popup */}
          <Modal
            transparent
            animationType="fade"
            visible={showDatePicker && Platform.OS === "ios"}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable
              onPress={() => setShowDatePicker(false)}
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
            >
              <Pressable
                onPress={() => {}}
                className="absolute left-0 right-0 bottom-0 bg-[#2B2C11] rounded-t-3xl border border-white/10 p-4"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <CustomText
                      size="sm"
                      weight="bold"
                      className="text-white/70"
                    >
                      Cancel
                    </CustomText>
                  </Pressable>

                  <CustomText size="sm" weight="bold" className="text-white">
                    Select date
                  </CustomText>

                  <Pressable
                    onPress={() => {
                      setSelectedDate(tempDate);
                      setShowDatePicker(false);
                    }}
                  >
                    <CustomText
                      size="sm"
                      weight="bold"
                      className="text-[#D9FF85]"
                    >
                      Done
                    </CustomText>
                  </Pressable>
                </View>

                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={onPickDate}
                    minimumDate={new Date()}
                  />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Investment Graph */}
          <CustomText size="lg" weight="bold" className="text-white mt-7 mb-3">
            Investment Graph
          </CustomText>

          <View className="bg-[#3B3C16] rounded-3xl p-4 border border-white/10">
            <View className="rounded-3xl overflow-hidden p-4">
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
                  min={yMin}
                  max={yMax}
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
