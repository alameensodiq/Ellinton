import React from "react";
import { View, Modal, Dimensions } from "react-native";
import Button from "./Button";
import CustomText from "./CustomText";

const { width } = Dimensions.get("window");

interface ErrorModalProps {
  visible: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  buttonText?: string;
  onDismiss: () => void;
}

const formatModalText = (content: any): React.ReactNode => {
  if (content == null) return "";
  if (typeof content === "string" || typeof content === "number" || typeof content === "boolean") {
    return String(content);
  }
  if (React.isValidElement(content)) {
    return content;
  }
  if (typeof content === "object") {
    if (typeof content.message === "string") return content.message;
    if (typeof content.error === "string") return content.error;
    if (content.message) return formatModalText(content.message);
    try {
      return JSON.stringify(content);
    } catch {
      return String(content);
    }
  }
  return String(content);
};

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = "Error",
  message = "An error occurred",
  buttonText = "OK",
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View
          className="bg-primary-400 rounded-2xl p-6 items-center shadow-lg"
          style={{ width: Math.min(width - 24, 420) }}
        >
          <CustomText weight="bold" size="lg" className="text-center mb-2">
            {formatModalText(title)}
          </CustomText>

          <CustomText size="lg" className="text-center leading-6 mt-4 mb-6">
            {formatModalText(message)}
          </CustomText>

          <Button
            title={buttonText}
            onPress={onDismiss}
            variant="primary"
            className="w-full mt-6 bg-accent-100"
          />
        </View>
      </View>
    </Modal>
  );
};

export default ErrorModal;
