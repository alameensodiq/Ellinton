import { useRouter, usePathname } from "expo-router";
import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logoutUser } from "../lib/thunks/authThunks";
import { clearError, logout } from "../lib/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAppSelector } from "../lib/hooks/useAppSelector";
import { useAppDispatch } from "../lib/hooks/useAppDispatch";

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 min timeout
const LAST_ACTIVE_KEY = "lastActiveTime";

const UserInactivityProvider = ({ children }: { children: React.ReactNode }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandlingLogout = useRef(false);
  const router = useRouter();
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

      // 1. Immediately update auth state and navigate to prevent UI delay
      dispatch(logout());
      dispatch(clearError());
      router.replace("/(auth)/current-user");

      // 2. Perform backend & Firebase sign-out and storage cleanup asynchronously in background
      AsyncStorage.removeItem(LAST_ACTIVE_KEY).catch(console.error);
      AsyncStorage.clear().catch(console.error);
      dispatch(logoutUser());
      signOut(auth).catch(console.error);
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(logout());
      dispatch(clearError());
      router.replace("/(auth)/current-user");
    } finally {
      isHandlingLogout.current = false;
    }
  }, [dispatch, router]);

  const recordStartTime = useCallback(async () => {
    if (isPublicRoute || !isAuthenticated) return;
    try {
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error recording start time:", error);
    }
  }, [isPublicRoute, isAuthenticated]);

  const checkInactivity = useCallback(async () => {
    if (isPublicRoute || !isAuthenticated) return;
    
    try {
      const lastActiveTime = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActiveTime) {
        const inactiveDuration = Date.now() - Number(lastActiveTime);
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

  const resetTimer = useCallback(async () => {
    if (isPublicRoute || !isAuthenticated) return;
    
    await recordStartTime();
    
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    inactivityTimer.current = setTimeout(() => {
      checkInactivity();
    }, INACTIVITY_TIMEOUT);
  }, [isPublicRoute, isAuthenticated, recordStartTime, checkInactivity]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (isPublicRoute || !isAuthenticated) {
        appState.current = nextAppState;
        return;
      }

      if (nextAppState === "background") {
        await recordStartTime();
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      }
      
      if (nextAppState === "active" && appState.current === "background") {
        const didLogout = await checkInactivity();
        if (!didLogout) {
          await resetTimer();
        }
      }
      
      appState.current = nextAppState;
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
      resetTimer();
    }

    return false;
  }, [isAuthenticated, isPublicRoute, resetTimer]);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={handleInteractionCapture}
      onMoveShouldSetResponderCapture={handleInteractionCapture}
    >
      {children}
    </View>
  );
};

export default UserInactivityProvider;
