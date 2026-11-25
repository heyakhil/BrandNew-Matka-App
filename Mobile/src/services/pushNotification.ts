import { PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  requestPermission,
  AuthorizationStatus,
  type RemoteMessage,
  type Messaging,
} from '@react-native-firebase/messaging';
import { showMessage } from 'react-native-flash-message';
import { registerFcmTokenApi, removeFcmTokenApi } from './api';

let activeAuthToken: string | null = null;
let cachedFcmToken: string | null = null;
let unsubscribeOnMessage: (() => void) | null = null;
let unsubscribeOnTokenRefresh: (() => void) | null = null;

function getMessagingInstance(): Messaging | null {
  try {
    return getMessaging();
  } catch (error) {
    console.warn('[Push] Firebase messaging instance not available:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }

    const messaging = getMessagingInstance();
    if (!messaging) return false;
    const authStatus = await requestPermission(messaging);
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[Push] Permission request error:', error);
    return false;
  }
}

export async function initPushNotifications(authToken?: string | null): Promise<void> {
  try {
    if (authToken) {
      activeAuthToken = authToken;
    }

    const messaging = getMessagingInstance();
    if (!messaging) {
      console.log('[Push] Messaging service skipped (not initialized).');
      return;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[Push] Notification permission not granted');
    }

    let fcmToken: string | null = null;
    try {
      fcmToken = await getToken(messaging);
      cachedFcmToken = fcmToken;
      console.log('[Push] Device FCM Token:', fcmToken);
    } catch (tokenErr) {
      console.warn('[Push] Failed to get FCM token:', tokenErr);
    }

    // Always subscribe to general broadcast topics
    try {
      await subscribeToTopic(messaging, 'all');
      await subscribeToTopic(messaging, 'results');
      console.log('[Push] Subscribed to topics: all, results');
    } catch (subErr) {
      console.warn('[Push] Topic subscription error:', subErr);
    }

    // If user is logged in and token is available, register token with backend
    if (fcmToken && activeAuthToken) {
      try {
        await registerFcmTokenApi(fcmToken, activeAuthToken, Platform.OS);
        console.log('[Push] Registered FCM token with server for logged in user.');
      } catch (regErr) {
        console.warn('[Push] Failed to register token with backend:', regErr);
      }
    }

    // Handle token refresh
    if (!unsubscribeOnTokenRefresh) {
      unsubscribeOnTokenRefresh = onTokenRefresh(messaging, (newToken: string) => {
        try {
          cachedFcmToken = newToken;
          void subscribeToTopic(messaging, 'all');
          void subscribeToTopic(messaging, 'results');
          if (activeAuthToken) {
            void registerFcmTokenApi(newToken, activeAuthToken, Platform.OS);
          }
        } catch (err) {
          console.warn('[Push] Token refresh handler error:', err);
        }
      });
    }

    // Foreground message listener
    if (!unsubscribeOnMessage) {
      unsubscribeOnMessage = onMessage(
        messaging,
        (remoteMessage: RemoteMessage) => {
          try {
            console.log('[Push] Foreground message received:', remoteMessage);
            const title = remoteMessage.notification?.title ?? 'Royal Club Alert';
            const body = remoteMessage.notification?.body ?? '';
            showMessage({
              message: title,
              description: body,
              type: 'info',
              icon: 'info',
              floating: true,
              duration: 5000,
            });
          } catch (err) {
            console.warn('[Push] Foreground message display error:', err);
          }
        },
      );
    }

    // Background notification tap
    onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
      console.log('[Push] App opened from background notification:', remoteMessage);
    });

    // Check if app was opened from quit state
    const initialNotification = await getInitialNotification(messaging);
    if (initialNotification) {
      console.log('[Push] App opened from quit state notification:', initialNotification);
    }
  } catch (error) {
    console.error('[Push] Setup push notifications failed:', error);
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    if (cachedFcmToken && activeAuthToken) {
      await removeFcmTokenApi(cachedFcmToken, activeAuthToken);
    }
    activeAuthToken = null;
  } catch (error) {
    console.warn('[Push] Unregister token error:', error);
  }
}
