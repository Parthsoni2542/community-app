// import React, {
//   useEffect, useState, useCallback, useMemo, memo, useRef,
// } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   StatusBar, TextInput, Platform, Animated,
// } from 'react-native';
// import {
//   getFirestore, collection, query,
//   where, onSnapshot,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import IonIcon from 'react-native-vector-icons/Ionicons';

// // ─── Design Tokens ────────────────────────────────────────────────────────────

// const T = {
//   primary: '#0D7B7A',
//   primaryLight: '#F0FDFA',
//   primaryBorder: '#E0F2F1',
//   primaryMid: '#0F6E56',
//   bg: '#F4FAFA',
//   surface: '#FFFFFF',
//   textMain: '#0F172A',
//   textSub: '#64748B',
//   inactive: '#94A3B8',
//   active: '#10B981',
//   danger: '#DC2626',
//   e2eColor: '#7C3AED',
//   e2eLight: '#F5F3FF',
//   e2eBorder: '#DDD6FE',
// };

// const AVATAR_COLORS = [
//   '#0D7B7A', '#7C3AED', '#DB2777',
//   '#059669', '#0891B2', '#DC2626', '#2563EB',
// ];

// const TABS_CONFIG = [
//   { key: 'e2e', label: 'Expert → Expert', icon: 'account-switch-outline',    color: T.e2eColor, light: T.e2eLight,    border: T.e2eBorder   },
//   { key: 'e2u', label: 'Expert → User',   icon: 'account-arrow-right-outline', color: T.primary,  light: T.primaryLight, border: T.primaryBorder },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const getAvatarColor = (name) =>
//   AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// const getInitials = (name) => {
//   if (!name) return '?';
//   const p = name.trim().split(' ');
//   return p.length >= 2
//     ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
//     : p[0][0].toUpperCase();
// };

// const formatTime = (ts) => {
//   if (!ts?.toDate) return '';
//   const d = ts.toDate();
//   const diff = Date.now() - d.getTime();
//   if (diff < 60_000)     return 'Just now';
//   if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
//   if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
//   return d.toLocaleDateString('en-IN');
// };

// // ─── Skeleton ─────────────────────────────────────────────────────────────────

// const SkeletonBox = memo(({ width, height, borderRadius = 8, style }) => {
//   const anim = useRef(new Animated.Value(0.4)).current;
//   useEffect(() => {
//     Animated.loop(Animated.sequence([
//       Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
//       Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
//     ])).start();
//   }, [anim]);
//   return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#C8EEEB', opacity: anim }, style]} />;
// });

// const CardSkeleton = memo(() => (
//   <View style={styles.compactCard}>
//     <SkeletonBox width={40} height={40} borderRadius={12} style={{ marginRight: 10 }} />
//     <View style={{ flex: 1, gap: 7 }}>
//       <SkeletonBox width="50%" height={12} />
//       <SkeletonBox width="75%" height={10} />
//     </View>
//     <SkeletonBox width={28} height={10} />
//   </View>
// ));

// // ─── Compact Card (shared layout for both tabs) ───────────────────────────────

// const CompactCard = memo(({ item, accentColor, accentLight, label, name, onPress }) => {
//   const topic = item.subcategoryName || item.categoryName || label;
//   const isChatEnabled = item.ChatEnabled === true;

//   return (
//     <TouchableOpacity
//       style={styles.compactCard}
//       onPress={() => onPress(item)}
//       activeOpacity={0.78}
//     >
//       {/* Left accent bar */}
//       <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

//       {/* Avatar */}
//       <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
//         <Text style={styles.avatarText}>{getInitials(name)}</Text>
//         {item.isActive && <View style={[styles.activeDot, { borderColor: accentLight }]} />}
//       </View>

//       {/* Content */}
//       <View style={styles.cardContent}>
//         <View style={styles.cardRow}>
//           <Text style={styles.cardName} numberOfLines={1}>{name || 'User'}</Text>
//           <Text style={styles.cardTime}>{formatTime(item.updatedAt)}</Text>
//         </View>
//         <View style={styles.cardRow}>
//           <Text style={[styles.cardTopic, { color: accentColor }]} numberOfLines={1}>
//             {topic}
//           </Text>
//           {/* enabled/pending pill only for e2e */}
//           {/* {label === 'Expert Chat' && (
//             <View style={[
//               styles.miniPill,
//               isChatEnabled
//                 ? { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }
//                 : { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
//             ]}>
//               <Text style={[styles.miniPillText, { color: isChatEnabled ? '#059669' : '#D97706' }]}>
//                 {isChatEnabled ? 'Enabled' : 'Pending'}
//               </Text>
//             </View>
//           )} */}
//         </View>
//         <Text style={styles.cardMsg} numberOfLines={1}>
//           {item.lastMessage || 'No messages yet'}
//         </Text>
//       </View>

