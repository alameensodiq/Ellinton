import React from "react";
import { View, ActivityIndicator, Modal } from "react-native";

interface LoadingProps {
  visible: boolean;
}

const Loading: React.FC<LoadingProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-primary-100 rounded-lg p-6">
          <ActivityIndicator size="large" color="white" />
        </View>
      </View>
    </Modal>
  );
};

export default Loading;
