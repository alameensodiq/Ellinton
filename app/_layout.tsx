// "use client";

// import { Provider } from "react-redux";
// import "./globals.css";

// import * as SplashScreen from "expo-splash-screen";
// import { useFonts } from "expo-font";
// import * as NavigationBar from "expo-navigation-bar";
// import { Platform, StatusBar } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { store } from "./lib/store";
// import AuthWrapper from "./(root)/AuthWrapper";
// import { logout } from "./lib/slices/authSlice";
// import { useEffect, useState } from "react";
// import { initializeAppsFlyer } from "./lib/analytics/appsflyer";
// import firebaseService from "./lib/firebase.service";
// import authListenerService from "./lib/auth-listener.service";
// import UserInactivityProvider from "./components/UserInactivityProvider";
// import { usePreventScreenCapture } from "expo-screen-capture";
// import { initializeEncryption } from "./lib/initializeEncryption";
// import * as Notifications from "expo-notifications";

// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   // Inside your RootLayout component...
//   useEffect(() => {
//     // 1. Listen for notifications that arrive while the app is actively open
//     const foregroundSubscription =
//       Notifications.addNotificationReceivedListener((notification) => {
//         console.log("🔔 Notification received in foreground:", notification);
//       });

//     // 2. Listen for when a user TAPS on a notification from their notification tray
//     const responseSubscription =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         console.log(
//           "👉 User tapped notification:",
//           response.notification.request.content.data
//         );
//         // Route your user here if needed! (e.g., router.push("/(root)/notifications"))
//       });

//     return () => {
//       foregroundSubscription.remove();
//       responseSubscription.remove();
//     };
//   }, []);

//   const [encryptionReady, setEncryptionReady] = useState(false);

//   const [fontsLoaded] = useFonts({
//     Outfit: require("./assets/fonts/Outfit-Bold.ttf"),
//     OutfitMedium: require("./assets/fonts/Outfit-Medium.ttf"),
//     OutfitBold: require("./assets/fonts/Outfit-Bold.ttf")
//   });
//   useEffect(() => {
//     initializeAppsFlyer().catch((error) => {
//       console.warn("Failed to initialize AppsFlyer:", error);
//     });
//     const initialize = async () => {
//       // Initialize Firebase (which also initializes notifications)
//       await firebaseService.initialize();

//       // Start listening to auth changes
//       authListenerService.startListening();
//     };
//     const initEncryption = async () => {
//       try {
//         await initializeEncryption();
//         setEncryptionReady(true);
//         console.log("✅ Encryption ready");
//       } catch (error) {
//         console.error("❌ Failed to initialize encryption:", error);
//         // You might want to show an error screen here
//         setEncryptionReady(true); // Set to true to prevent hanging, but log error
//       }
//     };

//     initEncryption();

//     initialize();

//     return () => {
//       authListenerService.stopListening();
//     };
//   }, []);

//   useEffect(() => {
//     const originalFetch = (global as any).fetch;

//     (global as any).fetch = async (input: any, init?: any) => {
//       try {
//         const response = await originalFetch(input, init);

//         if (response && response.status === 401) {
//           try {
//             await AsyncStorage.removeItem("authToken");
//           } catch (e) {
//             // ignore
//           }

//           // update redux state
//           // await notificationService.unregisterDeviceFromBackend();
//           store.dispatch(logout());

//           // mark session expired so other parts of the app can react
//           try {
//             await AsyncStorage.setItem("sessionExpired", "1");
//           } catch (e) {
//             // ignore
//           }
//         }

//         return response;
//       } catch (err) {
//         throw err;
//       }
//     };

//     return () => {
//       (global as any).fetch = originalFetch;
//     };
//   }, []);

//   if (!fontsLoaded) return null;

//   SplashScreen.hideAsync();

//   if (Platform.OS === "android") {
//     NavigationBar.setBackgroundColorAsync("#3F401B");
//     NavigationBar.setButtonStyleAsync("light");
//     StatusBar.setBackgroundColor("#3F401B", true);
//     StatusBar.setBarStyle("light-content", true);
//   }

