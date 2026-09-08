// import { Alert, Platform } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";
// import { BASE_URL } from "./api";
// import { getDeviceId } from "./utils";
// import { encryptedFetch } from "./encryptedFetch";
// import { encryptionClient } from "./encrption.client";
// import { generateNonce, generateSignature } from "./signature";

// const USE_ENCRYPTION = true;

// const safeFetch = async (url: string, options: RequestInit = {}) => {
//   const method = options.method?.toLowerCase() || "get";
//   const headers = (options.headers as Record<string, string>) || {};
//   const body = options.body ? JSON.parse(options.body as string) : undefined;

//   const hasAuthToken =
//     headers.Authorization && headers.Authorization.startsWith("Bearer ");

//   let enhancedHeaders = { ...headers };

//   console.log(hasAuthToken);

//   if (hasAuthToken) {
//     const timestamp = Date.now().toString();
//     const nonce = generateNonce();
//     const deviceId = await getDeviceId();

//     // IMPORTANT: Extract ONLY the pathname, not the full URL
//     const urlObj = new URL(url);
//     const path = urlObj.pathname; // This should be like "/api/v1/virtual-cards"

//     // console.log("📡 Request details:", {
//     //   fullUrl: url,
//     //   path,
//     //   method,
//     //   hasBody: !!body,
//     //   deviceId
//     // });

//     // Generate signature
//     const { signature } = await generateSignature(
//       method,
//       path,
//       body,
//       nonce,
//       timestamp,
//       deviceId
//     );

//     console.log(signature);
//     console.log(method);
//     console.log(path);
//     console.log(body);
//     console.log(nonce);
//     console.log(deviceId);
//     console.log(timestamp);

//     // CRITICAL FIX: Add x-device-id header
//     enhancedHeaders = {
//       ...headers,
//       "x-request-timestamp": timestamp,
//       "x-request-nonce": nonce,
//       "x-signature": signature,
//       "x-device-id": deviceId // ← THIS WAS MISSING - ADD THIS LINE
//     };

//     // console.log("🔐 Added signature headers:", {
//     //   timestamp,
//     //   noncePreview: nonce.substring(0, 10) + "...",
//     //   signaturePreview: signature.substring(0, 20) + "...",
//     //   deviceId
//     // });
//   } else {
//     // console.log("🔓 No auth token, skipping signature");
//   }

//   if (USE_ENCRYPTION) {
//     switch (method) {
//       case "post":
//         return await encryptedFetch.post(url, body, enhancedHeaders);
//       case "put":
//         return await encryptedFetch.put(url, body, enhancedHeaders);
//       case "patch":
//         return await encryptedFetch.patch(url, body, enhancedHeaders);
//       case "delete":
//         return await encryptedFetch.delete(url, enhancedHeaders);
//       default:
//         return await encryptedFetch.get(url, enhancedHeaders);
//     }
//   } else {
//     return await fetch(url, {
//       ...options,
//       headers: enhancedHeaders
//     });
//   }
// };

// const TOKEN_KEY = "expoPushToken";

// // Global Configuration
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldShowAlert: true
//   })
// });

// /**
//  * Get or Generate Device ID
//  */
// // const getDeviceId = async (): Promise<string> => {
// //   try {
// //     let deviceId = await AsyncStorage.getItem("deviceId");
// //     if (!deviceId) {
// //       deviceId = `${Device.osBuildId || Platform.OS}-${
// //         Device.deviceYearClass || Date.now()
// //       }-${Math.random().toString(36).substring(7)}`;
// //       await AsyncStorage.setItem("deviceId", deviceId);
// //     }
// //     return deviceId;
// //   } catch (error) {
// //     return `${Platform.OS}-${Date.now()}`;
// //   }
// // };

// /**
//  * Register for Push Notifications & Get Token
//  */
// export const registerForPushNotificationsAsync = async (): Promise<
//   string | null
// > => {
//   console.log("regpushTokenString");

//   try {
//     if (Platform.OS === "android") {
//       await Notifications.setNotificationChannelAsync("default", {
//         name: "default",
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: "#FF231F7C"
//       });
//     }

//     if (!Device.isDevice) {
//       Alert.alert("Error", "Must use physical device for push notifications");
//       return null;
//     }

//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       // Alert.alert("Error", "Permission not granted for push notifications!");
//       return null;
//     }

//     const projectId =
//       Constants?.expoConfig?.extra?.eas?.projectId ??
//       Constants?.easConfig?.projectId ??
//       "2cb6bacc-1e05-4771-81c3-6a9934f26c7d";

