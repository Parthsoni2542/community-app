// // import React, { useEffect, useState } from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import { useDispatch, useSelector } from 'react-redux';
// // import auth from '@react-native-firebase/auth';
// // import firestore from '@react-native-firebase/firestore';
// // import { setUser, setRole, logout } from '../store/slices/authSlice';

// // import AuthNavigator   from './AuthNavigator';
// // import AdminNavigator  from './AdminNavigator';
// // import ExpertNavigator from './ExpertNavigator';
// // import UserNavigator   from './UserNavigator';
// // import SplashScreen    from '../screens/auth/SplashScreen';

// // export default function AppNavigator() {
// //   const dispatch = useDispatch();
// //   const { role } = useSelector((state) => state.auth);
// //   const [loading, setLoading] = useState(true);
// //   const [currentUser, setCurrentUser] = useState(null);

// //   useEffect(() => {
// //     const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
// //       if (firebaseUser) {
// //         const doc = await firestore()
// //           .collection('users')
// //           .doc(firebaseUser.uid)
// //           .get();

// //         if (doc.exists) {
// //           const data = doc.data();
// //           dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email }));
// //           dispatch(setRole(data.role));
// //         }
// //         setCurrentUser(firebaseUser);
// //       } else {
// //         setCurrentUser(null);
// //         dispatch(logout());
// //       }
// //       setLoading(false);
// //     });

// //     return unsubscribe;
// //   }, []);

// //   if (loading) return <SplashScreen />;

// //   return (
// //     <NavigationContainer>
// //       {!currentUser ? (
// //         <AuthNavigator />
// //       ) : role === 'admin' ? (
// //         <AdminNavigator />
// //       ) : role === 'expert' ? (
// //         <ExpertNavigator />
// //       ) : (
// //         <UserNavigator />
// //       )}
// //     </NavigationContainer>
// //   );
// // }


// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import { getApp } from '@react-native-firebase/app';
// import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
// import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
// import { setUser, setRole, logout } from '../store/slices/authSlice';
// import AuthNavigator   from './AuthNavigator';
// import AdminNavigator  from './AdminNavigator';
// import ExpertNavigator from './ExpertNavigator';
// import UserNavigator   from './UserNavigator';
// import SplashScreen    from '../screens/auth/SplashScreen';

// export default function AppNavigator() {
//   const dispatch = useDispatch();
//   const { role } = useSelector((state) => state.auth);
//   const [loading, setLoading]         = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     const app  = getApp();
//     const auth = getAuth(app);
//     const db   = getFirestore(app);

//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       console.log('🔥 Auth state changed:', firebaseUser?.email ?? 'null');

//       if (firebaseUser) {
//         try {
//           const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
//           console.log('📄 doc exists:', userDoc.exists());

//           if (userDoc.exists()) {
//             const data = userDoc.data();
//             console.log('👤 Role:', data.role);
//             dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email }));
//             dispatch(setRole(data.role));
//           } else {
//             dispatch(setRole('user'));
//           }
//         } catch (err) {
//           console.error('❌ Firestore error:', err.message);
//         }
//         setCurrentUser(firebaseUser);
//       } else {
//         setCurrentUser(null);
//         dispatch(logout());
//       }

//       setLoading(false); // ✅ Hamesha false karo
//     });

//     return unsubscribe;
//   }, []);

//   // ✅ Sirf loading tak SplashScreen dikhao
//   if (loading) return <SplashScreen />;

//   return (
//     <NavigationContainer>
//       {!currentUser ? (
//         <AuthNavigator />
//       ) : role === 'admin' ? (
//         <AdminNavigator />
//       ) : role === 'expert' ? (
//         <ExpertNavigator />
//       ) : (
//         <UserNavigator />
//       )}
//     </NavigationContainer>
//   );
// }


import React, { useEffect, useState } from 'react';
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
import AuthNavigator   from './AuthNavigator';
import AdminNavigator  from './AdminNavigator';
import ExpertNavigator from './ExpertNavigator';
import UserNavigator   from './UserNavigator';
import SplashScreen    from '../screens/auth/SplashScreen';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.auth);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const app  = getApp();
    const auth = getAuth(app);
    const db   = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.phoneNumber ?? 'null');

      if (firebaseUser) {
        try {
          // ── Step 1: UID se direct lookup ──
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('📄 doc exists:', userDoc.exists());

          if (userDoc.exists()) {
            // ── Normal case: doc found ──
            const data = userDoc.data();
            console.log('👤 Role:', data.role);
            dispatch(setUser({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber }));
            dispatch(setRole(data.role));

          } else {
            // ── Step 2: Admin-created user — phone se dhundo ──
            console.log('🔍 UID se nahi mila, phone se try karo:', firebaseUser.phoneNumber);

            const q     = query(
              collection(db, 'users'),
              where('phone', '==', firebaseUser.phoneNumber),
            );
            const qSnap = await getDocs(q);

            if (!qSnap.empty) {
              const oldDoc = qSnap.docs[0];
              const data   = oldDoc.data();
              console.log('✅ Phone se mila, role:', data.role);

              // Naye Auth UID pe migrate karo
              await setDoc(doc(db, 'users', firebaseUser.uid), { ...data });
              await deleteDoc(doc(db, 'users', oldDoc.id));
              console.log('✅ Migration complete');

              dispatch(setUser({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber }));
              dispatch(setRole(data.role));

            } else {
              // Genuinely new user
              console.log('⚠️ Koi doc nahi mila, default user role');
              dispatch(setRole('user'));
            }
          }
        } catch (err) {
          console.error('❌ Auth state error:', err.message);
          dispatch(setRole('user'));
        }

        setCurrentUser(firebaseUser);
      } else {
        // ── Logged out ──
        console.log('👋 User logged out');
        setCurrentUser(null);
        dispatch(logout());
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
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