import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Platform,
  Switch,
  Alert
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../lib/store";
import { logoutUser, MfaReset } from "../lib/thunks/authThunks";
import { useRouter } from "expo-router";

import Sheet from "./Sheet";
import TextInputField from "./inputs/TextInputField";
import Button from "./Button";
import CustomText from "./CustomText";
import OtpInput from "./inputs/OtpInput";
import ErrorModal from "./ErrorModal";
import SuccessModal from "./SuccessModal";

import { requestStatement } from "../lib/thunks/statementsThunks";

import DateTimePicker from "@react-native-community/datetimepicker";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
}

interface UserProfile {
  avatarColor?: string;
  name: string;
  email: string;
  avatar?: string;
  mfa_required?: boolean;
}

interface BottomMenuProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile;
  items?: MenuItem[];
  version?: string;
}

const UserProfileSection: React.FC<UserProfile> = ({
  name,
  email,
  avatar = "https://i.pravatar.cc/100"
}) => (
  <View className="flex-row items-center mb-10 py-4 gap-3">
    <View className="w-12 h-12 rounded-full overflow-hidden bg-red-500">
      <Image
        source={{ uri: avatar }}
        className="w-full h-full"
        resizeMode="cover"
      />
    </View>
    <View>
      <Text className="text-white text-base">{name}</Text>
      <Text className="text-white/80 text-sm">{email}</Text>
    </View>
  </View>
);

