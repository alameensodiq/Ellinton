import React, { useEffect, useRef, useState } from "react";
import { View, StatusBar, ScrollView, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchGoldSkr } from "@/app/lib/thunks/goldThunks";
import BalanceInfoCard from "@/app/components/home/BalanceInfo";
import CustomText from "@/app/components/CustomText";
import { captureRef } from "react-native-view-shot";

function formatMoneyNGN(value?: string | number) {
  if (value === null || value === undefined) return "-";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "-";
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value?: string | number, maxDecimals = 6) {
  if (value === null || value === undefined) return "-";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

function formatDateYYYYMMDD(dateStr?: string) {
  return dateStr || "-";
}

export default function GoldSkr() {
  const dispatch = useAppDispatch();
  const gold = useAppSelector((s) => s.gold);
  const skr = gold.skr;

  // ✅ ref to the part you want to screenshot
  const receiptViewRef = useRef<View>(null);
  const [sharingNow, setSharingNow] = useState(false);

  useEffect(() => {
    dispatch(fetchGoldSkr() as any);
  }, [dispatch]);

  const handleShareReceipt = async () => {
    try {
      if (!receiptViewRef.current) return;

      if (!skr?.receipt_id) {
        Alert.alert("Unavailable", "Receipt data is not loaded yet.");
        return;
      }

      setSharingNow(true);

      const uri = await captureRef(receiptViewRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await Share.share({
        url: `file://${uri}`,
        message:
          `Secure Gold Vault Receipt\n` +
          `Receipt ID: ${skr.receipt_id}\n` +
          `Issue Date: ${skr.issue_date ?? "-"}\n` +
          `Weight: ${
            skr.weight_grams ? `${formatNumber(skr.weight_grams)} grams` : "-"
          }\n` +
          `Purity: ${skr.purity ?? "-"}\n` +
          `Storage Location: ${skr.storage_location ?? "-"}\n` +
          `Valuation: ${formatMoneyNGN(skr.current_valuation_ngn)}`,
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Failed to capture and share receipt.");
    } finally {
      setSharingNow(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4">
      <StatusBar barStyle="light-content" />
      <Header title="Secure Gold Vault" />

      <BalanceInfoCard
        balance="Secure Gold Vault"
        title="Premium Gold Storage Services"
      />

      <ScrollView className="px-1 pb-8" showsVerticalScrollIndicator={false}>
        {/* ✅ THIS PART IS CAPTURED */}
        <View ref={receiptViewRef} collapsable={false}>
          <View className="rounded-lg bg-primary-400 p-4 mb-4">
            <View className="flex-row justify-between items-center">
              <CustomText secondary className="opacity-80 mb-0">
                Receipt ID
              </CustomText>
              <CustomText weight="bold" className="mb-0">
                {skr?.receipt_id ?? "-"}
              </CustomText>
            </View>

            <View className="flex-row justify-between items-center mt-3">
              <CustomText secondary className="opacity-80 mb-0">
                Issue Date
              </CustomText>
              <CustomText className="mb-0">
                {formatDateYYYYMMDD(skr?.issue_date)}
              </CustomText>
            </View>
          </View>

          <View className="rounded-lg bg-primary-400 p-4 mb-4">
            <CustomText weight="bold" className="mb-3">
              Gold Details
            </CustomText>

            <View className="flex-row justify-between mb-2">
              <CustomText secondary className="opacity-80 mb-0">
                Weight
              </CustomText>
              <CustomText className="mb-0">
                {skr?.weight_grams
                  ? `${formatNumber(skr.weight_grams)} grams`
                  : "-"}
              </CustomText>
            </View>

            <View className="flex-row justify-between mb-2">
              <CustomText secondary className="opacity-80 mb-0">
                Purity
              </CustomText>
              <CustomText className="mb-0">{skr?.purity ?? "-"}</CustomText>
            </View>

            <View className="flex-row justify-between mb-2">
              <CustomText secondary className="opacity-80 mb-0">
                Storage Location
              </CustomText>
              <CustomText className="mb-0">
                {skr?.storage_location ?? "-"}
              </CustomText>
            </View>

            <View className="flex-row justify-between mb-2">
              <CustomText secondary className="opacity-80 mb-0">
                Storage Charges
              </CustomText>
              <CustomText className="mb-0">
                {skr?.storage_charge_per_gram_monthly
                  ? `₦${formatNumber(
                      skr.storage_charge_per_gram_monthly,
                      2
                    )} per gram/month`
                  : "-"}
              </CustomText>
            </View>

            <View className="flex-row justify-between">
              <CustomText secondary className="opacity-80 mb-0">
                Current Valuation
              </CustomText>
              <CustomText weight="bold" className="mb-0">
                {formatMoneyNGN(skr?.current_valuation_ngn)}
              </CustomText>
            </View>
          </View>
        </View>

        <Button
          title={sharingNow ? "Sharing..." : "Share Receipt"}
          variant="primary"
          onPress={handleShareReceipt}
          className="mt-10"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
