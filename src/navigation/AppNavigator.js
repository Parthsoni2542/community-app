// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { useDispatch, useSelector } from 'react-redux';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { setUser, setRole, logout } from '../store/slices/authSlice';

// import AuthNavigator   from './AuthNavigator';
// import AdminNavigator  from './AdminNavigator';
// import ExpertNavigator from './ExpertNavigator';
// import UserNavigator   from './UserNavigator';
// import SplashScreen    from '../screens/auth/SplashScreen';

// export default function AppNavigator() {
//   const dispatch = useDispatch();
//   const { role } = useSelector((state) => state.auth);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
//       if (firebaseUser) {
//         const doc = await firestore()
//           .collection('users')
//           .doc(firebaseUser.uid)
//           .get();

//         if (doc.exists) {
//           const data = doc.data();
//           dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email }));
//           dispatch(setRole(data.role));
//         }
//         setCurrentUser(firebaseUser);
//       } else {
//         setCurrentUser(null);
//         dispatch(logout());
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

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
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { setUser, setRole, logout } from '../store/slices/authSlice';
import AuthNavigator   from './AuthNavigator';
import AdminNavigator  from './AdminNavigator';
import ExpertNavigator from './ExpertNavigator';
import UserNavigator   from './UserNavigator';
import SplashScreen    from '../screens/auth/SplashScreen';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.auth);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const app  = getApp();
    const auth = getAuth(app);
    const db   = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email ?? 'null');

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('📄 doc exists:', userDoc.exists());

          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('👤 Role:', data.role);
            dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email }));
            dispatch(setRole(data.role));
          } else {
            dispatch(setRole('user'));
          }
        } catch (err) {
          console.error('❌ Firestore error:', err.message);
        }
        setCurrentUser(firebaseUser);
      } else {
        setCurrentUser(null);
        dispatch(logout());
      }

      setLoading(false); // ✅ Hamesha false karo
    });

    return unsubscribe;
  }, []);

  // ✅ Sirf loading tak SplashScreen dikhao
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