//       {/* Chevron */}
//       <Icon name="chevron-right" size={15} color={T.inactive} />
//     </TouchableOpacity>
//   );
// });

// // ─── Tab Button ───────────────────────────────────────────────────────────────

// const TabButton = memo(({ tabCfg, count, isActive, onPress }) => (
//   <TouchableOpacity
//     style={[styles.tab, isActive && { backgroundColor: tabCfg.light, borderColor: tabCfg.color }]}
//     onPress={onPress}
//     activeOpacity={0.75}
//   >
//     <MatIcon name={tabCfg.icon} size={13} color={isActive ? tabCfg.color : T.inactive} />
//     <Text style={[styles.tabText, isActive && { color: tabCfg.color, fontWeight: '800' }]}>
//       {tabCfg.label}
//     </Text>
//     <View style={[styles.tabBadge, isActive && { backgroundColor: tabCfg.color }]}>
//       <Text style={[styles.tabBadgeText, isActive && { color: '#FFFFFF' }]}>{count}</Text>
//     </View>
//   </TouchableOpacity>
// ));

// // ─── Empty State ──────────────────────────────────────────────────────────────

// const EmptyState = memo(({ search, tab }) => {
//   const isE2E = tab === 'e2e';
//   return (
//     <View style={styles.empty}>
//       <MatIcon name={isE2E ? 'account-switch-outline' : 'bullhorn-outline'} size={44} color={isE2E ? T.e2eColor : T.primary} />
//       <Text style={styles.emptyTitle}>
//         {search.trim() ? 'No results found' : isE2E ? 'No Expert Chats' : 'No Chats'}
//       </Text>
//       <Text style={styles.emptySub}>
//         {search.trim()
//           ? `Nothing matches "${search}"`
//           : isE2E ? 'Admin will assign chats to you here' : 'User chat requests will appear here'}
//       </Text>
//     </View>
//   );
// });

// // ─── Loading / Error ──────────────────────────────────────────────────────────

// const LoadingScreen = memo(({ pt }) => (
//   <View style={styles.container}>
//     <View style={[styles.header, { paddingTop: pt + 16 }]}>
//       <SkeletonBox width={130} height={20} style={{ marginBottom: 5 }} />
//       <SkeletonBox width={90} height={11} />
//     </View>
//     <View style={styles.searchWrap}><SkeletonBox width="100%" height={42} borderRadius={12} /></View>
//     <View style={styles.tabRow}>
//       <SkeletonBox width="48%" height={40} borderRadius={10} />
//       <SkeletonBox width="48%" height={40} borderRadius={10} />
//     </View>
//     <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 8 }}>
//       {[1,2,3,4,5].map((k) => <CardSkeleton key={k} />)}
//     </View>
//   </View>
// ));

// const ErrorScreen = memo(({ message }) => (
//   <View style={[styles.container, styles.centered]}>
//     <MatIcon name="alert-circle-outline" size={44} color={T.danger} />
//     <Text style={styles.emptyTitle}>Something went wrong</Text>
//     <Text style={styles.emptySub}>{message}</Text>
//   </View>
// ));

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// export default function ExpertChats({ navigation }) {
//   const insets = useSafeAreaInsets();

//   const [e2eChats, setE2eChats] = useState([]);   // expertId == uid
//   const [e2uChats, setE2uChats] = useState([]);   // expertIds array-contains uid
//   const [loading,  setLoading]  = useState(true);
//   const [error,    setError]    = useState(null);
//   const [search,   setSearch]   = useState('');
//   const [tab,      setTab]      = useState('e2e');

//   const db  = useMemo(() => getFirestore(), []);
//   const uid = useMemo(() => auth().currentUser?.uid, []);

//   // ── Listener 1: Expert→Expert ─────────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) { setLoading(false); return; }
//     return onSnapshot(
//       query(collection(db, 'broadcastChats'), where('userId', '==', uid)),
//       (snap) => {
//         setE2eChats(
//           snap.docs.map((d) => ({ id: d.id, ...d.data() }))
//             .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
//         );
//         setLoading(false);
//       },
//       (err) => { console.error('E2E error:', err); setError('Failed to load chats.'); setLoading(false); },
//     );
//   }, [db, uid]);

