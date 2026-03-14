import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type AppsFlyerExtra = {
  devKey?: string;
  iosAppId?: string;
};

type ExpoExtra = {
  appsflyer?: AppsFlyerExtra;
};

type AppsFlyerInitOptions = {
  devKey: string;
  appId?: string;
  isDebug: boolean;
  onInstallConversionDataListener: boolean;
  onDeepLinkListener: boolean;
  timeToWaitForATTUserAuthorization: number;
};

type AppsFlyerSuccessResponse = Record<string, unknown>;

type AppsFlyerErrorResponse = {
  status?: string;
  type?: string;
  message?: string;
};

type AppsFlyerInstallConversionResponse = {
  status?: string;
  type?: string;
  data?: Record<string, unknown>;
};

type AppsFlyerDeepLinkResponse = {
  status?: string;
  type?: string;
  deepLinkStatus?: string;
  data?: Record<string, unknown>;
};

type AppsFlyerModule = {
  onInstallConversionData: (
    listener: (response: AppsFlyerInstallConversionResponse) => void
  ) => void;
  onInstallConversionFailure: (
    listener: (response: AppsFlyerErrorResponse) => void
  ) => void;
  onDeepLink: (listener: (response: AppsFlyerDeepLinkResponse) => void) => void;
  initSdk: (
    options: AppsFlyerInitOptions,
    success?: (response: AppsFlyerSuccessResponse) => void,
    error?: (response: AppsFlyerErrorResponse) => void
  ) => void;
  logEvent: (
    eventName: string,
    eventValues: Record<string, string | number | boolean>,
    success?: (response: AppsFlyerSuccessResponse) => void,
    error?: (response: AppsFlyerErrorResponse) => void
  ) => void;
};

export type AppsFlyerEventValues = Record<
  string,
  string | number | boolean | undefined
>;

export type RegistrationCompletedEvent = {
  userId: string;
  registrationMethod?: string;
  status?: string;
};

let hasInitializedAppsFlyer = false;

function isExpoGo(): boolean {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function getAppsFlyerConfig(): AppsFlyerExtra {
  const extra = (Constants.expoConfig?.extra ?? null) as ExpoExtra | null;

  return extra?.appsflyer ?? {};
}

async function loadAppsFlyerModule(): Promise<AppsFlyerModule | null> {
  if (Platform.OS === "web" || isExpoGo()) {
    return null;
  }

  try {
    const module = await import("react-native-appsflyer");
    const appsFlyer = module.default as AppsFlyerModule | undefined;

    if (
      !appsflyerHasRequiredMethods(appsFlyer)
    ) {
      console.warn(
        "AppsFlyer native module is unavailable. Rebuild the native app and use a development build instead of Expo Go."
      );
      return null;
    }

    return appsFlyer;
  } catch (error) {
    console.warn("AppsFlyer module could not be loaded:", error);
    return null;
  }
}

function appsflyerHasRequiredMethods(
  appsFlyer: AppsFlyerModule | undefined
): appsFlyer is AppsFlyerModule {
  return Boolean(
    appsFlyer &&
      typeof appsFlyer.onInstallConversionData === "function" &&
      typeof appsFlyer.onInstallConversionFailure === "function" &&
      typeof appsFlyer.onDeepLink === "function" &&
      typeof appsFlyer.initSdk === "function" &&
      typeof appsFlyer.logEvent === "function"
  );
}

function sanitizeEventValues(
  values: AppsFlyerEventValues
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

export async function initializeAppsFlyer(): Promise<void> {
  if (hasInitializedAppsFlyer || Platform.OS === "web") {
    return;
  }

  if (isExpoGo()) {
    console.warn(
      "AppsFlyer is disabled in Expo Go. Use a development build or production build to test the native SDK."
    );
    return;
  }

  const { devKey, iosAppId } = getAppsFlyerConfig();

  if (!devKey || devKey === "YOUR_APPSFLYER_DEV_KEY") {
    console.warn("AppsFlyer dev key is missing. Skipping SDK initialization.");
    return;
  }

  if (Platform.OS === "ios" && (!iosAppId || iosAppId === "YOUR_APPLE_APP_ID")) {
    console.warn("AppsFlyer iOS App ID is missing. Skipping SDK initialization.");
    return;
  }

  const appsFlyer = await loadAppsFlyerModule();

  if (!appsFlyer) {
    return;
  }

  appsFlyer.onInstallConversionData((response) => {
    console.log("AppsFlyer install conversion data:", response);
  });

  appsFlyer.onInstallConversionFailure((response) => {
    console.warn("AppsFlyer install conversion failed:", response);
  });

  appsFlyer.onDeepLink((response) => {
    console.log("AppsFlyer deep link:", response);
  });

  appsFlyer.initSdk(
    {
      devKey,
      appId: Platform.OS === "ios" ? iosAppId : undefined,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      timeToWaitForATTUserAuthorization: 10,
    },
    (response) => {
      hasInitializedAppsFlyer = true;
      console.log("AppsFlyer initialized:", response);
    },
    (response) => {
      console.warn("AppsFlyer init failed:", response); 
    }
  );
}

export async function trackAppsFlyerEvent(
  eventName: string,
  eventValues: AppsFlyerEventValues = {}
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const appsFlyer = await loadAppsFlyerModule();

  if (!appsFlyer) {
    return;
  }

  const payload = sanitizeEventValues(eventValues);

  return new Promise((resolve, reject) => {
    appsFlyer.logEvent(
      eventName,
      payload,
      (response) => {
        console.log(`AppsFlyer event logged: ${eventName}`, response);
        resolve();
      },
      (response) => {
        console.warn(`AppsFlyer event failed: ${eventName}`, response);
        reject(response);
      }
    );
  });
}

export async function trackRegistrationCompleted(
  event: RegistrationCompletedEvent
): Promise<void> {
  const dedupeKey = `appsflyer:registration:${event.userId}`;
  const alreadyTracked = await AsyncStorage.getItem(dedupeKey);

  if (alreadyTracked) {
    return;
  }

  await trackAppsFlyerEvent("af_complete_registration", {
    customer_user_id: event.userId,
    af_registration_method: event.registrationMethod ?? "mobile_app",
    registration_status: event.status ?? "completed",
  });

  await trackAppsFlyerEvent("sign_up", {
    customer_user_id: event.userId,
    registration_method: event.registrationMethod ?? "mobile_app",
    status: event.status ?? "completed",
  });

  await AsyncStorage.setItem(dedupeKey, "1");
}
