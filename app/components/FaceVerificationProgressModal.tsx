import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";

interface FaceVerificationProgressModalProps {
  visible: boolean;
}

const STATUS_STEPS = [
  "Capturing facial details",
  "Matching your identity",
  "Confirming your selfie",
];

const FaceVerificationProgressModal: React.FC<
  FaceVerificationProgressModalProps
> = ({ visible }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      pulse.setValue(1);
      setStepIndex(0);
      return;
    }

    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.7,
          duration: 850,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.92,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(250),
        Animated.timing(progress, {
          toValue: 0.2,
          duration: 1,
          useNativeDriver: false,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    progressAnimation.start();
    pulseAnimation.start();

    const stepTimer = setInterval(() => {
      setStepIndex((current) => (current + 1) % STATUS_STEPS.length);
    }, 1300);

    return () => {
      clearInterval(stepTimer);
      progressAnimation.stop();
      pulseAnimation.stop();
      progress.setValue(0);
      pulse.setValue(1);
      setStepIndex(0);
    };
  }, [progress, pulse, visible]);

  if (!visible) {
    return null;
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["18%", "92%"],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [1, 1.08],
    outputRange: [1, 1.08],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [1, 1.08],
    outputRange: [0.22, 0.4],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-5">
        <View
          className="bg-primary-400 border border-primary-300 px-6 py-7 items-center"
          style={{ width: "100%", maxWidth: 360, borderRadius: 32 }}
        >
          <View className="items-center justify-center mb-6">
            <Animated.View
              style={{
                position: "absolute",
                width: 112,
                height: 112,
                borderRadius: 56,
                borderWidth: 1,
                borderColor: "rgba(251, 205, 88, 0.45)",
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              }}
            />

            <View
              className="w-24 h-24 rounded-full items-center justify-center border-4"
              style={{
                backgroundColor: "#63642A",
                borderColor: "#D4FF00",
              }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(251, 205, 88, 0.14)" }}
              >
                <Ionicons name="scan-circle-outline" size={34} color="#FBCD58" />
              </View>
            </View>
          </View>

          <CustomText weight="bold" size="xl" className="text-center mb-1">
            Verifying your face
          </CustomText>

          <CustomText
            secondary
            size="sm"
            className="text-center leading-6 mb-6"
          >
            Please keep the app open while we confirm your identity.
          </CustomText>

          <View className="w-full h-3 bg-primary-100 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{ width: progressWidth, backgroundColor: "#FBCD58" }}
            />
          </View>

          <View className="w-full mt-4 rounded-full bg-primary-100 px-4 py-3 flex-row items-center justify-center">
            <View
              className="w-2.5 h-2.5 rounded-full mr-3"
              style={{ backgroundColor: "#21D184" }}
            />
            <CustomText size="sm" className="mb-0 text-center">
              {STATUS_STEPS[stepIndex]}
            </CustomText>
          </View>

          <View className="flex-row items-center justify-center mt-4">
            {STATUS_STEPS.map((_, index) => (
              <View
                key={index}
                className="w-2 h-2 rounded-full mx-1"
                style={{
                  backgroundColor:
                    index === stepIndex ? "#FBCD58" : "rgba(255, 255, 255, 0.2)",
                }}
              />
            ))}
          </View>

          <CustomText secondary size="xs" className="text-center mt-5 mb-0">
            This usually takes a few seconds.
          </CustomText>
        </View>
      </View>
    </Modal>
  );
};

export default FaceVerificationProgressModal;
