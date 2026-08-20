import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AccountTransaction } from "@/app/lib/thunks/transferThunks";

interface Props {
  transaction: any; // Changed from AccountTransaction to any to handle both formats
  onPress?: () => void;
  disabled?: boolean;
}

export default function TransactionCard({
  transaction,
  onPress,
  disabled = false,
}: Props) {
  const router = useRouter();
  
  // Support both old and new API formats
  const isDebit = transaction.RecordType === "Debit" || transaction.type === "inter-bank" || transaction.type === "electricity" || transaction.type === "airtime";
  const rawAmount = transaction.Debit || transaction.Credit || transaction.amount || 0;
  const amountValue = Number(String(rawAmount || "0").replace(/,/g, "")) || 0;
  
  const referenceId = transaction.ReferenceID || transaction.id || "";
  const dateStr = transaction.CurrentDate || transaction.date || new Date().toISOString();
  const narration = transaction.Narration || transaction.narration || "Transaction";
  const status = transaction.IsReversed ? "REVERSED" : (transaction.status || "SUCCESSFUL");

  const fallbackReceiptData = JSON.stringify({
    amount: amountValue,
    type: transaction.RecordType || transaction.type,
    status: status,
    sender: transaction.senderName || "",
    beneficiary: transaction.receiverName || "",
    beneficiaryAccount: transaction.receiverAccount || "",
    beneficiaryBank: transaction.receiverBank || "",
    date: dateStr,
    referenceNo: referenceId,
  });

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
    
  const canOpenReceipt = Boolean(referenceId);
  const isDisabled = disabled || !canOpenReceipt;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={() => {
        if (!referenceId) return;

        onPress?.();

        router.push({
          pathname: "/(root)/transaction-details",
          params: {
            reference: transaction.UniqueIdentifier || transaction.id || referenceId,
            recordType: transaction.RecordType || transaction.type || "Debit",
            fallbackReceiptData,
          },
        });
      }}
      className={`bg-primary-400 rounded-xl p-4 mb-3 flex-row justify-between items-center ${
        isDisabled ? "opacity-70" : ""
      }`}
    >
      <View className="flex-1 mr-3">
        <Text className="text-white text-sm font-medium">
          {narration.toUpperCase()}
        </Text>

        <Text className="text-white/60 text-xs mt-1">{formattedDate}</Text>
      </View>

      <Text
        className={`text-sm font-bold ${
          isDebit ? "text-red-400" : "text-green-400"
        }`}
      >
        {isDebit ? "-" : "+"}₦
        {amountValue.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
        })}
      </Text>
    </TouchableOpacity>
  );
}