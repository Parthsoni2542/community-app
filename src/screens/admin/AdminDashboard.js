// import React, { useEffect, useState, useCallback, memo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
//   ActivityIndicator,
//   Platform,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { getAuth, signOut } from '@react-native-firebase/auth';
// import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
// import { useDispatch } from 'react-redux';
// import Icon from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { logout } from '../../store/slices/authSlice';

// // ── Design tokens — shared with navigators ────────────────────────────────────

// const COLORS = {
//   primary: '#0D7B7A',
//   primaryLight: '#F0FDFA',
//   primaryBorder: '#E0F2F1',
//   inactive: '#94A3B8',
//   surface: '#FFFFFF',
//   background: '#F4FAFA',
//   textPrimary: '#0F172A',
//   textSub: '#64748B',
//   danger: '#DC2626',
//   dangerBg: '#FEE2E2',
//   shadow: '#0D7B7A',
// };

// // ── Static data — defined outside component to avoid recreation on re-render ──

// const STAT_CARDS = [
//   {
//     key: 'users',
//     screen:"Users",
//     label: 'Total Users',
//     iconLib: 'feather',
//     icon: 'users',
//     accent: '#0D7B7A',
//     bg: '#F0FDFA',
//   },
//   {
//     key: 'experts',
//     label: 'Experts',
//     screen:'Experts',
//     iconLib: 'mat',
//     icon: 'stethoscope',
//     accent: '#0369A1',
//     bg: '#F0F9FF',
//   },
//   {
//     key: 'categories',
//     label: 'Services',
//     screen:'Services',
//     iconLib: 'mat',
//     icon: 'shape-outline',
//     accent: '#B45309',
//     bg: '#FFFBEB',
//   },
//   {
//     key: 'chats',
//     label: 'Active Chats',
//     iconLib: 'mat',
//     icon: 'chat-outline',
//     screen:'Chats',
//     accent: '#7C3AED',
//     bg: '#F5F3FF',
//   },
// ];

// const MENU_ITEMS = [
//   {
//     key: 'Services',
//     label: 'Manage Services',
//     iconLib: 'mat',
//     icon: 'shape-outline',
//     accent: '#B45309',
//     bg: '#FFFBEB',
//   },
//   {
//     key: 'Experts',
//     label: 'Manage Experts',
//     iconLib: 'mat',
//     icon: 'stethoscope',
//     accent: '#0369A1',
//     bg: '#F0F9FF',
//   },
//   {
//     key: 'Users',
//     label: 'Manage Users',
//     iconLib: 'feather',
//     icon: 'users',
//     accent: '#0D7B7A',
//     bg: '#F0FDFA',
//   },
//   {
//     key: 'Chats',
//     label: 'View All Chats',
//     iconLib: 'mat',
//     icon: 'chat-outline',
//     accent: '#7C3AED',
//     bg: '#F5F3FF',
//   },
// ];

// // ── Sub-components ─────────────────────────────────────────────────────────────

// const renderIcon = (iconLib, icon, size, color) =>
//   iconLib === 'feather'
//     ? <Icon name={icon} size={size} color={color} />
//     : <MatIcon name={icon} size={size} color={color} />;

// // Skeleton pulse card shown while data loads
// const SkeletonCard = memo(() => (
//   <View style={styles.skeletonCard}>
//     <View style={styles.skeletonCircle} />
//     <View style={styles.skeletonLine} />
//     <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
//   </View>
// ));

// const StatCard = memo(({ card, value,onPress }) => (
//   <TouchableOpacity style={[styles.statCard, { backgroundColor: card.bg }]}onPress={onPress}>
//     <View style={[styles.statIconWrap, { backgroundColor: card.accent + '18' }]}>
//       {renderIcon(card.iconLib, card.icon, 22, card.accent)}
//     </View>
//     <Text style={[styles.statValue, { color: card.accent }]}>{value}</Text>
//     <Text style={styles.statLabel}>{card.label}</Text>
//   </TouchableOpacity>
// ));

// const ActionCard = memo(({ item, onPress }) => (
//   <TouchableOpacity
//     style={styles.actionCard}
//     onPress={onPress}
//     activeOpacity={0.75}
//   >
//     <View style={[styles.actionIconWrap, { backgroundColor: item.bg }]}>
//       {renderIcon(item.iconLib, item.icon, 20, item.accent)}
//     </View>
//     <Text style={styles.actionLabel}>{item.label}</Text>
//     <Icon name="chevron-right" size={18} color={COLORS.inactive} />
//   </TouchableOpacity>
// ));

// // ── Main screen ───────────────────────────────────────────────────────────────

