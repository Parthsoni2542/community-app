import React, { useEffect }  from 'react';
import { Provider }          from 'react-redux';
import { SafeAreaProvider }  from 'react-native-safe-area-context';
import { store }             from './src/store/store';
import AppNavigator          from './src/navigation/AppNavigator';
import messaging             from '@react-native-firebase/messaging';
import auth                  from '@react-native-firebase/auth';
import { Text, TextInput }   from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import {
  requestNotificationPermission,
  saveFCMToken,
  createNotificationChannel,
  displayNotification,
} from './src/utils/notificationService';

// ✅ Font scaling globally disable
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

// ── Background handlers — must be at TOP LEVEL (outside component) ─────────

// FCM background/quit message (silent data push, no UI)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 FCM Background message:', remoteMessage.messageId);
  // notifee will already show UI if notification payload present
  // If data-only push, display manually:
  // if (!remoteMessage.notification) {
  //   await displayNotification(remoteMessage);
  // }
});

// ✅ Notifee background tap handler (user taps notification from background/quit)
// Navigation is handled inside AppNavigator via setupBackgroundNotification
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[NOTIFEE] Background tap data:', detail.notification?.data);
    // AppNavigator's setupBackgroundNotification handles the actual navigation
  }
});

// ──────────────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    // Create Android notification channels first
    createNotificationChannel();

    // Request permission + save FCM token
    requestNotificationPermission();

    // Re-save FCM token on every sign-in (token may rotate)
    const unsubAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('👤 User authenticated:', user.phoneNumber);
        setTimeout(() => saveFCMToken(), 2000);
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}