import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
  ScrollView,
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
import { cleanNarration } from "@/app/lib/utils";

interface SectionData {
  title: string;
  data: AccountTransaction[];
}

const TRANSACTION_TYPES = [
  { id: "airtime", label: "Airtime" },
  { id: "data", label: "Data" },
  { id: "bill", label: "Bill" },
  { id: "intra-bank", label: "Intra-Bank" },
  { id: "inter-bank", label: "Inter-Bank" },
  { id: "internet", label: "Internet" },
  { id: "betting", label: "Betting" },
  { id: "electricity", label: "Electricity" },
  { id: "cable", label: "Cable" },
  { id: "education", label: "Education" },
  { id: "travel", label: "Travel" },
  { id: "savings", label: "Savings" },
  { id: "utility", label: "Utility" },
  { id: "nip-inflow", label: "NIP Inflow" },
  { id: "stamp-duty", label: "Stamp Duty" },
  { id: "savings-withdrawal", label: "Savings Withdrawal" },
];

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
  <View className="mt-4 flex-1">
    <View className="h-4 w-28 rounded-full bg-white/15 mb-4" />

    {[0, 1, 2, 3, 4, 5].map((item) => (
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

  // Status & Type filter state - empty by default (optional on initial load)
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Date filter state - formatted as YYYY-MM-DD
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

  // Initial load & when status, type or date filters change
  // Note: On initial load, selectedStatus, selectedType, startDate and endDate are empty strings, so they are NOT added to query
  useEffect(() => {
    dispatch(
      fetchAccountTransactions({
        page: 1,
        limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
      })
    );
  }, [dispatch, startDate, endDate, selectedStatus, selectedType]);

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
        status: selectedStatus || undefined,
        type: selectedType || undefined,
      })
    );
  }, [dispatch, startDate, endDate, selectedStatus, selectedType]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isFetchingMore || !hasMoreTransactions) return;
    const nextPage = (currentPage || 1) + 1;
    dispatch(
      fetchAccountTransactions({
        page: nextPage,
        limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
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
    selectedStatus,
    selectedType,
  ]);

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setStartDateObj(null);
    setEndDateObj(null);
  };

  const handleSelectStatus = (statusVal: string) => {
    setSelectedStatus((prev) => (prev === statusVal ? "" : statusVal));
  };

  const handleSelectType = (typeVal: string) => {
    setSelectedType((prev) => (prev === typeVal ? "" : typeVal));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const narration = cleanNarration(tx.Narration || (tx as any).narration || "").toLowerCase();
        if (!narration.includes(q)) return false;
      }

      // 2. Status filter
      if (selectedStatus) {
        const rawStatus = String(
          (tx as any).status || (tx as any).Status || (tx as any).transactionStatus || (tx.IsReversed ? "REVERSED" : "SUCCESSFUL")
        ).toUpperCase();

        if (selectedStatus === "SUCCESSFUL") {
          const isSucc = rawStatus === "SUCCESSFUL" || rawStatus === "SUCCESS" || rawStatus === "COMPLETED" || rawStatus === "OK";
          if (!isSucc && (rawStatus === "FAILED" || rawStatus === "FAILURE" || rawStatus === "REJECTED" || rawStatus === "DECLINED" || tx.IsReversed)) {
            return false;
          }
        } else if (selectedStatus === "FAILED") {
          const isFail = rawStatus === "FAILED" || rawStatus === "FAILURE" || rawStatus === "REJECTED" || rawStatus === "DECLINED";
          if (!isFail) return false;
        }
      }

      // 3. Type filter
      if (selectedType) {
        const normFilter = selectedType.toLowerCase();
        const txType = String((tx as any).type || (tx as any).Type || (tx as any).transactionType || tx.RecordType || "").toLowerCase();
        const narration = cleanNarration(tx.Narration || (tx as any).narration || "").toLowerCase();
        const match =
          txType.includes(normFilter) ||
          narration.includes(normFilter) ||
          normFilter.replace(/-/g, "").includes(txType.replace(/-/g, ""));
        if (!match) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedStatus, selectedType]);

  const sections = useMemo(
    () => groupTransactionsToSections(filteredTransactions),
    [filteredTransactions]
  );

  const hasTransactions = filteredTransactions.length > 0;
  // Loader appears while data is fetching/loading until data load finishes
  const isDataLoading = (isLoading && !isFetchingMore) || Boolean(openingReference);

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
          <View className="bg-primary-400 p-3 rounded-2xl mb-3 border border-primary-300">
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

        {/* Status & Type Filter Section */}
        <View className="mt-3 mb-3 gap-2">
          {/* Status Filter Buttons */}
          <View className="flex-row items-center gap-2">
            <Text className="text-white/60 text-xs font-semibold mr-1">Status:</Text>
            <Pressable
              onPress={() => setSelectedStatus("")}
              className={`px-3 py-1.5 rounded-xl border ${
                !selectedStatus
                  ? "bg-accent-100 border-accent-100"
                  : "bg-primary-400 border-primary-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  !selectedStatus ? "text-primary-100" : "text-white/80"
                }`}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSelectStatus("SUCCESSFUL")}
              className={`px-3 py-1.5 rounded-xl border ${
                selectedStatus === "SUCCESSFUL"
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-primary-400 border-primary-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedStatus === "SUCCESSFUL" ? "text-white" : "text-emerald-400"
                }`}
              >
                SUCCESSFUL
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSelectStatus("FAILED")}
              className={`px-3 py-1.5 rounded-xl border ${
                selectedStatus === "FAILED"
                  ? "bg-red-500 border-red-500"
                  : "bg-primary-400 border-primary-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedStatus === "FAILED" ? "text-white" : "text-red-400"
                }`}
              >
                FAILED
              </Text>
            </Pressable>
          </View>

          {/* Type Filter Chips (Wrapped) */}
          <View className="flex-row flex-wrap gap-2 mt-1">
            <Pressable
              onPress={() => setSelectedType("")}
              className={`px-3 py-1.5 rounded-xl border ${
                !selectedType
                  ? "bg-accent-100 border-accent-100"
                  : "bg-primary-400 border-primary-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  !selectedType ? "text-primary-100" : "text-white/80"
                }`}
              >
                All Types
              </Text>
            </Pressable>

            {TRANSACTION_TYPES.map((t) => {
              const isSelected = selectedType === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => handleSelectType(t.id)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected
                      ? "bg-accent-100 border-accent-100"
                      : "bg-primary-400 border-primary-300"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-primary-100" : "text-white/80"
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isDataLoading && <TransactionsLoadingPlaceholder />}

        {!isDataLoading && hasTransactions && (
          <SectionList
            sections={sections}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyExtractor={(item, index) => {
              const isValid = (val: any) => {
                if (val === null || val === undefined) return false;
                const str = String(val).trim().toLowerCase();
                return (
                  str !== "" &&
                  str !== "null" &&
                  str !== "undefined" &&
                  str !== "n/a" &&
                  str !== "none" &&
                  str !== "0" &&
                  str !== "pending"
                );
              };

              if (isValid(item.ReferenceID)) return String(item.ReferenceID);
              if (isValid(item.UniqueIdentifier)) return String(item.UniqueIdentifier);
              if (isValid((item as any).id)) return String((item as any).id);
              if (isValid((item as any).reference)) return String((item as any).reference);
              if (isValid(item.Id)) return String(item.Id);

              const rawDate = item.CurrentDate || item.TransactionDate || (item as any).date || "";
              const rawAmount = item.Debit || item.Credit || (item as any).amount || "";
              return `tx-${rawDate}-${rawAmount}-${item.Narration || ""}-${index}`;
            }}
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
                disabled={Boolean(openingReference)}
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

        {!isDataLoading && !hasTransactions && (
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
              {startDate || endDate || selectedStatus || selectedType
                ? "Try adjusting your filters"
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

