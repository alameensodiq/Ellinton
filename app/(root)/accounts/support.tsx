import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import BottomSheet from "@/app/components/BottomSheet";
import { useRouter } from "expo-router";

const CUSTOMER_CARE_PHONE = "+234 704 700 7086";
// WhatsApp click-to-chat numbers must be international digits only (no `+`,
// spaces, or punctuation). Including `+` can make WhatsApp reject the link.
const CUSTOMER_CARE_WHATSAPP = "2347042678421";
const SUPPORT_EMAIL = "support@ellingtonbank.com";

interface FAQItem {
  id: string;
  category: "account" | "payments" | "security" | "fees" | "support";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq_account_create",
    category: "account",
    question: "How do I create an account?",
    answer:
      "Download the app, enter your name and phone number, verify your identity with the OTP sent via SMS, set your secure passcode, and you are in!",
  },
  {
    id: "faq_account_number",
    category: "account",
    question: "How do I get my account number?",
    answer:
      "Your account number is automatically generated upon completing your Tier 1 registration.",
  },
  {
    id: "faq_account_upgrade",
    category: "account",
    question: "How do I upgrade my account (Tier 1, 2, and 3)?",
    answer:
      "Go to Profile > Account Limits / Upgrade. To move to Tier 1, provide your BVN and complete a liveness check. To move to higher tiers (Tier 2 and Tier 3), enter your NIN or vNIN, and provide supplementary KYC documents such as a valid government ID and proof of address.",
  },
  {
    id: "faq_account_change_codes",
    category: "account",
    question: "How do I change my passcode or transaction PIN?",
    answer:
      "Navigate to Settings > Security. Select Change Passcode or Change Transaction PIN, enter your current code for verification, and set your new 4-digit or alphanumeric combination.",
  },
  {
    id: "faq_account_forgot_pin",
    category: "account",
    question: "What should I do if I forgot my transaction PIN?",
    answer:
      "Go to Settings > Security and select Forgot Transaction PIN. Follow the verification prompts, such as entering your passcode or OTP, to securely reset your transaction PIN.",
  },
  {
    id: "faq_payments_airtime_data",
    category: "payments",
    question: "How do I buy airtime or data?",
    answer:
      "Tap Airtime / Data on your home dashboard, select your preferred mobile network provider, enter the phone number (or pick from your contacts), choose the bundle or amount, and enter your transaction PIN to complete the purchase.",
  },
  {
    id: "faq_payments_statement",
    category: "payments",
    question: "How do I generate an account statement?",
    answer:
      "Go to your account dashboard, tap Statements or select your account balance to open transaction history. Tap Generate Statement, choose your preferred date range, and select whether you want to export it as a PDF or send it directly to your email.",
  },
  {
    id: "faq_security_data",
    category: "security",
    question: "Is my financial data and money safe on the app?",
    answer:
      "Yes. We use industry-standard encryption, multi-factor authentication (MFA), and secure tokenization to protect your funds and personal information at all times. All deposits are held securely with licensed partner institutions.",
  },
  {
    id: "faq_security_biometrics",
    category: "security",
    question: "How do I enable biometric login (Fingerprint / Face ID)?",
    answer:
      "Go to Settings > Security and toggle on Biometric Login. Follow the on-screen prompts to confirm your device biometrics for quick and secure access.",
  },
  {
    id: "faq_security_lost_phone",
    category: "security",
    question: "What should I do if my phone is lost or stolen?",
    answer:
      "Send an email to our support desk or call any of our support helplines immediately to temporarily freeze your account.",
  },
  {
    id: "faq_fees_charges",
    category: "fees",
    question: "What are the charges and fees for transactions?",
    answer:
      "We do not charge any additional or hidden fees. You only pay standard bank charges and applicable stamp duty as regulated.",
  },
  {
    id: "faq_support_contact",
    category: "support",
    question: "How can I contact customer support?",
    answer:
      "You can reach out to support through our WhatsApp channel, dedicated phone lines, or official support email. Navigate to Account > Help & Support and select the medium you want to use.",
  },
  {
    id: "faq_support_debited_failed",
    category: "support",
    question: "What should I do if my transfer fails or my account was debited for a failed transaction?",
    answer:
      "Failed transactions and transfers are typically reversed automatically within 24 hours. If the reversal does not reflect automatically, reach out to support by navigating to Account > Help & Support > WhatsApp / Phone / Official Email with your transaction reference number.",
  },
];

