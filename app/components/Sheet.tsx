import React from "react";
import { View, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onModalHide?: () => void;
  disableSwipe?: boolean;
  position?: "bottom" | "center";
  children: React.ReactNode;
}

const Sheet = ({ visible, onClose, onModalHide, disableSwipe, position = "bottom", children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();
  
  const isCenter = position === "center";
  
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={disableSwipe ? undefined : onClose}
      onModalHide={onModalHide}
      swipeDirection={disableSwipe ? undefined : "down"}
      style={{ margin: isCenter ? 24 : 0, justifyContent: isCenter ? "center" : "flex-end" }}
      backdropOpacity={0.4}
      propagateSwipe
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <View 
          className={`bg-primary-100 px-5 pt-4 ${isCenter ? 'rounded-3xl' : 'rounded-t-3xl'}`}
          style={{ paddingBottom: isCenter ? 32 : Math.max(insets.bottom + 16, 32) }}
        >
          <Pressable onPress={onClose} className="absolute right-4 top-4 z-10">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>

          <View className="mt-6">{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default Sheet;
