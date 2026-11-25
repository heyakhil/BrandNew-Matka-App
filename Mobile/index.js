/**
 * @format
 */

import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage: RemoteMessage) => {
    console.log('[Push] Message handled in the background:', remoteMessage);
  });
} catch (error) {
  console.warn('[Push] Background message handler init skipped:', error);
}

AppRegistry.registerComponent(appName, () => App);
