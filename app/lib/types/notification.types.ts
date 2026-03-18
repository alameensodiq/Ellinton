import * as Notifications from 'expo-notifications';

export type NotificationType = 
  | 'transaction'
  | 'security'
  | 'promotion'
  | 'account_update'
  | 'test';

export interface NotificationData {
  type: NotificationType;
  transactionId?: string;
  accountId?: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  url?: string;
  [key: string]: any;
}

export interface PushTokenData {
  pushToken: string;
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'web';
  deviceId?: string;
  appVersion?: string;
  timestamp: string;
}

export interface BackendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AndroidChannelConfig {
  id: string;
  name: string;
  importance: Notifications.AndroidImportance;
  vibrationPattern?: number[];
  lightColor?: string;
  sound?: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  platformVersion: string | number;
  deviceName?: string | null;
  deviceType?: number | null;
  deviceYear?: number | null;
  appVersion?: string;
}