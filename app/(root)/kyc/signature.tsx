import { View, Text, Alert } from "react-native";
import React, { useRef, useState } from "react";
import ProgressBar from "@/app/components/ProgressBar";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Svg, { Path } from "react-native-svg";
import { PanResponder } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import ViewShot from "react-native-view-shot";
import { captureSignature } from "@/app/lib/thunks/kycThunks";

const signature = () => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  const pathsRef = useRef<string[]>([]);
  const currentPathRef = useRef("");
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const commitCurrentPath = () => {
    if (!currentPathRef.current) return;

    const nextPaths = [...pathsRef.current, currentPathRef.current];
    pathsRef.current = nextPaths;
    setPaths(nextPaths);
    currentPathRef.current = "";
    setCurrentPath("");
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const locationX = event.nativeEvent.locationX;
        const locationY = event.nativeEvent.locationY;
        const nextPath = `M${locationX},${locationY}`;
        currentPathRef.current = nextPath;
        setCurrentPath(nextPath);
      },
      onPanResponderMove: (event) => {
        const locationX = event.nativeEvent.locationX;
        const locationY = event.nativeEvent.locationY;
        currentPathRef.current = `${currentPathRef.current} L${locationX},${locationY}`;
        setCurrentPath(currentPathRef.current);
      },
      onPanResponderRelease: commitCurrentPath,
      onPanResponderTerminate: commitCurrentPath,
    })
  ).current;

  const handleClear = () => {
    pathsRef.current = [];
    setPaths([]);
    currentPathRef.current = "";
    setCurrentPath("");
  };

  const handleSubmit = async () => {
    if (paths.length === 0 && !currentPath) {
      Alert.alert("Error", "Please provide your signature before submitting");
      return;
    }

    try {
      setIsLoading(true);

      // Capture the signature as base64 image
      const uri = await viewShotRef.current?.capture?.();

      if (!uri) {
        Alert.alert("Error", "Failed to capture signature");
        return;
      }

      const base64Signature = uri;

      const result = await dispatch(
        captureSignature({ signature: base64Signature })
      ).unwrap();

      Alert.alert(
        "Success",
        result.message || "Signature captured successfully"
      );

      router.push("/(root)/kyc/summary");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error || "Failed to submit signature. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100 px-4 pt-4">
      <ProgressBar currentStep={3} totalSteps={4} />
      <CustomText size="xl" className="mt-4 mb-6">
        Capture Signature
      </CustomText>

      <View className="flex-1">
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0, result: "data-uri" }}
        >
          <View
            className="bg-primary-400 rounded-2xl mb-4"
            style={{ height: 300 }}
            {...panResponder.panHandlers}
          >
            <Svg height="100%" width="100%">
              {paths.map((path, index) => (
                <Path
                  key={index}
                  d={path}
                  stroke="#ffffff"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath && (
                <Path
                  d={currentPath}
                  stroke="#ffffff"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
          </View>
        </ViewShot>

        <View className="mb-4">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">💡</Text>
            <CustomText secondary className="flex-1">
              use your fingers to draw your signature on the space above
            </CustomText>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mb-10">
        <View className="flex-1">
          <Button
            title="Clear"
            variant="secondary"
            onPress={handleClear}
            disabled={isLoading}
          />
        </View>
        <View className="flex-1">
          <Button
            title={isLoading ? "Submitting..." : "Submit"}
            variant="primary"
            onPress={handleSubmit}
            disabled={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default signature;
