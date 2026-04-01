import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { BASE_URL } from "./api";

const TOKEN_KEY = "expoPushToken";

// Global Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true
  })
});

/**
 * Get or Generate Device ID
 */
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = `${Device.osBuildId || Platform.OS}-${
        Device.deviceYearClass || Date.now()
      }-${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  } catch (error) {
    return `${Platform.OS}-${Date.now()}`;
  }
};

/**
 * Register for Push Notifications & Get Token
 */
export const registerForPushNotificationsAsync = async (): Promise<
  string | null
> => {
  console.log("regpushTokenString");

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C"
      });
    }

    if (!Device.isDevice) {
      Alert.alert("Error", "Must use physical device for push notifications");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Error", "Permission not granted for push notifications!");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "2cb6bacc-1e05-4771-81c3-6a9934f26c7d";

    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
        applicationId: Platform.OS === "ios" ? "com.ellingtonmfb.app" : undefined
      })
    ).data;
    await AsyncStorage.setItem(TOKEN_KEY, pushTokenString);
    console.log(pushTokenString, "pushTokenString");
    return pushTokenString;
  } catch (error: any) {
    const message = error.message;
    if (
      Platform.OS === "android" &&
      message.includes("FirebaseApp is not initialized")
    ) {
      console.warn(
        "Push Notifications: Firebase is not initialized. Ensure google-services.json is present."
      );
    }
    Alert.alert("Notification Error", message);
    return null;
  }
};

/**
 * Register Token with Backend
 */
export const registerDeviceWithBackend = async (
  token: string
): Promise<boolean> => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    const deviceId = await getDeviceId();

    if (!token || !authToken) return false;

    console.log("📡 Registering device with backend...");
    const response = await fetch(`${BASE_URL}/users/push-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        push_token: token,
        device_id: deviceId,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version || "2.0.5",
        device_make: Device.manufacturer || "Unknown",
        device_model: Device.modelName || Platform.OS,
        device_name: Device.deviceName || "Unknown"
      })
    });

    return response.ok;
  } catch (error) {
    console.error("❌ Register error:", error);
    return false;
  }
};

/**
 * Local Notification Helpers
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any,
  seconds: number = 5
) => {
  return await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data || {}, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds
    }
  });
};

export const clearPushToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};