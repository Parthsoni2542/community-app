/**
 * fcmService.js
 * Firebase Cloud Messaging + Notifee — production-ready helper.
 */

import messaging from '@react-native-firebase/messaging';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';
import { Platform, PermissionsAndroid } from 'react-native';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';

// ─── Internal helpers ────────────────────────────────────────────────────────

const _requestAndroidPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Notification Permission',
      message: 'Allow notifications to stay updated on your consultations and community activity.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Create (or update) the default Android notification channel.
 * Safe to call multiple times — notifee is idempotent for channels.
 */
export const createNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id:          'default',
    name:        'General Notifications',
    importance:  AndroidImportance.HIGH, // shows heads-up banner
    sound:       'default',
    vibration:   true,
  });

  // Extra channel for chat messages (optional but recommended)
  await notifee.createChannel({
    id:          'chat',
    name:        'Chat Messages',
    importance:  AndroidImportance.HIGH,
    sound:       'default',
    vibration:   true,
  });
};

/**
 * Display a local notification via notifee.
 * Works in FOREGROUND + background + quit state.
 */
export const displayNotification = async (remoteMessage) => {
  try {
    const currentUid = getAuth().currentUser?.uid;
    const senderUid  = remoteMessage.data?.senderUid; // ← backend se senderUid bhejo

    // ✅ Agar current user hi sender hai to notification mat dikhao
    if (currentUid && senderUid && currentUid === senderUid) {
      console.log('[NOTIFEE] Skipping own message notification.');
      return;
    }

    const title     = remoteMessage.notification?.title ?? remoteMessage.data?.title ?? 'New Message';
    const body      = remoteMessage.notification?.body  ?? remoteMessage.data?.body  ?? '';
    const data      = remoteMessage.data ?? {};
    const channelId = data.chatId ? 'chat' : 'default';

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        smallIcon:   'ic_launcher',
        color:       '#6C63FF',
        pressAction: { id: 'default' },
        sound:       'default',
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  } catch (e) {
    console.error('[NOTIFEE] displayNotification failed:', e.message);
  }
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const saveFCMToken = async () => {
  try {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      console.warn('[FCM] saveFCMToken called with no signed-in user — skipped.');
      return { success: false, error: 'no_user' };
    }

    const token = await messaging().getToken();
    if (!token) {
      console.warn('[FCM] getToken() returned empty — device may not support FCM.');
      return { success: false, error: 'no_token' };
    }

    const db = getFirestore();
    await setDoc(
      doc(db, 'users', uid),
      {
        fcmToken:        token,
        fcmTokenUpdated: new Date().toISOString(),
        platform:        Platform.OS,
      },
      { merge: true },
    );

    console.log('[FCM] Token saved for UID:', uid);
    return { success: true, token };

  } catch (e) {
    console.error('[FCM] saveFCMToken failed:', e.code, e.message);
    return { success: false, error: e.code ?? e.message };
  }
};

export const requestNotificationPermission = async () => {
  try {
    // Step 1: Android 13+ runtime permission
    const androidGranted = await _requestAndroidPermission();
    if (!androidGranted) {
      console.log('[FCM] Android notification permission denied by user.');
      return { success: false, error: 'android_denied' };
    }

    // Step 2: iOS permission via notifee (handles both FCM + local)
    if (Platform.OS === 'ios') {
      const settings = await notifee.requestPermission();
      const granted  = settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
      if (!granted) {
        console.log('[FCM] iOS permission denied via notifee.');
        return { success: false, error: 'ios_denied' };
      }
    } else {
      // Android: also request via FCM messaging (belt + suspenders)
      const authStatus = await messaging().requestPermission();
      const granted =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!granted) {
        return { success: false, error: 'android_fcm_denied' };
      }
    }

    // Step 3: Create Android channels
    await createNotificationChannel();

    console.log('[FCM] Permission granted.');
    return await saveFCMToken();

  } catch (e) {
    console.error('[FCM] requestNotificationPermission failed:', e.code, e.message);
    return { success: false, error: e.code ?? e.message };
  }
};

export const setupTokenRefresh = () => {
  return messaging().onTokenRefresh(async (newToken) => {
    console.log('[FCM] Token refreshed.');
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      const db = getFirestore();
      await setDoc(
        doc(db, 'users', uid),
        {
          fcmToken:        newToken,
          fcmTokenUpdated: new Date().toISOString(),
          platform:        Platform.OS,
        },
        { merge: true },
      );
      console.log('[FCM] Refreshed token saved for UID:', uid);
    } catch (e) {
      console.error('[FCM] Token refresh save failed:', e.code, e.message);
    }
  });
};

/**
 * Foreground FCM listener — shows system notification via notifee.
 * Returns unsubscribe function.
 */
export const setupForegroundNotification = (onMessage) => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM] Foreground message:', remoteMessage.messageId);

    // ✅ Show real system notification even while app is open
    await displayNotification(remoteMessage);

    onMessage?.(remoteMessage);
  });
};

export const setupBackgroundNotification = (onOpen) => {
  // App was in background, user tapped notification
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM] Opened from background:', remoteMessage.messageId);
    onOpen?.(remoteMessage, 'background');
  });

  // App was fully quit, user tapped notification
  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('[FCM] Opened from quit state:', remoteMessage.messageId);
      onOpen?.(remoteMessage, 'quit');
    }
  });
};