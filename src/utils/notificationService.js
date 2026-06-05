import messaging  from '@react-native-firebase/messaging';
import auth       from '@react-native-firebase/auth';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import {
  getFirestore, doc, updateDoc,
} from '@react-native-firebase/firestore';

// ✅ Android 13+ Permission maango
const requestAndroidPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title  : 'Notification Permission',
        message: 'Community Advisory app ko notifications bhejne ki permission chahiye',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // Android 12 aur neeche — permission automatic
};

// ✅ FCM Token Firestore mein save karo
export const saveFCMToken = async () => {
  try {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      console.log('⚠️ User not logged in — token not saved');
      return;
    }

    const token = await messaging().getToken();
    if (!token) {
      console.log('⚠️ FCM token not available');
      return;
    }

    console.log('📱 FCM Token:', token);

    const db = getFirestore();
    await updateDoc(doc(db, 'users', uid), {
      fcmToken : token,
      platform : Platform.OS,
    });

    console.log('✅ FCM Token saved!');
    return token;
  } catch (e) {
    console.error('❌ FCM Token save error:', e.message);
  }
};

// ✅ Main Permission Request Function
export const requestNotificationPermission = async () => {
  try {
    // Android 13+ permission
    const androidGranted = await requestAndroidPermission();
    if (!androidGranted) {
      console.log('❌ Android notification permission denied');
      return false;
    }

    // iOS + Firebase permission
    const authStatus = await messaging().requestPermission();
    const enabled    =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted, status:', authStatus);
      await saveFCMToken();
      return true;
    } else {
      console.log('❌ Notification permission denied, status:', authStatus);
      return false;
    }
  } catch (e) {
    console.error('❌ Permission error:', e.message);
    return false;
  }
};

// ✅ Foreground notification — App khuli ho tab
export const setupForegroundNotification = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('📩 Foreground notification received:', remoteMessage);

    // Alert.alert(
    //   remoteMessage.notification?.title || '🔔 New Notification',
    //   remoteMessage.notification?.body  || '',
    //   [{ text: 'OK', style: 'default' }],
    // );
  });
  return unsubscribe;
};

// ✅ Background notification — App band ho tab
export const setupBackgroundNotification = () => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('📩 App background mein thi, notification tap kiya:', remoteMessage);
  });

  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('📩 App quit thi, notification se khuli:', remoteMessage);
    }
  });
};

// ✅ Token Refresh — Token change hone par update karo
export const setupTokenRefresh = () => {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('🔄 FCM Token refreshed:', newToken);
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const db = getFirestore();
    await updateDoc(doc(db, 'users', uid), { fcmToken: newToken });
    console.log('✅ Refreshed token saved!');
  });
  return unsubscribe;
};