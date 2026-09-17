import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { resolveTransactionDate, parseFlexibleDate } from "@/app/lib/utils";

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
  
  const reduxAccountNumber = useSelector(
    (state: any) =>
      state.auth?.user?.accountNumber ||
      state.auth?.user?.account_number ||
      state.accounts?.accountInfo?.accountNumber
  );
  const [asyncAccountNumber, setAsyncAccountNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!reduxAccountNumber) {
      AsyncStorage.getItem("userAccountNumber").then(setAsyncAccountNumber);
    }
  }, [reduxAccountNumber]);

  const userAccountNumber = reduxAccountNumber || asyncAccountNumber;

  const recordType = String(
    transaction.RecordType || transaction.recordType || transaction.type || transaction.Type || ""
  ).toLowerCase();

  const isDebit =
    recordType.includes("debit") || recordType === "dr"
      ? true
      : recordType.includes("credit") || recordType === "cr"
      ? false
      : Boolean(transaction.Debit && Number(String(transaction.Debit).replace(/,/g, "")) > 0)
      ? true
      : Boolean(transaction.Credit && Number(String(transaction.Credit).replace(/,/g, "")) > 0)
      ? false
      : Boolean(userAccountNumber && transaction.senderAccount && String(transaction.senderAccount) === String(userAccountNumber));

  const rawAmount = transaction.Debit || transaction.Credit || transaction.amount || 0;
  const amountValue = Number(String(rawAmount || "0").replace(/,/g, "")) || 0;

  const referenceId = transaction.ReferenceID || transaction.id || transaction.reference || "";
  const dateStr = resolveTransactionDate(transaction);
  const narration = transaction.Narration || transaction.narration || "Transaction";
  
  const rawStatus = String(
    transaction.status || transaction.Status || transaction.transactionStatus || (transaction.IsReversed ? "REVERSED" : "SUCCESSFUL")
  ).toUpperCase();

  const isFailed = rawStatus === "FAILED" || rawStatus === "FAILURE" || rawStatus === "REJECTED" || rawStatus === "DECLINED";
  const isReversed = rawStatus === "REVERSED" || Boolean(transaction.IsReversed);
  const isPending = rawStatus === "PENDING";
  const displayStatus = isFailed ? "FAILED" : isReversed ? "REVERSED" : isPending ? "PENDING" : "SUCCESSFUL";

  const fallbackReceiptData = JSON.stringify({
    amount: amountValue,
    type: transaction.RecordType || transaction.type || (isDebit ? "Debit" : "Credit"),
    status: displayStatus,
    sender: transaction.senderName || "",
    senderAccount: transaction.senderAccount || "",
    senderBank: transaction.senderBank || "Ellington MFB",
    beneficiary: transaction.receiverName || "",
    beneficiaryAccount: transaction.receiverAccount || "",
    beneficiaryBank: transaction.receiverBank || "Ellington MFB",
    date: dateStr,
    referenceNo: referenceId,
    narration: narration,
  });

  const parsedDate = parseFlexibleDate(dateStr);
  const formattedDate = parsedDate
    ? parsedDate.toLocaleString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : dateStr;

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
      className={`bg-primary-400 rounded-xl p-4 mb-3 flex-row justify-between items-center ${isDisabled ? "opacity-70" : ""
        }`}
    >
      <View className="flex-1 mr-3">
        <Text className="text-white text-sm font-medium">
          {narration.toUpperCase()}
        </Text>

        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          <Text className="text-white/60 text-xs">{formattedDate}</Text>
          {isFailed && (
            <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
              <Text className="text-red-400 text-[10px] font-bold">FAILED</Text>
            </View>
          )}
          {isReversed && (
            <View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              <Text className="text-amber-400 text-[10px] font-bold">REVERSED</Text>
            </View>
          )}
          {isPending && (
            <View className="bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/30">
              <Text className="text-yellow-400 text-[10px] font-bold">PENDING</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        className={`text-sm font-bold ${
          isFailed ? "text-red-400/80" : isDebit ? "text-red-400" : "text-green-400"
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