// export default function AdminDashboard({ navigation }) {
//   const dispatch = useDispatch();
//   const insets = useSafeAreaInsets();

//   const [counts, setCounts] = useState({ users: 0, experts: 0, categories: 0, chats: 0 });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);

//   const fetchCounts = useCallback(async () => {
//     setLoading(true);
//     setError(false);
//     try {
//       const db = getFirestore();
//       const [u, e, c, ch] = await Promise.all([
//         getDocs(query(collection(db, 'users'), where('role', '==', 'user'))),
//         getDocs(query(collection(db, 'users'), where('role', '==', 'expert'))),
//         getDocs(collection(db, 'categories')),
//         getDocs(collection(db, 'chats')),
//       ]);
//       setCounts({
//         users: u.size,
//         experts: e.size,
//         categories: c.size,
//         chats: ch.size,
//       });
//     } catch (err) {
//       console.error('Dashboard fetch error:', err);
//       setError(true);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCounts();
//   }, [fetchCounts]);

//   const handleLogout = useCallback(async () => {
//     try {
//       await signOut(getAuth());
//       dispatch(logout());
//     } catch (err) {
//       console.error('Logout error:', err);
//     }
//   }, [dispatch]);

//   const handleNavigate = useCallback(
//     (screen) => navigation.navigate(screen),
//     [navigation],
//   );

//   const headerPaddingTop = Platform.OS === 'ios'
//     ? insets.top + 12
//     : insets.top + 16;

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

//       {/* ── Header ─────────────────────────────────────────────────────── */}
//       <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
//         <View style={styles.headerLeft}>
//           <View style={styles.avatarBadge}>
//             <Icon name="shield" size={16} color={COLORS.primary} />
//           </View>
//           <View>
//             <Text style={styles.greeting}>Admin Dashboard</Text>
//             <Text style={styles.subtitle}>Community Advisory Platform</Text>
//           </View>
//         </View>

