// /**
//  * ChatHistoryScreen.jsx
//  *
//  * Changes vs original:
//  *  - SkeletonCard shimmer loading state (replaces bare ActivityIndicator)
//  *  - Filter tab row: All / Active / Closed
//  *  - React.memo on ChatCard with proper areEqual comparator
//  *  - Animation guard (animates only once per mount, not on re-renders)
//  *  - renderItem / keyExtractor wrapped in useCallback
//  *  - activeCount / filteredChats wrapped in useMemo
//  *  - getItemLayout added (card height is fixed = CARD_HEIGHT)
//  *  - FlatList performance props: initialNumToRender, maxToRenderPerBatch,
//  *    windowSize, removeClippedSubviews
//  *  - onSnapshot error handler → loadError state + retry UI
//  *  - isMounted guard on all async setState calls
//  *  - Unused `light` property removed from AVATAR_PALETTES
//  *  - formatTime extracted as a module-level pure function (no re-creation per render)
//  *  - exploreBtn ripple fix (overflow on gradient child, not TouchableOpacity)
//  */

// import React, {
//   useEffect, useState, useRef, useCallback, useMemo,
// } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   ActivityIndicator, StatusBar, Animated, Dimensions, Platform,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon    from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {
//   getFirestore, collection, query,
//   where, onSnapshot, orderBy,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// const { width } = Dimensions.get('window');

// // ─── Constants ────────────────────────────────────────────────────────────────
// // Card height must match the rendered card exactly for getItemLayout to be correct.
// // Base card: paddingVertical 14 (top) + 14 (bottom) + content ~60px = ~88px.
// // With marginBottom: 10 → total slot = 98px.
// const CARD_CONTENT_HEIGHT = 88;
// const CARD_MARGIN_BOTTOM  = 10;
// const CARD_SLOT_HEIGHT    = CARD_CONTENT_HEIGHT + CARD_MARGIN_BOTTOM;

// // Filter options
// const FILTERS = [
//   { key: 'all',    label: 'All'    },
//   { key: 'active', label: 'Active' },
//   { key: 'closed', label: 'Closed' },
// ];

// // ─── Avatar palette — removed unused `light` property ─────────────────────────
// const AVATAR_PALETTES = [
//   { grad: ['#2563EB', '#1D4ED8'] },
//   { grad: ['#7C3AED', '#6D28D9'] },
//   { grad: ['#DB2777', '#BE185D'] },
//   { grad: ['#059669', '#047857'] },
//   { grad: ['#D97706', '#B45309'] },
//   { grad: ['#0D7B7A', '#0A4F4E'] },
// ];
// const getPalette = (name) =>
//   AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// // ─── Pure helper — defined at module level so it's never recreated ─────────────
// const formatTime = (ts) => {
//   if (!ts?.toDate) return '';
//   const d    = ts.toDate();
//   const diff = Date.now() - d.getTime();
//   if (diff < 60_000)     return 'Just now';
//   if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
//   if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
//   if (diff < 172_800_000) return 'Yesterday';
//   return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
// };

// // ─── Skeleton Card ────────────────────────────────────────────────────────────
// const SkeletonCard = React.memo(() => {
//   const shimmer = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const loop = Animated.loop(
//       Animated.sequence([
//         Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
//         Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
//       ]),
//     );
//     loop.start();
//     return () => loop.stop();
//   }, [shimmer]);

//   const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

//   return (
//     <View style={[styles.card, { marginBottom: CARD_MARGIN_BOTTOM }]}>
//       <View style={[styles.cardStripe, { backgroundColor: '#E2E8F0' }]} />
//       <View style={styles.avatarWrap}>
//         <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
//       </View>
//       <View style={[styles.cardContent, { gap: 8 }]}>
//         <Animated.View style={[styles.skeletonLine, { width: '55%', opacity }]} />
//         <Animated.View style={[styles.skeletonLine, { width: '35%', height: 10, opacity }]} />
//         <Animated.View style={[styles.skeletonLine, { width: '75%', height: 11, opacity }]} />
//       </View>
//       <View style={styles.cardRight}>
//         <Animated.View style={[styles.skeletonBadge, { opacity }]} />
//       </View>
//     </View>
//   );
// });

// const SkeletonList = React.memo(() => (
//   <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
//     {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
//   </View>
// ));

// // ─── Filter Row ───────────────────────────────────────────────────────────────
// const FilterRow = React.memo(({ activeFilter, onSelect }) => (
//   <View style={styles.filterRow}>
//     {FILTERS.map((f) => {
//       const isActive = f.key === activeFilter;
//       return (
//         <TouchableOpacity
//           key={f.key}
//           style={[styles.filterTab, isActive && styles.filterTabActive]}
//           onPress={() => onSelect(f.key)}
//           activeOpacity={0.75}
//         >
//           <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
//             {f.label}
//           </Text>
//         </TouchableOpacity>
//       );
//     })}
//   </View>
// ));

// // ─── Chat Card ────────────────────────────────────────────────────────────────
// // Animation guard: only plays once per component lifetime (not on re-renders).
// // React.memo with custom areEqual prevents re-renders when unrelated state changes.
// const ChatCard = React.memo(({ item, index, onPress }) => {
//   const palette     = useMemo(() => getPalette(item.expertName), [item.expertName]);
//   const fadeAnim    = useRef(new Animated.Value(0)).current;
//   const slideAnim   = useRef(new Animated.Value(20)).current;
//   const hasAnimated = useRef(false);

