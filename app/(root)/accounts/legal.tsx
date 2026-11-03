import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import PrivacyPolicyContent from "@/app/components/PrivacyPolicyContent";
import TermsOfServiceContent from "@/app/components/TermsOfServiceContent";

type LegalTab = "terms" | "privacy" | "regulatory";

export default function LegalAndRegulatoryScreen() {
  const [activeTab, setActiveTab] = useState<LegalTab>("terms");

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <Header title="Legal & Regulatory" />

      {/* Tabs */}
      <View className="px-4 py-2">
        <View className="bg-white p-1 rounded-2xl flex-row border border-gray-200">
          <Pressable
            onPress={() => setActiveTab("terms")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "terms" ? "bg-primary-200" : ""
            }`}
          >
            <Text
              className={`text-xs font-outfit-bold ${
                activeTab === "terms" ? "text-white" : "text-gray-600"
              }`}
            >
              Terms of Use
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("privacy")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "privacy" ? "bg-primary-200" : ""
            }`}
          >
            <Text
              className={`text-xs font-outfit-bold ${
                activeTab === "privacy" ? "text-white" : "text-gray-600"
              }`}
            >
              Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("regulatory")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "regulatory" ? "bg-primary-200" : ""
            }`}
          >
            <Text
              className={`text-xs font-outfit-bold ${
                activeTab === "regulatory" ? "text-white" : "text-gray-600"
              }`}
            >
              CBN & NDIC
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-2"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TERMS OF SERVICE */}
        {activeTab === "terms" && (
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <TermsOfServiceContent />
          </View>
        )}

        {/* PRIVACY POLICY */}
        {activeTab === "privacy" && (
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <PrivacyPolicyContent />
          </View>
        )}

        {/* REGULATORY DISCLOSURES */}
        {activeTab === "regulatory" && (
          <View className="space-y-4">
            {/* CBN License Card */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 rounded-2xl bg-emerald-50 justify-center items-center">
                  <MaterialCommunityIcons name="bank-check" size={26} color="#15803D" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-outfit-bold">
                    Central Bank of Nigeria (CBN)
                  </Text>
                  <Text className="text-emerald-700 text-xs font-outfit-medium">
                    Licensed Microfinance Institution
                  </Text>
                </View>
              </View>

              <Text className="text-gray-600 text-xs font-outfit leading-5 pt-2 border-t border-gray-100">
                Ellington Microfinance Bank is fully licensed and regulated by the Central Bank of Nigeria under the Banks and Other Financial Institutions Act (BOFIA). All deposit-taking activities, capital adequacy, and credit operations adhere strictly to CBN statutory directives.
              </Text>
            </View>

            {/* NDIC Insurance Card */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 rounded-2xl bg-[#EEEEE4] justify-center items-center">
                  <MaterialCommunityIcons name="shield-crown-outline" size={26} color="#3F401B" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-outfit-bold">
                    NDIC Deposit Insurance
                  </Text>
                  <Text className="text-[#3F401B] text-xs font-outfit-medium">
                    Insured by Nigeria Deposit Insurance Corporation
                  </Text>
                </View>
              </View>

              <Text className="text-gray-600 text-xs font-outfit leading-5 pt-2 border-t border-gray-100">
                All eligible customer deposits held with Ellington MFB are insured by the Nigeria Deposit Insurance Corporation (NDIC) up to the maximum regulatory coverage limit per depositor, providing you with absolute safety and peace of mind.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
