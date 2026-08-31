import React from "react";
import { View, Pressable } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onModalHide?: () => void;
  children: React.ReactNode;
}

const Sheet = ({ visible, onClose, onModalHide, children }: BottomSheetProps) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onModalHide={onModalHide}
      swipeDirection="down"
      style={{ margin: 0, justifyContent: "flex-end" }}
      backdropOpacity={0.4}
      propagateSwipe
    >
      <View className="bg-primary-100 rounded-t-3xl px-5 pt-4 pb-8">
        <Pressable onPress={onClose} className="absolute right-4 top-4 z-10">
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        <View className="mt-6">{children}</View>
      </View>
    </Modal>
  );
};

export default Sheet;