//   useEffect(() => {
//     if (hasAnimated.current) return;
//     hasAnimated.current = true;
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1, duration: 360, delay: index * 50,
//         useNativeDriver: true,
//       }),
//       Animated.spring(slideAnim, {
//         toValue: 0, tension: 72, friction: 14, delay: index * 50,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []); // intentionally empty — animate once on mount only

//   return (
//     <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
//       <TouchableOpacity
//         style={[styles.card, { marginBottom: CARD_MARGIN_BOTTOM }]}
//         onPress={onPress}
//         activeOpacity={0.82}
//       >
//         {/* Active indicator stripe */}
//         <View style={[styles.cardStripe, { backgroundColor: item.isActive ? '#0D7B7A' : '#E2E8F0' }]} />

//         {/* Avatar */}
//         <View style={styles.avatarWrap}>
//           <LinearGradient colors={palette.grad} style={styles.avatarGrad}>
//             <Text style={styles.avatarText}>
//               {item.expertName?.charAt(0)?.toUpperCase() || 'E'}
//             </Text>
//           </LinearGradient>
//           {item.isActive && (
//             <View style={styles.onlineRing}>
//               <View style={styles.onlineDot} />
//             </View>
//           )}
//         </View>

//         {/* Content */}
//         <View style={styles.cardContent}>
//           <View style={styles.cardTopRow}>
//             <Text style={styles.expertName} numberOfLines={1}>
//               {item.expertName || 'Expert'}
//             </Text>
//             <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
//           </View>

//           {!!item.categoryName && (
//             <View style={styles.categoryRow}>
//               <MatIcon name="briefcase-outline" size={11} color="#0D7B7A" />
//               <Text style={styles.categoryText}>{item.categoryName}</Text>
//             </View>
//           )}

//           <View style={styles.lastMsgRow}>
//             {item.lastMessage?.startsWith('📷') ? (
//               <Icon name="image" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
//             ) : (
//               <MatIcon name="message-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
//             )}
//             <Text style={styles.lastMsgText} numberOfLines={1}>
//               {item.lastMessage || 'No messages yet — start the conversation'}
//             </Text>
//           </View>
//         </View>

//         {/* Status badge + chevron */}
//         <View style={styles.cardRight}>
//           <View style={[styles.statusBadge, item.isActive ? styles.statusBadgeActive : styles.statusBadgeClosed]}>
//             <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#059669' : '#94A3B8' }]} />
//             <Text style={[styles.statusText, { color: item.isActive ? '#065F46' : '#64748B' }]}>
//               {item.isActive ? 'Active' : 'Closed'}
//             </Text>
//           </View>
//           <Icon name="chevron-right" size={16} color="#CBD5E1" style={{ marginTop: 6 }} />
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );
// }, (prev, next) =>
//   // Only re-render if data meaningful to the card actually changed
//   prev.item.id          === next.item.id          &&
//   prev.item.isActive    === next.item.isActive    &&
//   prev.item.lastMessage === next.item.lastMessage &&
//   prev.item.updatedAt   === next.item.updatedAt   &&
//   prev.index            === next.index
// );

// // ─── Empty State ──────────────────────────────────────────────────────────────
// const EmptyState = React.memo(({ filter, onBrowse }) => (
//   <View style={styles.emptyState}>
//     <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
//       <MatIcon name="message-text-outline" size={38} color="#0D7B7A" />
//     </LinearGradient>

//     <Text style={styles.emptyTitle}>
//       {filter === 'all' ? 'No Conversations Yet' : `No ${filter === 'active' ? 'Active' : 'Closed'} Conversations`}
//     </Text>
//     <Text style={styles.emptySubtitle}>
//       {filter === 'all'
//         ? `Connect with a verified expert and get\npersonalised guidance in minutes.`
//         : `You have no ${filter} consultations right now.`}
//     </Text>

//     {filter === 'all' && (
//       <>
//         {[
//           { icon: 'shield-check-outline', text: 'Verified professionals'   },
//           { icon: 'clock-fast',           text: 'Responds within minutes'  },
//           { icon: 'lock-outline',         text: 'Private & confidential'   },
//         ].map((f) => (
//           <View key={f.text} style={styles.featureRow}>
//             <View style={styles.featureIconWrap}>
//               <MatIcon name={f.icon} size={15} color="#0D7B7A" />
//             </View>
//             <Text style={styles.featureText}>{f.text}</Text>
//           </View>
//         ))}

//         {/* Fix: overflow on gradient child, not on TouchableOpacity (Android ripple) */}
//         <TouchableOpacity
//           style={styles.exploreBtn}
//           onPress={onBrowse}
//           activeOpacity={0.88}
//         >
//           <LinearGradient
//             colors={['#0D7B7A', '#0A5F5E']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.exploreBtnGrad}
//           >
//             <Icon name="search" size={16} color="#FFFFFF" />
//             <Text style={styles.exploreBtnText}>Browse Experts</Text>
//             <View style={styles.exploreBtnArrow}>
//               <Icon name="arrow-right" size={14} color="#0D7B7A" />
//             </View>
//           </LinearGradient>
//         </TouchableOpacity>
//       </>
//     )}
//   </View>
// ));

