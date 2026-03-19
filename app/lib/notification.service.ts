import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NotificationData,
  AndroidChannelConfig
} from "./types/notification.types";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowLockScreen: true,
    shouldPlaySoundInSilentMode: true,
    priority: Notifications.AndroidNotificationPriority.HIGH
  })
});

// Android channels
const ANDROID_CHANNELS: AndroidChannelConfig[] = [
  {
    id: "banking-notifications",
    name: "Banking Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3F401B",
    sound: "default"
  },
  {
    id: "transactions",
    name: "Transaction Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3F401B",
    sound: "default"
  },
  {
    id: "security",
    name: "Security Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF0000",
    sound: "default"
  }
];

class NotificationService {
  private pushToken: string | null = null;
  private readonly tokenKey = "expoPushToken";
  private readonly deviceIdKey = "appDeviceId";
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private tokenRefreshListener: Notifications.Subscription | null = null;
  private apiUrl: string;

  // const BASE_URL = "https://api.ellingtonbank.com/api/v2";

  constructor() {
    this.apiUrl =
      Constants.expoConfig?.extra?.apiUrl || "https://stagingapi.ellingtonbank.com";
  }

  async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device");
        return false;
      }

      const permissionStatus = await this.getPermissions();
      if (!permissionStatus) return false;

      if (Platform.OS === "android") {
        await this.setupAndroidChannels();
      }

      await this.getPushToken();

      // Register with backend if user is logged in
      const appToken = await AsyncStorage.getItem("authToken");
      if (appToken) {
        await this.registerDeviceWithBackend();
      }

      this.addNotificationListeners();

      return true;
    } catch (error) {
      console.error("Notification initialization error:", error);
      return false;
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    for (const channel of ANDROID_CHANNELS) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: channel.vibrationPattern,
        lightColor: channel.lightColor,
        sound: channel.sound,
        enableVibrate: true,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
      });
    }
  }

  private async getPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true }
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Enable Notifications",
        "Please enable notifications to receive important banking alerts.",
        [
          { text: "Later", style: "cancel" },
          { text: "Settings", onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    return true;
  }

  async getPushToken(): Promise<string> {
    try {
      const { eas } = Constants.expoConfig?.extra || {};
      if (!eas?.projectId) throw new Error("EAS project ID not found");

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: eas.projectId
      });
      this.pushToken = token.data;
      await SecureStore.setItemAsync(this.tokenKey, this.pushToken);
      console.log("Push token obtained:", this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error("Error getting push token:", error);
      throw error;
    }
  }

  // ✅ FIXED: Get or create persistent device ID (no null issues)
  private async getDeviceId(): Promise<string> {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(this.deviceIdKey);

    if (!deviceId) {
      // Handle null case for Constants.deviceId
      const constantDeviceId = Constants.deviceId;

      // Create a new device ID (guaranteed to be a string)
      const newDeviceId =
        constantDeviceId ||
        `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      // Store it
      await SecureStore.setItemAsync(this.deviceIdKey, newDeviceId);

      // Return the new ID
      return newDeviceId;
    }

    // If we have an existing ID, return it (TypeScript now knows it's a string)
    return deviceId;
  }

  // Register device with backend (sends deviceId + pushToken)
  async registerDeviceWithBackend(): Promise<boolean> {
    try {
      const appToken = await AsyncStorage.getItem("authToken");
      if (!appToken) {
        console.log("User not logged in");
        return false;
      }

      const pushToken = await this.getStoredToken();
      if (!pushToken) {
        console.log("No push token available");
        return false;
      }

      const deviceId = await this.getDeviceId();

      const payload = {
        deviceId: deviceId, // This is what your backend needs
        pushToken: pushToken, // Expo push token
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || "1.0.0"
      };

      console.log("Registering device with backend:", payload);

      // UNCOMMENT WHEN BACKEND IS READY
      const response = await fetch(`${this.apiUrl}/users/push-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`
        },
        body: JSON.stringify({
          token: appToken
        })
      });

      if (!response.ok) throw new Error("Failed to register device");
      console.log("Device registered successfully");

      return true;
    } catch (error) {
      console.error("Error registering device:", error);
      return false;
    }
  }

  // Unregister device from backend
  async unregisterDeviceFromBackend(): Promise<boolean> {
    try {
      const appToken = await AsyncStorage.getItem("authToken");
      if (!appToken) return false;

      const deviceId = await this.getDeviceId();

      // UNCOMMENT WHEN BACKEND IS READY
      const response = await fetch(`${this.apiUrl}/users/push-tokens/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${appToken}` },
        body: JSON.stringify({ token: appToken })
      });

      await SecureStore.deleteItemAsync(this.tokenKey);
      this.pushToken = null;
      return true;
    } catch (error) {
      console.error("Error unregistering device:", error);
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.tokenKey);
  }

  // Handle navigation when notification is tapped
  private handleNotificationNavigation(data: NotificationData): void {
    if (!data) return;

    switch (data.type) {
      case "transaction":
        if (data.transactionId) {
          router.push("/");
          //   router.push({
          //     pathname: "/transaction-details",
          //     params: { transactionId: data.transactionId }
          //   });
        }
        break;
      case "security":
        router.push("/");
        // router.push("/security-alerts");
        break;
      case "promotion":
        if (data.url) {
          router.push("/");
          // router.push(data.url);
        }
        break;
      case "account_update":
        router.push("/");
        // router.push("/accounts");
        break;
      default:
        router.push("/");
    }
  }

  private addNotificationListeners(): void {
    // When notification is received while app is open
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // When user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        this.handleNotificationNavigation(data as NotificationData);
      });

    // When push token is refreshed
    this.tokenRefreshListener = Notifications.addPushTokenListener(
      async (token) => {
        console.log("Push token refreshed");
        this.pushToken = token.data;
        await SecureStore.setItemAsync(this.tokenKey, token.data);

        const appToken = await AsyncStorage.getItem("authToken");
        if (appToken) {
          await this.registerDeviceWithBackend();
        }
      }
    );
  }

  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener.remove();
      this.tokenRefreshListener = null;
    }
  }

  // For testing
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    seconds: number = 5
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || { type: "test", timestamp: new Date().toISOString() },
        sound: "default"
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds
      }
    });
  }
}

// ✅ FIXED: Helper function for device ID (using class method instead)
// Removed duplicate getDeviceId function at bottom

export default new NotificationService();
