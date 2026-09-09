import React, { useEffect } from "react";
import { Text, View, StatusBar, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TransactionReceiptView, {
  ReceiptViewData,
} from "@/app/components/TransactionReceiptView";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { clearTransactionReceipt } from "@/app/lib/slices/transferSlice";
import { fetchSingleTransactionReceipt } from "@/app/lib/thunks/transferThunks";

const ReceiptDetailsSkeleton = ({ onBack }: { onBack: () => void }) => (
  <SafeAreaView className="flex-1 bg-primary-100">
    <StatusBar barStyle="light-content" />

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 rounded-full items-center justify-center bg-primary-400 mt-2"
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View className="w-[100px] h-[100px] mt-4 rounded-2xl bg-white/10 self-start" />

      <View className="bg-primary-400 rounded-2xl p-6 mt-4">
        <View className="h-5 w-28 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-36 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-24 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-40 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-32 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-44 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-52 rounded-full bg-white/10 mb-5" />
        <View className="h-5 w-40 rounded-full bg-white/10" />
      </View>

      <View className="h-12 rounded-2xl bg-white/10 mt-6 mb-8" />
    </ScrollView>
  </SafeAreaView>
);

export default function TransactionDetails() {
  const params = useLocalSearchParams<{
    reference?: string;
    recordType?: string;
    fallbackReceiptData?: string;
  }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { transactionReceipt, isLoading, error } = useAppSelector(
    (state) => state.transfers
  );
  console.log(transactionReceipt)
  const user = useAppSelector((state) => state.auth.user);
  const reference = Array.isArray(params.reference)
    ? params.reference[0]
    : params.reference;
  const recordType = Array.isArray(params.recordType)
    ? params.recordType[0]
    : params.recordType;
  const fallbackReceiptDataParam = Array.isArray(params.fallbackReceiptData)
    ? params.fallbackReceiptData[0]
    : params.fallbackReceiptData;
  let fallbackReceiptData: ReceiptViewData | null = null;

  try {
    fallbackReceiptData = fallbackReceiptDataParam
      ? JSON.parse(fallbackReceiptDataParam)
      : null;
  } catch {
    fallbackReceiptData = null;
  }

  useEffect(() => {
    if (!reference) return;

    dispatch(fetchSingleTransactionReceipt(reference));

    return () => {
      dispatch(clearTransactionReceipt());
    };
  }, [dispatch, reference]);

  if (!reference) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-100 px-6">
        <Text className="text-white text-center">
          No transaction reference was provided.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return <ReceiptDetailsSkeleton onBack={() => router.back()} />;
  }

  if (!transactionReceipt && !fallbackReceiptData && error) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-100 px-6">
        <Text className="text-white text-center">{error}</Text>
      </View>
    );
  }

  if (!transactionReceipt && !fallbackReceiptData) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-100 px-6">
        <Text className="text-white text-center">
          No receipt was found for this transaction.
        </Text>
      </View>
    );
  }

  const receiptData: ReceiptViewData = transactionReceipt
    ? {
      amount: transactionReceipt.amount,
      type: recordType || "Debit",
      status: transactionReceipt.status,
      sender: transactionReceipt.senderName || user?.first_name || "",
      beneficiary: transactionReceipt.receiverName || "",
      beneficiaryAccount: transactionReceipt.receiverAccount || "",
      beneficiaryBank: transactionReceipt.receiverBank || "",
      date: transactionReceipt.date
        ? new Date(transactionReceipt.date).toLocaleString()
        : new Date().toLocaleString(),
      referenceNo: transactionReceipt.reference,
      senderBank: transactionReceipt.senderBank
    }
    : {
      ...fallbackReceiptData!,
      sender: fallbackReceiptData?.sender || user?.first_name || "",
      type: fallbackReceiptData?.type || recordType || "Debit",
      date: fallbackReceiptData?.date
        ? new Date(fallbackReceiptData.date).toLocaleString()
        : new Date().toLocaleString(),
    };

  console.log(transactionReceipt)

  return (
    <TransactionReceiptView
      receiptData={receiptData}
      onBack={() => router.back()}
    />
  );
}
