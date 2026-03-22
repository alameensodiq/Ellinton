import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, Auth } from "firebase/auth";
import { app } from "../firebase"; // Import your initialized Firebase app
import {
  NotificationData,
  AndroidChannelConfig,
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
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Android channels
const ANDROID_CHANNELS: AndroidChannelConfig[] = [
  {
    id: "banking-notifications",
    name: "Banking Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3F401B",
    sound: "default",
  },
  {
    id: "transactions",
    name: "Transaction Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3F401B",
    sound: "default",
  },
  {
    id: "security",
    name: "Security Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF0000",
    sound: "default",
  },
];

class NotificationService {
  private pushToken: string | null = null;
  private readonly tokenKey = "expoPushToken";
  private readonly deviceIdKey = "appDeviceId";
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private tokenRefreshListener: Notifications.Subscription | null = null;
  private apiUrl: string;
  private auth: Auth | null = null; // 🔥 Initialize as null

  constructor() {
    this.apiUrl =
      Constants.expoConfig?.extra?.apiUrl ||
      "https://stagingapi.ellingtonbank.com/api/v2";
  }

  // 🔥 Get auth instance lazily (only when needed)
  private getAuth(): Auth {
    if (!this.auth) {
      this.auth = getAuth(app); // Get auth from your initialized Firebase app
    }
    return this.auth;
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
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }

  private async getPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Enable Notifications",
        "Please enable notifications to receive important banking alerts.",
        [
          { text: "Later", style: "cancel" },
          { text: "Settings", onPress: () => Linking.openSettings() },
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
        projectId: eas.projectId,
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

  private async getDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(this.deviceIdKey);
    if (!deviceId) {
      const constantDeviceId = Constants.deviceId;
      const newDeviceId =
        constantDeviceId ||
        `${Platform.OS}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}`;
      await SecureStore.setItemAsync(this.deviceIdKey, newDeviceId);
      return newDeviceId;
    }
    return deviceId;
  }

  // 🔥 REGISTER - Firebase token ONLY in body
  async registerDeviceWithBackend(): Promise<boolean> {
    try {
      const appToken = await AsyncStorage.getItem("authToken");
      console.log(appToken);
      if (!appToken) {
        console.log("User not logged in");
        return false;
      }

      const auth = this.getAuth(); // 🔥 Get auth instance
      const user = auth.currentUser;
      if (!user) {
        console.log("No Firebase user logged in");
        return false;
      }

      const firebaseToken = await user.getIdToken();
      console.log("Firebase token obtained for registration");

      console.log(`${this.apiUrl}/users/push-tokens`);
      console.log(firebaseToken);
      console.log(appToken);

      const response = await fetch(`${this.apiUrl}/users/push-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          token: firebaseToken, // 🔥 ONLY Firebase token
        }),
      });

      console.log(response);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to register device: ${response.status} ${errorText}`
        );
      }

      console.log("✅ Device registered successfully");
      return true;
    } catch (error) {
      console.error("❌ Error registering device:", error);
      return false;
    }
  }

  // 🔥 UNREGISTER - Firebase token ONLY in body
  async unregisterDeviceFromBackend(): Promise<boolean> {
    try {
      const appToken = await AsyncStorage.getItem("authToken");
      if (!appToken) return false;

      const auth = this.getAuth(); // 🔥 Get auth instance
      const user = auth.currentUser;
      if (!user) return false;

      const firebaseToken = await user.getIdToken();

      const response = await fetch(`${this.apiUrl}/users/push-tokens/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          token: firebaseToken, // 🔥 ONLY Firebase token
        }),
      });

      if (response.ok) {
        await SecureStore.deleteItemAsync(this.tokenKey);
        this.pushToken = null;
        console.log("✅ Device unregistered successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error unregistering device:", error);
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.tokenKey);
  }

  private handleNotificationNavigation(data: NotificationData): void {
    if (!data) return;
    console.log("Navigating with data:", data);
    router.push("/");
  }

  private addNotificationListeners(): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        this.handleNotificationNavigation(data as NotificationData);
      });

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
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds,
      },
    });
  }
}

export default new NotificationService();
