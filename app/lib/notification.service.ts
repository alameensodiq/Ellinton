// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";
// import { Platform, Alert, Linking } from "react-native";
// import * as SecureStore from "expo-secure-store";
// import { router } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { getAuth, Auth } from "firebase/auth";
// import { app } from "../firebase"; // Import your initialized Firebase app
// import {
//   NotificationData,
//   AndroidChannelConfig,
// } from "./types/notification.types";

// // Configure notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldShowLockScreen: true,
//     shouldPlaySoundInSilentMode: true,
//     priority: Notifications.AndroidNotificationPriority.HIGH,
//   }),
// });

// // Android channels
// const ANDROID_CHANNELS: AndroidChannelConfig[] = [
//   {
//     id: "banking-notifications",
//     name: "Banking Alerts",
//     importance: Notifications.AndroidImportance.MAX,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#3F401B",
//     sound: "default",
//   },
//   {
//     id: "transactions",
//     name: "Transaction Alerts",
//     importance: Notifications.AndroidImportance.HIGH,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#3F401B",
//     sound: "default",
//   },
//   {
//     id: "security",
//     name: "Security Alerts",
//     importance: Notifications.AndroidImportance.MAX,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#FF0000",
//     sound: "default",
//   },
// ];

// class NotificationService {
//   private pushToken: string | null = null;
//   private readonly tokenKey = "expoPushToken";
//   private readonly deviceIdKey = "appDeviceId";
//   private notificationListener: Notifications.Subscription | null = null;
//   private responseListener: Notifications.Subscription | null = null;
//   private tokenRefreshListener: Notifications.Subscription | null = null;
//   private apiUrl: string;
//   private auth: Auth | null = null; // 🔥 Initialize as null

//   constructor() {
//     this.apiUrl =
//       Constants.expoConfig?.extra?.apiUrl ||
//       "https://stagingapi.ellingtonbank.com/api/v2";
//   }

//   // 🔥 Get auth instance lazily (only when needed)
//   private getAuth(): Auth {
//     if (!this.auth) {
//       this.auth = getAuth(app); // Get auth from your initialized Firebase app
//     }
//     return this.auth;
//   }

//   async initialize(): Promise<boolean> {
//     try {
//       if (!Device.isDevice) {
//         console.log("Push notifications require a physical device");
//         return false;
//       }

//       const permissionStatus = await this.getPermissions();
//       if (!permissionStatus) return false;

//       if (Platform.OS === "android") {
//         await this.setupAndroidChannels();
//       }

//       await this.getPushToken();

//       // Register with backend if user is logged in
//       const appToken = await AsyncStorage.getItem("authToken");
//       if (appToken) {
//         await this.registerDeviceWithBackend();
//       }

//       this.addNotificationListeners();

//       return true;
//     } catch (error) {
//       console.error("Notification initialization error:", error);
//       return false;
//     }
//   }

//   private async setupAndroidChannels(): Promise<void> {
//     for (const channel of ANDROID_CHANNELS) {
//       await Notifications.setNotificationChannelAsync(channel.id, {
//         name: channel.name,
//         importance: channel.importance,
//         vibrationPattern: channel.vibrationPattern,
//         lightColor: channel.lightColor,
//         sound: channel.sound,
//         enableVibrate: true,
//         bypassDnd: true,
//         lockscreenVisibility:
//           Notifications.AndroidNotificationVisibility.PUBLIC,
//       });
//     }
//   }

