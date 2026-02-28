import React, { useEffect } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import CustomText from "@/app/components/CustomText";
import Header from "@/app/components/header-back";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchGoldTransactionById } from "@/app/lib/thunks/goldThunks";

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const { transactionDetail, isLoading } = useAppSelector(
    (state: any) => state.gold
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchGoldTransactionById({ id }));
    }
  }, [id, dispatch]);

  const transaction = transactionDetail;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4A4B1A]">
        <Header title="Transaction Details" />
        <View className="flex-1 items-center justify-center">
          <CustomText size="base" className="text-white">
            Loading...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-[#4A4B1A]">
        <Header title="Transaction Details" />
        <View className="flex-1 items-center justify-center">
          <CustomText size="base" className="text-white">
            Transaction not found
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  const transactionType = transaction.type === "buy" ? "Gold Purchase" : transaction.type === "sell" ? "Gold Sale" : "Transfer";
  const isPositive = transaction.type === "sell";
  const statusColor = transaction.status === "completed" ? "text-green-400" : transaction.status === "pending" ? "text-yellow-400" : "text-red-400";
  const transactionDate = new Date(transaction.created_at);

  return (
    <SafeAreaView className="flex-1 bg-[#4A4B1A]">
      <Header title="Transaction Details" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pb-10">
          {/* Transaction Header */}
          <View className="bg-[#2E2F12] rounded-3xl p-5 items-center mb-5">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
                isPositive ? "bg-green-900/30" : "bg-red-900/30"
              }`}
            >
              <Ionicons
                name={isPositive ? "arrow-down-outline" : "arrow-up-outline"}
                size={32}
                color={isPositive ? "#4ade80" : "#ef4444"}
              />
            </View>

            <CustomText size="lg" weight="bold" className="text-white mb-2">
              {transactionType}
            </CustomText>

            <CustomText
              size="xxxl"
              weight="bold"
              className={isPositive ? "text-green-400 mb-3" : "text-white mb-3"}
            >
              {isPositive ? "+" : "-"}₦{parseFloat(transaction.amount_ngn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CustomText>

            <View className="flex-row items-center gap-2">
              <View className={`px-3 py-1 rounded-full ${transaction.status === "completed" ? "bg-green-900/30" : transaction.status === "pending" ? "bg-yellow-900/30" : "bg-red-900/30"}`}>
                <CustomText
                  size="sm"
                  weight="bold"
                  className={statusColor}
                >
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Transaction Details */}
          <CustomText size="lg" weight="bold" className="text-white mb-3">
            Transaction Information
          </CustomText>

          <View className="bg-[#5A5B1F] rounded-3xl overflow-hidden mb-5">
            <DetailRow
              label="Transaction ID"
              value={transaction.reference}
              copyable
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Amount (Grams)"
              value={`${parseFloat(transaction.amount_grams).toFixed(8)} gm`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Price per Gram"
              value={`₦${parseFloat(transaction.price_per_gram_ngn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/gm`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Price (USD)"
              value={`$${parseFloat(transaction.price_per_gram_usd).toFixed(2)}/gm`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Date & Time"
              value={transactionDate.toLocaleString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </View>

          {/* Fee & Tax Details */}
          <CustomText size="lg" weight="bold" className="text-white mb-3">
            Fee & Charges
          </CustomText>

          <View className="bg-[#5A5B1F] rounded-3xl overflow-hidden mb-5">
            <DetailRow
              label="Transaction Fee"
              value={`₦${parseFloat(transaction.fee_ngn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Tax"
              value={`₦${parseFloat(transaction.tax_ngn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Storage Charge"
              value={`₦${parseFloat(transaction.storage_charge_ngn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <View className="h-[1px] bg-white/10" />
            <DetailRow
              label="Total Deducted"
              value={`₦${(
                parseFloat(transaction.fee_ngn) +
                parseFloat(transaction.tax_ngn) +
                parseFloat(transaction.storage_charge_ngn)
              ).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
          </View>

          {/* Additional Info */}
          {(transaction.remark || transaction.core_banking_reference) && (
            <>
              <CustomText size="lg" weight="bold" className="text-white mb-3">
                Additional Information
              </CustomText>

              <View className="bg-[#5A5B1F] rounded-3xl overflow-hidden mb-5">
                {transaction.core_banking_reference && (
                  <>
                    <DetailRow
                      label="Banking Reference"
                      value={transaction.core_banking_reference}
                      copyable
                    />
                    <View className="h-[1px] bg-white/10" />
                  </>
                )}
                {transaction.remark && (
                  <DetailRow
                    label="Remark"
                    value={transaction.remark}
                  />
                )}
              </View>
            </>
          )}

      
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <View className="px-5 py-4 flex-row items-center justify-between">
      <CustomText size="sm" className="text-white/60 flex-1">
        {label}
      </CustomText>
      <View className="flex-row items-center gap-2 flex-1 justify-end">
        <CustomText
          size="sm"
          weight="bold"
          className="text-white text-right flex-1"
          numberOfLines={1}
        >
          {value}
        </CustomText>
        {copyable && (
          <Pressable
            onPress={() => {
              // Copy to clipboard functionality
            }}
            hitSlop={10}
          >
            <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