// // ─── Error State ──────────────────────────────────────────────────────────────
// const ErrorState = React.memo(({ onRetry }) => (
//   <View style={[styles.centered, { flex: 1 }]}>
//     <View style={styles.errorIconWrap}>
//       <Icon name="wifi-off" size={32} color="#94A3B8" />
//     </View>
//     <Text style={styles.errorTitle}>Unable to Load Conversations</Text>
//     <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
//     <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
//       <Text style={styles.retryBtnText}>Retry</Text>
//     </TouchableOpacity>
//   </View>
// ));

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function ChatHistoryScreen({ navigation }) {
//   const [chats, setChats]         = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [loadError, setLoadError] = useState(false);
//   const [filter, setFilter]       = useState('all');

//   const headerAnim = useRef(new Animated.Value(0)).current;
//   const isMounted  = useRef(true);

//   const uid = auth().currentUser?.uid;

//   // ── Unmount guard ───────────────────────────────────────────────────────
//   useEffect(() => {
//     isMounted.current = true;
//     return () => { isMounted.current = false; };
//   }, []);

//   // ── Header entrance animation ───────────────────────────────────────────
//   useEffect(() => {
//     Animated.timing(headerAnim, {
//       toValue: 1, duration: 500, useNativeDriver: true,
//     }).start();
//   }, [headerAnim]);

//   // ── Firestore listener ──────────────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) {
//       setLoading(false);
//       return;
//     }
//     const db  = getFirestore();
//     const q   = query(
//       collection(db, 'chats'),
//       where('userId', '==', uid),
//       orderBy('updatedAt', 'desc'),
//     );
//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         if (!isMounted.current) return;
//         setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//         setLoadError(false);
//       },
//       () => {
//         if (!isMounted.current) return;
//         setLoading(false);
//         setLoadError(true);
//       },
//     );
//     return unsub;
//   }, [uid]);

//   // ── Derived state ───────────────────────────────────────────────────────
//   const activeCount = useMemo(
//     () => chats.filter((c) => c.isActive).length,
//     [chats],
//   );

//   const filteredChats = useMemo(() => {
//     if (filter === 'active') return chats.filter((c) =>  c.isActive);
//     if (filter === 'closed') return chats.filter((c) => !c.isActive);
//     return chats;
//   }, [chats, filter]);

//   // ── FlatList helpers ────────────────────────────────────────────────────
//   const keyExtractor = useCallback((item) => item.id, []);

//   const renderItem = useCallback(({ item, index }) => (
//     <ChatCard
//       item={item}
//       index={index}
//       onPress={() =>
//         navigation.navigate('ChatFromHistory', {
//           chatId    : item.id,
//           expertName: item.expertName || 'Expert',
//           expertId  : item.expertId,
//         })
//       }
//     />
//   ), [navigation]);

//   // getItemLayout: card height is fixed → enables instant scrollToIndex
//   const getItemLayout = useCallback((_data, index) => ({
//     length: CARD_SLOT_HEIGHT,
//     offset: CARD_SLOT_HEIGHT * index,
//     index,
//   }), []);

//   const ListHeaderComponent = useMemo(() => (
//     filteredChats.length > 0 ? (
//       <Text style={styles.listLabel}>RECENT CONVERSATIONS</Text>
//     ) : null
//   ), [filteredChats.length]);

//   const ListEmptyComponent = useMemo(() => (
//     !loading ? (
//       <EmptyState
//         filter={filter}
//         onBrowse={() => navigation.navigate('Home')}
//       />
//     ) : null
//   ), [loading, filter, navigation]);

//   // ── Retry ───────────────────────────────────────────────────────────────
//   const handleRetry = useCallback(() => {
//     setLoadError(false);
//     setLoading(true);
//     // Trigger re-subscription by temporarily clearing chats
//     setChats([]);
//   }, []);

//   // ── Error state ─────────────────────────────────────────────────────────
//   if (loadError) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />
//         <LinearGradient
//           colors={['#0A4F4E', '#0D7B7A']}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//           style={styles.header}
//         >
//           <Text style={styles.headerTitle}>My Consultations</Text>
//         </LinearGradient>
//         <ErrorState onRetry={handleRetry} />
//       </View>
//     );
//   }

//   // ── Render ───────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

//       {/* ── Gradient Header ── */}
//       <LinearGradient
//         colors={['#0A4F4E', '#0D7B7A']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.header}
//       >
//         <Animated.View style={{ opacity: headerAnim }}>
//           <View style={styles.headerTopRow}>
//             <View>
//               <Text style={styles.headerTitle}>My Consultations</Text>
//               <Text style={styles.headerSub}>
//                 {chats.length} total · {activeCount} active
//               </Text>
//             </View>
//             <View style={styles.headerIconWrap}>
//               <MatIcon name="message-text-outline" size={22} color="rgba(255,255,255,0.9)" />
//             </View>
//           </View>

//           {/* Stats pills */}
//           <View style={styles.statsPillRow}>
//             <View style={styles.statsPill}>
//               <MatIcon name="forum-outline" size={13} color="#0D7B7A" />
//               <Text style={styles.statsPillText}>{chats.length} Conversations</Text>
//             </View>
//             <View style={styles.statsPill}>
//               <View style={styles.statsPillDot} />
//               <Text style={styles.statsPillText}>{activeCount} Active</Text>
//             </View>
//           </View>
//         </Animated.View>
//       </LinearGradient>

//       {/* ── Filter Tabs ── */}
//       <FilterRow activeFilter={filter} onSelect={setFilter} />

//       {/* ── Content ── */}
//       {loading ? (
//         <SkeletonList />
//       ) : (
//         <FlatList
//           data={filteredChats}
//           keyExtractor={keyExtractor}
//           renderItem={renderItem}
//           getItemLayout={getItemLayout}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//           ListHeaderComponent={ListHeaderComponent}
//           ListEmptyComponent={ListEmptyComponent}
//           // ── Performance props ──
//           initialNumToRender={12}
//           maxToRenderPerBatch={8}
//           windowSize={8}
//           removeClippedSubviews={Platform.OS === 'android'}
//           updateCellsBatchingPeriod={30}
//         />
//       )}
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container : { flex: 1, backgroundColor: '#EFF4F4' },
//   centered  : { justifyContent: 'center', alignItems: 'center', gap: 12 },

//   // ── Skeleton ───────────────────────────────────────────────────────────────
//   skeletonAvatar: {
//     width: 48, height: 48, borderRadius: 15,
//     backgroundColor: '#CBD5E1',
//   },
//   skeletonLine: {
//     height: 13, borderRadius: 6,
//     backgroundColor: '#CBD5E1',
//   },
//   skeletonBadge: {
//     width: 56, height: 24, borderRadius: 10,
//     backgroundColor: '#CBD5E1',
//   },

//   // ── Header ─────────────────────────────────────────────────────────────────
//   header: {
//     paddingTop       : 56,
//     paddingBottom    : 20,
//     paddingHorizontal: 20,
//   },
//   headerTopRow: {
//     flexDirection : 'row',
//     justifyContent: 'space-between',
//     alignItems    : 'center',
//     marginBottom  : 14,
//   },
//   headerTitle  : { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
//   headerSub    : { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3, fontWeight: '500' },
//   headerIconWrap: {
//     width: 44, height: 44, borderRadius: 14,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   statsPillRow : { flexDirection: 'row', gap: 10 },
//   statsPill    : {
//     flexDirection    : 'row',
//     alignItems       : 'center',
//     gap              : 6,
//     backgroundColor  : '#FFFFFF',
//     paddingHorizontal: 12,
//     paddingVertical  : 6,
//     borderRadius     : 20,
//   },
//   statsPillDot  : { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
//   statsPillText : { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

//   // ── Filter Tabs ────────────────────────────────────────────────────────────
//   filterRow: {
//     flexDirection    : 'row',
//     backgroundColor  : '#FFFFFF',
//     paddingHorizontal: 16,
//     paddingVertical  : 10,
//     gap              : 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0F2F1',
//   },
//   filterTab: {
//     flex             : 1,
//     paddingVertical  : 8,
//     borderRadius     : 10,
//     alignItems       : 'center',
//     backgroundColor  : '#F8FAFC',
//     borderWidth      : 1,
//     borderColor      : '#E2E8F0',
//   },
//   filterTabActive: {
//     backgroundColor: '#0D7B7A',
//     borderColor    : '#0D7B7A',
//   },
//   filterTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
//   filterTabTextActive: { color: '#FFFFFF' },

//   // ── List ───────────────────────────────────────────────────────────────────
//   listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
//   listLabel  : {
//     fontSize    : 11,
//     fontWeight  : '700',
//     color       : '#94A3B8',
//     letterSpacing: 0.8,
//     marginBottom: 10,
//   },

//   // ── Chat Card ──────────────────────────────────────────────────────────────
//   card: {
//     flexDirection  : 'row',
//     alignItems     : 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius   : 18,
//     overflow       : 'hidden',
//     borderWidth    : 1,
//     borderColor    : '#E0F2F1',
//     shadowColor    : '#0D7B7A',
//     shadowOpacity  : 0.07,
//     shadowRadius   : 8,
//     shadowOffset   : { width: 0, height: 3 },
//     elevation      : 3,
//     minHeight      : CARD_CONTENT_HEIGHT,
//   },
//   cardStripe : { width: 4, alignSelf: 'stretch' },
//   avatarWrap : { position: 'relative', marginHorizontal: 14 },
//   avatarGrad : {
//     width: 48, height: 48, borderRadius: 15,
//     justifyContent: 'center', alignItems: 'center',
//   },
//   avatarText : { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
//   onlineRing : {
//     position       : 'absolute',
//     bottom         : -1, right: -1,
//     width          : 16, height: 16,
//     borderRadius   : 8,
//     backgroundColor: '#FFFFFF',
//     justifyContent : 'center', alignItems: 'center',
//   },
//   onlineDot : { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },

//   cardContent : { flex: 1, paddingVertical: 14 },
//   cardTopRow  : {
//     flexDirection : 'row',
//     justifyContent: 'space-between',
//     alignItems    : 'center',
//     marginBottom  : 4,
//   },
//   expertName  : { fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1 },
//   timeText    : { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginLeft: 8 },
//   categoryRow : { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
//   categoryText: { fontSize: 12, color: '#0D7B7A', fontWeight: '700' },
//   lastMsgRow  : { flexDirection: 'row', alignItems: 'center' },
//   lastMsgText : { fontSize: 13, color: '#64748B', flex: 1 },

//   cardRight   : { alignItems: 'center', paddingRight: 14, paddingLeft: 8 },
//   statusBadge : {
//     flexDirection    : 'row',
//     alignItems       : 'center',
//     gap              : 4,
//     paddingHorizontal: 8,
//     paddingVertical  : 4,
//     borderRadius     : 10,
//   },
//   statusBadgeActive : { backgroundColor: '#ECFDF5' },
//   statusBadgeClosed : { backgroundColor: '#F8FAFC' },
//   statusDot  : { width: 6, height: 6, borderRadius: 3 },
//   statusText : { fontSize: 11, fontWeight: '700' },

//   // ── Empty state ────────────────────────────────────────────────────────────
//   emptyState   : { alignItems: 'center', paddingTop: 56, paddingHorizontal: 28 },
//   emptyIconGrad: {
//     width: 88, height: 88, borderRadius: 28,
//     justifyContent: 'center', alignItems: 'center',
//     marginBottom: 20,
//   },
//   emptyTitle   : { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
//   emptySubtitle: {
//     fontSize: 14, color: '#64748B', textAlign: 'center',
//     lineHeight: 21, marginBottom: 24,
//   },
//   featureRow    : {
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     width: '100%', marginBottom: 10,
//   },
//   featureIconWrap: {
//     width: 32, height: 32, borderRadius: 10,
//     backgroundColor: '#F0FDFA',
//     justifyContent : 'center', alignItems: 'center',
//   },
//   featureText   : { fontSize: 14, color: '#334155', fontWeight: '500' },
//   exploreBtn    : { marginTop: 28, width: '100%', borderRadius: 16 },
//   exploreBtnGrad: {
//     flexDirection  : 'row',
//     alignItems     : 'center',
//     justifyContent : 'center',
//     paddingVertical: 15,
//     borderRadius   : 16,       // fix: rounded corners on gradient, not on TouchableOpacity
//     gap            : 10,
//   },
//   exploreBtnText : { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
//   exploreBtnArrow: {
//     width: 28, height: 28, borderRadius: 14,
//     backgroundColor: '#FFFFFF',
//     justifyContent : 'center', alignItems: 'center',
//   },

//   // ── Error state ────────────────────────────────────────────────────────────
//   errorIconWrap  : {
//     width: 72, height: 72, borderRadius: 22,
//     backgroundColor: '#F1F5F9',
//     justifyContent : 'center', alignItems: 'center',
//     marginBottom   : 16,
//   },
//   errorTitle     : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
//   errorSubtitle  : { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
//   retryBtn       : {
//     marginTop        : 20,
//     backgroundColor  : '#0D7B7A',
//     paddingHorizontal: 28,
//     paddingVertical  : 12,
//     borderRadius     : 14,
//   },
//   retryBtnText   : { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

//   // Loading text (used in original loading state — kept for parity)
//   loadingText : { fontSize: 14, color: '#64748B', fontWeight: '500' },
// });    



/**
 * ChatHistoryScreen.jsx
 *
 * Sections:
 *  1. Broadcast Consultations  — from `broadcastChats` (userId == uid)
 *  2. Expert Consultations     — from `chats`          (userId == uid)
 *
 * Navigates to MainChatScreen for both, with isBroadcast flag.
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList,
  TouchableOpacity, ActivityIndicator, StatusBar,
  Animated, Dimensions, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, query,
  where, onSnapshot, orderBy,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

// ─── Constants ─────────────────────────────────────────────────────────────────
const CARD_CONTENT_HEIGHT = 88;
const CARD_MARGIN_BOTTOM = 10;
const CARD_SLOT_HEIGHT = CARD_CONTENT_HEIGHT + CARD_MARGIN_BOTTOM;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
];

// ─── Avatar palette ────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { grad: ['#2563EB', '#1D4ED8'] },
  { grad: ['#7C3AED', '#6D28D9'] },
  { grad: ['#DB2777', '#BE185D'] },
  { grad: ['#059669', '#047857'] },
  { grad: ['#D97706', '#B45309'] },
  { grad: ['#0D7B7A', '#0A4F4E'] },
];
const getPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// ─── Pure time formatter ────────────────────────────────────────────────────────
const formatTime = (ts) => {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 172_800_000) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── SkeletonCard ──────────────────────────────────────────────────────────────
const SkeletonCard = React.memo(() => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <View style={[styles.card, { marginBottom: CARD_MARGIN_BOTTOM }]}>
      <View style={[styles.cardStripe, { backgroundColor: '#E2E8F0' }]} />
      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      </View>
      <View style={[styles.cardContent, { gap: 8 }]}>
        <Animated.View style={[styles.skeletonLine, { width: '55%', opacity }]} />
        <Animated.View style={[styles.skeletonLine, { width: '35%', height: 10, opacity }]} />
        <Animated.View style={[styles.skeletonLine, { width: '75%', height: 11, opacity }]} />
      </View>
      <View style={styles.cardRight}>
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
      </View>
    </View>
  );
});

const SkeletonList = React.memo(() => (
  <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
    {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
  </View>
));

// ─── FilterRow ─────────────────────────────────────────────────────────────────
const FilterRow = React.memo(({ activeFilter, onSelect }) => (
  <View style={styles.filterRow}>
    {FILTERS.map((f) => {
      const isActive = f.key === activeFilter;
      return (
        <TouchableOpacity
          key={f.key}
          style={[styles.filterTab, isActive && styles.filterTabActive]}
          onPress={() => onSelect(f.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ─── SectionHeader ─────────────────────────────────────────────────────────────
const SectionHeader = React.memo(({ title, count, icon, isBroadcast }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIconWrap, isBroadcast && styles.sectionIconWrapBroadcast]}>
      <MatIcon name={icon} size={14} color={isBroadcast ? '#7C3AED' : '#0D7B7A'} />
    </View>
    <Text style={[styles.sectionTitle, isBroadcast && styles.sectionTitleBroadcast]}>
      {title}
    </Text>
    <View style={[styles.sectionCountPill, isBroadcast && styles.sectionCountPillBroadcast]}>
      <Text style={[styles.sectionCountText, isBroadcast && styles.sectionCountTextBroadcast]}>
        {count}
      </Text>
    </View>
  </View>
));

// ─── BroadcastCard ─────────────────────────────────────────────────────────────
// Distinct visual from regular chat cards — purple accent, "Broadcast" badge.
const BroadcastCard = React.memo(({ item, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 360, delay: index * 50, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 72, friction: 14, delay: index * 50, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const expertCount = item.expertIds?.length ?? 0;
  const displayName = item.userName || 'Broadcast Chat';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, styles.broadcastCard, { marginBottom: CARD_MARGIN_BOTTOM }]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Purple stripe for broadcast */}
        <View style={[styles.cardStripe, { backgroundColor: item.isActive ? '#7C3AED' : '#E2E8F0' }]} />

        {/* Avatar — broadcast icon instead of initial */}
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={item.isActive ? ['#7C3AED', '#6D28D9'] : ['#CBD5E1', '#94A3B8']}
            style={styles.avatarGrad}
          >
            <Icon name="users" size={20} color="#FFFFFF" />
          </LinearGradient>
          {item.isActive && (
            <View style={styles.onlineRing}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.expertName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
          </View>

          {/* Category + broadcast badge row */}
          <View style={styles.categoryRow}>
            {/* <View style={styles.broadcastLabelPill}>
              <Icon name="radio" size={10} color="#7C3AED" />
              <Text style={styles.broadcastLabelText}>Broadcast</Text>
            </View> */}
            {!!item.categoryName && (
              <Text style={styles.broadcastCategoryText} numberOfLines={1}>
                {item.categoryName}
              </Text>
            )}
          </View>

          <View style={styles.lastMsgRow}>
            {item.lastMessage?.startsWith('📷') ? (
              <Icon name="image" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            ) : item.lastMessage?.startsWith('🎤') ? (
              <Icon name="mic" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            ) : (
              <MatIcon name="broadcast" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.lastMsgText} numberOfLines={1}>
              {item.lastMessage || 'No messages yet — tap to start'}
            </Text>
          </View>
        </View>

        {/* Right section */}
        <View style={styles.cardRight}>
          {/* <View style={[
            styles.statusBadge,
            item.isActive ? styles.statusBadgeBroadcastActive : styles.statusBadgeClosed,
          ]}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#7C3AED' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: item.isActive ? '#5B21B6' : '#64748B' }]}>
              {item.isActive ? 'Active' : 'Closed'}
            </Text>
          </View> */}
          {/* {expertCount > 0 && (
            <View style={styles.expertCountBadge}>
              <Icon name="users" size={9} color="#7C3AED" />
              <Text style={styles.expertCountText}>{expertCount}</Text>
            </View>
          )} */}
          <Icon name="chevron-right" size={16} color="#CBD5E1" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.item.isActive === next.item.isActive &&
  prev.item.lastMessage === next.item.lastMessage &&
  prev.item.updatedAt === next.item.updatedAt &&
  prev.index === next.index
);

// ─── ChatCard ──────────────────────────────────────────────────────────────────
const ChatCard = React.memo(({ item, index, onPress }) => {
  const palette = useMemo(() => getPalette(item.expertName), [item.expertName]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 360, delay: index * 50, useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 72, friction: 14, delay: index * 50, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { marginBottom: CARD_MARGIN_BOTTOM }]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        <View style={[styles.cardStripe, { backgroundColor: item.isActive ? '#0D7B7A' : '#E2E8F0' }]} />

        <View style={styles.avatarWrap}>
          <LinearGradient colors={palette.grad} style={styles.avatarGrad}>
            <Text style={styles.avatarText}>
              {item.expertName?.charAt(0)?.toUpperCase() || 'E'}
            </Text>
          </LinearGradient>
          {item.isActive && (
            <View style={styles.onlineRing}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={styles.expertName} numberOfLines={1}>
              {item.expertName || 'Expert'}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
          </View>

          {!!item.categoryName && (
            <View style={styles.categoryRow}>
              <MatIcon name="briefcase-outline" size={11} color="#0D7B7A" />
              <Text style={styles.categoryText}>{item.categoryName}</Text>
            </View>
          )}

          <View style={styles.lastMsgRow}>
            {item.lastMessage?.startsWith('📷') ? (
              <Icon name="image" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            ) : (
              <MatIcon name="message-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.lastMsgText} numberOfLines={1}>
              {item.lastMessage || 'No messages yet — start the conversation'}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, item.isActive ? styles.statusBadgeActive : styles.statusBadgeClosed]}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#059669' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: item.isActive ? '#065F46' : '#64748B' }]}>
              {item.isActive ? 'Active' : 'Closed'}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color="#CBD5E1" style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.item.isActive === next.item.isActive &&
  prev.item.lastMessage === next.item.lastMessage &&
  prev.item.updatedAt === next.item.updatedAt &&
  prev.index === next.index
);

// ─── EmptySection ──────────────────────────────────────────────────────────────
const EmptySection = React.memo(({ isBroadcast }) => (
  <View style={styles.emptySectionWrap}>
    <MatIcon
      name={isBroadcast ? 'broadcast' : 'message-text-outline'}
      size={22}
      color={isBroadcast ? '#DDD6FE' : '#B2DFDE'}
    />
    <Text style={styles.emptySectionText}>
      {isBroadcast
        ? 'No broadcast consultations yet'
        : 'No expert consultations yet'}
    </Text>
  </View>
));

// ─── FullEmptyState ────────────────────────────────────────────────────────────
const FullEmptyState = React.memo(({ filter, onBrowse }) => (
  <View style={styles.emptyState}>
    <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
      <MatIcon name="message-text-outline" size={38} color="#0D7B7A" />
    </LinearGradient>
    <Text style={styles.emptyTitle}>
      {filter === 'all' ? 'No Conversations Yet' : `No ${filter === 'active' ? 'Active' : 'Closed'} Conversations`}
    </Text>
    <Text style={styles.emptySubtitle}>
      {filter === 'all'
        ? 'Connect with a verified expert and get\npersonalised guidance in minutes.'
        : `You have no ${filter} consultations right now.`}
    </Text>
    {filter === 'all' && (
      <>
        {[
          { icon: 'shield-check-outline', text: 'Verified professionals' },
          { icon: 'clock-fast', text: 'Responds within minutes' },
          { icon: 'lock-outline', text: 'Private & confidential' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <MatIcon name={f.icon} size={15} color="#0D7B7A" />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.exploreBtn} onPress={onBrowse} activeOpacity={0.88}>
          <LinearGradient
            colors={['#0D7B7A', '#0A5F5E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.exploreBtnGrad}
          >
            <Icon name="search" size={16} color="#FFFFFF" />
            <Text style={styles.exploreBtnText}>Browse Experts</Text>
            <View style={styles.exploreBtnArrow}>
              <Icon name="arrow-right" size={14} color="#0D7B7A" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </>
    )}
  </View>
));

// ─── ErrorState ────────────────────────────────────────────────────────────────
const ErrorState = React.memo(({ onRetry }) => (
  <View style={[styles.centered, { flex: 1 }]}>
    <View style={styles.errorIconWrap}>
      <Icon name="wifi-off" size={32} color="#94A3B8" />
    </View>
    <Text style={styles.errorTitle}>Unable to Load Conversations</Text>
    <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
      <Text style={styles.retryBtnText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ChatHistoryScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [broadcastChats, setBroadcastChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingBcast, setLoadingBcast] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const uid = auth().currentUser?.uid;

  const loading = loadingChats || loadingBcast;

  // ── Unmount guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Header animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  // ── Firestore: regular chats listener ────────────────────────────────────────
  useEffect(() => {
    if (!uid) { setLoadingChats(false); return; }
    const db = getFirestore();
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted.current) return;
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingChats(false);
        setLoadError(false);
      },
      () => {
        if (!isMounted.current) return;
        setLoadingChats(false);
        setLoadError(true);
      },
    );
    return unsub;
  }, [uid]);

  // ── Firestore: broadcast chats listener ──────────────────────────────────────
  useEffect(() => {
    if (!uid) { setLoadingBcast(false); return; }
    const db = getFirestore();
    const q = query(
      collection(db, 'broadcastChats'),
      where('userId', '==', uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted.current) return;
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const enabledChats = data.filter(
          (chat) => chat.chatEnabled === true
        );

        setBroadcastChats(
          snap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .filter((chat) => chat.ChatEnabled === true)
        );
        setLoadingBcast(false);
        setLoadError(false);
      },
      () => {
        if (!isMounted.current) return;
        setLoadingBcast(false);
        // Don't block entire screen for broadcast failure
      },
    );
    return unsub;
  }, [uid]);

  // ── Derived state ─────────────────────────────────────────────────────────────
  const applyFilter = useCallback((list) => {
    if (filter === 'active') return list.filter((c) => c.isActive);
    if (filter === 'closed') return list.filter((c) => !c.isActive);
    return list;
  }, [filter]);

  const filteredChats = useMemo(() => applyFilter(chats), [chats, applyFilter]);
  const filteredBroadcast = useMemo(() => applyFilter(broadcastChats), [broadcastChats, applyFilter]);

  const activeCount = useMemo(
    () => chats.filter((c) => c.isActive).length + broadcastChats.filter((c) => c.isActive).length,
    [chats, broadcastChats],
  );
  const totalCount = chats.length + broadcastChats.length;

  // ── SectionList data ──────────────────────────────────────────────────────────
  // Build sections only when there is at least one item in either list,
  // so the FullEmptyState appears correctly when both are empty.
  const sections = useMemo(() => {
    const result = [];
    result.push({
      key: 'broadcast',
      title: 'Expert Consultations',
      icon: 'broadcast',
      isBroadcast: true,
      data: filteredBroadcast,
    });
    // result.push({
    //   key        : 'expert',
    //   title      : 'Expert Consultations',
    //   icon       : 'account-tie-outline',
    //   isBroadcast: false,
    //   data       : filteredChats,
    // });
    return result;
  }, [filteredBroadcast, filteredChats]);

  const bothEmpty = filteredChats.length === 0 && filteredBroadcast.length === 0;

  // ── Navigate helpers ──────────────────────────────────────────────────────────
  const navigateToChat = useCallback((item, isBroadcast) => {
    navigation.navigate('MainChat', {
      chatId: item.id,
      expertName: isBroadcast
        ? (item.subcategoryName || 'Broadcast Chat')
        : (item.expertName || 'Expert'),
      expertId: isBroadcast ? null : item.expertId,
      isBroadcast: !!isBroadcast,
      subcategoryName: item.subcategoryName ?? '',
      categoryName: item.categoryName ?? '',
      expertIds: item.expertIds ?? [],
    });
  }, [navigation]);

  // ── SectionList render helpers ────────────────────────────────────────────────
  const renderSectionHeader = useCallback(({ section }) => (
    <SectionHeader
      title={section.title}
      count={section.data.length}
      icon={section.icon}
      isBroadcast={section.isBroadcast}
    />
  ), []);

  const renderItem = useCallback(({ item, index, section }) => {
    if (section.isBroadcast) {
      return (
        <BroadcastCard
          item={item}
          index={index}
          onPress={() => navigateToChat(item, true)}
        />
      );
    }
    // return (
    //   <ChatCard
    //     item={item}
    //     index={index}
    //     onPress={() => navigateToChat(item, false)}
    //   />
    // );
  }, [navigateToChat]);

  const renderSectionFooter = useCallback(({ section }) => {
    if (section.data.length > 0) return <View style={{ height: 8 }} />;
    return <EmptySection isBroadcast={section.isBroadcast} />;
  }, []);

  const keyExtractor = useCallback((item, index) => item.id ?? String(index), []);

  // ── Retry ─────────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setLoadError(false);
    setLoadingChats(true);
    setLoadingBcast(true);
    setChats([]);
    setBroadcastChats([]);
  }, []);

  // ── Error state ───────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Consultations</Text>
        </LinearGradient>
        <ErrorState onRetry={handleRetry} />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      {/* ── Header ── */}
      <LinearGradient
        colors={['#0A4F4E', '#0D7B7A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={{ opacity: headerAnim }}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>My Consultations</Text>
              {/* <Text style={styles.headerSub}>
                {totalCount} total · {activeCount} active
              </Text> */}
            </View>
            <View style={styles.headerIconWrap}>
              <MatIcon name="message-text-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          {/* Stats pills */}
          <View style={styles.statsPillRow}>
            {/* <View style={styles.statsPill}>
              <MatIcon name="forum-outline" size={13} color="#0D7B7A" />
              <Text style={styles.statsPillText}>{chats.length} Expert</Text>
            </View> */}
            <View style={styles.statsPill}>
              <Icon name="radio" size={11} color="#7C3AED" />
              <Text style={[styles.statsPillText, { color: '#7C3AED' }]}>
                {broadcastChats.length} Chats
              </Text>
            </View>
            {/* <View style={styles.statsPill}>
              <View style={styles.statsPillDot} />
              <Text style={styles.statsPillText}>{activeCount} Active</Text>
            </View> */}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ── Filter Tabs ── */}
      {/* <FilterRow activeFilter={filter} onSelect={setFilter} /> */}

      {/* ── Content ── */}
      {loading ? (
        <SkeletonList />
      ) : bothEmpty ? (
        // Full empty state when absolutely nothing to show
        <FullEmptyState
          filter={filter}
          onBrowse={() => navigation.navigate('Home')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={8}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={30}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  skeletonAvatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#CBD5E1' },
  skeletonLine: { height: 13, borderRadius: 6, backgroundColor: '#CBD5E1' },
  skeletonBadge: { width: 56, height: 24, borderRadius: 10, backgroundColor: '#CBD5E1' },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3, fontWeight: '500' },
  headerIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsPillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statsPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  statsPillText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

  // ── Filter Tabs ──────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#E0F2F1',
  },
  filterTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#0D7B7A', borderColor: '#0D7B7A' },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF' },

  // ── Section Header ────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, marginTop: 4, gap: 8,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#E0F7F6',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionIconWrapBroadcast: { backgroundColor: '#EDE9FE' },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#0D7B7A',
    letterSpacing: 0.7, textTransform: 'uppercase', flex: 1,
  },
  sectionTitleBroadcast: { color: '#7C3AED' },
  sectionCountPill: {
    backgroundColor: '#E0F7F6',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  sectionCountPillBroadcast: { backgroundColor: '#EDE9FE' },
  sectionCountText: { fontSize: 11, fontWeight: '700', color: '#0D7B7A' },
  sectionCountTextBroadcast: { color: '#7C3AED' },

  // ── List ──────────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  // ── Shared card styles ────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3, minHeight: CARD_CONTENT_HEIGHT,
  },
  broadcastCard: {
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
  },
  cardStripe: { width: 4, alignSelf: 'stretch' },
  avatarWrap: { position: 'relative', marginHorizontal: 14 },
  avatarGrad: {
    width: 48, height: 48, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
  onlineRing: {
    position: 'absolute', bottom: -1, right: -1,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },

  cardContent: { flex: 1, paddingVertical: 14 },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  expertName: { fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1 },
  timeText: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginLeft: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  categoryText: { fontSize: 12, color: '#0D7B7A', fontWeight: '700' },
  lastMsgRow: { flexDirection: 'row', alignItems: 'center' },
  lastMsgText: { fontSize: 13, color: '#64748B', flex: 1 },

  cardRight: { alignItems: 'center', paddingRight: 14, paddingLeft: 8, gap: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  statusBadgeActive: { backgroundColor: '#ECFDF5' },
  statusBadgeBroadcastActive: { backgroundColor: '#F5F3FF' },
  statusBadgeClosed: { backgroundColor: '#F8FAFC' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // ── Broadcast-specific card styles ────────────────────────────────────────────
  broadcastLabelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  broadcastLabelText: { fontSize: 10, fontWeight: '800', color: '#7C3AED' },
  broadcastCategoryText: {
    fontSize: 11, color: '#7C3AED', fontWeight: '600',
    flex: 1, marginLeft: 4,
  },
  expertCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  expertCountText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },

  // ── Empty section (inline) ────────────────────────────────────────────────────
  emptySectionWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 4, marginBottom: 8,
  },
  emptySectionText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },

  // ── Full empty state ──────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 28 },
  emptyIconGrad: {
    width: 88, height: 88, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  emptySubtitle: {
    fontSize: 14, color: '#64748B', textAlign: 'center',
    lineHeight: 21, marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', marginBottom: 10,
  },
  featureIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  exploreBtn: { marginTop: 28, width: '100%', borderRadius: 16 },
  exploreBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 15,
    borderRadius: 16, gap: 10,
  },
  exploreBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  exploreBtnArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Error state ───────────────────────────────────────────────────────────────
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  errorSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, backgroundColor: '#0D7B7A',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
});