import React, { useEffect } from 'react';
import { Provider }         from 'react-redux';
import { store }            from './src/store/store';
import AppNavigator         from './src/navigation/AppNavigator';
import messaging            from '@react-native-firebase/messaging';
import auth                 from '@react-native-firebase/auth';
import {
  requestNotificationPermission,
  setupForegroundNotification,
  setupBackgroundNotification,
  setupTokenRefresh,
  saveFCMToken,
} from './src/utils/notificationService';

// ✅ Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 Background message handled:', remoteMessage);
});

export default function App() {
  useEffect(() => {
    // ✅ Permission + Token setup
    requestNotificationPermission();

    // ✅ Foreground
    const unsubForeground = setupForegroundNotification();

    // ✅ Background/Quit
    setupBackgroundNotification();

    // ✅ Token Refresh
    const unsubRefresh = setupTokenRefresh();

    // ✅ Jab bhi user login kare — token save karo
    const unsubAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('👤 User logged in:', user.email);
        // Token save karo login ke baad
        setTimeout(() => saveFCMToken(), 2000);
      }
    });

    return () => {
      unsubForeground();
      unsubRefresh();
      unsubAuth();
    };
  }, []);

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}