//   private async getPermissions(): Promise<boolean> {
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync({
//         ios: { allowAlert: true, allowBadge: true, allowSound: true },
//       });
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       Alert.alert(
//         "Enable Notifications",
//         "Please enable notifications to receive important banking alerts.",
//         [
//           { text: "Later", style: "cancel" },
//           { text: "Settings", onPress: () => Linking.openSettings() },
//         ]
//       );
//       return false;
//     }

//     return true;
//   }

//   async getPushToken(): Promise<string> {
//     try {
//       const { eas } = Constants.expoConfig?.extra || {};
//       if (!eas?.projectId) throw new Error("EAS project ID not found");

//       const token = await Notifications.getExpoPushTokenAsync({
//         projectId: eas.projectId,
//       });
//       this.pushToken = token.data;
//       await SecureStore.setItemAsync(this.tokenKey, this.pushToken);
//       console.log("Push token obtained:", this.pushToken);
//       return this.pushToken;
//     } catch (error) {
//       console.error("Error getting push token:", error);
//       throw error;
//     }
//   }

//   private async getDeviceId(): Promise<string> {
//     let deviceId = await SecureStore.getItemAsync(this.deviceIdKey);
//     if (!deviceId) {
//       const constantDeviceId = Constants.deviceId;
//       const newDeviceId =
//         constantDeviceId ||
//         `${Platform.OS}-${Date.now()}-${Math.random()
//           .toString(36)
//           .substring(2, 10)}`;
//       await SecureStore.setItemAsync(this.deviceIdKey, newDeviceId);
//       return newDeviceId;
//     }
//     return deviceId;
//   }

//   // 🔥 REGISTER - Firebase token ONLY in body
//   async registerDeviceWithBackend(): Promise<boolean> {
//     try {
//       const appToken = await AsyncStorage.getItem("authToken");
//       console.log(appToken);
//       if (!appToken) {
//         console.log("User not logged in");
//         return false;
//       }

//       const auth = this.getAuth(); // 🔥 Get auth instance
//       const user = auth.currentUser;
//       if (!user) {
//         console.log("No Firebase user logged in");
//         return false;
//       }

//       const firebaseToken = await user.getIdToken();
//       console.log("Firebase token obtained for registration");

//       console.log(`${this.apiUrl}/users/push-tokens`);
//       console.log(firebaseToken);
//       console.log(appToken);

//       const response = await fetch(`${this.apiUrl}/users/push-tokens`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${appToken}`,
//         },
//         body: JSON.stringify({
//           token: firebaseToken, // 🔥 ONLY Firebase token
//         }),
//       });

//       console.log(response);

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(
//           `Failed to register device: ${response.status} ${errorText}`
//         );
//       }

//       console.log("✅ Device registered successfully");
//       return true;
//     } catch (error) {
//       console.error("❌ Error registering device:", error);
//       return false;
//     }
//   }

//   // 🔥 UNREGISTER - Firebase token ONLY in body
//   async unregisterDeviceFromBackend(): Promise<boolean> {
//     try {
//       const appToken = await AsyncStorage.getItem("authToken");
//       if (!appToken) return false;

//       const auth = this.getAuth(); // 🔥 Get auth instance
//       const user = auth.currentUser;
//       if (!user) return false;

//       const firebaseToken = await user.getIdToken();

//       const response = await fetch(`${this.apiUrl}/users/push-tokens/delete`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${appToken}`,
//         },
//         body: JSON.stringify({
//           token: firebaseToken, // 🔥 ONLY Firebase token
//         }),
//       });

//       if (response.ok) {
//         await SecureStore.deleteItemAsync(this.tokenKey);
//         this.pushToken = null;
//         console.log("✅ Device unregistered successfully");
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error("❌ Error unregistering device:", error);
//       return false;
//     }
//   }

//   async getStoredToken(): Promise<string | null> {
//     return await SecureStore.getItemAsync(this.tokenKey);
//   }

//   private handleNotificationNavigation(data: NotificationData): void {
//     if (!data) return;
//     console.log("Navigating with data:", data);
//     router.push("/");
//   }

//   private addNotificationListeners(): void {
//     this.notificationListener = Notifications.addNotificationReceivedListener(
//       (notification) => {
//         console.log("Notification received:", notification);
//       }
//     );

//     this.responseListener =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         const { data } = response.notification.request.content;
//         this.handleNotificationNavigation(data as NotificationData);
//       });

//     this.tokenRefreshListener = Notifications.addPushTokenListener(
//       async (token) => {
//         console.log("Push token refreshed");
//         this.pushToken = token.data;
//         await SecureStore.setItemAsync(this.tokenKey, token.data);

//         const appToken = await AsyncStorage.getItem("authToken");
//         if (appToken) {
//           await this.registerDeviceWithBackend();
//         }
//       }
//     );
//   }

//   removeNotificationListeners(): void {
//     if (this.notificationListener) {
//       this.notificationListener.remove();
//       this.notificationListener = null;
//     }
//     if (this.responseListener) {
//       this.responseListener.remove();
//       this.responseListener = null;
//     }
//     if (this.tokenRefreshListener) {
//       this.tokenRefreshListener.remove();
//       this.tokenRefreshListener = null;
//     }
//   }

//   async scheduleLocalNotification(
//     title: string,
//     body: string,
//     data?: NotificationData,
//     seconds: number = 5
//   ): Promise<string> {
//     return await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         data: data || { type: "test", timestamp: new Date().toISOString() },
//         sound: "default",
//       },
//       trigger: {
//         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//         seconds: seconds,
//       },
//     });
//   }
// }

// export default new NotificationService();

// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";
// import { Platform, Alert, Linking } from "react-native";
// import * as SecureStore from "expo-secure-store";
// import { router } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { getAuth, Auth } from "firebase/auth";
// import { app } from "../firebase";
// import {
//   NotificationData,
//   AndroidChannelConfig,
// } from "./types/notification.types";

// // Configure notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldShowLockScreen: true,
//     shouldPlaySoundInSilentMode: true,
//     priority: Notifications.AndroidNotificationPriority.HIGH,
//   }),
// });

// // Android channels
// const ANDROID_CHANNELS: AndroidChannelConfig[] = [
//   {
//     id: "banking-notifications",
//     name: "Banking Alerts",
//     importance: Notifications.AndroidImportance.MAX,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#3F401B",
//     sound: "default",
//   },
//   {
//     id: "transactions",
//     name: "Transaction Alerts",
//     importance: Notifications.AndroidImportance.HIGH,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#3F401B",
//     sound: "default",
//   },
//   {
//     id: "security",
//     name: "Security Alerts",
//     importance: Notifications.AndroidImportance.MAX,
//     vibrationPattern: [0, 250, 250, 250],
//     lightColor: "#FF0000",
//     sound: "default",
//   },
// ];

// class NotificationService {
//   private pushToken: string | null = null;
//   private readonly tokenKey = "expoPushToken";
//   private readonly deviceIdKey = "appDeviceId";
//   private notificationListener: Notifications.Subscription | null = null;
//   private responseListener: Notifications.Subscription | null = null;
//   private tokenRefreshListener: Notifications.Subscription | null = null;
//   private apiUrl: string;
//   private auth: Auth | null = null;

//   constructor() {
//     this.apiUrl =
//       Constants.expoConfig?.extra?.apiUrl ||
//       "https://stagingapi.ellingtonbank.com/api/v2";
//   }

//   private getAuth(): Auth {
//     if (!this.auth) {
//       this.auth = getAuth(app);
//     }
//     return this.auth;
//   }

//   async initialize(): Promise<boolean> {
//     try {
//       if (!Device.isDevice) {
//         console.log("Push notifications require a physical device");
//         return false;
//       }

//       const permissionStatus = await this.getPermissions();
//       if (!permissionStatus) return false;

//       if (Platform.OS === "android") {
//         await this.setupAndroidChannels();
//       }

//       await this.getPushToken();

//       // Register with backend if user is logged in
//       const appToken = await AsyncStorage.getItem("authToken");
//       if (appToken) {
//         await this.registerDeviceWithBackend();
//       }

//       this.addNotificationListeners();

//       return true;
//     } catch (error) {
//       console.error("Notification initialization error:", error);
//       return false;
//     }
//   }

//   private async setupAndroidChannels(): Promise<void> {
//     for (const channel of ANDROID_CHANNELS) {
//       await Notifications.setNotificationChannelAsync(channel.id, {
//         name: channel.name,
//         importance: channel.importance,
//         vibrationPattern: channel.vibrationPattern,
//         lightColor: channel.lightColor,
//         sound: channel.sound,
//         enableVibrate: true,
//         bypassDnd: true,
//         lockscreenVisibility:
//           Notifications.AndroidNotificationVisibility.PUBLIC,
//       });
//     }
//   }

//   private async getPermissions(): Promise<boolean> {
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync({
//         ios: { allowAlert: true, allowBadge: true, allowSound: true },
//       });
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       Alert.alert(
//         "Enable Notifications",
//         "Please enable notifications to receive important banking alerts.",
//         [
//           { text: "Later", style: "cancel" },
//           { text: "Settings", onPress: () => Linking.openSettings() },
//         ]
//       );
//       return false;
//     }

//     return true;
//   }

//   async getPushToken(): Promise<string> {
//     try {
//       const { eas } = Constants.expoConfig?.extra || {};
//       if (!eas?.projectId) throw new Error("EAS project ID not found");

//       const token = await Notifications.getExpoPushTokenAsync({
//         projectId: eas.projectId,
//       });
//       this.pushToken = token.data;
//       await SecureStore.setItemAsync(this.tokenKey, this.pushToken);
//       console.log("✅ Expo push token obtained:", this.pushToken);
//       return this.pushToken;
//     } catch (error) {
//       console.error("❌ Error getting push token:", error);
//       throw error;
//     }
//   }

//   private async getDeviceId(): Promise<string> {
//     let deviceId = await SecureStore.getItemAsync(this.deviceIdKey);
//     if (!deviceId) {
//       const constantDeviceId = Constants.deviceId;
//       const newDeviceId =
//         constantDeviceId ||
//         `${Platform.OS}-${Date.now()}-${Math.random()
//           .toString(36)
//           .substring(2, 10)}`;
//       await SecureStore.setItemAsync(this.deviceIdKey, newDeviceId);
//       return newDeviceId;
//     }
//     return deviceId;
//   }

//   // ✅ FIXED: Register device with Expo push token
//   async registerDeviceWithBackend(): Promise<boolean> {
//     try {
//       const appToken = await AsyncStorage.getItem("authToken");
//       if (!appToken) {
//         console.log("❌ User not logged in, skipping device registration");
//         return false;
//       }

//       // Get the Firebase auth token for authentication
//       const auth = this.getAuth();
//       const user = auth.currentUser;
//       if (!user) {
//         console.log("❌ No Firebase user logged in");
//         return false;
//       }

//       const firebaseAuthToken = await user.getIdToken();
//       console.log("✅ Firebase auth token obtained");

//       // Get the Expo push token (device token)
//       const expoPushToken = await this.getPushToken();
//       console.log("✅ Expo push token:", expoPushToken);

//       // Get device info for better tracking
//       const deviceId = await this.getDeviceId();
//       const deviceInfo = {
//         platform: Platform.OS,
//         version: Platform.Version,
//         model: Device.modelName || "unknown",
//       };

//       console.log("📡 Registering device with backend...");
//       console.log(`URL: ${this.apiUrl}/users/push-tokens`);
//       console.log(`Device ID: ${deviceId}`);
//       console.log(`Platform: ${Platform.OS}`);

//       const response = await fetch(`${this.apiUrl}/users/push-tokens`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${appToken}`,
//         },
//         body: JSON.stringify({
//           token: expoPushToken, // ✅ Send the Expo push token (device token)
//         }),
//       });

//       console.log("Response status:", response.status);
//        console.log("Response status:", response);

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(
//           `Failed to register device: ${response.status} ${errorText}`
//         );
//       }

//       console.log("✅ Device registered successfully with backend");
//       return true;
//     } catch (error) {
//       console.error("❌ Error registering device:", error);
//       return false;
//     }
//   }

//   // ✅ FIXED: Unregister device with Expo push token
//   async unregisterDeviceFromBackend(): Promise<boolean> {
//     try {
//       const appToken = await AsyncStorage.getItem("authToken");
//       if (!appToken) {
//         console.log("No auth token, skipping unregistration");
//         return false;
//       }

//       const auth = this.getAuth();
//       const user = auth.currentUser;
//       if (!user) {
//         console.log("No Firebase user, skipping unregistration");
//         return false;
//       }

//       const firebaseAuthToken = await user.getIdToken();
//       const expoPushToken = await this.getPushToken();

//       console.log("📡 Unregistering device from backend...");

//       const response = await fetch(`${this.apiUrl}/users/push-tokens/delete`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${appToken}`,
//         },
//         body: JSON.stringify({
//           token: expoPushToken, // ✅ Send the Expo push token to unregister
//         }),
//       });

//       if (response.ok) {
//         await SecureStore.deleteItemAsync(this.tokenKey);
//         this.pushToken = null;
//         console.log("✅ Device unregistered successfully");
//         return true;
//       }

//       console.log("❌ Failed to unregister device:", response.status);
//       return false;
//     } catch (error) {
//       console.error("❌ Error unregistering device:", error);
//       return false;
//     }
//   }

//   async getStoredToken(): Promise<string | null> {
//     return await SecureStore.getItemAsync(this.tokenKey);
//   }

//   private handleNotificationNavigation(data: NotificationData): void {
//     if (!data) return;
//     console.log("Navigating with data:", data);
//     router.push("/");
//   }

//   private addNotificationListeners(): void {
//     this.notificationListener = Notifications.addNotificationReceivedListener(
//       (notification) => {
//         console.log("Notification received:", notification);
//       }
//     );

//     this.responseListener =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         const { data } = response.notification.request.content;
//         this.handleNotificationNavigation(data as NotificationData);
//       });

//     this.tokenRefreshListener = Notifications.addPushTokenListener(
//       async (token) => {
//         console.log("Push token refreshed");
//         this.pushToken = token.data;
//         await SecureStore.setItemAsync(this.tokenKey, token.data);

//         const appToken = await AsyncStorage.getItem("authToken");
//         if (appToken) {
//           await this.registerDeviceWithBackend();
//         }
//       }
//     );
//   }

//   removeNotificationListeners(): void {
//     if (this.notificationListener) {
//       this.notificationListener.remove();
//       this.notificationListener = null;
//     }
//     if (this.responseListener) {
//       this.responseListener.remove();
//       this.responseListener = null;
//     }
//     if (this.tokenRefreshListener) {
//       this.tokenRefreshListener.remove();
//       this.tokenRefreshListener = null;
//     }
//   }

//   async scheduleLocalNotification(
//     title: string,
//     body: string,
//     data?: NotificationData,
//     seconds: number = 5
//   ): Promise<string> {
//     return await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         data: data || { type: "test", timestamp: new Date().toISOString() },
//         sound: "default",
//       },
//       trigger: {
//         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//         seconds: seconds,
//       },
//     });
//   }
// }

// export default new NotificationService();

// app/lib/notification.service.ts
// app/lib/notification.service.ts
// app/lib/notification.service.ts
// app/lib/notification.service.ts
// app/lib/notification.service.ts
// app/lib/notification.service.ts
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { BASE_URL } from "./api";

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

class NotificationService {
  private expoPushToken: string | null = null;
  private readonly TOKEN_KEY = "expoPushToken";
  private apiUrl: string;
  private notificationListener: any = null;
  private responseListener: any = null;

  constructor() {
    this.apiUrl = BASE_URL;
  }

  /**
   * Initialize push notifications - Call once on app start
   */
  async initialize(): Promise<boolean> {
    try {
      console.log("🔥 Initializing Expo push notifications...");

      // Register for push notifications and get token
      const token = await this.registerForPushNotificationsAsync();

      if (token) {
        this.expoPushToken = token;
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
        console.log("✅ Expo Push Token:", token);

        // Set up notification listeners
        this.setupNotificationListeners();

        // Register with backend if logged in
        const authToken = await AsyncStorage.getItem("authToken");
        if (authToken) {
          await this.registerDeviceWithBackend();
        }

        console.log("✅ Expo push notifications ready");
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Push notification init error:", error);
      return false;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `${Device.osBuildId || Platform.OS}-${
          Device.deviceYearClass || Date.now()
        }-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem("deviceId", deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error("Error getting deviceId:", error);
      // Fallback deviceId
      return `${Platform.OS}-${Date.now()}`;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  private async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      // Set up Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C"
        });
      }

      // Check if device is physical
      if (!Device.isDevice) {
        this.handleRegistrationError(
          "Must use physical device for push notifications"
        );
        return null;
      }

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        this.handleRegistrationError(
          "Permission not granted to get push token for push notification!"
        );
        return null;
      }

      // Get project ID from Constants
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        "2cb6bacc-1e05-4771-81c3-6a9934f26c7d";

      if (!projectId) {
        this.handleRegistrationError("Project ID not found");
        return null;
      }

      // Get Expo push token
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId
        })
      ).data;

      return pushTokenString;
    } catch (error: unknown) {
      this.handleRegistrationError(`${error}`);
      return null;
    }
  }

  /**
   * Handle registration errors
   */
  private handleRegistrationError(errorMessage: string): void {
    console.error("Push notification registration error:", errorMessage);
    Alert.alert("Notification Error", errorMessage);
  }

  /**
   * Send a test push notification (for development/testing)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.log("No push token available");
        return false;
      }

      const message = {
        to: this.expoPushToken,
        sound: "default",
        title: "Original Title",
        body: "And here is the body!",
        data: { someData: "goes here" }
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });

      const result = await response.json();
      console.log("Test notification sent:", result);
      return response.ok;
    } catch (error) {
      console.error("Error sending test notification:", error);
      return false;
    }
  }

  /**
   * Send a custom push notification (for internal use)
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const message = {
        to: expoPushToken,
        sound: "default",
        title: title,
        body: body,
        data: data || {}
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  }

  /**
   * Get stored token
   */
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current Expo push token
   */
  getCurrentToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Register device with backend
   */
  async registerDeviceWithBackend(): Promise<boolean> {
    try {
      const token = this.expoPushToken;
      const authToken = await AsyncStorage.getItem("authToken");
      const deviceId = await this.getDeviceId();

      if (!token || !authToken) {
        console.log("❌ Missing token or auth for registration");
        return false;
      }

      console.log("📡 Registering device with backend...");

      const response = await fetch(`${this.apiUrl}/users/push-tokens`, {
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

      console.log(response);

      if (response.ok) {
        console.log("✅ Device registered successfully");
        return true;
      }

      console.log("❌ Registration failed:", response.status);
      return false;
    } catch (error) {
      console.error("❌ Register error:", error);
      return false;
    }
  }

  /**
   * Unregister device from backend
   */
  // async unregisterDeviceFromBackend(): Promise<boolean> {
  //   try {
  //     const token = await this.getStoredToken();
  //     const authToken = await AsyncStorage.getItem("authToken");
  //     const deviceId = await this.getDeviceId();

  //     if (!token || !authToken) {
  //       console.log("No token or auth to unregister");
  //       return false;
  //     }

  //     console.log("📡 Unregistering device...");

  //     const response = await fetch(`${this.apiUrl}/users/push-tokens/delete`, {
  //       method: "DELETE",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${authToken}`
  //       },
  //       body: JSON.stringify({
  //         push_token: token,
  //         device_id: deviceId,
  //         platform: Platform.OS,
  //         app_version: Constants.expoConfig?.version || "2.0.5",
  //         device_make: Device.manufacturer || "Unknown",
  //         device_model: Device.modelName || Platform.OS,
  //         device_name: Device.deviceName || "Unknown"
  //       })
  //     });

  //     if (response.ok) {
  //       await AsyncStorage.removeItem(this.TOKEN_KEY);
  //       this.expoPushToken = null;
  //       console.log("✅ Device unregistered successfully");
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error("❌ Unregister error:", error);
  //     return false;
  //   }
  // }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    seconds: number = 5
  ): Promise<string | null> {
    try {
      console.log(`📅 Scheduling notification in ${seconds} seconds...`);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds
        }
      });

      console.log("✅ Notification scheduled:", identifier);
      return identifier;
    } catch (error) {
      console.error("❌ Schedule notification error:", error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log("🗑️ Cancelled notification:", identifier);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("🗑️ Cancelled all notifications");
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus | null> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error("Error getting permissions:", error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Remove existing listeners if any
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }

    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📨 Notification received in foreground:", notification);

        const title = notification.request.content.title;
        const body = notification.request.content.body;
        const data = notification.request.content.data;

        // Show alert for foreground notifications
        Alert.alert(title || "Notification", body || "", [{ text: "OK" }]);

        // You can also trigger a callback here if needed
        // this.onNotificationReceived?.(notification);
      }
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("🔘 Notification tapped:", response);

        const data = response.notification.request.content.data;

        // Handle navigation based on notification data
        if (data && typeof data === "object") {
          // Add your navigation logic here
          if (data.screen) {
            console.log(`📱 Navigate to: ${data.screen}`);
            // Example: navigation.navigate(data.screen, data.params);
          }
        }

        // You can also trigger a callback here if needed
        // this.onNotificationResponse?.(response);
      });
  }

  /**
   * Clear token (for logout)
   */
  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(this.TOKEN_KEY);
    this.expoPushToken = null;
    console.log("🗑️ Push token cleared");
  }

  /**
   * Cleanup listeners (call on app unmount if needed)
   */
  /**
   * Cleanup listeners (call on app unmount if needed)
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export default new NotificationService();
