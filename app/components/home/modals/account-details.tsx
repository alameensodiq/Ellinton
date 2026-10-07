import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Share,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Button from "../../Button";
import type { AppDispatch, RootState } from "@/app/lib/store";
import { fetchAccountInfo } from "@/app/lib/thunks/accountThunks";

interface AccountDetailsModalProps {
  visible: boolean;
  onClose: () => void;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    accountInfo,
    isLoading: loading,
    error,
  } = useSelector((state: RootState) => state.accounts);

  const bankName = "Ellington Microfinance Bank";
  const accountNumber = accountInfo?.accountNumber || "";
  const accountHolder = accountInfo?.accountName || "";
  const accountBalance = accountInfo?.accountBalance || 0;

  // ---- COPIED TOAST ANIMATION ----
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setCopied(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setCopied(false));
      }, 1200);
    });
  };

  const copyToClipboard = async () => {
    const details = `Bank: ${bankName}
Account: ${accountNumber}
Holder: ${accountHolder}`;

    await Clipboard.setStringAsync(details);

    showToast();
  };

  const shareDetails = async () => {
    const message = `Bank: ${bankName}\nAccount: ${accountNumber}\nHolder: ${accountHolder}\n`;

    try {
      await Share.share({
        message,
        title: "My Bank Details",
      });
    } catch { }
  };

  // ----------- ERROR UI -----------
  if (error) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
          <View className="flex-1 justify-end">
            <Pressable
              className="bg-primary-100 rounded-t-3xl pb-10 min-h-[500px]"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row items-center justify-center py-5 px-6 border-b border-white/10">
                <Text className="text-lg font-semibold text-white">
                  Details
                </Text>

                <TouchableOpacity
                  onPress={onClose}
                  className="absolute right-6 w-8 h-8 rounded-2xl bg-primary-300 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View className="p-6">
                <Text className="text-2xl font-bold text-white mb-2">
                  Error Fetching Details
                </Text>
                <Text className="text-sm text-red-400 mb-6">{error}</Text>

                <Button
                  variant="primary"
                  title="Retry"
                  onPress={() => dispatch(fetchAccountInfo())}
                />
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    );
  }

  // ----------- MAIN UI -----------
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <View className="flex-1 justify-end">
          <Pressable
            className="bg-primary-100 rounded-t-3xl pb-10 min-h-[500px]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-center py-5 px-6 border-b border-white/10">
              <Text className="text-lg font-semibold text-white">Details</Text>

              <TouchableOpacity
                onPress={onClose}
                className="absolute right-6 w-8 h-8 rounded-2xl bg-primary-300 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="p-6">
              <Text className="text-2xl font-bold text-white mb-2">
                Your bank details
              </Text>
              <Text className="text-sm text-accent-100 mb-6">
                See your account detail below
              </Text>

              {loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#9CA366" />
                  <Text className="text-white mt-2">
                    Loading account info...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Info Block */}
                  <View className="bg-primary-400 rounded-2xl p-5 mb-4">
                    {/* Bank */}
                    <View className="flex-row items-center py-4 border-b border-white/10">
                      <MaterialIcons
                        name="account-balance"
                        size={24}
                        color="#9CA366"
                        style={{ marginRight: 16 }}
                      />
                      <View className="flex-1">
                        <Text className="text-xs text-white mb-1">
                          Bank name
                        </Text>
                        <Text className="text-base font-semibold text-accent-100">
                          {bankName}
                        </Text>
                      </View>
                    </View>

                    {/* Account number */}
                    <View className="flex-row items-center py-4 border-b border-white/10">
                      <MaterialIcons
                        name="credit-card"
                        size={24}
                        color="#9CA366"
                        style={{ marginRight: 16 }}
                      />
                      <View className="flex-1">
                        <Text className="text-xs text-white mb-1">
                          Account number
                        </Text>
                        <Text className="text-base font-semibold text-accent-100">
                          {accountNumber}
                        </Text>
                      </View>
                    </View>

                    {/* Holder */}
                    <View className="flex-row items-center py-4">
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="#9CA366"
                        style={{ marginRight: 16 }}
                      />
                      <View className="flex-1">
                        <Text className="text-xs text-white mb-1">
                          Account holder
                        </Text>
                        <Text className="text-base font-semibold text-accent-100">
                          {accountHolder}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ---- COPY BUTTON + TOAST ---- */}
                  <View className="relative mb-3">
                    <Button
                      variant="primary"
                      title="Copy to clipboard"
                      onPress={copyToClipboard}
                      icon={
                        <Ionicons name="copy-outline" size={20} color="#fff" />
                      }
                    />

                    {copied && (
                      <Animated.View
                        style={{
                          opacity: fadeAnim,
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: [{ translateY: -10 }],
                        }}
                      >
                        <Text className="text-green-300 text-xs font-medium">
                          Copied!
                        </Text>
                      </Animated.View>
                    )}
                  </View>

                  {/* Share */}
                  <Button
                    variant="secondary"
                    title="Share details"
                    onPress={shareDetails}
                    icon={
                      <Ionicons
                        name="share-outline"
                        size={20}
                        color="#1A1A0A"
                      />
                    }
                  />
                </>
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

export default AccountDetailsModal;