//     const pushTokenString = (
//       await Notifications.getExpoPushTokenAsync({
//         projectId,
//         applicationId: Platform.OS === "ios" ? "com.ellingtonmfb.app" : undefined
//       })
//     ).data;
//     await AsyncStorage.setItem(TOKEN_KEY, pushTokenString);
//     console.log(pushTokenString, "pushTokenString");
//     return pushTokenString;
//   } catch (error: any) {
//     const message = error.message;
//     if (
//       Platform.OS === "android" &&
//       message.includes("FirebaseApp is not initialized")
//     ) {
//       console.warn(
//         "Push Notifications: Firebase is not initialized. Ensure google-services.json is present."
//       );
//     }
//     Alert.alert("Notification Error", message);
//     return null;
//   }
// };

// /**
//  * Register Token with Backend
//  */
// export const registerDeviceWithBackend = async (
//   token: string,
//   passedAuthToken?: string
// ): Promise<boolean> => {
//   try {
//     const authToken = passedAuthToken || await AsyncStorage.getItem("authToken");
//     console.log(authToken)
//     const deviceId = await getDeviceId();

//     if (!token || !authToken) return false;
//     console.log({
//         push_token: token,
//         device_id: deviceId,
//         platform: Platform.OS,
//         app_version: Constants.expoConfig?.version || "2.0.5",
//         device_make: Device.manufacturer || "Unknown",
//         device_model: Device.modelName || Platform.OS,
//         device_name: Device.deviceName || "Unknown"
//       })

//     console.log("📡 Registering device with backend...");
//     const response = await safeFetch(`${BASE_URL}/users/push-tokens`, {
//       method: "POST",
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

//     return response.ok;
//   } catch (error) {
//     console.error("❌ Register error:", error);
//     return false;
//   }
// };

// /**
//  * Local Notification Helpers
//  */
// export const scheduleLocalNotification = async (
//   title: string,
//   body: string,
//   data?: any,
//   seconds: number = 5
// ) => {
//   return await Notifications.scheduleNotificationAsync({
//     content: { title, body, data: data || {}, sound: true },
//     trigger: {
//       type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
//       seconds
//     }
//   });
// };

// export const clearPushToken = async () => {
//   await AsyncStorage.removeItem(TOKEN_KEY);
// };

// /**
//  * Get Push Token - Gets existing token or registers a new one
//  * Use this function anywhere in your app to get the push token
//  */
// export const getPushToken = async (): Promise<string | null> => {
//   try {
//     // First, try to get existing token from storage
//     let pushToken = await AsyncStorage.getItem(TOKEN_KEY);
    
//     // If no token exists, register for one
//     if (!pushToken) {
//       pushToken = await registerForPushNotificationsAsync();
//     }
    
//     return pushToken;
//   } catch (error) {
//     console.error("Failed to get push token:", error);
//     return null;
//   }
// };


import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { BASE_URL } from "./api";
import { getDeviceId } from "./utils";
import { encryptedFetch } from "./encryptedFetch";
import { encryptionClient } from "./encrption.client";
import { generateNonce, generateSignature } from "./signature";

const USE_ENCRYPTION = true;

// Notification handler is configured in _layout.tsx to avoid duplication

const safeFetch = async (url: string, options: RequestInit = {}) => {
  const method = options.method?.toLowerCase() || "get";
  const headers = (options.headers as Record<string, string>) || {};
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  const hasAuthToken =
    headers.Authorization && headers.Authorization.startsWith("Bearer ");

  let enhancedHeaders = { ...headers };

  console.log(hasAuthToken);

  if (hasAuthToken) {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const deviceId = await getDeviceId();

    const urlObj = new URL(url);
    const path = urlObj.pathname;

    const { signature } = await generateSignature(
      method,
      path,
      body,
      nonce,
      timestamp,
      deviceId
    );

    enhancedHeaders = {
      ...headers,
      "x-request-timestamp": timestamp,
      "x-request-nonce": nonce,
      "x-signature": signature,
      "x-device-id": deviceId
    };
  }

  if (USE_ENCRYPTION) {
    switch (method) {
      case "post":
        return await encryptedFetch.post(url, body, enhancedHeaders);
      case "put":
        return await encryptedFetch.put(url, body, enhancedHeaders);
      case "patch":
        return await encryptedFetch.patch(url, body, enhancedHeaders);
      case "delete":
        return await encryptedFetch.delete(url, enhancedHeaders);
      default:
        return await encryptedFetch.get(url, enhancedHeaders);
    }
  } else {
    return await fetch(url, {
      ...options,
      headers: enhancedHeaders
    });
  }
};

