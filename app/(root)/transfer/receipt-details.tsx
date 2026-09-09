import React from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import TransactionReceiptView from "@/app/components/TransactionReceiptView";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

export default function ReceiptDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  let receiptPayload;
  try {
    receiptPayload = JSON.parse(params.receiptData as string);
  } catch {
    receiptPayload = null;
  }

  if (!receiptPayload) {
    let transferResult;
    try {
      transferResult = JSON.parse(params.transferResult as string);
    } catch {
      transferResult = null;
    }

    if (transferResult) {
      receiptPayload = {
        amount: transferResult.amount,
        status: transferResult.status,
        sender: transferResult.sender,
        senderBank: transferResult.senderBank || "Ellington Bank",
        beneficiaryName: transferResult.beneficiaryName,
        beneficiaryAccount: transferResult.beneficiaryAccount,
        beneficiaryBankName: transferResult.beneficiaryBankName,
        date: transferResult.date,
        remark: transferResult.remark,
        transactionReference:
          transferResult.transactionReference || transferResult.reference,
      };
    }
  }

  if (!receiptPayload) return <Text>No transfer details available.</Text>;

  return (
    <TransactionReceiptView
      receiptData={{
        amount: receiptPayload.amount,
        type: "Debit",
        status: receiptPayload.status,
        sender: receiptPayload.sender || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "",
        senderAccount: receiptPayload.senderAccount || (user as any)?.account_number || (user as any)?.accountNumber || "",
        senderBank: receiptPayload.senderBank || "Ellington MFB",
        beneficiary: receiptPayload.beneficiaryName || "",
        beneficiaryAccount: receiptPayload.beneficiaryAccount || "",
        beneficiaryBank: receiptPayload.beneficiaryBankName || "",
        date: receiptPayload.date
          ? new Date(receiptPayload.date).toLocaleString()
          : new Date().toLocaleString(),
        referenceNo: receiptPayload.transactionReference || "",
      }}
      onBack={() => router.replace("/(root)/(tabs)")}
    />
  );
}