interface Dispute {
  id: string;
  reference: string;
  amount: string;
  date: string;
  status: "Pending Investigation" | "Resolved" | "Refunded";
  description: string;
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: "disp_1",
    reference: "TRX-994820194",
    amount: "₦15,000.00",
    date: "10 Oct 2026",
    status: "Pending Investigation",
    description: "Inter-bank transfer to GTBank not credited to recipient.",
  },
  {
    id: "disp_2",
    reference: "TRX-883912048",
    amount: "₦3,500.00",
    date: "28 Sep 2026",
    status: "Refunded",
    description: "Airtime purchase failure reversed back to wallet.",
  },
];

export default function HelpAndSupportScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq_account_create");

  // Dispute modal
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeRef, setDisputeRef] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const handleOpenWhatsApp = async () => {
    const whatsappUrl = `whatsapp://send?phone=${CUSTOMER_CARE_WHATSAPP}`;
    const webFallbackUrl = `https://wa.me/${CUSTOMER_CARE_WHATSAPP}`;

    try {
      // Opening the app scheme first avoids the intermediate browser redirect,
      // which is where WhatsApp was showing the incorrect device-date warning.
      await Linking.openURL(whatsappUrl);
    } catch {
      try {
        await Linking.openURL(webFallbackUrl);
      } catch {
        Alert.alert(
          "Unable to open WhatsApp",
          "Please install WhatsApp or contact us by phone or email."
        );
      }
    }
  };

  const handleCall = async () => {
    await Linking.openURL(`tel:${CUSTOMER_CARE_PHONE.replace(/\s/g, "")}`);
  };

  const handleEmail = async () => {
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support Request - Ellington Account`);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogDispute = () => {
    if (!disputeRef.trim() || !disputeReason.trim()) {
      Alert.alert("Validation", "Please enter transaction reference and issue details.");
      return;
    }
    setDisputeModalVisible(false);
    setDisputeRef("");
    setDisputeReason("");
    Alert.alert(
      "Dispute Logged",
      "Your dispute has been submitted to compliance. Ticket ref #DISP-" +
      Math.floor(100000 + Math.random() * 900000)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Help & Support" />

      <ScrollView
        className="flex-1 px-4 py-2"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* QUICK CONTACT CHANNELS */}
        <View className="grid grid-cols-2 gap-3 mb-5">
          <View className="flex-row gap-3">
            {/* Live Chat */}
            {/* <Pressable
              onPress={() => router.push("/(root)/(tabs)/chat")}
              className="flex-1 bg-primary-200 rounded-2xl p-4 shadow-sm active:opacity-90"
            >
              <View className="w-10 h-10 rounded-full bg-white/10 justify-center items-center mb-2">
                <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#FFFFFF" />
              </View>
              <Text className="text-white text-xs font-outfit-bold">In-App Chat</Text>
              <Text className="text-blue-200 text-[10px] font-outfit mt-0.5">
                Chat with live agent
              </Text>
            </Pressable> */}

            {/* WhatsApp */}
            <Pressable
              onPress={handleOpenWhatsApp}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <View className="w-10 h-10 rounded-full bg-emerald-50 justify-center items-center mb-2">
                <MaterialCommunityIcons name="whatsapp" size={20} color="#16A34A" />
              </View>
              <Text className="text-gray-900 text-xs font-outfit-bold">WhatsApp</Text>
              <Text className="text-gray-500 text-[10px] font-outfit mt-0.5">
                Official verified line
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3 mt-1">
            {/* Call */}
            <Pressable
              onPress={handleCall}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <View className="w-10 h-10 rounded-full bg-[#EEEEE4] justify-center items-center mb-2">
                <Feather name="phone-call" size={18} color="#0284C7" />
              </View>
              <Text className="text-gray-900 text-xs font-outfit-bold">Phone Support</Text>
              <Text className="text-gray-500 text-[10px] font-outfit mt-0.5">
                {CUSTOMER_CARE_PHONE}
              </Text>
            </Pressable>

            {/* Email */}
            <Pressable
              onPress={handleEmail}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <View className="w-10 h-10 rounded-full bg-amber-50 justify-center items-center mb-2">
                <MaterialCommunityIcons name="email-outline" size={20} color="#D97706" />
              </View>
              <Text className="text-gray-900 text-xs font-outfit-bold">Official Email</Text>
              <Text className="text-gray-500 text-[10px] font-outfit mt-0.5">
                {SUPPORT_EMAIL}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* DISPUTE RESOLUTION & TRACKER */}
        {/* <View className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-gray-900 text-sm font-outfit-bold">
                Dispute Resolution Tracker
              </Text>
              <Text className="text-gray-500 text-xs font-outfit mt-0.5">
                Monitor status of disputed or pending transfers
              </Text>
            </View>
            <Pressable
              onPress={() => setDisputeModalVisible(true)}
              className="bg-primary-200 px-3 py-1.5 rounded-lg active:opacity-90"
            >
              <Text className="text-white text-[10px] font-outfit-bold">+ New Dispute</Text>
            </Pressable>
          </View>

          <View className="space-y-2.5">
            {MOCK_DISPUTES.map((disp) => (
              <View
                key={disp.id}
                className="bg-[#F8FAFC] rounded-xl p-3 border border-gray-100"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-gray-900 text-xs font-outfit-bold">{disp.reference}</Text>
                  <View
                    className={`px-2 py-0.5 rounded-full ${disp.status === "Refunded"
                      ? "bg-emerald-100"
                      : disp.status === "Resolved"
                        ? "bg-blue-100"
                        : "bg-amber-100"
                      }`}
                  >
                    <Text
                      className={`text-[9px] font-outfit-bold ${disp.status === "Refunded"
                        ? "text-emerald-800"
                        : disp.status === "Resolved"
                          ? "text-blue-800"
                          : "text-amber-800"
                        }`}
                    >
                      {disp.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-700 text-xs font-outfit leading-4">
                  {disp.description}
                </Text>
                <View className="flex-row justify-between items-center mt-2 pt-1 border-t border-gray-200/50">
                  <Text className="text-gray-400 text-[10px] font-outfit">{disp.date}</Text>
                  <Text className="text-gray-900 text-xs font-outfit-bold">{disp.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View> */}

        {/* FAQS & SELF-SERVICE KNOWLEDGE BASE */}
        <Text className="text-gray-900 text-sm font-outfit-bold mb-2 ml-1">
          Frequently Asked Questions (FAQs)
        </Text>

        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-gray-200 mb-3 shadow-sm">
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search FAQs (account, payments, security, fees)"
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-xs text-gray-900 font-outfit"
          />
        </View>

        {/* Category Pills */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[
            { id: "all", label: "All" },
            { id: "account", label: "Account" },
            { id: "payments", label: "Payments" },
            { id: "security", label: "Security" },
            { id: "fees", label: "Fees" },
            { id: "support", label: "Support" },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full border ${isSelected
                  ? "bg-primary-200 border-primary-200"
                  : "bg-white border-gray-200"
                  }`}
              >
                <Text
                  className={`text-[11px] font-outfit-medium ${isSelected ? "text-white" : "text-gray-700"
                    }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* FAQ Accordion */}
        <View className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <Pressable
                key={faq.id}
                onPress={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-900 text-xs font-outfit-bold flex-1 mr-2">
                    {faq.question}
                  </Text>
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#64748B"
                  />
                </View>
                {isExpanded && (
                  <Text className="text-gray-600 text-xs font-outfit mt-2 pt-2 border-t border-gray-100 leading-5">
                    {faq.answer}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* DISPUTE LOGGING MODAL */}
      {/* <BottomSheet
        visible={disputeModalVisible}
        onClose={() => setDisputeModalVisible(false)}
        title="Report Transaction Issue"
        buttonText="Submit Dispute Ticket"
        onConfirm={handleLogDispute}
      >
        <View className="py-2 space-y-3">
          <View>
            <Text className="text-gray-700 text-xs font-outfit-medium mb-1">
              Transaction Reference / Session ID
            </Text>
            <TextInput
              value={disputeRef}
              onChangeText={setDisputeRef}
              placeholder="e.g. TRX-1092847192"
              placeholderTextColor="#94A3B8"
              className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-outfit"
            />
          </View>

          <View>
            <Text className="text-gray-700 text-xs font-outfit-medium mb-1">
              Description of Problem
            </Text>
            <TextInput
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="Explain what happened (e.g. Debited but beneficiary not credited)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-outfit h-20"
            />
          </View>
        </View>
      </BottomSheet> */}
    </SafeAreaView>
  );
}
