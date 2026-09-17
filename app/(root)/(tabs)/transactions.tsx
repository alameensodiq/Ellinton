import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import DateTimePicker from "@react-native-community/datetimepicker";

import SearchBar from "@/app/components/SearchBar";
import TransactionCard from "@/app/components/TransactionCard";
import { AppDispatch, RootState } from "@/app/lib/store";
import {
  fetchAccountTransactions,
  AccountTransaction,
} from "@/app/lib/thunks/transferThunks";

interface SectionData {
  title: string;
  data: AccountTransaction[];
}

const formatDateToYYYYMMDD = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const groupTransactionsToSections = (
  transactions: AccountTransaction[]
): SectionData[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groupsMap = new Map<string, AccountTransaction[]>();

  transactions.forEach((tx) => {
    const rawDate =
      (tx as any).date ||
      tx.CurrentDate ||
      tx.TransactionDate ||
      tx.TransactionDateString ||
      (tx as any).dateStr ||
      (tx as any).transactionDate ||
      (tx as any).created_at ||
      (tx as any).createdAt;
    const txDate = new Date(rawDate || "");

    let groupKey = "Other";
    if (rawDate && !Number.isNaN(txDate.getTime())) {
      if (txDate.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = txDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            txDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }
    groupsMap.get(groupKey)!.push(tx);
  });

  const sections: SectionData[] = [];
  groupsMap.forEach((data, title) => {
    sections.push({ title, data });
  });

  return sections;
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

  // Date filter state - formatted as YYYY-MM-DD
  // On initial load, startDate and endDate are empty strings, so they are NOT added to query
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Date picker state
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDateFilters, setShowDateFilters] = useState(false);

  const {
    transactions,
    isLoading,
    isFetchingMore,
    hasMoreTransactions,
    currentPage,
  } = useSelector((state: RootState) => state.transfers);

  // Initial load & when date filters change:
  // Note: On initial load, startDate and endDate are empty strings, so only page: 1 is sent in query
  useEffect(() => {
    dispatch(
      fetchAccountTransactions({
        // page: 1,
        // limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
    );
  }, [dispatch, startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      setOpeningReference(null);
    }, [])
  );

  const handleRefresh = useCallback(() => {
    dispatch(
      fetchAccountTransactions({
        page: 1,
        limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
    );
  }, [dispatch, startDate, endDate]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isFetchingMore || !hasMoreTransactions) return;
    const nextPage = (currentPage || 1) + 1;
    dispatch(
      fetchAccountTransactions({
        page: nextPage,
        limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isLoadMore: true,
      })
    );
  }, [
    dispatch,
    isLoading,
    isFetchingMore,
    hasMoreTransactions,
    currentPage,
    startDate,
    endDate,
  ]);

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setStartDateObj(null);
    setEndDateObj(null);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;

    return transactions.filter((tx) =>
      (tx.Narration || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const sections = useMemo(
    () => groupTransactionsToSections(filteredTransactions),
    [filteredTransactions]
  );

  const hasTransactions = filteredTransactions.length > 0;
  const isInitialLoading = isLoading && transactions.length === 0;
  const isOpeningTransaction = Boolean(openingReference);

  return (
    <SafeAreaView className="flex-1 bg-primary-100 -mb-16">
      <View className="p-4 flex-1">
        {/* Header */}
        <View className="mb-3 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-xl font-bold">
              Recent transactions
            </Text>
            <Text className="text-white/60 text-sm">
              Your latest financial activities
            </Text>
          </View>

          <Pressable
            onPress={() => setShowDateFilters(!showDateFilters)}
            className={`p-2.5 rounded-xl border ${startDate || endDate || showDateFilters
              ? "bg-accent-100/20 border-accent-100"
              : "bg-primary-400 border-primary-300"
              }`}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={startDate || endDate || showDateFilters ? "#D4FF00" : "#FFFFFF"}
            />
          </Pressable>
        </View>

        {/* Date Filter Bar */}
        {(showDateFilters || startDate || endDate) && (
          <View className="bg-primary-400 p-3 rounded-2xl mb-4 border border-primary-300">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-xs font-semibold">
                FILTER BY DATE (YYYY-MM-DD)
              </Text>
              {(startDate || endDate) && (
                <Pressable onPress={handleClearDates}>
                  <Text className="text-accent-100 text-xs font-semibold underline">
                    Clear Filter
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row gap-2">
              {/* Start Date Button */}
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-1 bg-primary-100 p-3 rounded-xl border border-primary-300 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-white/50 text-[10px]">Start Date</Text>
                  <Text className="text-white text-xs font-medium mt-0.5">
                    {startDate || "YYYY-MM-DD"}
                  </Text>
                </View>
                <Ionicons name="calendar-sharp" size={16} color="#9ca3af" />
              </Pressable>

              {/* End Date Button */}
              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-1 bg-primary-100 p-3 rounded-xl border border-primary-300 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-white/50 text-[10px]">End Date</Text>
                  <Text className="text-white text-xs font-medium mt-0.5">
                    {endDate || "YYYY-MM-DD"}
                  </Text>
                </View>
                <Ionicons name="calendar-sharp" size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>
        )}

        <SearchBar onSearch={setSearchQuery} />

        {(isInitialLoading || isOpeningTransaction) && (
          <TransactionsLoadingPlaceholder />
        )}

        {!isInitialLoading && !isOpeningTransaction && hasTransactions && (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) =>
              item.ReferenceID ||
              item.UniqueIdentifier ||
              (item.Id ? String(item.Id) : `tx-${index}`)
            }
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-primary-100 pt-3 pb-1">
                <Text className="text-white/70 text-sm font-medium">
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TransactionCard
                transaction={item}
                disabled={isOpeningTransaction}
                onPress={() =>
                  setOpeningReference(item.ReferenceID || "pending")
                }
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading && transactions.length > 0 && !isFetchingMore}
                onRefresh={handleRefresh}
                tintColor="#D4FF00"
              />
            }
            ListFooterComponent={
              isFetchingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#D4FF00" />
                </View>
              ) : null
            }
          />
        )}

        {!isInitialLoading && !isOpeningTransaction && !hasTransactions && (
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="receipt-outline"
              size={64}
              color="rgba(255,255,255,0.3)"
            />
            <Text className="text-white/60 text-base mt-4">
              No transactions found
            </Text>
            <Text className="text-white/50 text-sm text-center mt-1">
              {startDate || endDate
                ? "Try adjusting your date filters"
                : "Your transaction history will appear here"}
            </Text>
          </View>
        )}

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDateObj || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              if (Platform.OS !== "ios") {
                setShowStartPicker(false);
              }
              if (date) {
                setStartDateObj(date);
                setStartDate(formatDateToYYYYMMDD(date));
                if (endDateObj && endDateObj.getTime() < date.getTime()) {
                  setEndDateObj(null);
                  setEndDate("");
                }
              }
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDateObj || startDateObj || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={startDateObj || undefined}
            onChange={(_, date) => {
              if (Platform.OS !== "ios") {
                setShowEndPicker(false);
              }
              if (date) {
                setEndDateObj(date);
                setEndDate(formatDateToYYYYMMDD(date));
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

