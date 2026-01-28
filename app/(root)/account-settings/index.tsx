import {
  View,
  Text,
  Image,
  Alert,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/app/components/header-back";
import { Tab, TabBar } from "@/app/components/tabs";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import {
  updateUserProfile,
  getUserProfile,
  forgotPasscode,
} from "@/app/lib/thunks/authThunks";
import { Dropdown } from "@/app/components/inputs/DropdownInputs";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";
import { useRouter } from "expo-router";
import CustomText from "@/app/components/CustomText";
import * as Clipboard from "expo-clipboard";
import BottomSheet from "@/app/components/BottomSheet";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    gender: user?.gender || "",
    address1: user?.address_1 || "",
    city: user?.city || "",
    state: user?.state || "",
    localGovernment: user?.local_government || "",
    dateOfBirth: user?.date_of_birth || "",
  });

  // 🔹 Referral toast animation state
  const [copied, setCopied] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const handleCopyReferral = async () => {
    const code = user?.referral_code || "RJUEGEKNDM";
    await Clipboard.setStringAsync(code);

    setCopied(true);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Fade out after delay
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setCopied(false));
    }, 1500);
  };

  const tabs: Tab[] = [
    { label: "Personal", value: "personal" },
    { label: "Security", value: "security" },
    // { label: "General", value: "general" },
  ];

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        gender: formData.gender || undefined,
      };

      Object.keys(payload).forEach(
        (key) =>
          payload[key as keyof typeof payload] === undefined &&
          delete payload[key as keyof typeof payload]
      );

      const result = await dispatch(updateUserProfile(payload)).unwrap();
      dispatch(getUserProfile());
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditLocation = () => {
    router.push("/(root)/account-settings/address");
  };

  const handleKYC = () => {
    router.push("/(root)/account-settings/kyc");
  };

  const handleResetPasscode = () => {
    setShowResetModal(true);
  };

  const handleChangePasscode = () => {
    router.push("/(root)/account-settings/change-passcode");
  };

  const handleResetTransactionPin = () => {
    // router.push("/(root)/account-settings/reset-transaction-pin");
  };

  const handleChangeTransactionPin = () => {
    router.push("/(root)/account-settings/change-transaction-pin");
  };

  const handleTemporarilyDisable = () => {
    // router.push("/(root)/account-settings/temporarily-disable");
  };

  const handleCloseAccount = () => {
    // router.push("/(root)/account-settings/close-account");
  };

  const email = user?.email as string;

  const handleResetPinConfirm = async () => {
    setShowResetModal(false);
    await dispatch(forgotPasscode({ email })).unwrap();
    router.push("/(root)/account-settings/reset-passcode");
  };

  const renderPersonalTab = () => (
    <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-4 mt-6">
        <Pressable className="mb-2">
          <Image
            source={{
              uri: user?.passport || "https://i.pravatar.cc/100",
            }}
            className="w-24 h-24 rounded-full"
          />
        </Pressable>
        <Text className="text-accent-100 text-sm">Tap to change picture</Text>
      </View>

      <CustomText className="text-center">{`${user?.first_name} ${user?.last_name}`}</CustomText>

      <Pressable
        onPress={handleKYC}
        className="mb-6 bg-primary-400 rounded-2xl p-4 mt-4"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row gap-2">
              <CustomText>KYC Level</CustomText>
              <CustomText className="text-primary-100 font-medium bg-yellow rounded-xl px-2 ">
                Level {user?.kyc_level}
              </CustomText>
            </View>
            <CustomText secondary size="xs" className="text-accent-100 mt-2">
              You are currently on level {user?.kyc_level}
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </Pressable>

      <Dropdown
        label="Gender"
        placeholder="Select gender"
        options={genderOptions}
        selectedValue={formData.gender}
        onSelect={(value) => handleInputChange("gender", value)}
      />

      <View className="mb-6">
        <Text className="text-white text-sm mb-3">
          Postal/Residential Address
        </Text>
        <View className="flex-row items-center justify-between bg-primary-400 rounded-xl p-4 border-2 border-primary-100">
          <Text className="text-white text-base">{formData.address1}</Text>
          <Pressable onPress={handleEditLocation}>
            <Text className="text-accent-100 text-sm">Edit</Text>
          </Pressable>
        </View>
      </View>

      {/* 🔹 REFERRAL CODE + COPY + TOAST */}
      {user?.referral_code && (
        <View className="mb-6">
          <Text className="text-white text-sm mb-3">Referral Code</Text>
          <View className="flex-row items-center justify-between bg-primary-400 rounded-xl p-4 border-2 border-primary-100">
            <Text className="text-white text-base">
              {user?.referral_code || "RJUEGEKNDM"}
            </Text>
            <View className="flex-row items-center">
              {copied && (
                <Animated.Text
                  style={{ opacity: fadeAnim }}
                  className="text-green-300 text-xs mr-2"
                >
                  Copied!
                </Animated.Text>
              )}

              <Pressable onPress={handleCopyReferral}>
                <Ionicons name="copy-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <Button
        title="Save changes"
        variant="primary"
        onPress={handleSaveChanges}
        disabled={isUpdating}
        className="mb-4"
      />
    </ScrollView>
  );

  const renderSecurityTab = () => (
    <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
      <View className="mt-6 mb-6">
        <CustomText className="mb-4">Verified Information</CustomText>
        <View className="bg-primary-400 p-6 rounded-2xl">
          <View className="border-b border-primary-300 py-2">
            <CustomText secondary>Email address</CustomText>
            <CustomText>{user?.email || "olamidebisi@gmail.com"}</CustomText>
          </View>
          <View className="border-b border-primary-300 py-2">
            <CustomText secondary>Phone number</CustomText>
            <CustomText>{user?.phone || "0902311323"}</CustomText>
          </View>
          <View className="border-b border-primary-300 py-2">
            <CustomText secondary>BVN</CustomText>
            <CustomText>{user?.bvn_masked || "***2347"}</CustomText>
          </View>
          <View className="border-b border-primary-300 py-2">
            <CustomText secondary>
              Valid ID (License, NIN, Voter&apos;s Card, International Passport)
            </CustomText>
            <CustomText>Provided</CustomText>
          </View>
          <View className="py-2">
            <CustomText secondary>Utility Bill</CustomText>
            <CustomText>
              {user?.utility_bill_provided ? "Provided" : "Not Provided"}
            </CustomText>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <CustomText className="mb-4">Password & PIN</CustomText>
        <View className="bg-primary-400 rounded-2xl p-4">
          <Pressable
            className="flex-row items-center justify-between py-4 border-b border-primary-300 last:border-b-0"
            onPress={handleResetPasscode}
          >
            <CustomText>Reset Passcode</CustomText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between py-4 border-b border-primary-300 last:border-b-0"
            onPress={handleChangePasscode}
          >
            <CustomText>Change Passcode</CustomText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between py-4 border-b border-primary-300 last:border-b-0"
            onPress={handleChangeTransactionPin}
          >
            <CustomText>Change Transaction PIN</CustomText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* <View className="mb-6">
        <CustomText className="mb-4">Disable Account</CustomText>
        <View className="bg-primary-400 rounded-2xl p-4">
          <Pressable
            className="flex-row items-center justify-between py-4 border-b border-primary-300 last:border-b-0"
            onPress={handleTemporarilyDisable}
          >
            <CustomText>Temporarily disable account</CustomText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between py-4 border-b border-primary-300 last:border-b-0"
            onPress={handleCloseAccount}
          >
            <CustomText>Close account</CustomText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </View> */}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalTab();
      case "security":
        return renderSecurityTab();
      // case "general":
      //   return (
      //     <View className="flex-1 justify-center items-center">
      //       <Text className="text-gray-500 text-base">Coming soon</Text>
      //     </View>
      // );
      default:
        return null;
    }
  };

  const resetModalContent = (
    <CustomText secondary className="text-center text-sm leading-5">
      To reset your passcode, we will send a verification code to your
      registered email address. You will need to provide this code to reset your
      PIN.
    </CustomText>
  );

  return (
    <SafeAreaView className="bg-primary-100 flex-1 px-4">
      <Header title="Account settings" showCancel />
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
      <Loading visible={isUpdating} />

      <BottomSheet
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Passcode reset"
        children={resetModalContent}
        showConfirmButton={true}
        confirmText="Reset PIN"
        onConfirm={handleResetPinConfirm}
        cancelText="Cancel"
        onCancel={() => setShowResetModal(false)}
        hideshowButton={false}
      />
    </SafeAreaView>
  );
};

export default AccountSettings;
