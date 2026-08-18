import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import { Text, TextInput, AppState, AppStateStatus } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import {
  requestNotificationPermission,
  saveFCMToken,
  createNotificationChannel,
  displayNotification,
} from './src/utils/notificationService';

// ── Dev-only logger — production build mein silent ─────────────────────────
const log = (...args: unknown[]) => {
  if (__DEV__) console.log(...args);
};

// ── Font scaling globally disable ───────────────────────────────────────────
// Note: defaultProps on function components is deprecated in React 19 /
// New Architecture. Works fine on current RN Firebase + Notifee stack, but
// if you migrate to RN 0.75+ with New Arch fully on, replace this with a
// custom <AppText>/<AppTextInput> wrapper component instead.
// @ts-ignore - defaultProps not in TextProps type, safe to ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.allowFontScaling = false;
// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.allowFontScaling = false;

// ── Background handlers — MUST stay at TOP LEVEL (outside component) ───────
// These run even when JS engine restarts headlessly, so keep them lean and
// side-effect-safe. Never rely on component state here.

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    log('📩 FCM background message:', remoteMessage.messageId);
    // Data-only push (no `notification` block) → show UI manually via notifee.
    if (!remoteMessage.notification) {
      await displayNotification(remoteMessage);
    }
  } catch (err) {
    log('❌ Background message handler error:', err);
  }
});

// Notifee background tap (user taps notification while app is backgrounded/killed).
// Actual navigation is resolved inside AppNavigator's setupBackgroundNotification,
// which reads notifee's initial/foreground event stream — this handler's only
// job is to make sure the event is acknowledged so the OS doesn't retry it.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    log('[NOTIFEE] Background tap data:', detail.notification?.data);
  }
});

// ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let isMounted = true;

    const bootstrapNotifications = async () => {
      try {
        await createNotificationChannel();
        await requestNotificationPermission();
      } catch (err) {
        log('❌ Notification bootstrap failed:', err);
      }
    };

    bootstrapNotifications();

    // ── Foreground FCM messages (app open, in use) ──────────────────────
    // Without this, pushes received while the app is foregrounded are
    // silently dropped — setBackgroundMessageHandler does NOT fire here.
    const unsubOnMessage = messaging().onMessage(async (remoteMessage) => {
      try {
        log('📩 FCM foreground message:', remoteMessage.messageId);
        await displayNotification(remoteMessage);
      } catch (err) {
        log('❌ onMessage handler error:', err);
      }
    });

    // ── App opened by tapping notification while app was in BACKGROUND ──
    const unsubOnNotificationOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        log('🔔 Notification opened app from background:', remoteMessage?.data);
        // Hand off to your navigation layer, e.g.:
        // navigationRef.current?.navigate(remoteMessage?.data?.screen, remoteMessage?.data);
      }
    );

    // ── App opened by tapping notification from QUIT/killed state ───────
    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          log('🔔 App opened from quit state via notification:', remoteMessage.data);
          // navigationRef.current?.navigate(remoteMessage.data?.screen, remoteMessage.data);
        }
      })
      .catch((err) => log('❌ getInitialNotification error:', err));

    // ── FCM token can rotate at any time — keep backend in sync ─────────
    const unsubTokenRefresh = messaging().onTokenRefresh(async (token) => {
      try {
        log('🔄 FCM token refreshed');
        await saveFCMToken(token);
      } catch (err) {
        log('❌ Token refresh save failed:', err);
      }
    });

    // ── Save token on sign-in (token may differ per session) ────────────
    const unsubAuth = auth().onAuthStateChanged(async (user) => {
      if (!user || !isMounted) return;
      log('👤 User authenticated:', user.phoneNumber);
      try {
        await saveFCMToken();
      } catch (err) {
        log('❌ saveFCMToken on auth failed:', err);
      }
    });

    // ── Re-check permission when app comes back to foreground ───────────
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        requestNotificationPermission().catch((err) =>
          log('❌ Permission recheck failed:', err)
        );
      }
      appState.current = nextState;
    });

    return () => {
      isMounted = false;
      unsubOnMessage();
      unsubOnNotificationOpened();
      unsubTokenRefresh();
      unsubAuth();
      appStateSub.remove();
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