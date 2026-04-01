import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import CustomText from "@/app/components/CustomText";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { logoutUser } from "@/app/lib/thunks/authThunks";
import { clearError } from "@/app/lib/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "@/app/firebase";


const Success = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const firstname = useAppSelector((state) => state.auth.user?.first_name);


const handleClose = async () => {
  try {
    // 1. Logout from your backend
    await dispatch(logoutUser()).unwrap();
    
    // 2. Unregister device from backend
    // await notificationService.unregisterDeviceFromBackend();
    
    // 3. Sign out from Firebase
    await signOut(auth);
    
    // 4. Clear Redux error (dispatch it!)
    dispatch(clearError());
    
    console.log("✅ Logout successful");
    
  } catch (error) {
    console.error("❌ Logout error:", error);
  } finally {
    // Always navigate away
    router.replace("/(auth)/current-user");
  }
};

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-6">
      <View className="flex-row justify-start items-center pt-4 pb-6">
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center space-y-6">
        <Text className="text-8xl text-center mt-10 mb-6">🎉</Text>

        <CustomText size="xxxl" className="mb-6 text-center">
          Passcode updated successfully
        </CustomText>
        <CustomText size="lg" className="mb- text-center" secondary>
          {firstname}, your passcode has been updated, you can now log in to
          your account
        </CustomText>
      </View>

      <View className="pb-6">
        <Button title="Ok" variant="primary" onPress={handleClose} />
      </View>
    </SafeAreaView>
  );
};

export default Success;