//   // ── Listener 2: Expert→User ───────────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) return;
//     return onSnapshot(
//       query(collection(db, 'broadcastChats'), where('expertIds', 'array-contains', uid)),
//       (snap) => {
//         setE2uChats(
//           snap.docs.map((d) => ({ id: d.id, ...d.data() }))
//             .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
//         );
//       },
//       (err) => { console.error('E2U error:', err); },
//     );
//   }, [db, uid]);

//   const counts = useMemo(() => ({ e2e: e2eChats.length, e2u: e2uChats.length }), [e2eChats, e2uChats]);

//   const filtered = useMemo(() => {
//     const src = tab === 'e2e' ? e2eChats : e2uChats;
//     if (!search.trim()) return src;
//     const s = search.toLowerCase();
//     return src.filter((c) => (c.userName ?? c.expertName ?? '').toLowerCase().includes(s));
//   }, [e2eChats, e2uChats, tab, search]);

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const handleE2EPress = useCallback((item) => {
//     navigation.navigate('MainChat', {
//       chatId: item.id,
//       userName: item.userName || 'User',
//       isBroadcast: true,
//       categoryName: item.categoryName ?? '',
//       subcategoryName: item.subcategoryName ?? '',
//       expertIds: item.expertIds ?? [],
//     });
//   }, [navigation]);

//   const handleE2UPress = useCallback((item) => {
//     navigation.navigate('ExpertReplyChat', {
//       chatId: item.id,
//       userName: item.userName || 'User',
//       isBroadcast: true,
//       subcategoryName: item.subcategoryName ?? '',
//       categoryName: item.categoryName ?? '',
//       expertIds: item.expertIds ?? [],
//     });
//   }, [navigation]);

//   const keyExtractor = useCallback((item) => item.id, []);

//   const renderItem = useCallback(({ item }) => {
//     if (tab === 'e2e') {
//       return (
//         <CompactCard
//           item={item}
//           accentColor={T.e2eColor}
//           accentLight={T.e2eLight}
//           label="Expert Chat"
//           name={item.expertName || 'User'}
//           onPress={handleE2EPress}
//         />
//       );
//     }
//     return (
//       <CompactCard
//         item={item}
//         accentColor={T.primary}
//         accentLight={T.primaryLight}
//         label="Broadcast"
//         name={item.userName || 'User'}
//         onPress={handleE2UPress}
//       />
//     );
//   }, [tab, handleE2EPress, handleE2UPress]);

//   const pt = insets.top > 0 ? insets.top : 0;

//   if (loading) return <LoadingScreen pt={pt} />;
//   if (error)   return <ErrorScreen message={error} />;

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={T.surface} />

//       {/* Header */}
//       <View style={[styles.header, { paddingTop: pt + 16 }]}>
//         <View style={styles.headerLeft}>
//           <View style={styles.headerIcon}>
//             <MatIcon name="chat-processing-outline" size={17} color={T.primary} />
//           </View>
//           <View>
//             <Text style={styles.headerTitle}>My Chats</Text>
//             <Text style={styles.headerSub}>{counts.e2e} expert · {counts.e2u} broadcast</Text>
//           </View>
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Icon name="search" size={15} color={T.inactive} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search by name..."
//           placeholderTextColor={T.inactive}
//           value={search}
//           onChangeText={setSearch}
//           returnKeyType="search"
//         />
//         {search.length > 0 && (
//           <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//             <Icon name="x" size={14} color={T.inactive} />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Tabs */}
//       <View style={styles.tabRow}>
//         {TABS_CONFIG.map((tabCfg) => (
//           <TabButton
//             key={tabCfg.key}
//             tabCfg={tabCfg}
//             count={counts[tabCfg.key]}
//             isActive={tab === tabCfg.key}
//             onPress={() => setTab(tabCfg.key)}
//           />
//         ))}
//       </View>

//       {/* List */}
//       <FlatList
//         data={filtered}
//         keyExtractor={keyExtractor}
//         renderItem={renderItem}
//         ListEmptyComponent={<EmptyState search={search} tab={tab} />}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//         keyboardDismissMode="on-drag"
//         initialNumToRender={15}
//         maxToRenderPerBatch={10}
//         windowSize={8}
//         removeClippedSubviews={Platform.OS === 'android'}
//         ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
//       />
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: T.bg },
//   centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 100 },

//   // Header
//   header: {
//     backgroundColor: T.surface,
//     paddingHorizontal: 18, paddingBottom: 14,
//     borderBottomWidth: 1, borderBottomColor: T.primaryBorder,
//     ...Platform.select({
//       ios:     { shadowColor: T.primary, shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
//       android: { elevation: 2 },
//     }),
//   },
//   headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   headerIcon:  {
//     width: 34, height: 34, borderRadius: 10,
//     backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
//     borderWidth: 1, borderColor: T.primaryBorder,
//   },
//   headerTitle: { fontSize: 18, fontWeight: '800', color: T.textMain },
//   headerSub:   { fontSize: 11, color: T.inactive, marginTop: 1 },

//   // Search
//   searchWrap: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: T.surface,
//     marginHorizontal: 14, marginTop: 12,
//     borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
//     borderWidth: 1, borderColor: T.primaryBorder,
//     gap: 8,
//   },
//   searchInput: { flex: 1, fontSize: 14, color: T.textMain, padding: 0 },

//   // Tabs
//   tabRow: {
//     flexDirection: 'row',
//     marginHorizontal: 14, marginTop: 10, marginBottom: 2,
//     gap: 8,
//   },
//   tab: {
//     flex: 1, flexDirection: 'row', alignItems: 'center',
//     justifyContent: 'center', gap: 4,
//     backgroundColor: T.surface,
//     borderRadius: 10, paddingVertical: 9,
//     borderWidth: 1.5, borderColor: T.primaryBorder,
//   },
//   tabText:          { fontSize: 11, fontWeight: '600', color: T.inactive },
//   tabBadge:         { backgroundColor: '#E2E8F0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 7 },
//   tabBadgeText:     { fontSize: 10, fontWeight: '700', color: T.inactive },

//   // ── Compact Card ───────────────────────────────────────────────────────────
//   compactCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: T.surface,
//     borderRadius: 14,
//     paddingVertical: 10,
//     paddingRight: 12,
//     paddingLeft: 0,
//     borderWidth: 1, borderColor: T.primaryBorder,
//     overflow: 'hidden',
//     gap: 10,
//     ...Platform.select({
//       ios:     { shadowColor: T.primary, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
//       android: { elevation: 2 },
//     }),
//   },

//   // Left color accent bar (4px wide, full height via alignSelf)
//   accentBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 0 },

//   // Avatar (small)
//   avatar: {
//     width: 40, height: 40, borderRadius: 12,
//     justifyContent: 'center', alignItems: 'center',
//     position: 'relative',
//   },
//   avatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
//   activeDot:  {
//     position: 'absolute', bottom: 0, right: 0,
//     width: 10, height: 10, borderRadius: 5,
//     backgroundColor: T.active, borderWidth: 1.5,
//   },

//   // Card content
//   cardContent: { flex: 1, gap: 3 },
//   cardRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   cardName:    { fontSize: 13, fontWeight: '700', color: T.textMain, flex: 1, marginRight: 6 },
//   cardTime:    { fontSize: 10, color: T.inactive, fontWeight: '500' },
//   cardTopic:   { fontSize: 11, fontWeight: '600', flex: 1, marginRight: 6 },
//   cardMsg:     { fontSize: 12, color: T.textSub },

//   // Mini enabled/pending pill
//   miniPill: {
//     paddingHorizontal: 6, paddingVertical: 2,
//     borderRadius: 6, borderWidth: 1,
//   },
//   miniPillText: { fontSize: 9, fontWeight: '700' },

//   // Empty / Error
//   empty:      { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
//   emptyTitle: { fontSize: 15, fontWeight: '700', color: T.textMain, marginTop: 14, marginBottom: 5 },
//   emptySub:   { fontSize: 12, color: T.inactive, textAlign: 'center', lineHeight: 18 },
// });

import React, {
  useEffect, useState, useCallback, useMemo, memo, useRef,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, TextInput, Platform, Animated, SectionList,
} from 'react-native';
import {
  getFirestore, collection, query,
  where, onSnapshot,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
  primary: '#0D7B7A',
  primaryLight: '#F0FDFA',
  primaryBorder: '#E0F2F1',
  bg: '#F4FAFA',
  surface: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  inactive: '#94A3B8',
  active: '#10B981',
  danger: '#DC2626',
  e2eColor: '#7C3AED',
  e2eLight: '#F5F3FF',
  e2eBorder: '#DDD6FE',
};

const AVATAR_COLORS = [
  '#0D7B7A', '#7C3AED', '#DB2777',
  '#059669', '#0891B2', '#DC2626', '#2563EB',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2
    ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
    : p[0][0].toUpperCase();
};

const formatTime = (ts) => {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return 'Just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-IN');
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonBox = memo(({ width, height, borderRadius = 8, style }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, [anim]);
  return (
    <Animated.View style={[
      { width, height, borderRadius, backgroundColor: '#C8EEEB', opacity: anim },
      style,
    ]} />
  );
});