const TOKEN_KEY = "expoPushToken";

// ✅ FIXED: Setup Android channels
export const setupAndroidChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });
    
    await Notifications.setNotificationChannelAsync('test_channel', {
      name: 'Test Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });
    
    console.log('✅ Android notification channels created');
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 3000, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => {
        console.warn(`⚠️ Push notification action timed out after ${ms}ms`);
        resolve(fallbackValue);
      }, ms)
    )
  ]);
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  console.log("regpushTokenString");

  try {
    // Setup channels FIRST on Android
    if (Platform.OS === "android") {
      await setupAndroidChannels();
    }

    if (!Device.isDevice) {
      Alert.alert("Error", "Must use physical device for push notifications");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowProvisional: false,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "2cb6bacc-1e05-4771-81c3-6a9934f26c7d";

    let pushTokenString: string | null = null;

    try {
      // 1. Try standard Expo push token with projectId (with 3s timeout)
      const tokenResult = await withTimeout(
        Notifications.getExpoPushTokenAsync({ projectId }),
        3000,
        null
      );
      if (tokenResult?.data) {
        pushTokenString = tokenResult.data;
      }
    } catch (expoTokenError: any) {
      console.warn("Primary getExpoPushTokenAsync failed:", expoTokenError?.message);
    }

    if (!pushTokenString) {
      // 2. Retry with explicit development mode flag on iOS / Sandbox APNs environment
      try {
        const tokenResult = await withTimeout(
          Notifications.getExpoPushTokenAsync({
            projectId,
            development: __DEV__,
          }),
          3000,
          null
        );
        if (tokenResult?.data) {
          pushTokenString = tokenResult.data;
        }
      } catch (retryError: any) {
        console.warn("Secondary getExpoPushTokenAsync failed:", retryError?.message);
      }
    }

    if (!pushTokenString) {
      // 3. Fallback to native device push token (APNs token on iOS / FCM token on Android)
      try {
        const deviceTokenResult = await withTimeout(
          Notifications.getDevicePushTokenAsync(),
          3000,
          null
        );
        if (deviceTokenResult?.data) {
          pushTokenString = typeof deviceTokenResult.data === "string"
            ? deviceTokenResult.data
            : JSON.stringify(deviceTokenResult.data);
          console.log("✅ Fallback to native device token succeeded:", pushTokenString);
        }
      } catch (deviceTokenError: any) {
        console.error("❌ Fallback device push token failed:", deviceTokenError?.message);
      }
    }

    if (pushTokenString) {
      await AsyncStorage.setItem(TOKEN_KEY, pushTokenString);
      console.log(pushTokenString, "pushTokenString");
      return pushTokenString;
    }

    return null;
  } catch (error: any) {
    const message = error?.message || "Failed to get push token";
    if (Platform.OS === "android" && message.includes("FirebaseApp is not initialized")) {
      console.warn("Push Notifications: Firebase is not initialized. Ensure google-services.json is present.");
    } else if (Platform.OS === "ios" && message.includes("aps-environment")) {
      console.warn("Push Notifications: Missing aps-environment entitlement in iOS build configuration.");
    } else {
      console.warn("Push Notifications registration failed:", message);
    }
    return null;
  }
};

export const registerDeviceWithBackend = async (token: string, passedAuthToken?: string): Promise<boolean> => {
  try {
    const authToken = passedAuthToken || await AsyncStorage.getItem("authToken");
    const deviceId = await getDeviceId();

    if (!token || !authToken) return false;
    
    const response = await safeFetch(`${BASE_URL}/users/push-tokens`, {
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

export const scheduleLocalNotification = async (title: string, body: string, data?: any, seconds: number = 5) => {
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

export const getPushToken = async (): Promise<string | null> => {
  try {
    let pushToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!pushToken) {
      pushToken = await withTimeout(registerForPushNotificationsAsync(), 4000, null);
    }
    return pushToken;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
};

// ✅ Test function with correct Android configuration
export const testDirectPushNotification = async () => {
  try {
    const token = await getPushToken();
    if (!token) {
      console.log("No push token found");
      return;
    }

    console.log("Testing with token:", token);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: "Test Notification",
        body: "This is a test from your app!",
        sound: "default",
        priority: "high",
        channelId: "test_channel", // For Android
        data: { test: true, timestamp: Date.now() }
      })
    });

    const result = await response.json();
    console.log("Push test result:", result);

    if (result.data?.status === "error") {
      console.error("Push error details:", result.data?.details);
    }
  } catch (error) {
    console.error("Test push failed:", error);
  }
};