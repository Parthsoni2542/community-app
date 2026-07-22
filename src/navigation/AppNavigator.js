import React, { useEffect, useState, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
} from '@react-native-firebase/firestore';
import { setUser, setRole, logout } from '../store/slices/authSlice';
import notifee, { EventType } from '@notifee/react-native';

import AuthNavigator   from './AuthNavigator';
import AdminNavigator  from './AdminNavigator';
import ExpertNavigator from './ExpertNavigator';
import UserNavigator   from './UserNavigator';
import SplashScreen    from '../screens/auth/SplashScreen';

import {
  setupBackgroundNotification,
  setupForegroundNotification,
  setupTokenRefresh,
} from '../utils/notificationService';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.auth);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const navigationRef = useRef(null);

  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  // ── Navigate helper ───────────────────────────────────────────────────────
  const handleNotificationNavigation = useCallback((data) => {
    if (!data?.chatId) return;

    const currentRole = roleRef.current;
    const isBroadcast = data.isBroadcast === 'true';
    const expertIds   = (() => {
      try { return data.expertIds ? JSON.parse(data.expertIds) : []; }
      catch (_) { return []; }
    })();

    console.log('[NAV] role:', currentRole, '| chatId:', data.chatId);

    if (currentRole === 'expert') {
      navigationRef.current?.navigate('Chats', {
        screen: 'ExpertReplyChat',
        params: {
          chatId:          data.chatId,
          userName:        data.userName        || 'User',
          isBroadcast:     isBroadcast,
          subcategoryName: data.subcategoryName || '',
          categoryName:    data.categoryName    || '',
          expertIds,
        },
      });

    } else if (currentRole === 'admin') {
      navigationRef.current?.navigate('Chats', {
        screen: 'AdminChat',
        params: { openChatId: data.chatId },
      });

    } else {
      navigationRef.current?.navigate('Home', {
        screen: 'MainChat',
        params: {
          chatId:          data.chatId,
          expertName:      data.categoryName || 'Chat',
          expertId:        null,
          isBroadcast:     true,
          subcategoryName: data.subcategoryName || null,
          categoryName:    data.categoryName    || null,
          expertIds,
        },
      });
    }
  }, []);

  // ── FCM + Notifee Setup ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribeTokenRefresh = setupTokenRefresh();

    // FCM: background + quit state tap
    setupBackgroundNotification((remoteMessage, state) => {
      console.log(`[FCM] Opened from ${state}:`, remoteMessage.data);
      if (state === 'quit') {
        setTimeout(() => handleNotificationNavigation(remoteMessage.data), 800);
      } else {
        handleNotificationNavigation(remoteMessage.data);
      }
    });

    // FCM: foreground — notifee shows the system banner automatically
    const unsubscribeForeground = setupForegroundNotification((remoteMessage) => {
      console.log('[FCM] Foreground message received:', remoteMessage.data);
      // No manual navigation here — user will tap the notification
    });

    // ✅ NOTIFEE: foreground tap handler
    // When user taps notifee notification while app is open
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('[NOTIFEE] Foreground tap:', detail.notification?.data);
        handleNotificationNavigation(detail.notification?.data);
      }

      if (type === EventType.DISMISSED) {
        console.log('[NOTIFEE] Notification dismissed:', detail.notification?.id);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeNotifee(); // ✅ cleanup notifee listener
    };
  }, [handleNotificationNavigation]);

  // ── Auth State ────────────────────────────────────────────────────────────
  useEffect(() => {
    const app  = getApp();
    const auth = getAuth(app);
    const db   = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.phoneNumber ?? 'null');

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('📄 doc exists:', userDoc.exists());

          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('👤 Role:', data.role);
            dispatch(setUser({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber }));
            dispatch(setRole(data.role));

          } else {
            console.log('🔍 UID se nahi mila, phone se try karo:', firebaseUser.phoneNumber);

            const q     = query(collection(db, 'users'), where('phone', '==', firebaseUser.phoneNumber));
            const qSnap = await getDocs(q);

            if (!qSnap.empty) {
              const oldDoc = qSnap.docs[0];
              const data   = oldDoc.data();
              console.log('✅ Phone se mila, role:', data.role);

              await setDoc(doc(db, 'users', firebaseUser.uid), { ...data });
              await deleteDoc(doc(db, 'users', oldDoc.id));
              console.log('✅ Migration complete');

              dispatch(setUser({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber }));
              dispatch(setRole(data.role));

            } else {
              console.log('⚠️ Koi doc nahi mila, default user role');
              dispatch(setRole('user'));
            }
          }
        } catch (err) {
          console.error('❌ Auth state error:', err.message);
        }

        setCurrentUser(firebaseUser);
      } else {
        console.log('👋 User logged out');
        setCurrentUser(null);
        dispatch(logout());
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef}>
      {!currentUser ? (
        <AuthNavigator />
      ) : role === 'admin' ? (
        <AdminNavigator />
      ) : role === 'expert' ? (
        <ExpertNavigator />
      ) : (
        <UserNavigator />
      )}
    </NavigationContainer>
  );
}