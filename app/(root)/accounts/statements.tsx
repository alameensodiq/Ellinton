import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import SuccessModal from "@/app/components/SuccessModal";
import ErrorModal from "@/app/components/ErrorModal";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { requestStatement } from "@/app/lib/thunks/statementsThunks";
import DateTimePicker from "@react-native-community/datetimepicker";

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

type DateRangePreset = "30" | "60" | "90" | "custom";
type FileFormat = "pdf" | "csv";
type DeliveryMethod = "email" | "download" | "in_app";

const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function AccountStatementsScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [preset, setPreset] = useState<DateRangePreset>("30");
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);
  const [format, setFormat] = useState<FileFormat>("pdf");
  const [delivery, setDelivery] = useState<DeliveryMethod>("email");
  const [requesting, setRequesting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectPreset = (days: DateRangePreset) => {
    setPreset(days);
    const now = new Date();
    setEndDate(now);
    if (days === "30") setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    else if (days === "60") setStartDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
    else if (days === "90") setStartDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
  };

  const validateDates = () => {
    if (endDate.getTime() < startDate.getTime()) {
      setErrorMsg("End date must be on or after start date.");
      return false;
    }
    if (endDate.getTime() > Date.now()) {
      setErrorMsg("End date cannot be in the future.");
      return false;
    }
    return true;
  };

  const canSubmit = !!startDate && !!endDate;

  const handleRequestStatement = async () => {
    if (requesting) return;
    if (!validateDates()) return;

    try {
      setRequesting(true);

      const payload = {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      };

      await dispatch(requestStatement(payload)).unwrap();

      setErrorMsg("");
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(typeof err === "string" ? err : err?.message || "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ backgroundColor: C.white, borderColor: C.cardBorder, borderWidth: 1 }} className="rounded-2xl p-5 mb-4 shadow-sm">
      <Text style={{ color: C.textPrimary, fontSize: 13, fontFamily: "OutfitBold", marginBottom: 14 }}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Statements & Receipts" />

      <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <View style={{ backgroundColor: C.bgMid }} className="rounded-2xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center gap-3 mb-2">
            <View style={{ backgroundColor: "rgba(255,255,255,0.1)", width: 40, height: 40, borderRadius: 999, justifyContent: "center", alignItems: "center" }}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={C.white} />
            </View>
            <View>
              <Text className="text-white text-base font-outfit-bold">Generate Statement</Text>
              <Text style={{ color: C.accent }} className="text-xs font-outfit">Official Ellington MFB stamped bank statement</Text>
            </View>
          </View>
          <Text style={{ color: "#a0a87a" }} className="text-xs font-outfit leading-4 mt-1">
            Suitable for visa applications, credit evaluations, auditing, and personal accounting records.
          </Text>
        </View>

        {/* 1. DATE RANGE */}
        <SectionCard title="1. Select Date Range">
          <View className="flex-row gap-2 mb-4 flex-wrap">
            {[{ id: "30", label: "Last 30 Days" }, { id: "60", label: "60 Days" }, { id: "90", label: "90 Days" }, { id: "custom", label: "Custom" }].map((item) => {
              const sel = preset === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectPreset(item.id as DateRangePreset)}
                  style={{ backgroundColor: sel ? C.bgDark : C.inputBg, borderColor: sel ? C.bgDark : C.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center" }}
                >
                  <Text style={{ color: sel ? C.white : C.textSub, fontSize: 11, fontFamily: "OutfitBold" }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-3">
            {[{ label: "Start Date", date: startDate, onOpen: () => { setPreset("custom"); setOpenStartPicker(true); } }, { label: "End Date", date: endDate, onOpen: () => { setPreset("custom"); setOpenEndPicker(true); } }].map((item) => (
              <View key={item.label} style={{ flex: 1 }}>
                <Text style={{ color: C.textSub, fontSize: 11, fontFamily: "Outfit", marginBottom: 6 }}>{item.label}</Text>
                <Pressable onPress={item.onOpen} style={{ backgroundColor: C.inputBg, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: C.textPrimary, fontSize: 12, fontFamily: "OutfitMedium" }}>{formatDate(item.date)}</Text>
                  <MaterialCommunityIcons name="calendar" size={16} color={C.textSub} />
                </Pressable>
              </View>
            ))}
          </View>

          {openStartPicker && (
            <DateTimePicker value={startDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(e, d) => { setOpenStartPicker(false); if (d) setStartDate(d); }} />
          )}
          {openEndPicker && (
            <DateTimePicker value={endDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(e, d) => { setOpenEndPicker(false); if (d) setEndDate(d); }} />
          )}
        </SectionCard>

        {/* 2. FILE FORMAT */}
        <SectionCard title="2. File Format">
          <View className="flex-row gap-3">
            {[
              { id: "pdf", icon: "file-pdf-box", label: "PDF Document", sub: "Official stamp included", selBg: "#FEF2F2", selBorder: "#FCA5A5", selIconColor: "#DC2626", selTextColor: "#7F1D1D" },
              { id: "csv", icon: "file-excel-box", label: "Excel / CSV", sub: "Spreadsheet data", selBg: "#F0FDF4", selBorder: "#86EFAC", selIconColor: "#16A34A", selTextColor: "#14532D" },
            ].map((item) => {
              const sel = format === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFormat(item.id as FileFormat)}
                  style={{
                    flex: 1, padding: 14, borderRadius: 12,
                    backgroundColor: sel ? item.selBg : C.inputBg,
                    borderColor: sel ? item.selBorder : C.cardBorder,
                    borderWidth: 1,
                    flexDirection: "row", alignItems: "center", gap: 10,
                  }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={sel ? item.selIconColor : C.textSub} />
                  <View>
                    <Text style={{ color: sel ? item.selTextColor : C.textPrimary, fontSize: 12, fontFamily: "OutfitBold" }}>{item.label}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 10, fontFamily: "Outfit" }}>{item.sub}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* 3. DELIVERY METHOD */}
        <SectionCard title="3. Delivery Method">
          <View style={{ gap: 10 }}>
            {[
              { id: "email", title: "Send to Registered Email", subtitle: user?.email || "your-email@domain.com", icon: "email-outline" },
              { id: "download", title: "Download to Device", subtitle: "Saves PDF into your downloads folder", icon: "download-outline" },
              { id: "in_app", title: "Instant In-App Viewer", subtitle: "Preview statement on your screen now", icon: "eye-outline" },
            ].map((item) => {
              const sel = delivery === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDelivery(item.id as DeliveryMethod)}
                  style={{
                    padding: 14, borderRadius: 12,
                    backgroundColor: sel ? "#EEEEE4" : C.inputBg,
                    borderColor: sel ? C.accent : C.cardBorder,
                    borderWidth: 1,
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 }}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={sel ? C.bgDark : C.textSub} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.textPrimary, fontSize: 12, fontFamily: "OutfitBold" }}>{item.title}</Text>
                      <Text style={{ color: C.textMuted, fontSize: 10, fontFamily: "Outfit", marginTop: 2 }}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: sel ? C.bgDark : C.white, borderColor: sel ? C.bgDark : C.cardBorder, borderWidth: 1, justifyContent: "center", alignItems: "center" }}>
                    {sel && <MaterialCommunityIcons name="check" size={12} color={C.white} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* CTA */}
        <Button
          title={requesting ? "Requesting..." : "Request statement"}
          variant="primary"
          onPress={handleRequestStatement}
          disabled={!canSubmit || requesting}
        />
      </ScrollView>

      <SuccessModal
        visible={showSuccess}
        title="Statement Generated!"
        message={`Your official bank statement for ${formatDate(startDate)} to ${formatDate(endDate)} has been dispatched to ${user?.email || "your registered email"}.`}
        onDismiss={() => setShowSuccess(false)}
      />
      <ErrorModal visible={!!errorMsg} title="Statement Error" message={errorMsg} onDismiss={() => setErrorMsg("")} />
    </SafeAreaView>
  );
}
