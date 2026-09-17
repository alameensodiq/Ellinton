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
import { resolveTransactionDate } from "@/app/lib/utils";

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

  const userAccountNumber = (user as any)?.account_number || (user as any)?.accountNumber || "";
  const userFirstName = (user?.first_name || "").trim().toLowerCase();
  const userLastName = (user?.last_name || "").trim().toLowerCase();
  const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

  const isUserParty = (nameStr?: string) => {
    if (!nameStr) return false;
    const lower = nameStr.toLowerCase();
    return (
      (userFirstName && lower.includes(userFirstName)) ||
      (userLastName && lower.includes(userLastName))
    );
  };

  const determineIsDebit = (tx?: any) => {
    const sender = tx?.senderName || tx?.sender || "";
    const receiver = tx?.receiverName || tx?.beneficiaryName || tx?.beneficiary || "";

    if (tx?.senderAccount && userAccountNumber) {
      return tx.senderAccount === userAccountNumber;
    }
    if (tx?.receiverAccount && userAccountNumber) {
      return tx.receiverAccount !== userAccountNumber;
    }
    if (isUserParty(receiver) && !isUserParty(sender)) {
      return false;
    }
    if (isUserParty(sender) && !isUserParty(receiver)) {
      return true;
    }
    if (recordType && recordType !== "undefined") {
      return recordType.toLowerCase().includes("debit");
    }
    if (tx?.type) {
      if (tx.type.toLowerCase().includes("debit")) return true;
      if (tx.type.toLowerCase().includes("credit")) return false;
    }
    return true;
  };

  const isDebit = transactionReceipt
    ? determineIsDebit(transactionReceipt)
    : determineIsDebit(fallbackReceiptData);

  const activeTx: any = transactionReceipt || fallbackReceiptData || {};

  const txSenderName = activeTx.senderName || activeTx.sender || "";
  const txReceiverName = activeTx.receiverName || activeTx.beneficiaryName || activeTx.beneficiary || "";

  const isSenderUser =
    (activeTx.senderAccount && userAccountNumber && activeTx.senderAccount === userAccountNumber) ||
    isUserParty(txSenderName) ||
    (isDebit && !isUserParty(txReceiverName));

  const isReceiverUser =
    (activeTx.receiverAccount && userAccountNumber && activeTx.receiverAccount === userAccountNumber) ||
    isUserParty(txReceiverName) ||
    (!isDebit && !isUserParty(txSenderName));

  const finalSenderName =
    activeTx.senderName ||
    activeTx.sender ||
    (isSenderUser ? userName : "");

  const finalSenderAccount =
    activeTx.senderAccount ||
    (isSenderUser ? userAccountNumber : "");

  const finalBeneficiaryName =
    activeTx.receiverName ||
    activeTx.beneficiaryName ||
    activeTx.beneficiary ||
    (isReceiverUser ? userName : "");

  const finalBeneficiaryAccount =
    activeTx.receiverAccount ||
    activeTx.beneficiaryAccount ||
    (isReceiverUser ? userAccountNumber : "");

  const receiptData: ReceiptViewData = {
    amount: activeTx.amount,
    type: isDebit ? "Debit" : "Credit",
    status: activeTx.status,
    sender: finalSenderName,
    senderAccount: finalSenderAccount,
    senderBank: activeTx.senderBank || "Ellington MFB",
    beneficiary: finalBeneficiaryName,
    beneficiaryAccount: finalBeneficiaryAccount,
    beneficiaryBank: activeTx.receiverBank || activeTx.beneficiaryBank || "Ellington MFB",
    date: resolveTransactionDate(activeTx),
    referenceNo:
      activeTx.reference ||
      activeTx.id ||
      activeTx.referenceNo ||
      reference ||
      "",
    narration:
      activeTx.narration ||
      activeTx.remark ||
      "",
    sessionId: activeTx.sessionId,
  };

  console.log(transactionReceipt)

  return (
    <TransactionReceiptView
      receiptData={receiptData}
      onBack={() => router.back()}
    />
  );
}
