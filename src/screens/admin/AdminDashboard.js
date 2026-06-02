// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';

// export default function AdminDashboard() {
//   const dispatch = useDispatch();
//   const [counts, setCounts] = useState({ users: 0, experts: 0, categories: 0, chats: 0 });

//   useEffect(() => {
//     const fetchCounts = async () => {
//       const [users, experts, categories, chats] = await Promise.all([
//         firestore().collection('users').where('role', '==', 'user').get(),
//         firestore().collection('users').where('role', '==', 'expert').get(),
//         firestore().collection('categories').get(),
//         firestore().collection('chats').get(),
//       ]);
//       setCounts({
//         users     : users.size,
//         experts   : experts.size,
//         categories: categories.size,
//         chats     : chats.size,
//       });
//     };
//     fetchCounts();
//   }, []);

//   const handleLogout = async () => {
//     await auth().signOut();
//     dispatch(logout());
//   };

//   const cards = [
//     { label: 'Total Users',      value: counts.users,      emoji: '👥', color: '#DBEAFE' },
//     { label: 'Total Experts',    value: counts.experts,    emoji: '👨‍⚕️', color: '#D1FAE5' },
//     { label: 'Categories',       value: counts.categories, emoji: '📂', color: '#FEF3C7' },
//     { label: 'Active Chats',     value: counts.chats,      emoji: '💬', color: '#FCE7F3' },
//   ];

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Admin Dashboard</Text>
//         <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.grid}>
//         {cards.map((card) => (
//           <View key={card.label} style={[styles.card, { backgroundColor: card.color }]}>
//             <Text style={styles.cardEmoji}>{card.emoji}</Text>
//             <Text style={styles.cardValue}>{card.value}</Text>
//             <Text style={styles.cardLabel}>{card.label}</Text>
//           </View>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container : { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
//   title     : { fontSize: 22, fontWeight: '700', color: '#111827' },
//   logoutBtn : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
//   logoutText: { color: '#DC2626', fontWeight: '600' },
//   grid      : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   card      : { width: '47%', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
//   cardEmoji : { fontSize: 32, marginBottom: 8 },
//   cardValue : { fontSize: 28, fontWeight: '700', color: '#111827' },
//   cardLabel : { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
// });


// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';

// export default function AdminDashboard() {
//   const dispatch = useDispatch();
//   const [counts, setCounts] = useState({ users: 0, experts: 0, categories: 0, chats: 0 });

//   useEffect(() => {
//     const fetchCounts = async () => {
//       const [users, experts, categories, chats] = await Promise.all([
//         firestore().collection('users').where('role', '==', 'user').get(),
//         firestore().collection('users').where('role', '==', 'expert').get(),
//         firestore().collection('categories').get(),
//         firestore().collection('chats').get(),
//       ]);
//       setCounts({
//         users     : users.size,
//         experts   : experts.size,
//         categories: categories.size,
//         chats     : chats.size,
//       });
//     };
//     fetchCounts();
//   }, []);

//   const handleLogout = async () => {
//     await auth().signOut();
//     dispatch(logout());
//   };

//   const cards = [
//     { label: 'Total Users',      value: counts.users,      emoji: '👥', color: '#DBEAFE' },
//     { label: 'Total Experts',    value: counts.experts,    emoji: '👨‍⚕️', color: '#D1FAE5' },
//     { label: 'Categories',       value: counts.categories, emoji: '📂', color: '#FEF3C7' },
//     { label: 'Active Chats',     value: counts.chats,      emoji: '💬', color: '#FCE7F3' },
//   ];

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Admin Dashboard</Text>
//         <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.grid}>
//         {cards.map((card) => (
//           <View key={card.label} style={[styles.card, { backgroundColor: card.color }]}>
//             <Text style={styles.cardEmoji}>{card.emoji}</Text>
//             <Text style={styles.cardValue}>{card.value}</Text>
//             <Text style={styles.cardLabel}>{card.label}</Text>
//           </View>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container : { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
//   title     : { fontSize: 22, fontWeight: '700', color: '#111827' },
//   logoutBtn : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
//   logoutText: { color: '#DC2626', fontWeight: '600' },
//   grid      : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   card      : { width: '47%', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
//   cardEmoji : { fontSize: 32, marginBottom: 8 },
//   cardValue : { fontSize: 28, fontWeight: '700', color: '#111827' },
//   cardLabel : { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
// });

// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView,
//   TouchableOpacity, StatusBar, ActivityIndicator,
// } from 'react-native';
// import { getAuth, signOut } from '@react-native-firebase/auth';
// import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
// import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';

// export default function AdminDashboard() {
//   const dispatch = useDispatch();
//   const [counts, setCounts]   = useState({ users: 0, experts: 0, categories: 0, chats: 0 });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCounts = async () => {
//       const db = getFirestore();
//       const [u, e, c, ch] = await Promise.all([
//         getDocs(query(collection(db, 'users'),      where('role', '==', 'user'))),
//         getDocs(query(collection(db, 'users'),      where('role', '==', 'expert'))),
//         getDocs(collection(db, 'categories')),
//         getDocs(collection(db, 'chats')),
//       ]);
//       setCounts({ users: u.size, experts: e.size, categories: c.size, chats: ch.size });
//       setLoading(false);
//     };
//     fetchCounts();
//   }, []);

//   const handleLogout = async () => {
//     await signOut(getAuth());
//     dispatch(logout());
//   };