//         <TouchableOpacity
//           style={styles.logoutBtn}
//           onPress={handleLogout}
//           activeOpacity={0.8}
//         >
//           <Icon name="log-out" size={14} color={COLORS.danger} style={{ marginRight: 5 }} />
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ── Divider ────────────────────────────────────────────────────── */}
//       <View style={styles.headerDivider} />

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={[
//           styles.scrollContent,
//           { paddingBottom: insets.bottom + 100 },
//         ]}
//       >

//         {/* ── Stats overview ──────────────────────────────────────────── */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <MatIcon name="chart-box-outline" size={16} color={COLORS.primary} />
//             <Text style={styles.sectionTitle}>Overview</Text>
//           </View>

//           {error ? (
//             // Error state with retry
//             <View style={styles.errorBox}>
//               <Icon name="wifi-off" size={28} color={COLORS.inactive} />
//               <Text style={styles.errorText}>Failed to load data</Text>
//               <TouchableOpacity style={styles.retryBtn} onPress={fetchCounts}>
//                 <Text style={styles.retryText}>Retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View style={styles.statsGrid}>
//               {STAT_CARDS.map((card) =>
//                 loading ? (
//                   <SkeletonCard key={card.key} />
//                 ) : (
//                   <StatCard
//                     key={card.key}
//                     card={card}
//                     value={counts[card.key]}
//                     onPress={() => handleNavigate(card.screen)}
//                   />
//                 ),
//               )}
//             </View>
//           )}
//         </View>

//         {/* ── Quick actions ───────────────────────────────────────────── */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <MatIcon name="lightning-bolt-outline" size={16} color={COLORS.primary} />
//             <Text style={styles.sectionTitle}>Quick Actions</Text>
//           </View>

//           {MENU_ITEMS.map((item) => (
//             <ActionCard
//               key={item.key}
//               item={item}
//               onPress={() => handleNavigate(item.key)}
//             />
//           ))}
//         </View>

//       </ScrollView>
//     </View>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },

//   // Header
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: COLORS.surface,
//     paddingHorizontal: 20,
//     paddingBottom: 16,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatarBadge: {
//     width: 36,
//     height: 36,
//     borderRadius: 12,
//     backgroundColor: COLORS.primaryLight,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: COLORS.primaryBorder,
//   },
//   greeting: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: COLORS.textPrimary,
//   },
//   subtitle: {
//     fontSize: 11,
//     color: COLORS.inactive,
//     marginTop: 2,
//     fontWeight: '500',
//   },
//   logoutBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.dangerBg,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   logoutText: {
//     color: COLORS.danger,
//     fontWeight: '700',
//     fontSize: 12,
//   },
//   headerDivider: {
//     height: 1,
//     backgroundColor: COLORS.primaryBorder,
//   },

//   // Scroll
//   scrollContent: {
//     paddingHorizontal: 16,
//     paddingTop: 20,
//   },

//   // Section
//   section: {
//     marginBottom: 24,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 14,
//   },
//   sectionTitle: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: COLORS.primary,
//     marginLeft: 6,
//     letterSpacing: 0.4,
//     textTransform: 'uppercase',
//   },

//   // Stat cards — 2-column grid without gap (Android compat)
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   statCard: {
//     width: '48.5%',
//     borderRadius: 18,
//     paddingVertical: 18,
//     paddingHorizontal: 14,
//     alignItems: 'flex-start',
//     marginBottom: 12,
//     // iOS shadow
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 4 },
//     // Android
//     elevation: 3,
//   },
//   statIconWrap: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 12,
//   },
//   statValue: {
//     fontSize: 28,
//     fontWeight: '800',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: COLORS.textSub,
//     fontWeight: '600',
//   },

//   // Skeleton
//   skeletonCard: {
//     width: '48.5%',
//     borderRadius: 18,
//     paddingVertical: 18,
//     paddingHorizontal: 14,
//     marginBottom: 12,
//     backgroundColor: '#E8F5F5',
//     elevation: 0,
//   },
//   skeletonCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     backgroundColor: '#C8E6E5',
//     marginBottom: 12,
//   },
//   skeletonLine: {
//     height: 14,
//     borderRadius: 6,
//     backgroundColor: '#C8E6E5',
//     marginBottom: 8,
//     width: '70%',
//   },
//   skeletonLineShort: {
//     width: '50%',
//   },

//   // Error state
//   errorBox: {
//     alignItems: 'center',
//     paddingVertical: 32,
//     backgroundColor: COLORS.surface,
//     borderRadius: 18,
//     marginBottom: 12,
//   },
//   errorText: {
//     color: COLORS.textSub,
//     fontSize: 14,
//     fontWeight: '600',
//     marginTop: 10,
//     marginBottom: 16,
//   },
//   retryBtn: {
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: 24,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: COLORS.primaryBorder,
//   },
//   retryText: {
//     color: COLORS.primary,
//     fontWeight: '700',
//     fontSize: 13,
//   },

//   // Action cards
//   actionCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.surface,
//     borderRadius: 16,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     marginBottom: 10,
//     // iOS shadow
//     shadowColor: COLORS.shadow,
//     shadowOpacity: 0.07,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 3 },
//     // Android
//     elevation: 2,
//   },
//   actionIconWrap: {
//     width: 42,
//     height: 42,
//     borderRadius: 13,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 14,
//   },
//   actionLabel: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '700',
//     color: COLORS.textPrimary,
//   },
// });


import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../../store/slices/authSlice';

// ── Design tokens — shared with navigators ────────────────────────────────────

const COLORS = {
  primary: '#0D7B7A',
  primaryLight: '#F0FDFA',
  primaryBorder: '#E0F2F1',
  inactive: '#94A3B8',
  surface: '#FFFFFF',
  background: '#F4FAFA',
  textPrimary: '#0F172A',
  textSub: '#64748B',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  shadow: '#0D7B7A',
};

// ── Static data — defined outside component to avoid recreation on re-render ──

const STAT_CARDS = [
  {
    key: 'users',
    screen: 'Users',
    label: 'Total Users',
    iconLib: 'feather',
    icon: 'users',
    accent: '#0D7B7A',
    bg: '#F0FDFA',
  },
  {
    key: 'experts',
    label: 'Experts',
    screen: 'Experts',
    iconLib: 'mat',
    icon: 'stethoscope',
    accent: '#0369A1',
    bg: '#F0F9FF',
  },
  {
    key: 'categories',
    label: 'Services',
    screen: 'Services',
    iconLib: 'mat',
    icon: 'shape-outline',
    accent: '#B45309',
    bg: '#FFFBEB',
  },
  {
    key: 'chats',
    label: 'Active Chats',
    iconLib: 'mat',
    icon: 'chat-outline',
    screen: 'Chats',
    accent: '#7C3AED',
    bg: '#F5F3FF',
  },
];

const MENU_ITEMS = [
  {
    key: 'Services',
    label: 'Manage Services',
    iconLib: 'mat',
    icon: 'shape-outline',
    accent: '#B45309',
    bg: '#FFFBEB',
  },
  {
    key: 'Experts',
    label: 'Manage Experts',
    iconLib: 'mat',
    icon: 'stethoscope',
    accent: '#0369A1',
    bg: '#F0F9FF',
  },
  {
    key: 'Users',
    label: 'Manage Users',
    iconLib: 'feather',
    icon: 'users',
    accent: '#0D7B7A',
    bg: '#F0FDFA',
  },
  {
    key: 'Chats',
    label: 'View All Chats',
    iconLib: 'mat',
    icon: 'chat-outline',
    accent: '#7C3AED',
    bg: '#F5F3FF',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

const renderIcon = (iconLib, icon, size, color) =>
  iconLib === 'feather'
    ? <Icon name={icon} size={size} color={color} />
    : <MatIcon name={icon} size={size} color={color} />;

// Skeleton pulse card shown while data loads
const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonCircle} />
    <View style={styles.skeletonLine} />
    <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
  </View>
));

const StatCard = memo(({ card, value, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: card.bg }]} onPress={onPress}>
    <View style={[styles.statIconWrap, { backgroundColor: card.accent + '18' }]}>
      {renderIcon(card.iconLib, card.icon, 22, card.accent)}
    </View>
    <Text style={[styles.statValue, { color: card.accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{card.label}</Text>
  </TouchableOpacity>
));

const ActionCard = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.actionIconWrap, { backgroundColor: item.bg }]}>
      {renderIcon(item.iconLib, item.icon, 20, item.accent)}
    </View>
    <Text style={styles.actionLabel}>{item.label}</Text>
    <Icon name="chevron-right" size={18} color={COLORS.inactive} />
  </TouchableOpacity>
));

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdminDashboard({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [counts, setCounts] = useState({ users: 0, experts: 0, categories: 0, chats: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const db = getFirestore();

      const [u, e, c, ch] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'user'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'expert'))),
        getDocs(collection(db, 'categories')),
        getDocs(
          query(
            collection(db, 'broadcastChats'),
            where('ChatEnabled', '==', true)
          )
        ),
      ]);

      setCounts({
        users: u.size,
        experts: e.size,
        categories: c.size,
        chats: ch.size,
      });
      // const [u, e, c, ch] = await Promise.all([
      //   getDocs(query(collection(db, 'users'), where('role', '==', 'user'))),
      //   getDocs(query(collection(db, 'users'), where('role', '==', 'expert'))),
      //   getDocs(collection(db, 'categories')),
      //   getDocs(collection(db, 'broadcastChats'), where('ChatEnabled', '===', true)),
      // ]);
      // setCounts({
      //   users: u.size,
      //   experts: e.size,
      //   categories: c.size,
      //   chats: ch.size,
      // });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(getAuth());
      dispatch(logout());
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [dispatch]);

  const handleNavigate = useCallback(
    (screen) => navigation.navigate(screen),
    [navigation],
  );

  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        {/* Left — avatar + title */}
        <View style={styles.headerLeft}>
          <View style={styles.avatarBadge}>
            <Icon name="shield" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Community Advisory Platform</Text>
          </View>
        </View>

        {/* Right — Settings + Logout icon buttons */}
        <View style={styles.headerActions}>
          {/* Settings */}
          {/* <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleNavigate('Settings')}
            activeOpacity={0.8}
          >
            <Icon name="settings" size={18} color={COLORS.primary} />
          </TouchableOpacity> */}

          {/* Logout */}
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnDanger]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="log-out" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <View style={styles.headerDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >

        {/* ── Stats overview ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MatIcon name="chart-box-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>

          {error ? (
            // Error state with retry
            <View style={styles.errorBox}>
              <Icon name="wifi-off" size={28} color={COLORS.inactive} />
              <Text style={styles.errorText}>Failed to load data</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchCounts}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {STAT_CARDS.map((card) =>
                loading ? (
                  <SkeletonCard key={card.key} />
                ) : (
                  <StatCard
                    key={card.key}
                    card={card}
                    value={counts[card.key]}
                    onPress={() => handleNavigate(card.screen)}
                  />
                ),
              )}
            </View>
          )}
        </View>

        {/* ── Quick actions ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MatIcon name="lightning-bolt-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          {MENU_ITEMS.map((item) => (
            <ActionCard
              key={item.key}
              item={item}
              onPress={() => handleNavigate(item.key)}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.inactive,
    marginTop: 2,
    fontWeight: '500',
  },

  // ── NEW: icon button group ──────────────────────────────────────────
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  iconBtnDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor: '#FECACA',
  },
  // ────────────────────────────────────────────────────────────────────

  headerDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Stat cards — 2-column grid without gap (Android compat)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.5%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: '600',
  },

  // Skeleton
  skeletonCard: {
    width: '48.5%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#E8F5F5',
    elevation: 0,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#C8E6E5',
    marginBottom: 12,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 6,
    backgroundColor: '#C8E6E5',
    marginBottom: 8,
    width: '70%',
  },
  skeletonLineShort: {
    width: '50%',
  },

  // Error state
  errorBox: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  // Action cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});