"use client";

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight } = Dimensions.get("window");

const CreateAccountScreen = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [modalContent, setModalContent] = useState<"privacy" | "terms" | null>(
    null
  );

  const handleBack = () => router.back();

  const handlePrivacyPolicy = () => {
    setModalContent("privacy");
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleTermsOfService = () => {
    setModalContent("terms");
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setModalContent(null);
    });
  };

  const handleContinue = () => {
    router.push("/(auth)/phone-number-screen");
  };

  const privacyPolicyContent = (
    <View className="flex-1 bg-primary-100 rounded-t-3xl p-6">
      <View className="flex-row items-center mb-6 relative">
        <Text className="text-xl font-bold text-white text-center flex-1">
          Privacy Policy
        </Text>

        <TouchableOpacity
          onPress={closeModal}
          className="absolute right-0 bg-primary-300 rounded-full p-1"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          <View className="mt-4">
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              Ellington Microfinance Bank
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              ......Do More, Be More
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              RC:7809047
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              At Ellington Bank, your privacy is a priority. This Privacy
              Policy explains how we collect, use, and protect your information
              when you use our mobile application.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              1. Information We Collect
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              To provide banking services, we collect the following types of
              data:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Personal Identifiable Information (PII): Name, email address,
              phone number, and government-issued ID.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Financial Data: Account numbers, transaction history, and
              credit information.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Device Information: IP address, device ID, and operating system
              version.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Location Data: We may collect precise or approximate location
              data to prevent fraudulent logins from unknown areas / help you
              find the nearest branch or partner.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              2. How We Use Your Data
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              We use your information to:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Process transactions and manage your account.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Verify your identity and prevent fraud.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Send real-time alerts and security notifications.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Improve app performance and user experience.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              3. Data Sharing and Third Parties
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              We do not sell your personal information. We only share data with
              third parties when necessary to provide our services, such as:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Payment Processors: To execute transfers and payments.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Security Services: To monitor for fraudulent activity.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Regulatory Bodies: When required by law to comply with
              financial reporting.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              4. Data Retention and Deletion
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              In compliance with the Central Bank of Nigeria (CBN)
              Anti-Money Laundering and Combating the Financing of Terrorism
              (AML/CFT) Regulations, and the CBN Customer Due Diligence (KYC)
              Requirements, Ellington Bank is obligated to retain your personal
              data, transaction records, and KYC information for a period of at
              least five (5) years following the closure of your account or the
              completion of a transaction.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-3">
              User Control & Deletion Requests:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              You may request the deletion of your account and associated data
              at any time through the app settings or by contacting
              support@ellingtonbank.com. Upon receiving such a request:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Account Closure: Your account will be rendered inaccessible for
              transactions and permanently closed.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Data Retention (Legal Hold): While your account will be closed,
              certain personal and transactional data will be securely retained
              by the Bank to fulfill our statutory obligations under the CBN
              AML/CFT and KYC framework.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Permanent Erasure: Once the statutory retention period mandated
              by the CBN has elapsed, and provided there are no other legal or
              regulatory requirements to retain the data, your information will
              be securely and permanently deleted from our systems.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              5. Security Measures
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              As stated in our Terms, we use industry-standard encryption
              (AES-256) and robust firewalls to ensure your hard-earned savings
              and personal data remain intact and protected from unauthorised
              access.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const termsOfServiceContent = (
    <View className="flex-1 bg-primary-100 rounded-t-3xl p-6">
      <View className="flex-row items-center mb-6 relative">
        <Text className="text-xl font-bold text-white text-center flex-1">
          Terms of Service
        </Text>

        <TouchableOpacity
          onPress={closeModal}
          className="absolute right-0 bg-primary-300 rounded-full p-1"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          <View className="mt-4">
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              Ellington Microfinance Bank
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              ......Do More, Be More
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mb-3">
              RC:7809047
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              Welcome to Ellington Bank. By accessing or using our mobile
              application and services, you agree to be bound by these Terms of
              Service. Please read them carefully.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              1. Eligibility and Account Security
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              To use Ellington Bank, you must be at least 18 years old and
              provide accurate, current information during registration.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Your Responsibility: You are solely responsible for maintaining
              the confidentiality of your login credentials.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Unauthorised Access: You must notify us immediately of any
              unauthorised use of your account. As stated in our policy, we
              implement robust firewalls and encryption, but user-side security
              is "in your hands."
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              2. Banking and Investment Procedures
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              All financial transactions, including deposits, funds transfers
              (via NIP, NEFT, or RTGS), and investments, are processed through
              secure, encrypted channels in compliance with the Central Bank of
              Nigeria (CBN) cybersecurity guidelines and the Nigerian Data
              Protection Regulation (NDPR). We employ industry-standard
              encryption protocols to protect your financial data during
              transmission and processing.
            </Text>
            <Text className="text-md font-semibold text-accent-100 mt-4 mb-2">
              Transaction Finality (Irreversibility)
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              By authorising a transaction through the Ellington Bank app (e.g.
              via PIN, biometrics, or password), you acknowledge that
              processing will begin immediately. In line with the CBN
              Guidelines on Instant (Inter-Bank) Payments, once a credit
              transfer has been received by the beneficiary's bank, the
              transaction is considered final and irreversible.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              Note: If you believe a transaction was fraudulent or
              unauthorised, you must report it to our support team immediately
              to initiate the CBN-mandated return process.
            </Text>
            <Text className="text-md font-semibold text-accent-100 mt-4 mb-2">
              Service Availability and System Integrity
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              We strive to provide uninterrupted access to our services 24 hours
              a day, 7 days a week. However, Ellington Bank acts as a
              participant in the national financial infrastructure operated by
              the Nigeria Inter-Bank Settlement System (NIBSS) and other
              switching partners.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              Therefore, we do not guarantee uninterrupted service during:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Scheduled Maintenance: Planned downtime by Ellington Bank,
              NIBSS, or other payment infrastructure providers to enhance
              system integrity.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Force Majeure: Unforeseen technical issues, power outages, or
              disruptions to telecommunications network services
              (GSM/Internet) provided by third-party operators.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Transaction Failures: Delays or failures in transaction
              processing caused by network downtime affecting mobile network
              operators or internet service providers.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              3. Communications and Alerts
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              By using this service, you consent to receive electronic
              communications from us, including:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Real-time Security Alerts: Notifications regarding logins and
              policy changes.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Transaction Updates: Digital receipts and account activity
              logs.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Promotional Content: You may opt out of trends, offers, and
              promotions via the app settings.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              4. User Conduct and Restrictions
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              You agree not to:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Use the service for any illegal activities, including money
              laundering or fraud.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Attempt to bypass our security protocols or reverse-engineer
              the application.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Provide false documentation for identity verification.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              5. Limitation of Liability
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              Ellington Bank provides services "as is." While we use the latest
              encryption technology to keep your data intact, we are not liable
              for losses resulting from:
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • User negligence (e.g., sharing passwords).
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Third-party hardware or internet service failures.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              • Actions taken by regulatory authorities.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              6. Changes to Terms
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              We reserve the right to modify these terms at any time. You will
              be informed of significant changes via an in-app notification or
              email. Continued use of the app after such changes constitutes
              acceptance of the new terms.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-md font-semibold text-accent-100 mb-2">
              7. Governing Law and Jurisdiction
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed">
              These Terms and your use of the Ellington Bank services shall be
              governed by, and construed in accordance with, the laws of the
              Federal Republic of Nigeria, including but not limited to the
              Banks and Other Financial Institutions Act (BOFIA), 2020, the
              Central Bank of Nigeria (CBN) Act, 2007, and all applicable
              circulars, guidelines, and regulations issued by the Central Bank
              of Nigeria.
            </Text>
            <Text className="text-accent-100 text-base leading-relaxed mt-2">
              By using this application, you irrevocably submit to the
              exclusive jurisdiction of the Federal High Court of Nigeria or
              such other applicable courts in Nigeria for the resolution of any
              disputes arising out of or in connection with these Terms.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-white mb-10">
            Create your Ellington Bank personal account in just a few minutes.
            Here's what we'll need from you:
          </Text>
        </View>

        <View className="px-4 space-y-6">
          <View className="flex-row items-start space-x-3 gap-3">
            <View className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center mt-1">
              <Ionicons name="person-outline" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-accent-100 text-lg mb-4">
                Personal Information: We'll ask for some basic details to open
                your account and verify your identity.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start space-x-3 gap-3">
            <View className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center mt-1">
              <Ionicons name="mail-outline" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-accent-100 text-lg mb-4">
                Contact Details: As a branchless bank, we require your contact
                information to keep your account secure. You can complete the
                KYC process once your account is created.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start space-x-3 gap-3">
            <View className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center mt-1">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#fff"
              />
            </View>
            <View className="flex-1">
              <Text className="text-accent-100 text-lg mb-4">
                Verification: Once we validate your details, you'll gain full
                access to Ellington Bank's seamless transactions.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Links */}
        <View className="px-16 mt-8 space-y-2">
          <Text className="text-accent-100 text-md text-left mb-3">
            Need more clarification?
          </Text>
          <TouchableOpacity onPress={handlePrivacyPolicy}>
            <Text className="text-accent-100 text-md text-left mb-3">
              Read our Privacy Policy →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTermsOfService}>
            <Text className="text-accent-100 text-md text-left mb-3">
              Read our Terms of Service →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-4 pb-6">
        <Button
          title="Continue"
          variant="primary"
          onPress={handleContinue}
          className="w-full"
        />
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              height: screenHeight * 0.9,
            }}
          >
            {modalContent === "privacy"
              ? privacyPolicyContent
              : modalContent === "terms"
              ? termsOfServiceContent
              : null}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateAccountScreen;
