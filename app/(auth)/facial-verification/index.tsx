import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { verifyUserFacial } from "@/app/lib/thunks/authThunks";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const FacialVerificationScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, user } = useAppSelector((state) => state.auth);
  const { userId } = useLocalSearchParams();
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const handleBack = () => {
    if (showCamera) {
      setShowCamera(false);
    } else {
      router.back();
    }
  };

  const handleTakePicture = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
        });

        const manipulatedImage = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          {
            compress: 0.6,
            format: SaveFormat.JPEG,
            base64: true,
          }
        );

        try {
          await dispatch(
            verifyUserFacial({
              userId: (userId as string) || (user?.id as string),
              selfie: `data:image/jpeg;base64,${manipulatedImage.base64}`,
            })
          ).unwrap();

          setShowCamera(false);
          router.push({
            pathname: "/(auth)/transacion-pin",
            params: { userId: (userId as string) || user?.id },
          });
        } catch (err: any) {
          Alert.alert(
            "Verification Failed",
            err || "Facial verification failed"
          );
          setShowCamera(false);
        }
      } catch (error) {
        console.error("Error capturing photo:", error);
        Alert.alert("Error", "Failed to capture photo");
      }
    }
  };

  if (showCamera) {
    if (!permission) {
      return (
        <View>
          <Text>Requesting camera permission...</Text>
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View>
          <Text>No access to camera</Text>
        </View>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-primary-100">
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">
            Facial Verification
          </Text>
          <View className="w-8" />
        </View>

        {/* CAMERA ONLY INSIDE CIRCLE */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 300,
              height: 300,
              borderRadius: 300,
              overflow: "hidden",
              borderWidth: 4,
              borderColor: "#D4FF00",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CameraView
              ref={cameraRef}
              style={{ width: "110%", height: "110%" }}
              facing="front"
            />
          </View>

          <Text className="text-white text-lg font-semibold mt-6">
            Position your face within the circle
          </Text>
        </View>

        <TouchableOpacity
          onPress={capturePhoto}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View className="bg-green-500 rounded-full p-4 mb-10">
            <Ionicons name="camera" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-white text-3xl font-bold mb-2">
            Facial Verification
          </Text>
          <Text className="text-white text-base mb-8">
            Take a picture with your face fully captured
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleTakePicture}
          className="items-center mb-6"
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/camera.png")}
            className="w-32 h-32 mb-4"
            resizeMode="contain"
          />
          <Text className="text-white text-lg font-semibold">
            Tap to take a picture
          </Text>
        </TouchableOpacity>

        <View className="w-full mb-8">
          <Text className="text-accent-100 text-lg font-semibold mb-4">
            Please ensure the following
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-start mb-4">
              <Ionicons
                name="videocam"
                size={24}
                color="#FFD700"
                className="mt-1 mr-3"
              />
              <View className="flex-1">
                <Text className="text-accent-100 font-semibold">
                  Well Lit Space
                </Text>
                <Text className="text-gray-300 text-sm mt-1">
                  Make sure there is enough light in your environment.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Ionicons
                name="videocam"
                size={24}
                color="#FFD700"
                className="mt-1 mr-3"
              />
              <View className="flex-1">
                <Text className="text-accent-100 font-semibold">
                  720p camera
                </Text>
                <Text className="text-gray-300 text-sm mt-1">
                  Minimum video quality standard should be 720 or higher.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FacialVerificationScreen;