//   const cards = [
//     { label: 'Total Users',   value: counts.users,      icon: '👥', bg: '#EFF6FF', accent: '#2563EB' },
//     { label: 'Experts',       value: counts.experts,    icon: '🩺', bg: '#F0FDF4', accent: '#16A34A' },
//     { label: 'Categories',    value: counts.categories, icon: '📂', bg: '#FFFBEB', accent: '#D97706' },
//     { label: 'Active Chats',  value: counts.chats,      icon: '💬', bg: '#FDF4FF', accent: '#9333EA' },
//   ];

//   const menuItems = [
//     { label: 'Manage Categories', icon: '📂', screen: 'Categories', color: '#FEF3C7', border: '#F59E0B' },
//     { label: 'Manage Experts',    icon: '🩺', screen: 'Experts',    color: '#D1FAE5', border: '#10B981' },
//     { label: 'Manage Users',      icon: '👥', screen: 'Users',      color: '#DBEAFE', border: '#3B82F6' },
//     { label: 'View All Chats',    icon: '💬', screen: 'Chats',      color: '#EDE9FE', border: '#8B5CF6' },
//   ];

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.greeting}>Good day, Admin 👋</Text>
//           <Text style={styles.subtitle}>Community Advisory Platform</Text>
//         </View>
//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>

//         {/* Stats */}
//         <Text style={styles.sectionTitle}>Overview</Text>
//         {loading ? (
//           <ActivityIndicator color="#2563EB" style={{ marginVertical: 24 }} />
//         ) : (
//           <View style={styles.grid}>
//             {cards.map((card) => (
//               <View key={card.label} style={[styles.statCard, { backgroundColor: card.bg }]}>
//                 <Text style={styles.statIcon}>{card.icon}</Text>
//                 <Text style={[styles.statValue, { color: card.accent }]}>{card.value}</Text>
//                 <Text style={styles.statLabel}>{card.label}</Text>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Quick Actions */}
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <View style={styles.menuGrid}>
//           {menuItems.map((item) => (
//             <TouchableOpacity
//               key={item.label}
//               style={[styles.menuCard, { backgroundColor: item.color, borderLeftColor: item.border }]}
//             >
//               <Text style={styles.menuIcon}>{item.icon}</Text>
//               <Text style={styles.menuLabel}>{item.label}</Text>
//               <Text style={styles.menuArrow}>→</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <View style={{ height: 30 }} />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container   : { flex: 1, backgroundColor: '#F8FAFC' },
//   header      : {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   greeting    : { fontSize: 18, fontWeight: '700', color: '#0F172A' },
//   subtitle    : { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   logoutBtn   : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
//   logoutText  : { color: '#DC2626', fontWeight: '600', fontSize: 13 },
//   sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginLeft: 20, marginTop: 24, marginBottom: 12, textTransform: 'uppercase' },
//   grid        : { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
//   statCard    : { width: '47%', borderRadius: 16, padding: 18, alignItems: 'flex-start' },
//   statIcon    : { fontSize: 28, marginBottom: 10 },
//   statValue   : { fontSize: 30, fontWeight: '800' },
//   statLabel   : { fontSize: 12, color: '#64748B', marginTop: 4 },
//   menuGrid    : { paddingHorizontal: 20, gap: 10 },
//   menuCard    : {
//     flexDirection: 'row', alignItems: 'center',
//     borderRadius: 14, padding: 16,
//     borderLeftWidth: 4,
//   },
//   menuIcon    : { fontSize: 22, marginRight: 14 },
//   menuLabel   : { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
//   menuArrow   : { fontSize: 18, color: '#94A3B8' },
// });



import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const COLORS = {
  primary: '#0D7B7A',
  accent: '#14B8A6',
  lightTeal: '#A7E9E7',
  background: '#B3E9E6',
  white: '#FFFFFF',
  textPrimary: '#0D7B7A',
  textSecondary: '#80B2B0',
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const [counts, setCounts] = useState({ users: 0, experts: 0, categories: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const db = getFirestore();
      const [u, e, c, ch] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'user'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'expert'))),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'chats')),
      ]);
      setCounts({ users: u.size, experts: e.size, categories: c.size, chats: ch.size });
      setLoading(false);
    };
    fetchCounts();
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth());
    dispatch(logout());
  };

  const cards = [
    { label: 'Total Users', value: counts.users, icon: '👥' },
    { label: 'Experts', value: counts.experts, icon: '🩺' },
    { label: 'Categories', value: counts.categories, icon: '📂' },
    { label: 'Active Chats', value: counts.chats, icon: '💬' },
  ];

  const menuItems = [
    { label: 'Manage Categories', icon: '📂', screen: 'Categories' },
    { label: 'Manage Experts', icon: '🩺', screen: 'Experts' },
    { label: 'Manage Users', icon: '👥', screen: 'Users' },
    { label: 'View All Chats', icon: '💬', screen: 'Chats' },
  ];

  return (
    <LinearGradient
      colors={[COLORS.lightTeal, COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.lightTeal} />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good day, Admin</Text>
          <Text style={styles.subtitle}>Community Advisory Platform</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Decorative Shape */}
        <View style={styles.decoration} />

        {/* Overview Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.statsGrid}>
              {cards.map((card) => (
                <View key={card.label} style={styles.statCard}>
                  <Text style={styles.statIcon}>{card.icon}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity key={item.label} style={styles.actionCard}>
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>{item.icon}</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>{item.label}</Text>
                  <Text style={styles.actionArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#FEE9E6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutText: {
    color: '#D95C50',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  decoration: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -40,
    right: -40,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F0FFFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionArrow: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
