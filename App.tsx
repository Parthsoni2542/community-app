import React, { useEffect } from 'react';
import { Provider }         from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

// Background message handler — must be registered before any other listener
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 Background message received:', remoteMessage);
});

export default function App() {
  useEffect(() => {
    // Request notification permission and register FCM token
    requestNotificationPermission();

    // Foreground notification listener
    const unsubForeground = setupForegroundNotification();

    // Background / quit-state notification handler
    setupBackgroundNotification();

    // Refresh FCM token whenever it rotates
    const unsubRefresh = setupTokenRefresh();

    // Save a fresh FCM token each time the user signs in
    const unsubAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('👤 User authenticated:', user.email);
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
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}