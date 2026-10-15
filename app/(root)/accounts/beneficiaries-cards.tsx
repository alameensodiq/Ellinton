import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import BottomSheet from "@/app/components/BottomSheet";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { fetchBeneficiaries, Beneficiary } from "@/app/lib/thunks/beneficiaryThunks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  bgMid: "#4a4b20",
  accent: "#969841",
  gold: "#FBCD58",
  green: "#21D184",
  white: "#FFFFFF",
  cardBorder: "#E8E5DC",
  inputBg: "#FAFAF5",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
  textMuted: "#9A9B7A",
};

type ActiveTab = "beneficiaries" | "cards";

interface LinkedCard {
  id: string;
  brand: "mastercard" | "visa" | "verve";
  last4: string;
  expMonth: string;
  expYear: string;
  bankName: string;
  isDefault?: boolean;
}

const DEFAULT_LINKED_CARDS: LinkedCard[] = [
  { id: "card_1", brand: "mastercard", last4: "4242", expMonth: "08", expYear: "27", bankName: "Guaranty Trust Bank", isDefault: true },
  { id: "card_2", brand: "visa", last4: "8821", expMonth: "11", expYear: "26", bankName: "Access Bank", isDefault: false },
];

export default function BeneficiariesAndCardsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const rawBeneficiaries = useAppSelector((state) => state.beneficiaries.beneficiaries);
  const isLoadingBeneficiaries = useAppSelector((state) => state.beneficiaries.isLoading);

  const [activeTab, setActiveTab] = useState<ActiveTab>("beneficiaries");
  const [searchQuery, setSearchQuery] = useState("");
  const [beneficiariesList, setBeneficiariesList] = useState<Beneficiary[]>([]);
  const [linkedCards, setLinkedCards] = useState<LinkedCard[]>(DEFAULT_LINKED_CARDS);

  const [addCardModal, setAddCardModal] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [editAliasModal, setEditAliasModal] = useState(false);
  const [selectedBen, setSelectedBen] = useState<Beneficiary | null>(null);
  const [aliasName, setAliasName] = useState("");

  useEffect(() => {
    dispatch(fetchBeneficiaries());
    loadCards();
  }, [dispatch]);

  useEffect(() => {
    setBeneficiariesList(rawBeneficiaries ?? []);
  }, [rawBeneficiaries]);

  const loadCards = async () => {
    try {
      const stored = await AsyncStorage.getItem("user_linked_cards");
      if (stored) setLinkedCards(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  const filteredBeneficiaries = beneficiariesList.filter((b) => {
    const q = searchQuery.toLowerCase();
    return b.account_name.toLowerCase().includes(q) || b.account_number.includes(q) || b.bank_name.toLowerCase().includes(q);
  });

  const handleDeleteBeneficiary = (accountNumber: string) => {
    Alert.alert("Delete Beneficiary", "Remove this saved beneficiary?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setBeneficiariesList((p) => p.filter((b) => b.account_number !== accountNumber)) },
    ]);
  };

  const handleOpenEditAlias = (ben: Beneficiary) => { setSelectedBen(ben); setAliasName(ben.account_name); setEditAliasModal(true); };
  const handleSaveAlias = () => {
    if (!selectedBen || !aliasName.trim()) return;
    setBeneficiariesList((p) => p.map((b) => b.account_number === selectedBen.account_number ? { ...b, account_name: aliasName.trim() } : b));
    setEditAliasModal(false);
  };

  const handleAddCard = async () => {
    if (cardNumber.replace(/\s/g, "").length < 16 || !cardExpiry || !cardCvv) { Alert.alert("Validation", "Please enter valid card details."); return; }
    const cleanNumber = cardNumber.replace(/\s/g, "");
    const last4 = cleanNumber.slice(-4);
    const expParts = cardExpiry.split("/");
    const newCard: LinkedCard = {
      id: `card_${Date.now()}`,
      brand: cleanNumber.startsWith("4") ? "visa" : "mastercard",
      last4,
      expMonth: expParts[0] || "12",
      expYear: expParts[1] || "28",
      bankName: "Linked Funding Card",
      isDefault: linkedCards.length === 0,
    };
    const updated = [...linkedCards, newCard];
    setLinkedCards(updated);
    await AsyncStorage.setItem("user_linked_cards", JSON.stringify(updated));
    setAddCardModal(false); setCardHolder(""); setCardNumber(""); setCardExpiry(""); setCardCvv("");
    Alert.alert("Card Added", "Your card has been linked for wallet funding.");
  };

  const handleUnlinkCard = (cardId: string) => {
    Alert.alert("Unlink Card", "Disconnect this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink", style: "destructive",
        onPress: async () => {
          const updated = linkedCards.filter((c) => c.id !== cardId);
          setLinkedCards(updated);
          await AsyncStorage.setItem("user_linked_cards", JSON.stringify(updated));
        },
      },
    ]);
  };

  const inputStyle = {
    backgroundColor: C.inputBg,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 13,
    fontFamily: "Outfit",
    marginBottom: 12,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Saved Beneficiaries & Cards" />

      {/* Tab switcher */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 16, flexDirection: "row", padding: 4 }}>
          {/* {(["beneficiaries", "cards"] as ActiveTab[]).map((tab) => { */}
          {(["beneficiaries"] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  backgroundColor: isActive ? C.bgDark : "transparent",
                }}
              >
                <Text style={{ color: isActive ? C.white : C.textSub, fontSize: 12, fontFamily: "OutfitBold" }}>
                  {tab === "beneficiaries" ? "Saved Beneficiaries" : "Linked Funding Cards"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── BENEFICIARIES TAB ─────────────────────────────────────────────── */}
      {activeTab === "beneficiaries" && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Search bar */}
          <View
            style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <Feather name="search" size={18} color={C.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, bank or account number"
              placeholderTextColor={C.textMuted}
              style={{ flex: 1, marginLeft: 10, fontSize: 12, color: C.textPrimary, fontFamily: "Outfit" }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color={C.textMuted} />
              </Pressable>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {isLoadingBeneficiaries && !rawBeneficiaries ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <ActivityIndicator color={C.accent} />
                <Text style={{ color: C.textMuted, fontSize: 12, fontFamily: "Outfit", marginTop: 10 }}>Loading beneficiaries...</Text>
              </View>
            ) : filteredBeneficiaries.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color={C.cardBorder} />
                <Text style={{ color: C.textMuted, fontSize: 12, fontFamily: "Outfit", marginTop: 10 }}>No beneficiaries found</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {filteredBeneficiaries.map((b) => (
                  <View
                    key={b.account_number}
                    style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: "#EEEEE4", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: C.bgDark, fontSize: 14, fontFamily: "OutfitBold" }}>{b.bank_name ? b.bank_name.charAt(0) : "B"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold" }} numberOfLines={1}>{b.account_name}</Text>
                        <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginTop: 2 }}>{b.bank_name} • {b.account_number}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable onPress={() => handleOpenEditAlias(b)} style={{ padding: 8, borderRadius: 10, backgroundColor: "#EEEEE4" }}>
                        <Feather name="edit-2" size={15} color={C.bgMid} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteBeneficiary(b.account_number)} style={{ padding: 8, borderRadius: 10, backgroundColor: "#FEF2F2" }}>
                        <Feather name="trash-2" size={15} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── CARDS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "cards" && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Quick link to Ellington Cards */}
            <Pressable
              onPress={() => router.push("/(root)/cards" as any)}
              style={{ backgroundColor: C.bgMid, padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" }}>
                  <MaterialCommunityIcons name="credit-card-chip-outline" size={22} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.white, fontSize: 12, fontFamily: "OutfitBold" }}>Ellington Bank Cards</Text>
                  <Text style={{ color: C.accent, fontSize: 11, fontFamily: "Outfit", marginTop: 2 }}>View & manage your virtual and physical debit cards</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={C.gold} />
            </Pressable>

            {/* Info banner */}
            <View style={{ backgroundColor: "#EEEEE4", borderColor: C.cardBorder, borderWidth: 1 }} className="p-4 rounded-2xl flex-row items-center gap-3 mb-4">
              <MaterialCommunityIcons name="credit-card-check-outline" size={24} color={C.bgMid} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.bgDark, fontSize: 12, fontFamily: "OutfitBold" }}>Wallet Auto-Funding</Text>
                <Text style={{ color: C.bgMid, fontSize: 11, fontFamily: "Outfit", marginTop: 2 }}>Linked external debit cards can be used for instant wallet top-ups.</Text>
              </View>
            </View>

            {/* Cards list */}
            <View style={{ gap: 10, marginBottom: 14 }}>
              {linkedCards.map((card) => (
                <View key={card.id} style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialCommunityIcons name={card.brand === "visa" ? "credit-card" : "credit-card-outline"} size={22} color={C.bgMid} />
                      <Text style={{ color: C.textPrimary, fontSize: 12, fontFamily: "OutfitBold", textTransform: "uppercase" }}>{card.brand} Debit</Text>
                    </View>
                    {card.isDefault && (
                      <View style={{ backgroundColor: "rgba(33,209,132,0.12)", borderColor: "rgba(33,209,132,0.35)", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                        <Text style={{ color: "#16a34a", fontSize: 10, fontFamily: "OutfitBold" }}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: C.textPrimary, fontSize: 16, fontFamily: "OutfitBold", letterSpacing: 2, marginBottom: 12 }}>•••• •••• •••• {card.last4}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopColor: C.cardBorder, borderTopWidth: 1, paddingTop: 12 }}>
                    <View>
                      <Text style={{ color: C.textMuted, fontSize: 10, fontFamily: "Outfit" }}>EXPIRES</Text>
                      <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "OutfitMedium" }}>{card.expMonth}/{card.expYear}</Text>
                    </View>
                    <Pressable onPress={() => handleUnlinkCard(card.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Feather name="trash-2" size={13} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontSize: 12, fontFamily: "OutfitBold" }}>Unlink</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Add card */}
            <Pressable
              onPress={() => setAddCardModal(true)}
              style={{ borderColor: C.accent, borderWidth: 2, borderStyle: "dashed", borderRadius: 16, padding: 16, alignItems: "center", backgroundColor: C.white, flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Feather name="plus-circle" size={18} color={C.bgDark} />
              <Text style={{ color: C.bgDark, fontSize: 12, fontFamily: "OutfitBold" }}>Link New Debit Card</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* ADD CARD MODAL */}
      <BottomSheet visible={addCardModal} onClose={() => setAddCardModal(false)} title="Link External Debit Card" buttonText="Add & Verify Card" onConfirm={handleAddCard}>
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginBottom: 4 }}>Cardholder Name</Text>
          <TextInput value={cardHolder} onChangeText={setCardHolder} placeholder="Name on card" placeholderTextColor={C.textMuted} style={inputStyle} />
          <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginBottom: 4 }}>Card Number</Text>
          <TextInput value={cardNumber} onChangeText={setCardNumber} placeholder="0000 0000 0000 0000" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={19} style={inputStyle} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginBottom: 4 }}>Expiry (MM/YY)</Text>
              <TextInput value={cardExpiry} onChangeText={setCardExpiry} placeholder="MM/YY" placeholderTextColor={C.textMuted} maxLength={5} style={inputStyle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginBottom: 4 }}>CVV</Text>
              <TextInput value={cardCvv} onChangeText={setCardCvv} placeholder="123" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={4} secureTextEntry style={inputStyle} />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* EDIT ALIAS MODAL */}
      <BottomSheet visible={editAliasModal} onClose={() => setEditAliasModal(false)} title="Edit Beneficiary Alias" buttonText="Save Alias" onConfirm={handleSaveAlias}>
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ color: C.textSub, fontSize: 12, fontFamily: "Outfit", marginBottom: 12 }}>
            Customise the displayed name for {selectedBen?.bank_name} ({selectedBen?.account_number})
          </Text>
          <TextInput value={aliasName} onChangeText={setAliasName} placeholder="Beneficiary Alias" placeholderTextColor={C.textMuted} style={inputStyle} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
