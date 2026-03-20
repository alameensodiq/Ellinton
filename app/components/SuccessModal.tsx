import React from "react";
import { View, Modal, Dimensions } from "react-native";
import Button from "./Button";
import CustomText from "./CustomText";

const { width } = Dimensions.get("window");

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onDismiss: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title = "Request Successful",
  message = "Your request was completed successfully.",
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View
          className="bg-primary-400 rounded-2xl p-6 items-center shadow-lg"
          style={{ width: Math.min(width - 24, 420) }}
        >
          <CustomText weight="bold" size="lg" className="text-center mb-2">
            {title}
          </CustomText>

          <CustomText size="lg" className="text-center leading-6 mt-4 mb-6">
            {message}
          </CustomText>

          <Button
            title="Done"
            onPress={onDismiss}
            variant="primary"
            className="w-full mt-10"
          />
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;
