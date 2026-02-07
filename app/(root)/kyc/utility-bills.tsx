import { View, Text, Pressable, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import CustomText from "@/app/components/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Button from "@/app/components/Button";
import Loading from "@/app/components/Loading";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { uploadUtilityBill, submitTier3 } from "@/app/lib/thunks/kycThunks";

const kycUtility = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access media library is required!");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      try {
        // Compress the image before uploading
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }], // max width 1024px
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // 70% JPEG
        );

        setImageUri(manipulatedImage.uri);

        const base64Data = await FileSystem.readAsStringAsync(
          manipulatedImage.uri,
          { encoding: "base64" }
        );

        setBase64(`data:image/jpeg;base64,${base64Data}`);
        setError("");
        setSuccess(false);
      } catch (err) {
        setError("Error processing image.");
        console.error(err);
      }
    }
  };

  const handleUpload = async () => {
    if (!base64) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(uploadUtilityBill({ utility_bill: base64 })).unwrap();
      await dispatch(submitTier3()).unwrap();

      setSuccess(true);
      setError("");
      setImageUri(null);
      setBase64(null);
    } catch (err: any) {
      setError(err?.message || err || "Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToSettings = () => {
    router.push("/(root)/(tabs)");
  };

  return (
    <SafeAreaView className="bg-primary-100 flex-1 px-2">
      <Header title="KYC Level" />

      <View className="px-4 flex-1">
        <View>
          <View className="bg-primary-400 rounded-full w-16 h-16 justify-center items-center mx-auto border border-primary-300">
            <CustomText className="text-center" size="xxl">
              {user?.kyc_level}
            </CustomText>
          </View>

          <CustomText className="text-center mt-4" size="xxl">
            Level {user?.kyc_level}
          </CustomText>

          <View className="mt-8">
            <CustomText size="xl" className="mb-4">
              Upgrade to level 3
            </CustomText>

            <CustomText
              secondary
              size="sm"
              className="text-accent-100 mb-6 max-w-72"
            >
              To access all features it's essential to verify your identity.
            </CustomText>

            <CustomText size="lg" className="mb-4">
              Upload your utility bill for verification
            </CustomText>

            <CustomText secondary size="sm" className="mb-6">
              Please upload a clear image of your utility bill (e.g.,
              electricity, water, etc.) showing your name and address.
            </CustomText>

            {imageUri && (
              <View className="relative mb-4">
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="contain"
                />
                <Pressable
                  onPress={() => {
                    setImageUri(null);
                    setBase64(null);
                    setError("");
                    setSuccess(false);
                  }}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                >
                  <Ionicons name="close" size={20} color="white" />
                </Pressable>
              </View>
            )}

            {error ? <Text className="text-red-500 mb-4">{error}</Text> : null}

            {success ? (
              <Text className="text-green-500 mb-4">
                Utility bill uploaded successfully!
              </Text>
            ) : null}
          </View>
        </View>

        {/* Bottom Button Area */}
        {success ? (
          <View className="absolute bottom-5 left-4 right-4">
            <Button title="Continue" variant="primary" onPress={goToSettings} />
          </View>
        ) : imageUri ? (
          <View className="absolute bottom-5 left-4 right-4">
            <Button
              title="Upload"
              variant="primary"
              onPress={handleUpload}
              disabled={!base64 || isLoading}
            />
          </View>
        ) : (
          <View className="absolute bottom-5 left-4 right-4">
            <Button
              title="Select Image"
              variant="secondary"
              onPress={pickImage}
            />
          </View>
        )}
      </View>

      <Loading visible={isLoading} />
    </SafeAreaView>
  );
};

export default kycUtility;
