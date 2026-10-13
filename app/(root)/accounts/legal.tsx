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
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <Text className="text-gray-900 text-base font-outfit-bold">
              Ellington MFB Terms of Service
            </Text>
            <Text className="text-gray-400 text-[11px] font-outfit">
              Last Updated: January 2026 • Effective for all active accounts
            </Text>

            <View className="border-t border-gray-100 pt-3 space-y-3">
              <Text className="text-gray-900 text-xs font-outfit-bold">
                1. Account Creation & Eligibility
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                By maintaining an account with Ellington Microfinance Bank (MFB), you confirm that you are at least 18 years of age and legally eligible to enter into banking contracts under the laws of the Federal Republic of Nigeria. Your identity is verified using Bank Verification Numbers (BVN) and National Identity Numbers (NIN) in compliance with CBN KYC circulars.
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                2. Transaction Limits & Operational Guidelines
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                Transaction ceilings are established according to your verified KYC tier (Tier 1: ₦300,000/day, Tier 2: ₦500,000/day, Tier 3: ₦5,000,000/day). You agree never to use Ellington services for fraudulent transactions, money laundering, terrorist financing, or prohibited online gambling.
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                3. Fee Schedules & Statutory Charges
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                Transfers above ₦10,000 may incur statutory electronic transfer levy and NIP clearing fees as determined by the Central Bank of Nigeria. Voluntary transaction SMS alerts are charged at ₦4.00 per SMS. Account maintenance fees are ₦0.00.
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                4. Security & User Credentials
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                You are solely responsible for maintaining the confidentiality of your 6-digit login passcode, 4-digit transaction PIN, and biometric sensors. Ellington MFB staff will NEVER call, email, or message you requesting your PIN or OTP.
              </Text>
            </View>
          </View>
        )}

        {/* PRIVACY POLICY */}
        {activeTab === "privacy" && (
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <Text className="text-gray-900 text-base font-outfit-bold">
              Data Protection & NDPR Policy
            </Text>
            <Text className="text-gray-400 text-[11px] font-outfit">
              Compliant with Nigeria Data Protection Regulation (NDPR) & NDPA 2023
            </Text>

            <View className="border-t border-gray-100 pt-3 space-y-3">
              <Text className="text-gray-900 text-xs font-outfit-bold">
                1. Information We Collect
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                We collect personal identifiers including legal names, BVN, NIN, facial biometric vectors, phone numbers, email addresses, device identifiers, and location data necessary for anti-fraud heuristics and compliance obligations.
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                2. Processing & Security
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                All data transmission between the mobile application and Ellington servers is protected by end-to-end 256-bit AES encryption, cryptographic HMAC request signatures, and ISO/IEC 27001 data center architectures.
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                3. Regulatory Reporting
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                In compliance with statutory requirements, transaction and KYC records are subject to regulatory examination by the Central Bank of Nigeria (CBN) and the Nigerian Financial Intelligence Unit (NFIU).
              </Text>

              <Text className="text-gray-900 text-xs font-outfit-bold">
                4. Data Subject Rights
              </Text>
              <Text className="text-gray-600 text-xs font-outfit leading-5">
                Under the NDPR, you possess the right to inspect your records, request data portability, object to automated profiling, or request deletion of voluntary marketing profiles.
              </Text>
            </View>
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