const CardSkeleton = memo(() => (
  <View style={styles.compactCard}>
    <SkeletonBox width={40} height={40} borderRadius={12} style={{ marginRight: 10 }} />
    <View style={{ flex: 1, gap: 7 }}>
      <SkeletonBox width="50%" height={12} />
      <SkeletonBox width="75%" height={10} />
    </View>
    <SkeletonBox width={28} height={10} />
  </View>
));

// ─── Compact Card ─────────────────────────────────────────────────────────────

const CompactCard = memo(({ item, accentColor, accentLight, name, onPress }) => {
  const topic = item.subcategoryName || item.categoryName || '';
  return (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() => onPress(item)}
      activeOpacity={0.78}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
        {item.isActive && <View style={[styles.activeDot, { borderColor: accentLight }]} />}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName} numberOfLines={1}>{name || 'User'}</Text>
          <Text style={styles.cardTime}>{formatTime(item.updatedAt)}</Text>
        </View>
        <Text style={[styles.cardTopic, { color: accentColor }]} numberOfLines={1}>
          {topic}
        </Text>
        <Text style={styles.cardMsg} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      <Icon name="chevron-right" size={15} color={T.inactive} />
    </TouchableOpacity>
  );
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = memo(({ title, icon, color, count }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
      <MatIcon name={icon} size={14} color={color} />
    </View>
    <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    <View style={[styles.sectionBadge, { backgroundColor: color }]}>
      <Text style={styles.sectionBadgeText}>{count}</Text>
    </View>
  </View>
));

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = memo(({ search }) => (
  <View style={styles.empty}>
    <MatIcon name="chat-outline" size={44} color={T.primary} />
    <Text style={styles.emptyTitle}>
      {search.trim() ? 'No results found' : 'No Chats Yet'}
    </Text>
    <Text style={styles.emptySub}>
      {search.trim()
        ? `Nothing matches "${search}"`
        : 'Your chats will appear here'}
    </Text>
  </View>
));

