import React from "react";
import { View, Text } from "react-native";
import { AccountTransaction } from "@/app/lib/thunks/transferThunks";

interface Props {
  transaction: AccountTransaction;
}

export default function TransactionCard({ transaction }: Props) {
  const isDebit = transaction.RecordType === "Debit";

  const amountInNaira = transaction.Amount / 100;

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

  return (
    <View className="bg-primary-400 rounded-xl p-4 mb-3 flex-row justify-between items-center">
      <View className="flex-1 mr-3">
        <Text className="text-white text-sm font-medium">
          {transaction.Narration?.toUpperCase()}
        </Text>

        <Text className="text-white/60 text-xs mt-1">{formattedDate}</Text>
      </View>

      <Text
        className={`text-sm font-bold ${
          isDebit ? "text-red-400" : "text-green-400"
        }`}
      >
        {isDebit ? "-" : "+"}₦
        {amountInNaira.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}
      </Text>
    </View>
  );
}
