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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../lib/store";
import { logoutUser } from "../lib/thunks/authThunks";
import { useRouter } from "expo-router";

import Sheet from "./Sheet";
import TextInputField from "./inputs/TextInputField";
import Button from "./Button";
import CustomText from "./CustomText";

import { requestStatement } from "../lib/thunks/statementsThunks";

import DateTimePicker from "@react-native-community/datetimepicker";

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
}

interface BottomMenuProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile;
  items?: MenuItem[];
  version: string;
}

const UserProfileSection: React.FC<UserProfile> = ({
  name,
  email,
  avatar = "https://i.pravatar.cc/100",
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
  version = "2.0.0",
}) => {
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

  const defaultListItems: MenuItem[] = [
    {
      id: "2",
      label: "Account settings",
      icon: "cog",
      onPress: () => router.push("/(root)/account-settings"),
    },
    {
      id: "3",
      label: "Request bank statement",
      icon: "file-document",
      onPress: () => {
        onClose();
        setTimeout(() => setStatementSheetOpen(true), 200);
      },
    },
  ];

  const displayListItems = items.length > 0 ? items : defaultListItems;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(screenHeight);
    }
  }, [visible]);

  const handleItemPress = (item: MenuItem) => {
    item.onPress?.();
    onClose();
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    router.replace("/(auth)/current-user");
    onClose();
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
        endDate: formatDate(endDateObj!),
      };

      await dispatch(requestStatement(payload)).unwrap();

      // reset
      setStatementSheetOpen(false);
      setStartDateObj(null);
      setEndDateObj(null);
      setStartErr("");
      setEndErr("");
      setRequestErr("");
    } catch (err: any) {
      setRequestErr(
        typeof err === "string" ? err : err?.message || "Request failed"
      );
    } finally {
      setRequesting(false);
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
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
          <View className="flex-1 justify-end">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View
                className="bg-primary-100 rounded-t-[32px] overflow-hidden"
                style={{
                  transform: [{ translateY: slideAnim }],
                  height: screenHeight * 0.9,
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
                        className={`flex-row items-center px-6 py-4 border-b border-white/10 ${
                          index === displayListItems.length - 1
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
                    Version {version}
                  </Text>
                </ScrollView>
              </Animated.View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ✅ Statement request sheet */}
      <Sheet
        visible={statementSheetOpen}
        onClose={() => setStatementSheetOpen(false)}
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
              onChangeText={() => {}}
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
              onChangeText={() => {}}
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

        {!!requestErr && (
          <Text className="text-red-500 text-sm mb-4">{requestErr}</Text>
        )}

        <Button
          title={requesting ? "Requesting..." : "Request statement"}
          variant="primary"
          onPress={handleRequestStatement}
          disabled={!canSubmit || requesting}
        />

        {/* ✅ Native pickers */}
        {openStartPicker && (
          <DateTimePicker
            value={startDateObj || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              setOpenStartPicker(Platform.OS === "ios"); // keep open on iOS until user closes sheet? (simple)
              if (date) {
                setStartDateObj(date);
                setStartErr("");
                // if endDate exists but now invalid, clear it
                if (endDateObj && endDateObj.getTime() < date.getTime()) {
                  setEndDateObj(null);
                }
              } else {
                setOpenStartPicker(false);
              }
              if (Platform.OS !== "ios") setOpenStartPicker(false);
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
              setOpenEndPicker(Platform.OS === "ios");
              if (date) {
                setEndDateObj(date);
                setEndErr("");
              } else {
                setOpenEndPicker(false);
              }
              if (Platform.OS !== "ios") setOpenEndPicker(false);
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
    </>
  );
};

export default BottomMenu;