// ─── Error Screen ─────────────────────────────────────────────────────────────

const ErrorScreen = memo(({ message }) => (
  <View style={[styles.container, styles.centered]}>
    <MatIcon name="alert-circle-outline" size={44} color={T.danger} />
    <Text style={styles.emptyTitle}>Something went wrong</Text>
    <Text style={styles.emptySub}>{message}</Text>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExpertChats({ navigation }) {
  const insets = useSafeAreaInsets();

  const [e2eChats, setE2eChats] = useState([]);
  const [e2uChats, setE2uChats] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');

  const db  = useMemo(() => getFirestore(), []);
  const uid = useMemo(() => auth().currentUser?.uid, []);

  // ── Listener 1: Expert→Expert (userId == uid) ─────────────────────────────
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    return onSnapshot(
      query(collection(db, 'broadcastChats'), where('userId', '==', uid)),
      (snap) => {
        setE2eChats(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
        );
        setLoading(false);
      },
      (err) => {
        console.error('E2E error:', err);
        setError('Failed to load chats.');
        setLoading(false);
      },
    );
  }, [db, uid]);

  // ── Listener 2: Expert→User (expertIds array-contains uid) ───────────────
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db, 'broadcastChats'), where('expertIds', 'array-contains', uid)),
      (snap) => {
        setE2uChats(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
        );
      },
      (err) => console.error('E2U error:', err),
    );
  }, [db, uid]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleE2EPress = useCallback((item) => {
    navigation.navigate('MainChat', {
      chatId: item.id,
      userName: item.userName || 'User',
      isBroadcast: true,
      categoryName: item.categoryName ?? '',
      subcategoryName: item.subcategoryName ?? '',
      expertIds: item.expertIds ?? [],
    });
  }, [navigation]);

  const handleE2UPress = useCallback((item) => {
    navigation.navigate('ExpertReplyChat', {
      chatId: item.id,
      userName: item.userName || 'User',
      isBroadcast: true,
      subcategoryName: item.subcategoryName ?? '',
      categoryName: item.categoryName ?? '',
      expertIds: item.expertIds ?? [],
    });
  }, [navigation]);

  // ── Sections data ─────────────────────────────────────────────────────────
  const sections = useMemo(() => {
    const applySearch = (list, nameKey) => {
      if (!search.trim()) return list;
      const s = search.toLowerCase();
      return list.filter((c) =>
        (c[nameKey] ?? '').toLowerCase().includes(s) ||
        (c.categoryName ?? '').toLowerCase().includes(s) ||
        (c.subcategoryName ?? '').toLowerCase().includes(s),
      );
    };

    const filteredE2E = applySearch(e2eChats, 'expertName');
    const filteredE2U = applySearch(e2uChats, 'userName');

    const result = [];
    if (filteredE2E.length > 0) {
      result.push({
        key: 'e2e',
        title: 'Expert → Expert',
        icon: 'account-switch-outline',
        color: T.e2eColor,
        count: filteredE2E.length,
        data: filteredE2E,
      });
    }
    if (filteredE2U.length > 0) {
      result.push({
        key: 'e2u',
        title: 'Expert → User',
        icon: 'account-arrow-right-outline',
        color: T.primary,
        count: filteredE2U.length,
        data: filteredE2U,
      });
    }
    return result;
  }, [e2eChats, e2uChats, search]);

  const totalCount = e2eChats.length + e2uChats.length;
  const isEmpty = sections.length === 0;

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item, section }) => {
    if (section.key === 'e2e') {
      return (
        <CompactCard
          item={item}
          accentColor={T.e2eColor}
          accentLight={T.e2eLight}
          name={item.expertName || 'User'}
          onPress={handleE2EPress}
        />
      );
    }
    return (
      <CompactCard
        item={item}
        accentColor={T.primary}
        accentLight={T.primaryLight}
        name={item.userName || 'User'}
        onPress={handleE2UPress}
      />
    );
  }, [handleE2EPress, handleE2UPress]);

  const renderSectionHeader = useCallback(({ section }) => (
    <SectionHeader
      title={section.title}
      icon={section.icon}
      color={section.color}
      count={section.count}
    />
  ), []);

  const pt = insets.top > 0 ? insets.top : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: pt + 16 }]}>
          <SkeletonBox width={130} height={20} style={{ marginBottom: 5 }} />
          <SkeletonBox width={90} height={11} />
        </View>
        <View style={styles.searchWrap}>
          <SkeletonBox width="100%" height={42} borderRadius={12} />
        </View>
        <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 12 }}>
          {[1, 2, 3, 4, 5].map((k) => <CardSkeleton key={k} />)}
        </View>
      </View>
    );
  }

  if (error) return <ErrorScreen message={error} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={T.surface} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: pt + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MatIcon name="chat-processing-outline" size={17} color={T.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Chats</Text>
            <Text style={styles.headerSub}>
              {e2eChats.length} expert · {e2uChats.length} broadcast
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={15} color={T.inactive} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or topic..."
          placeholderTextColor={T.inactive}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={14} color={T.inactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Section List */}
      {isEmpty ? (
        <EmptyState search={search} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 100 },

  header: {
    backgroundColor: T.surface,
    paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.primaryBorder,
    ...Platform.select({
      ios:     { shadowColor: T.primary, shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:  {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.primaryBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.textMain },
  headerSub:   { fontSize: 11, color: T.inactive, marginTop: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.surface,
    marginHorizontal: 14, marginTop: 12, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: T.primaryBorder,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.textMain, padding: 0 },

  // Section Header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingVertical: 10,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
  sectionBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, minWidth: 22, alignItems: 'center',
  },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  // Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingRight: 12,
    paddingLeft: 0,
    borderWidth: 1, borderColor: T.primaryBorder,
    overflow: 'hidden',
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: T.primary, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  accentBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  activeDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.active, borderWidth: 1.5,
  },
  cardContent: { flex: 1, gap: 3 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName:    { fontSize: 13, fontWeight: '700', color: T.textMain, flex: 1, marginRight: 6 },
  cardTime:    { fontSize: 10, color: T.inactive, fontWeight: '500' },
  cardTopic:   { fontSize: 11, fontWeight: '600' },
  cardMsg:     { fontSize: 12, color: T.textSub },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: T.textMain, marginTop: 14, marginBottom: 5 },
  emptySub:   { fontSize: 12, color: T.inactive, textAlign: 'center', lineHeight: 18 },
});