import { useRouter, usePathname } from "expo-router";
import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { logoutUser } from "../lib/thunks/authThunks";
import { clearError } from "../lib/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAppSelector } from "../lib/hooks/useAppSelector";

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 min timeout
const LAST_ACTIVE_KEY = "lastActiveTime";

const PUBLIC_ROUTES = [
  "/(auth)/login",
  "/(auth)/current-user", 
  "/(auth)/create-account",
  "/(auth)/forgot-password",
  "/(auth)/create-account-info",
  "/"
];

const UserInactivityProvider = ({ children }: { children: React.ReactNode }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // Fixed: Use ReturnType<typeof setTimeout>
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  
  // Get auth state from Redux
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.includes(route));

  const handleLogout = useCallback(async () => {
    try {
      console.log("Inactivity logout triggered");
      
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      
      // Dispatch logout and sign out from Firebase
      await dispatch(logoutUser() as any).unwrap();
      await signOut(auth);
      dispatch(clearError());
      
      router.replace("/(auth)/current-user");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/(auth)/current-user");
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
          console.log(`User inactive for ${inactiveDuration}ms, logging out`);
          await handleLogout();
        }
      }
    } catch (error) {
      console.error("Error checking inactivity:", error);
    }
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
        await checkInactivity();
        await resetTimer();
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
    resetTimer();
  }, [pathname, isAuthenticated, resetTimer]);

  // Track user interactions (taps, swipes) - only for web
  useEffect(() => {
    if (isPublicRoute || !isAuthenticated) return;

    const handleUserInteraction = () => {
      resetTimer();
    };

    // For web/platform that supports these events
    const events = ['click', 'touchstart', 'touchmove', 'keydown'];
    
    // Check if window is defined (web environment)
    if (typeof window !== 'undefined') {
      events.forEach(event => {
        window.addEventListener(event, handleUserInteraction);
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        events.forEach(event => {
          window.removeEventListener(event, handleUserInteraction);
        });
      }
    };
  }, [isPublicRoute, isAuthenticated, resetTimer]);

  return children;
};

export default UserInactivityProvider;