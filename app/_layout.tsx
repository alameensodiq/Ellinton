"use client";

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
import { useEffect } from "react";
import { initializeAppsFlyer } from "./lib/analytics/appsflyer";
import firebaseService from "./lib/firebase.service";
import authListenerService from "./lib/auth-listener.service";
import notificationService from "./lib/notification.service";
import UserInactivityProvider from "./components/UserInactivityProvider";
import { usePreventScreenCapture } from "expo-screen-capture";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  usePreventScreenCapture();
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
      // Initialize Firebase (which also initializes notifications)
      await firebaseService.initialize();

      // Start listening to auth changes
      authListenerService.startListening();
    };

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

          // update redux state
          // await notificationService.unregisterDeviceFromBackend();
          store.dispatch(logout());

          // mark session expired so other parts of the app can react
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