//   return (
//     <Provider store={store}>
//       <UserInactivityProvider>
//         <AuthWrapper />
//       </UserInactivityProvider>
//     </Provider>
//   );
// }

import { Provider } from "react-redux";
import "./globals.css";

import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Platform, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "./lib/store";
import AuthWrapper from "./(root)/AuthWrapper";
import { logout } from "./lib/slices/authSlice";
import { useEffect, useState } from "react";
import { initializeAppsFlyer } from "./lib/analytics/appsflyer";
import firebaseService from "./lib/firebase.service";
import authListenerService from "./lib/auth-listener.service";
import UserInactivityProvider from "./components/UserInactivityProvider";
import { usePreventScreenCapture } from "expo-screen-capture";
import { initializeEncryption } from "./lib/initializeEncryption";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

// ✅ ADD THIS RIGHT HERE - Before any other code
// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // Required for Android
    shouldShowList: true, // Required for Android
    priority: Notifications.AndroidNotificationPriority.HIGH
  })
});

export default function RootLayout() {
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 RECEIVED", notification);
      }
    );

    const response = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👆 TAPPED", response);
      }
    );

    return () => {
      received.remove();
      response.remove();
    };
  }, []);
  // ✅ Add Android channel setup
  // In RootLayout, update the setupAndroidChannels function
  useEffect(() => {
    const setupAndroidChannels = async () => {
      if (Platform.OS === "android") {
        // Create default channel
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          enableLights: true
        });

        // ✅ CREATE THE TEST CHANNEL
        await Notifications.setNotificationChannelAsync("test_channel", {
          name: "Test Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          enableLights: true,
          bypassDnd: true // Bypass Do Not Disturb for tests
        });

        console.log("✅ Android notification channels created");
      }
    };

    setupAndroidChannels();
  }, []);

  // Your existing notification listeners
  useEffect(() => {
    // 1. Listen for notifications that arrive while the app is actively open
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification received in foreground:", notification);
      });

    // 2. Listen for when a user TAPS on a notification
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "👉 User tapped notification:",
          response.notification.request.content.data
        );
      });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const [encryptionReady, setEncryptionReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Outfit: require("./assets/fonts/Outfit-Bold.ttf"),
    OutfitMedium: require("./assets/fonts/Outfit-Medium.ttf"),
    OutfitBold: require("./assets/fonts/Outfit-Bold.ttf")
  });

  useEffect(() => {
    initializeAppsFlyer().catch((error) => {
      console.warn("Failed to initialize AppsFlyer:", error);
    });
    const initialize = async () => {
      await firebaseService.initialize();
      authListenerService.startListening();
    };
    const initEncryption = async () => {
      try {
        await initializeEncryption();
        setEncryptionReady(true);
        console.log("✅ Encryption ready");
      } catch (error) {
        console.error("❌ Failed to initialize encryption:", error);
        setEncryptionReady(true);
      }
    };

    initEncryption();
    initialize();

    return () => {
      authListenerService.stopListening();
    };
  }, []);

  useEffect(() => {
    const originalFetch = (global as any).fetch;

    (global as any).fetch = async (input: any, init?: any) => {
      try {
        const response = await originalFetch(input, init);

        if (response && response.status === 401) {
          try {
            await AsyncStorage.removeItem("authToken");
          } catch (e) {
            // ignore
          }

          store.dispatch(logout());

          try {
            await AsyncStorage.setItem("sessionExpired", "1");
          } catch (e) {
            // ignore
          }
        }

        return response;
      } catch (err) {
        throw err;
      }
    };

    return () => {
      (global as any).fetch = originalFetch;
    };
  }, []);

  if (!fontsLoaded) return null;

  SplashScreen.hideAsync();

  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync("#3F401B");
    NavigationBar.setButtonStyleAsync("light");
    StatusBar.setBackgroundColor("#3F401B", true);
    StatusBar.setBarStyle("light-content", true);
  }

  return (
    <Provider store={store}>
      <UserInactivityProvider>
        <AuthWrapper />
      </UserInactivityProvider>
    </Provider>
  );
}
