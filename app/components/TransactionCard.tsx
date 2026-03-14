import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AccountTransaction } from "@/app/lib/thunks/transferThunks";

interface Props {
  transaction: AccountTransaction;
  onPress?: () => void;
  disabled?: boolean;
}

export default function TransactionCard({
  transaction,
  onPress,
  disabled = false,
}: Props) {
  const router = useRouter();
  const isDebit = transaction.RecordType === "Debit";
  const rawAmount = isDebit ? transaction.Debit : transaction.Credit;
  const amountValue = Number(String(rawAmount || "0").replace(/,/g, "")) || 0;
  const fallbackReceiptData = JSON.stringify({
    amount: amountValue,
    type: transaction.RecordType,
    status: transaction.IsReversed ? "REVERSED" : "SUCCESSFUL",
    sender: "",
    beneficiary: "",
    beneficiaryAccount: "",
    beneficiaryBank: "",
    date: transaction.CurrentDate,
    referenceNo: transaction.ReferenceID || "",
  });

  const formattedDate = transaction.CurrentDate
    ? new Date(transaction.CurrentDate).toLocaleString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const canOpenReceipt = Boolean(transaction.ReferenceID);
  const isDisabled = disabled || !canOpenReceipt;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={() => {
        if (!transaction.ReferenceID) return;

        onPress?.();

        router.push({
          pathname: "/(root)/transaction-details",
          params: {
            reference: transaction.ReferenceID,
            recordType: transaction.RecordType,
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
          {(transaction.Narration || "Transaction").toUpperCase()}
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
