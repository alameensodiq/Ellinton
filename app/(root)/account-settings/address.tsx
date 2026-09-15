import { View, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import { updateUserAddress, logoutUser } from "@/app/lib/thunks/authThunks";
import { clearError } from "@/app/lib/slices/authSlice";
import { RootState, AppDispatch } from "@/app/lib/store";

const Address = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading: loading } = useSelector(
    (state: RootState) => state.auth
  );
  const [address, setAddress] = useState(user?.address_1 || "");
  const [city, setCity] = useState(user?.city || "Ikeja");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setAddress(user.address_1 || "");
      setCity(user.city || user.local_government || "Ikeja");
    }
  }, [user]);

  const handleSave = async () => {
    if (!address.trim() || !city.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(
        updateUserAddress({
          address_1: address,
          city: city,
        })
      ).unwrap();

      try {
        await AsyncStorage.clear();
        await dispatch(logoutUser()).unwrap();
        await signOut(auth);
        dispatch(clearError());
      } catch (logoutErr) {
        console.error("Logout error following address update:", logoutErr);
      } finally {
        router.replace("/(auth)/current-user");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Failed to update address:", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-2">
      <Header title="My location" />
      <ScrollView
        className="flex-1 px-2 pt-10"
        showsVerticalScrollIndicator={false}
      >
        <TextInputField
          label="Postal/Residential address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your postal/residential address"
          editable={!isSaving}
        />
        <TextInputField
          label="City"
          value={city}
          onChangeText={setCity}
          placeholder="Enter your city"
          editable={!isSaving}
        />
      </ScrollView>
      <View className="pb-4">
        <Button
          title={isSaving ? "Saving..." : "Save"}
          variant="primary"
          onPress={handleSave}
          disabled={isSaving || loading}
        />
      </View>
    </SafeAreaView>
  );
};

export default Address;