const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const BottomMenu: React.FC<BottomMenuProps> = ({
  visible,
  onClose,
  user,
  items = [],
  version
}) => {
  const resolvedVersion = version || Constants.expoConfig?.version || "2.0.7";
  const screenHeight = Dimensions.get("window").height;
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // ✅ Statement sheet
  const [statementSheetOpen, setStatementSheetOpen] = useState(false);

  // store real dates
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);

  // pickers
  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);

  const [startErr, setStartErr] = useState("");
  const [endErr, setEndErr] = useState("");
  const [requestErr, setRequestErr] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingSuccessModal, setPendingSuccessModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_required ?? false);

  // Transaction Pin Biometric
  const [transBiometric, setTransBiometric] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const TRANS_BIOMETRIC_KEY = "transBiometricEnabled";
  const TRANS_PIN_KEY = "transBiometricPin";

  const defaultListItems: MenuItem[] = [
    {
      id: "2",
      label: "Account settings",
      icon: "cog",
      onPress: () => router.push("/(root)/account-settings")
    },
    {
      id: "overdraft",
      label: "Overdraft",
      icon: "bank-transfer",
      onPress: () => router.push("/(root)/overdraft")
    },
    {
      id: "3",
      label: "Request bank statement",
      icon: "file-document",
      onPress: () => {
        setStatementSheetOpen(true);
      }
    }
  ];

  const displayListItems = items.length > 0 ? items : defaultListItems;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      slideAnim.setValue(screenHeight);
    }
  }, [visible]);

  useEffect(() => {
    setMfaEnabled(user?.mfa_required ?? false);
  }, [user?.mfa_required]);

  // Load transBiometric state from AsyncStorage when menu becomes visible
  useEffect(() => {
    if (visible) {
      const loadTransBiometric = async () => {
        try {
          const stored = await AsyncStorage.getItem(TRANS_BIOMETRIC_KEY);
          if (stored !== null) {
            setTransBiometric(JSON.parse(stored));
          }
        } catch (err: any) {
          console.error("Failed to load transBiometric state:", err);
        }
      };
      loadTransBiometric();
    }
  }, [visible]);

  const handleItemPress = (item: MenuItem) => {
    item.onPress?.();
    onClose();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await dispatch(logoutUser()).unwrap();
      await signOut(auth);
      onClose();

      // 4. Navigate to login screen
      router.replace("/(auth)/current-user");
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const startDateText = useMemo(
    () => (startDateObj ? formatDate(startDateObj) : ""),
    [startDateObj]
  );
  const endDateText = useMemo(
    () => (endDateObj ? formatDate(endDateObj) : ""),
    [endDateObj]
  );

  const canSubmit = useMemo(() => {
    if (!startDateObj || !endDateObj) return false;
    return endDateObj.getTime() >= startDateObj.getTime();
  }, [startDateObj, endDateObj]);

  const validateDates = () => {
    let ok = true;
    setRequestErr("");

    if (!startDateObj) {
      setStartErr("Select start date");
      ok = false;
    } else {
      setStartErr("");
    }

    if (!endDateObj) {
      setEndErr("Select end date");
      ok = false;
    } else {
      setEndErr("");
    }

    if (ok && startDateObj && endDateObj) {
      if (endDateObj.getTime() < startDateObj.getTime()) {
        setEndErr("End date must be after start date");
        ok = false;
      }
    }

    return ok;
  };

  const handleRequestStatement = async () => {
    if (requesting) return;
    if (!validateDates()) return;

    try {
      setRequesting(true);

      const payload = {
        startDate: formatDate(startDateObj!),
        endDate: formatDate(endDateObj!)
      };

      await dispatch(requestStatement(payload)).unwrap();

      // reset
      setStartDateObj(null);
      setEndDateObj(null);
      setStartErr("");
      setEndErr("");
      setRequestErr("");
      setPendingSuccessModal(true);
      setStatementSheetOpen(false);
    } catch (err: any) {
      setRequestErr(
        typeof err === "string" ? err : err?.message || "Request failed"
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleSheetHide = () => {
    if (pendingSuccessModal) {
      setPendingSuccessModal(false);
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);
    }
  };

  const handleMfaToggle = async (value: boolean) => {
    setMfaEnabled(value);
    try {
      await dispatch(
        MfaReset({ enabled: value }) // true = ON, false = OFF
      ).unwrap();
      const existingData = await AsyncStorage.getItem("data");

      if (existingData) {
        const parsedData = JSON.parse(existingData);

        parsedData.mfa_required = value;

        await AsyncStorage.setItem("data", JSON.stringify(parsedData));
      }
    } catch (err) {
      // revert UI if API fails
      setMfaEnabled(!value);
      Alert.alert(
        "MFA Error",
        typeof err === "string" ? err : (err as any)?.message || "MFA update failed"
      );
    }
  };

  const handleTransBiometricToggle = async (value: boolean) => {
    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            "Biometrics Not Available",
            "Please ensure Face ID or Fingerprint authentication is enabled in your device settings."
          );
          setTransBiometric(false);
          return;
        }

        setPinValue("");
        setPinError("");
        setShowPinModal(true);
      } catch (err: any) {
        console.error("Biometrics check error:", err);
        Alert.alert("Error", "Could not verify biometric support on this device.");
        setTransBiometric(false);
      }
    } else {
      try {
        await AsyncStorage.removeItem(TRANS_PIN_KEY);
        await AsyncStorage.setItem(TRANS_BIOMETRIC_KEY, JSON.stringify(false));
        setTransBiometric(false);
      } catch (err: any) {
        console.error("Failed to disable transBiometric:", err);
      }
    }
  };

  const handlePinSubmit = async () => {
    if (pinValue.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }
    try {
      setSavingPin(true);
      await AsyncStorage.setItem(TRANS_PIN_KEY, pinValue);
      await AsyncStorage.setItem(TRANS_BIOMETRIC_KEY, JSON.stringify(true));
      setTransBiometric(true);
      setShowPinModal(false);
      setPinValue("");
      setPinError("");
    } catch (err: any) {
      console.error("Failed to save transaction PIN:", err);
      setPinError("Failed to save PIN. Please try again.");
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={onClose}
          />
          <Animated.View
            className="bg-primary-100 rounded-t-[32px] overflow-hidden"
            style={{
              transform: [{ translateY: slideAnim }],
              height: screenHeight * 0.9
            }}
          >
            <View className="rounded-t-[32px] px-6 py-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-xl">Menu</Text>
                <Pressable
                  onPress={onClose}
                  className="p-2 rounded-full bg-primary-500"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
              <UserProfileSection {...user} />
            </View>

            <ScrollView className="flex-1 px-4">
              <View className="bg-primary-400 rounded-2xl overflow-hidden mt-2">
                {displayListItems.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleItemPress(item)}
                    className={`flex-row items-center px-6 py-4 border-b border-white/10 ${index === displayListItems.length - 1
                        ? "border-b-0"
                        : ""
                      }`}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text className="text-white text-base flex-1 ml-4">
                      {item.label}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </Pressable>
                ))}
              </View>

              <View className="bg-primary-400 rounded-2xl overflow-hidden mt-6">
                <View className="flex-row items-center px-6 py-4">
                  <Text className="text-white text-base flex-1">MFA</Text>

                  <Switch
                    value={mfaEnabled}
                    onValueChange={handleMfaToggle}
                    trackColor={{ false: "#555", true: "#63642A" }}
                    thumbColor={mfaEnabled ? "#fff" : "#ccc"}
                    ios_backgroundColor="#555"
                  />
                </View>
              </View>

              <View className="bg-primary-400 rounded-2xl overflow-hidden mt-6">
                <View className="flex-row items-center px-6 py-4">
                  <Text className="text-white text-base flex-1">Transaction Pin Biometric</Text>

                  <Switch
                    value={transBiometric}
                    onValueChange={handleTransBiometricToggle}
                    trackColor={{ false: "#555", true: "#63642A" }}
                    thumbColor={transBiometric ? "#fff" : "#ccc"}
                    ios_backgroundColor="#555"
                  />
                </View>
              </View>

              <View className="bg-primary-400 rounded-2xl overflow-hidden mt-6">
                <Pressable
                  onPress={handleLogout}
                  className="flex-row items-center px-6 py-4"
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text className="text-white text-base flex-1 ml-4">
                    Logout
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>

              <Text className="text-accent-100 text-sm px-6 pt-8 pb-8">
                Version {resolvedVersion}
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ✅ Statement request sheet */}
      <Sheet
        visible={statementSheetOpen}
        onClose={() => setStatementSheetOpen(false)}
        onModalHide={handleSheetHide}
      >
        <CustomText size="lg" weight="bold" className="text-white mb-2">
          Request bank statement
        </CustomText>

        <CustomText size="sm" secondary className="mb-6">
          Pick your date range.
        </CustomText>

        {/* Start Date (tap to open picker) */}
        <Pressable
          onPress={() => {
            setOpenStartPicker(true);
            setRequestErr("");
            setStartErr("");
          }}
        >
          <View pointerEvents="none">
            <TextInputField
              label="Start date"
              value={startDateText}
              onChangeText={() => { }}
              placeholder="Select start date"
              disabled
              error={startErr}
              rightIcon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={22}
                  color="#fff"
                />
              }
            />
          </View>
        </Pressable>

        {/* End Date (tap to open picker) */}
        <Pressable
          onPress={() => {
            setOpenEndPicker(true);
            setRequestErr("");
            setEndErr("");
          }}
        >
          <View pointerEvents="none">
            <TextInputField
              label="End date"
              value={endDateText}
              onChangeText={() => { }}
              placeholder="Select end date"
              disabled
              error={endErr}
              rightIcon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={22}
                  color="#fff"
                />
              }
            />
          </View>
        </Pressable>

        <Button
          title={requesting ? "Requesting..." : "Request statement"}
          variant="primary"
          onPress={handleRequestStatement}
          disabled={!canSubmit || requesting}
        />

        {/* Native pickers */}
        {openStartPicker && (
          <DateTimePicker
            value={startDateObj || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              if (Platform.OS !== "ios") {
                setOpenStartPicker(false);
              }
              if (date) {
                setStartDateObj(date);
                setStartErr("");
                if (endDateObj && endDateObj.getTime() < date.getTime()) {
                  setEndDateObj(null);
                }
              }
            }}
          />
        )}

        {openEndPicker && (
          <DateTimePicker
            value={endDateObj || startDateObj || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={startDateObj || undefined}
            onChange={(_, date) => {
              if (Platform.OS !== "ios") {
                setOpenEndPicker(false);
              }
              if (date) {
                setEndDateObj(date);
                setEndErr("");
              }
            }}
          />
        )}

        {/* iOS: add a close button for the picker */}
        {Platform.OS === "ios" && (openStartPicker || openEndPicker) && (
          <View className="mt-2">
            <Button
              title="Done"
              variant="primary"
              onPress={() => {
                setOpenStartPicker(false);
                setOpenEndPicker(false);
              }}
            />
          </View>
        )}
      </Sheet>

      <ErrorModal
        visible={!!requestErr}
        title="Statement Request Error"
        message={
          requestErr ||
          "We could not request your statement, give it another shot"
        }
        onDismiss={() => setRequestErr("")}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Statement Requested"
        message="Your bank statement request was submitted successfully."
        onDismiss={() => setShowSuccessModal(false)}
      />

      {/* Transaction PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPinModal(false);
          setPinValue("");
          setPinError("");
        }}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center"
          onPress={() => {
            setShowPinModal(false);
            setPinValue("");
            setPinError("");
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-primary-100 rounded-3xl mx-6 px-6 py-8 w-[90%]"
          >
            <CustomText size="lg" weight="bold" className="text-white text-center mb-2">
              Enter Transaction PIN
            </CustomText>
            <CustomText size="sm" secondary className="text-center mb-6">
              Enter your 4-digit transaction PIN to enable biometric.
            </CustomText>

            <OtpInput
              digitCount={4}
              value={pinValue}
              onChange={(val) => {
                setPinValue(val);
                setPinError("");
              }}
              secure={true}
              autoFocus={true}
              inputStyle="w-14 h-14"
            />

            {pinError ? (
              <Text className="text-red-500 text-sm text-center mt-3">
                {pinError}
              </Text>
            ) : null}

            <View className="mt-6">
              <Button
                title={savingPin ? "Saving..." : "Confirm"}
                variant="primary"
                onPress={handlePinSubmit}
                disabled={pinValue.length !== 4 || savingPin}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default BottomMenu;
