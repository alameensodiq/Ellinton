import React, { useMemo, useRef, useState } from "react";
import { View, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Sheet from "@/app/components/Sheet";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { searchUsers } from "@/app/lib/thunks/authThunks"; // ✅ change path if yours is different

type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  account_number: string;
};

const LoadingRow = () => (
  <View className="bg-primary-400 rounded-2xl p-4 mb-3 border border-white/10">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-white/10" />
        <View>
          <View className="h-4 w-40 bg-white/10 rounded-md mb-2" />
          <View className="h-3 w-28 bg-white/10 rounded-md" />
        </View>
      </View>
      <View className="w-6 h-6 rounded-full bg-white/10" />
    </View>
  </View>
);

export default function AddFriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, any>>();
  const dispatch = useAppDispatch();

  const [sheetOpen, setSheetOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ApiUser[]>([]);

  const [selected, setSelected] = useState<ApiUser[]>([]);

  const debounceRef = useRef<any>(null);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  const isSelected = (id: string) => selected.some((u) => u.id === id);

  const toggleSelect = (u: ApiUser) => {
    setSelected((prev) => {
      const exists = prev.some((x) => x.id === u.id);
      if (exists) return prev.filter((x) => x.id !== u.id);
      return [...prev, u];
    });
  };

  const removeSelected = (id: string) => {
    setSelected((prev) => prev.filter((x) => x.id !== id));
  };

  const doSearch = (text: string) => {
    const q = text.trim();
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!q) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const data = await dispatch(searchUsers({ search: q }) as any).unwrap();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleContinue = () => {
    const participants = selected.map((u) => ({
      userId: u.id,
      accountNumber: u.account_number,
      userName: u.name,
    }));

    router.push({
      pathname: "/(root)/savings/target",
      params: {
        ...params,
        participants: JSON.stringify(participants),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="px-4 pt-3">
        <View className="flex-row items-center justify-between">
          <ProgressBar currentStep={1} totalSteps={4} />
        </View>

        <CustomText size="lg" weight="bold" className="mt-6">
          Add friends
        </CustomText>

        <CustomText size="sm" secondary className="mt-2">
          The number of the member should not be an issue! You can add as much
          as you can. We do the calculation for you
        </CustomText>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        {/* add / add more */}
        <Pressable
          onPress={openSheet}
          className="border border-white/20 rounded-2xl px-4 py-5 items-center justify-center"
          style={{ borderStyle: "dashed" }}
        >
          <View className="flex-row items-center gap-2">
            <CustomText weight="bold">
              {selected.length ? "Add more" : "Add friends"}
            </CustomText>
            <Ionicons name="add" size={18} color="#fff" />
          </View>
        </Pressable>

        {/* selected list */}
        <View className="mt-5">
          {selected.map((u) => (
            <View
              key={u.id}
              className="bg-primary-400 rounded-2xl p-4 mb-3 border border-white/10"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary-300 items-center justify-center">
                    <Ionicons name="person-outline" size={18} color="#fff" />
                  </View>

                  <View>
                    <CustomText weight="bold">{u.name}</CustomText>
                    <CustomText size="sm" secondary className="mt-1">
                      {u.account_number}
                    </CustomText>
                  </View>
                </View>

                <Pressable onPress={() => removeSelected(u.id)} className="p-2">
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* bottom fixed button */}
      <View className="absolute left-0 right-0 bottom-0 bg-primary-100 px-4 pt-3 pb-8">
        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          disabled={selected.length === 0}
          className="rounded-full"
        />
      </View>

      {/* sheet */}
      <Sheet visible={sheetOpen} onClose={closeSheet}>
        <CustomText size="lg" weight="bold" className="text-center mb-4">
          Add friends
        </CustomText>

        {/* search input */}
        <View className="bg-primary-400 rounded-2xl px-4 py-3 flex-row items-center gap-2 border border-white/10">
          <Ionicons name="search" size={18} color="#fff" />
          <TextInput
            value={query}
            onChangeText={doSearch}
            placeholder="Search by name, phone, account"
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="flex-1 text-white"
            autoCapitalize="none"
          />
        </View>

        <View className="mt-4">
          {isSearching ? (
            <>
              <LoadingRow />
              <LoadingRow />
              <LoadingRow />
            </>
          ) : results.length > 0 ? (
            results.map((u) => {
              const active = isSelected(u.id);

              return (
                <Pressable
                  key={u.id}
                  onPress={() => toggleSelect(u)}
                  className="bg-primary-400 rounded-2xl p-4 mb-3 border border-white/10"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-primary-300 items-center justify-center">
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color="#fff"
                        />
                      </View>

                      <View>
                        <CustomText weight="bold">{u.name}</CustomText>
                        <CustomText size="sm" secondary className="mt-1">
                          {u.account_number}
                        </CustomText>
                      </View>
                    </View>

                    {/* radio */}
                    <View
                      className={`w-7 h-7 rounded-full border items-center justify-center ${
                        active ? "border-primary-200" : "border-white/20"
                      }`}
                    >
                      {active && (
                        <View className="w-4 h-4 rounded-full bg-primary-200" />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : query.trim() ? (
            <CustomText size="sm" secondary className="text-center mt-6">
              No users found
            </CustomText>
          ) : (
            <CustomText size="sm" secondary className="text-center mt-6">
              Search to add friends
            </CustomText>
          )}
        </View>

        <View className="mt-4">
          <Button title="Continue" variant="primary" onPress={closeSheet} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
