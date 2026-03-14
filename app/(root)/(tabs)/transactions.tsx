import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import SearchBar from "@/app/components/SearchBar";
import TransactionCard from "@/app/components/TransactionCard";
import { AppDispatch, RootState } from "@/app/lib/store";
import { fetchAccountTransactions } from "@/app/lib/thunks/transferThunks";

const groupTransactionsByDate = (transactions: any[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, any[]> = {};

  transactions.forEach((tx) => {
    const txDate = new Date(tx.CurrentDate || tx.TransactionDate);

    if (Number.isNaN(txDate.getTime())) {
      return;
    }

    let groupKey = txDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (txDate.toDateString() === today.toDateString()) {
      groupKey = "Today";
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      groupKey = "Yesterday";
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(tx);
  });

  return groups;
};

const TransactionsLoadingPlaceholder = () => (
  <View className="mt-4">
    <View className="h-4 w-28 rounded-full bg-white/15 mb-4" />

    {[0, 1, 2, 3].map((item) => (
      <View
        key={item}
        className="bg-primary-400 rounded-xl p-4 mb-3 flex-row justify-between items-center"
      >
        <View className="flex-1 mr-3">
          <View className="h-4 w-3/4 rounded-full bg-white/10 mb-3" />
          <View className="h-3 w-1/2 rounded-full bg-white/10" />
        </View>

        <View className="h-4 w-20 rounded-full bg-white/10" />
      </View>
    ))}
  </View>
);

export default function TransactionsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState("");
  const [openingReference, setOpeningReference] = useState<string | null>(null);

  const { transactions, isLoading } = useSelector(
    (state: RootState) => state.transfers
  );

  useEffect(() => {
    dispatch(fetchAccountTransactions());
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      setOpeningReference(null);
    }, [])
  );

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;

    return transactions.filter((tx) =>
      (tx.Narration || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const hasTransactions = filteredTransactions.length > 0;
  const isFetchingTransactions = isLoading && transactions.length === 0;
  const isOpeningTransaction = Boolean(openingReference);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 -mb-16">
      <View className="p-4 flex-1">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-white text-xl font-bold">
            Recent transactions
          </Text>
          <Text className="text-white/60 text-sm">
            Your latest financial activities
          </Text>
        </View>

        <SearchBar onSearch={setSearchQuery} />

        {(isFetchingTransactions || isOpeningTransaction) && (
          <TransactionsLoadingPlaceholder />
        )}

        {!isFetchingTransactions && !isOpeningTransaction && hasTransactions && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <View key={date} className="mb-4">
                <Text className="text-white/70 text-sm font-medium mb-2">
                  {date}
                </Text>

                {transactions.map((transaction, index) => (
                  <TransactionCard
                    key={`${transaction.ReferenceID}-${index}`}
                    transaction={transaction}
                    disabled={isOpeningTransaction}
                    onPress={() =>
                      setOpeningReference(transaction.ReferenceID || "pending")
                    }
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {!isFetchingTransactions && !isOpeningTransaction && !hasTransactions && (
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="receipt-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text className="text-white/60 text-base mt-4">
              No transactions yet
            </Text>
            <Text className="text-white/50 text-sm text-center mt-1">
              Your transaction history will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
