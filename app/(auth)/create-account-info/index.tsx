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
import PrivacyPolicyContent from "@/app/components/PrivacyPolicyContent";
import TermsOfServiceContent from "@/app/components/TermsOfServiceContent";
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
    router.push("/(auth)/personal-details");
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
        <PrivacyPolicyContent dark />
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
        <TermsOfServiceContent dark />
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
              {"Read our Privacy Policy →"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTermsOfService}>
            <Text className="text-accent-100 text-md text-left mb-3">
              {"Read our Terms of Service →"}
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
