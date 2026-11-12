import { usePathname } from "expo-router";
import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearError, logout } from "../lib/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAppSelector } from "../lib/hooks/useAppSelector";
import { useAppDispatch } from "../lib/hooks/useAppDispatch";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5-minute inactivity timeout
const LAST_ACTIVE_KEY = "lastActiveTime";
const STORAGE_WRITE_THROTTLE_MS = 10 * 1000;

const KEYS_TO_PRESERVE = new Set([
  "userPin",
  "userEmail",
  "userProfile",
  "userAccountNumber",
  "hasLoggedInBefore",
  "loginBiometricEnabled",
  "transBiometricEnabled",
  "transBiometricPin",
  "deviceIdBackup",
  "deviceVerified",
  "app_theme",
  "user_linked_cards",
  "user_employment_details",
]);

const clearSessionStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) => !KEYS_TO_PRESERVE.has(key));
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error("Error clearing session storage:", error);
  }
};

const UserInactivityProvider = ({ children }: { children: React.ReactNode }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandlingLogout = useRef(false);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const lastPersistedTimeRef = useRef<number>(0);
  const wasAuthenticatedRef = useRef<boolean>(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isPublicRoute = pathname?.startsWith("/(auth)") || pathname === "/";

  const handleLogout = useCallback(async () => {
    if (isHandlingLogout.current) return;
    isHandlingLogout.current = true;

    try {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }

      // Clear local credentials before exposing the signed-out screen, so a
      // quick re-login cannot have its newly written credentials removed by
      // this cleanup operation.
      await clearSessionStorage();

      // Let AuthWrapper handle the redirect after auth state changes. Keeping
      // navigation in one place avoids competing route replacements on resume.
      dispatch(logout());
      dispatch(clearError());

      // Do not dispatch logoutUser here: its async completion can race with a
      // new login and clear the fresh credentials from Redux.
      await signOut(auth).catch(console.error);
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(logout());
      dispatch(clearError());
    } finally {
      isHandlingLogout.current = false;
    }
  }, [dispatch]);

  const recordStartTime = useCallback(
    async (forcePersist = false) => {
      if (!isAuthenticated) return;
      const now = Date.now();
      lastActiveTimeRef.current = now;

      if (
        !forcePersist &&
        now - lastPersistedTimeRef.current < STORAGE_WRITE_THROTTLE_MS
      ) {
        return;
      }

      lastPersistedTimeRef.current = now;
      try {
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } catch (error) {
        console.error("Error recording start time:", error);
      }
    },
    [isAuthenticated]
  );

  const checkInactivity = useCallback(async () => {
    if (isPublicRoute || !isAuthenticated) return false;

    try {
      const storedLastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      const parsedStored = storedLastActive ? Number(storedLastActive) : 0;
      const effectiveLastActive = Math.max(
        lastActiveTimeRef.current,
        Number.isNaN(parsedStored) ? 0 : parsedStored
      );

      if (effectiveLastActive > 0) {
        const inactiveDuration = Date.now() - effectiveLastActive;
        if (inactiveDuration >= INACTIVITY_TIMEOUT) {
          await handleLogout();
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking inactivity:", error);
    }

    return false;
  }, [isPublicRoute, isAuthenticated, handleLogout]);

  const resetTimer = useCallback(
    async (forcePersist = false) => {
      if (isPublicRoute || !isAuthenticated) return;

      await recordStartTime(forcePersist);

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      inactivityTimer.current = setTimeout(() => {
        checkInactivity();
      }, INACTIVITY_TIMEOUT);
    },
    [isPublicRoute, isAuthenticated, recordStartTime, checkInactivity]
  );

  // Immediately stamp fresh activity time whenever user transitions to authenticated
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticatedRef.current) {
      const now = Date.now();
      lastActiveTimeRef.current = now;
      lastPersistedTimeRef.current = now;
      AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString()).catch(() => {});
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      // Update synchronously before awaiting storage so a quick resume cannot
      // be missed while the background timestamp is being persisted.
      appState.current = nextAppState;

      if (isPublicRoute || !isAuthenticated) {
        return;
      }

      if (
        nextAppState !== "active" &&
        previousAppState === "active"
      ) {
        await recordStartTime(true);
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      }

      if (nextAppState === "active" && previousAppState !== "active") {
        const didLogout = await checkInactivity();
        if (!didLogout) {
          await resetTimer(true);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };
  }, [isPublicRoute, isAuthenticated, recordStartTime, checkInactivity, resetTimer]);

  // Reset timer on route changes and when authentication changes
  useEffect(() => {
    if (isPublicRoute || !isAuthenticated) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    resetTimer();
  }, [pathname, isAuthenticated, resetTimer]);

  const handleInteractionCapture = useCallback(() => {
    if (!isPublicRoute && isAuthenticated) {
      resetTimer(false);
    }

    return false;
  }, [isAuthenticated, isPublicRoute, resetTimer]);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={handleInteractionCapture}
    >
      {children}
    </View>
  );
};

export default UserInactivityProvider;
