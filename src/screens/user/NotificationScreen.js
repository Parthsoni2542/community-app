// // /**
// //  * NotificationScreen.jsx
// //  *
// //  * Design: Matches PrivacyPolicy.jsx & TermsOfService.jsx design system exactly
// //  *  - Same teal LinearGradient hero with back button
// //  *  - Same SectionCard style for grouped notifications
// //  *  - Staggered entrance animations (fadeAnim + slide per card)
// //  *  - Unread badge count in hero
// //  *  - Static notification data grouped by Today / Yesterday / Earlier
// //  *  - StatusBar consistent with PrivacyPolicy / TermsOfService
// //  */

// // import React, { useEffect, useRef } from 'react';
// // import {
// //   View, Text, StyleSheet, ScrollView,
// //   TouchableOpacity, StatusBar, Animated,
// // } from 'react-native';
// // import LinearGradient from 'react-native-linear-gradient';
// // import Icon    from 'react-native-vector-icons/Feather';
// // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// // // ─── Static Notification Data ─────────────────────────────────────────────────
// // const NOTIFICATIONS = [
// //   // ── Today
// //   {
// //     id       : 'n1',
// //     group    : 'Today',
// //     icon     : 'user-check',
// //     iconLib  : 'feather',
// //     iconColor: '#0D7B7A',
// //     iconBg   : '#F0FDFA',
// //     title    : 'Consultation Confirmed',
// //     message  : 'Your consultation with Dr. Priya Sharma has been confirmed for 3:00 PM today.',
// //     time     : '10:32 AM',
// //     unread   : true,
// //   },
// //   {
// //     id       : 'n2',
// //     group    : 'Today',
// //     icon     : 'credit-card',
// //     iconLib  : 'feather',
// //     iconColor: '#7C3AED',
// //     iconBg   : '#F5F3FF',
// //     title    : 'Payment Successful',
// //     message  : 'Your payment of ₹499 for the Premium Plan has been processed successfully.',
// //     time     : '9:15 AM',
// //     unread   : true,
// //   },
// //   {
// //     id       : 'n3',
// //     group    : 'Today',
// //     icon     : 'star',
// //     iconLib  : 'feather',
// //     iconColor: '#D97706',
// //     iconBg   : '#FFFBEB',
// //     title    : 'Rate Your Experience',
// //     message  : 'How was your session with Advocate Rajan Mehta? Share your feedback.',
// //     time     : '8:00 AM',
// //     unread   : true,
// //   },

// //   // ── Yesterday
// //   {
// //     id       : 'n4',
// //     group    : 'Yesterday',
// //     icon     : 'message-circle',
// //     iconLib  : 'feather',
// //     iconColor: '#0D7B7A',
// //     iconBg   : '#F0FDFA',
// //     title    : 'New Message',
// //     message  : 'CA Neha Gupta sent you a message regarding your tax filing documents.',
// //     time     : '6:45 PM',
// //     unread   : false,
// //   },
// //   {
// //     id       : 'n5',
// //     group    : 'Yesterday',
// //     icon     : 'clock',
// //     iconLib  : 'feather',
// //     iconColor: '#DC2626',
// //     iconBg   : '#FEF2F2',
// //     title    : 'Appointment Reminder',
// //     message  : 'Reminder: You have a scheduled call with Dr. Arvind Patel tomorrow at 11:00 AM.',
// //     time     : '4:00 PM',
// //     unread   : false,
// //   },
// //   {
// //     id       : 'n6',
// //     group    : 'Yesterday',
// //     icon     : 'gift',
// //     iconLib  : 'feather',
// //     iconColor: '#D97706',
// //     iconBg   : '#FFFBEB',
// //     title    : 'Special Offer',
// //     message  : 'Get 20% off on your next legal consultation. Use code LEGAL20. Valid for 48 hrs.',
// //     time     : '11:30 AM',
// //     unread   : false,
// //   },

// //   // ── Earlier
// //   {
// //     id       : 'n7',
// //     group    : 'Earlier',
// //     icon     : 'check-circle',
// //     iconLib  : 'feather',
// //     iconColor: '#16A34A',
// //     iconBg   : '#F0FDF4',
// //     title    : 'Profile Verified',
// //     message  : 'Your profile has been successfully verified. You can now access all features.',
// //     time     : 'Mon, 2 Jun',
// //     unread   : false,
// //   },
// //   {
// //     id       : 'n8',
// //     group    : 'Earlier',
// //     icon     : 'bell',
// //     iconLib  : 'feather',
// //     iconColor: '#0D7B7A',
// //     iconBg   : '#F0FDFA',
// //     title    : 'App Update Available',
// //     message  : 'A new version of the app is available. Update now to enjoy the latest features.',
// //     time     : 'Sun, 1 Jun',
// //     unread   : false,
// //   },
// //   {
// //     id       : 'n9',
// //     group    : 'Earlier',
// //     icon     : 'shield',
// //     iconLib  : 'feather',
// //     iconColor: '#7C3AED',
// //     iconBg   : '#F5F3FF',
// //     title    : 'Security Alert',
// //     message  : 'A new login was detected from Mumbai, Maharashtra. If this was not you, secure your account.',
// //     time     : 'Sat, 31 May',
// //     unread   : false,
// //   },
// // ];

// // const GROUPS = ['Today', 'Yesterday', 'Earlier'];
// // const UNREAD_COUNT = NOTIFICATIONS.filter((n) => n.unread).length;

// // // ─── Single Notification Row ──────────────────────────────────────────────────
// // const NotifRow = ({ item, isLast }) => (
// //   <TouchableOpacity
// //     style={[styles.notifRow, !isLast && styles.notifRowBorder]}
// //     activeOpacity={0.7}
// //   >
// //     {/* Icon */}
// //     <View style={[styles.notifIconWrap, { backgroundColor: item.iconBg }]}>
// //       {item.iconLib === 'mat'
// //         ? <MatIcon name={item.icon} size={16} color={item.iconColor} />
// //         : <Icon    name={item.icon} size={16} color={item.iconColor} />
// //       }
// //     </View>

// //     {/* Text */}
// //     <View style={styles.notifTextWrap}>
// //       <View style={styles.notifTitleRow}>
// //         <Text style={[styles.notifTitle, item.unread && styles.notifTitleUnread]} numberOfLines={1}>
// //           {item.title}
// //         </Text>
// //         <Text style={styles.notifTime}>{item.time}</Text>
// //       </View>
// //       <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
// //     </View>

// //     {/* Unread dot */}
// //     {item.unread && <View style={styles.unreadDot} />}
// //   </TouchableOpacity>
// // );

// // // ─── Group Card ───────────────────────────────────────────────────────────────
// // const GroupCard = ({ group, items, animStyle }) => (
// //   <Animated.View style={[styles.groupCard, animStyle]}>
// //     {/* Group label */}
// //     <View style={styles.groupLabelRow}>
// //       <Text style={styles.groupLabel}>{group}</Text>
// //       {group === 'Today' && (
// //         <View style={styles.groupBadge}>
// //           <Text style={styles.groupBadgeText}>{items.filter((i) => i.unread).length} new</Text>
// //         </View>
// //       )}
// //     </View>

// //     {/* Rows */}
// //     {items.map((item, idx) => (
// //       <NotifRow key={item.id} item={item} isLast={idx === items.length - 1} />
// //     ))}
// //   </Animated.View>
// // );

// // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // export default function NotificationScreen({ navigation }) {
// //   const fadeAnim   = useRef(new Animated.Value(0)).current;
// //   const heroSlide  = useRef(new Animated.Value(-16)).current;
// //   const slideAnims = useRef(GROUPS.map(() => new Animated.Value(20))).current;

// //   useEffect(() => {
// //     Animated.parallel([
// //       Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
// //       Animated.spring(heroSlide, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
// //     ]).start();

// //     const cardAnims = slideAnims.map((anim, i) =>
// //       Animated.spring(anim, {
// //         toValue        : 0,
// //         tension        : 68,
// //         friction       : 14,
// //         delay          : 80 + i * 60,
// //         useNativeDriver: true,
// //       }),
// //     );
// //     Animated.parallel(cardAnims).start();
// //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

// //       <ScrollView
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.scrollContent}
// //       >
// //         {/* ── Hero ── */}
// //         <LinearGradient
// //           colors={['#0A4F4E', '#0D7B7A']}
// //           start={{ x: 0, y: 0 }}
// //           end={{ x: 1, y: 1 }}
// //           style={styles.hero}
// //         >
// //           {/* Top bar */}
// //           <View style={styles.heroTopBar}>
// //             <TouchableOpacity
// //               style={styles.backBtn}
// //               onPress={() => navigation.goBack()}
// //               activeOpacity={0.8}
// //             >
// //               <Icon name="arrow-left" size={18} color="#FFFFFF" />
// //             </TouchableOpacity>
// //             <Text style={styles.heroScreenTitle}>Notifications</Text>
// //             {/* Mark all read button */}
// //             <TouchableOpacity style={styles.markAllBtn} activeOpacity={0.8}>
// //               <Icon name="check" size={14} color="#FFFFFF" />
// //             </TouchableOpacity>
// //           </View>

// //           {/* Hero content */}
// //           <Animated.View
// //             style={[
// //               styles.heroContent,
// //               { opacity: fadeAnim, transform: [{ translateY: heroSlide }] },
// //             ]}
// //           >
// //             <View style={styles.bellIconWrap}>
// //               <Icon name="bell" size={32} color="#FFFFFF" />
// //               {UNREAD_COUNT > 0 && (
// //                 <View style={styles.heroBadge}>
// //                   <Text style={styles.heroBadgeText}>{UNREAD_COUNT}</Text>
// //                 </View>
// //               )}
// //             </View>
// //             <Text style={styles.heroSubtitle}>
// //               Stay updated with your consultations, payments, and important alerts.
// //             </Text>
// //             <View style={styles.metaRow}>
// //               <View style={styles.metaBadge}>
// //                 <Icon name="bell" size={11} color="#0D7B7A" />
// //                 <Text style={styles.metaBadgeText}>{UNREAD_COUNT} Unread</Text>
// //               </View>
// //               <View style={styles.metaBadge}>
// //                 <Icon name="list" size={11} color="#0D7B7A" />
// //                 <Text style={styles.metaBadgeText}>{NOTIFICATIONS.length} Total</Text>
// //               </View>
// //             </View>
// //           </Animated.View>
// //         </LinearGradient>

// //         {/* ── Grouped Notification Cards ── */}
// //         {GROUPS.map((group, idx) => {
// //           const items = NOTIFICATIONS.filter((n) => n.group === group);
// //           if (!items.length) return null;
// //           return (
// //             <GroupCard
// //               key={group}
// //               group={group}
// //               items={items}
// //               animStyle={{
// //                 opacity  : fadeAnim,
// //                 transform: [{ translateY: slideAnims[idx] }],
// //               }}
// //             />
// //           );
// //         })}

// //         {/* ── Empty state (hidden when data exists, shown when no notifications) ── */}
// //         {/* Uncomment below to preview empty state */}
// //         {/*
// //         <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
// //           <View style={styles.emptyIconWrap}>
// //             <Icon name="bell-off" size={32} color="#94A3B8" />
// //           </View>
// //           <Text style={styles.emptyTitle}>No Notifications</Text>
// //           <Text style={styles.emptySubtitle}>You're all caught up! Check back later.</Text>
// //         </Animated.View>
// //         */}

// //       </ScrollView>
// //     </View>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────
// // const styles = StyleSheet.create({
// //   container    : { flex: 1, backgroundColor: '#EFF4F4' },
// //   scrollContent: { paddingBottom: 56 },

// //   // ── Hero ──────────────────────────────────────────────────────────────────
// //   hero: {
// //     paddingTop       : 56,
// //     paddingBottom    : 28,
// //     paddingHorizontal: 20,
// //   },
// //   heroTopBar: {
// //     flexDirection : 'row',
// //     alignItems    : 'center',
// //     marginBottom  : 22,
// //   },
// //   backBtn: {
// //     width          : 36,
// //     height         : 36,
// //     borderRadius   : 12,
// //     backgroundColor: 'rgba(255,255,255,0.15)',
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //   },
// //   heroScreenTitle: {
// //     flex         : 1,
// //     textAlign    : 'center',
// //     fontSize     : 20,
// //     fontWeight   : '900',
// //     color        : '#FFFFFF',
// //     letterSpacing: 0.2,
// //   },
// //   markAllBtn: {
// //     width          : 36,
// //     height         : 36,
// //     borderRadius   : 12,
// //     backgroundColor: 'rgba(255,255,255,0.15)',
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //   },

// //   heroContent: { alignItems: 'center' },
// //   bellIconWrap: {
// //     width          : 64,
// //     height         : 64,
// //     borderRadius   : 20,
// //     backgroundColor: 'rgba(255,255,255,0.15)',
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //     marginBottom   : 14,
// //     borderWidth    : 1,
// //     borderColor    : 'rgba(255,255,255,0.2)',
// //   },
// //   heroBadge: {
// //     position       : 'absolute',
// //     top            : -4,
// //     right          : -4,
// //     minWidth       : 18,
// //     height         : 18,
// //     borderRadius   : 9,
// //     backgroundColor: '#EF4444',
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //     paddingHorizontal: 4,
// //     borderWidth    : 2,
// //     borderColor    : 'rgba(255,255,255,0.3)',
// //   },
// //   heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

// //   heroSubtitle: {
// //     fontSize         : 13,
// //     color            : 'rgba(255,255,255,0.78)',
// //     textAlign        : 'center',
// //     lineHeight       : 20,
// //     fontWeight       : '500',
// //     paddingHorizontal: 8,
// //   },
// //   metaRow: {
// //     flexDirection: 'row',
// //     gap          : 8,
// //     marginTop    : 14,
// //   },
// //   metaBadge: {
// //     flexDirection    : 'row',
// //     alignItems       : 'center',
// //     gap              : 5,
// //     backgroundColor  : '#FFFFFF',
// //     paddingHorizontal: 11,
// //     paddingVertical  : 5,
// //     borderRadius     : 20,
// //   },
// //   metaBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

// //   // ── Group Card ────────────────────────────────────────────────────────────
// //   groupCard: {
// //     backgroundColor  : '#FFFFFF',
// //     marginHorizontal : 16,
// //     marginTop        : 14,
// //     borderRadius     : 20,
// //     borderWidth      : 1,
// //     borderColor      : '#E0F2F1',
// //     shadowColor      : '#0D7B7A',
// //     shadowOpacity    : 0.05,
// //     shadowRadius     : 8,
// //     shadowOffset     : { width: 0, height: 3 },
// //     elevation        : 3,
// //     overflow         : 'hidden',
// //   },
// //   groupLabelRow: {
// //     flexDirection    : 'row',
// //     alignItems       : 'center',
// //     gap              : 8,
// //     paddingHorizontal: 16,
// //     paddingTop       : 14,
// //     paddingBottom    : 10,
// //   },
// //   groupLabel: {
// //     fontSize  : 12,
// //     fontWeight: '800',
// //     color     : '#94A3B8',
// //     letterSpacing: 0.6,
// //     textTransform: 'uppercase',
// //   },
// //   groupBadge: {
// //     backgroundColor  : '#F0FDFA',
// //     borderRadius     : 20,
// //     paddingHorizontal: 8,
// //     paddingVertical  : 2,
// //     borderWidth      : 1,
// //     borderColor      : '#CCEFED',
// //   },
// //   groupBadgeText: { fontSize: 11, fontWeight: '700', color: '#0D7B7A' },

// //   // ── Notification Row ──────────────────────────────────────────────────────
// //   notifRow: {
// //     flexDirection    : 'row',
// //     alignItems       : 'flex-start',
// //     paddingHorizontal: 16,
// //     paddingVertical  : 12,
// //     gap              : 12,
// //   },
// //   notifRowBorder: {
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F9FF',
// //   },
// //   notifIconWrap: {
// //     width          : 40,
// //     height         : 40,
// //     borderRadius   : 12,
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //     marginTop      : 1,
// //   },
// //   notifTextWrap: { flex: 1 },
// //   notifTitleRow : {
// //     flexDirection : 'row',
// //     alignItems    : 'center',
// //     justifyContent: 'space-between',
// //     marginBottom  : 3,
// //   },
// //   notifTitle: {
// //     fontSize  : 13,
// //     fontWeight: '600',
// //     color     : '#64748B',
// //     flex      : 1,
// //     marginRight: 8,
// //   },
// //   notifTitleUnread: {
// //     fontWeight: '800',
// //     color     : '#0F172A',
// //   },
// //   notifTime: {
// //     fontSize  : 11,
// //     color     : '#94A3B8',
// //     fontWeight: '500',
// //   },
// //   notifMessage: {
// //     fontSize  : 12,
// //     color     : '#94A3B8',
// //     lineHeight: 18,
// //     fontWeight: '400',
// //   },
// //   unreadDot: {
// //     width          : 8,
// //     height         : 8,
// //     borderRadius   : 4,
// //     backgroundColor: '#0D7B7A',
// //     marginTop      : 6,
// //   },

// //   // ── Empty State ───────────────────────────────────────────────────────────
// //   emptyWrap: {
// //     alignItems: 'center',
// //     marginTop : 60,
// //     gap       : 10,
// //   },
// //   emptyIconWrap: {
// //     width          : 72,
// //     height         : 72,
// //     borderRadius   : 24,
// //     backgroundColor: '#F1F5F9',
// //     justifyContent : 'center',
// //     alignItems     : 'center',
// //     marginBottom   : 4,
// //   },
// //   emptyTitle: {
// //     fontSize  : 16,
// //     fontWeight: '800',
// //     color     : '#0F172A',
// //   },
// //   emptySubtitle: {
// //     fontSize  : 13,
// //     color     : '#94A3B8',
// //     fontWeight: '400',
// //   },
// // });


// /**
//  * NotificationScreen.jsx
//  * Firestore structure ke according:
//  *   chats/{chatId}
//  *     - userId: string
//  *     - expertId: string
//  *     - expertName: string
//  *     - lastMessage: string
//  *     - updatedAt: Timestamp
//  *     - unreadCount: number
//  *     - userName: string
//  *     - categoryName: string
//  *     - isActive: boolean
//  */

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView,
//   TouchableOpacity, StatusBar, Animated,
//   ActivityIndicator,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Feather';
// import {
//   getFirestore, collection, query, where,
//   onSnapshot, doc, updateDoc, writeBatch,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const timeAgo = (ts) => {
//   if (!ts?.toDate) return '';
//   const diff = Math.floor((Date.now() - ts.toDate()) / 1000);
//   if (diff < 60) return 'Just now';
//   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//   if (diff < 172800) return 'Yesterday';
//   return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
// };

// const getGroup = (ts) => {
//   if (!ts?.toDate) return 'Earlier';
//   const diff = Date.now() - ts.toDate();
//   if (diff < 86400000) return 'Today';
//   if (diff < 172800000) return 'Yesterday';
//   return 'Earlier';
// };

// const getMsgStyle = (lastMessage = '') => {
//   if (lastMessage.startsWith('📷'))
//     return { icon: 'image', iconColor: '#7C3AED', iconBg: '#F5F3FF' };
//   if (lastMessage.startsWith('🎤'))
//     return { icon: 'mic', iconColor: '#D97706', iconBg: '#FFFBEB' };
//   return { icon: 'message-circle', iconColor: '#0D7B7A', iconBg: '#F0FDFA' };
// };

// // ─── NotifRow ─────────────────────────────────────────────────────────────────
// const NotifRow = React.memo(({ item, isLast, onPress }) => {
//   const s = getMsgStyle(item.lastMessage);
//   const isUnread = (item.unreadCount ?? 0) > 0;

//   return (
//     <TouchableOpacity
//       style={[styles.notifRow, !isLast && styles.notifRowBorder]}
//       activeOpacity={0.7}
//       onPress={() => onPress(item)}
//     >
//       <View style={[styles.notifIconWrap, { backgroundColor: s.iconBg }]}>
//         <Icon name={s.icon} size={16} color={s.iconColor} />
//       </View>

//       <View style={styles.notifTextWrap}>
//         <View style={styles.notifTitleRow}>
//           <Text
//             style={[styles.notifTitle, isUnread && styles.notifTitleUnread]}
//             numberOfLines={1}
//           >
//             {item.expertName || 'Expert'}
//           </Text>
//           <Text style={styles.notifTime}>{timeAgo(item.updatedAt)}</Text>
//         </View>
//         {!!item.categoryName && (
//           <Text style={styles.notifCategory} numberOfLines={1}>
//             {item.categoryName}
//           </Text>
//         )}
//         <Text style={styles.notifMessage} numberOfLines={2}>
//           {item.lastMessage || 'Sent you a reply'}
//         </Text>
//       </View>

//       {isUnread && (
//         <View style={styles.unreadBadge}>
//           <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// });

// // ─── GroupCard ────────────────────────────────────────────────────────────────
// const GroupCard = React.memo(({ group, items, animStyle, onPress }) => {
//   const newCount = items.filter((i) => (i.unreadCount ?? 0) > 0).length;
//   return (
//     <Animated.View style={[styles.groupCard, animStyle]}>
//       <View style={styles.groupLabelRow}>
//         <Text style={styles.groupLabel}>{group}</Text>
//         {newCount > 0 && (
//           <View style={styles.groupBadge}>
//             <Text style={styles.groupBadgeText}>{newCount} new</Text>
//           </View>
//         )}
//       </View>
//       {items.map((item, idx) => (
//         <NotifRow
//           key={item.id}
//           item={item}
//           isLast={idx === items.length - 1}
//           onPress={onPress}
//         />
//       ))}
//     </Animated.View>
//   );
// });

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function NotificationScreen({ navigation }) {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const heroSlide = useRef(new Animated.Value(-16)).current;
//   const slideAnims = useRef([0, 1, 2].map(() => new Animated.Value(20))).current;
//   const isMounted = useRef(true);

//   const uid = auth().currentUser?.uid;

//   useEffect(() => {
//     isMounted.current = true;
//     return () => { isMounted.current = false; };
//   }, []);

//   // ── Firestore: where('userId', '==', uid) — single field, no index needed ─
//   useEffect(() => {
//     if (!uid) { setLoading(false); return; }

//     const db = getFirestore();

//     const q = query(
//       collection(db, 'chats'),
//       where('userId', '==', uid),   // aapka exact field name
//     );



//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         if (!isMounted.current) return;
//         console.log("dsdsdssd", snap.docs);
//         const data = snap.docs
//           .map((d) => ({ id: d.id, ...d.data() }))
//           // Sirf wo chats jisme koi unread message ho (expert ne reply kiya ho)
//           .filter((chat) => (chat.unreadCount ?? 0) > 0)
//           // Latest pehle
//           .sort((a, b) => {
//             const at = a.updatedAt?.toDate?.() ?? new Date(0);
//             const bt = b.updatedAt?.toDate?.() ?? new Date(0);
//             return bt - at;
//           });

//         setNotifications(data);
//         setLoading(false);
//       },
//       (err) => {
//         console.error('Notifications error:', err);
//         if (!isMounted.current) return;
//         setLoading(false);
//       },
//     );

//     return () => unsub();
//   }, [uid]);

//   // ── Animations ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (loading) return;
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
//       Animated.spring(heroSlide, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
//     ]).start();
//     slideAnims.forEach((anim, i) =>
//       Animated.spring(anim, {
//         toValue: 0, tension: 68, friction: 14,
//         delay: 80 + i * 60, useNativeDriver: true,
//       }).start(),
//     );
//   }, [loading]);

//   // ── Press: reset unreadCount + navigate ───────────────────────────────────
//   const handleNotifPress = useCallback(async (item) => {
//     try {
//       const db = getFirestore();
//       await updateDoc(doc(db, 'chats', item.id), { unreadCount: 0 });
//     } catch (e) {
//       console.error('Reset unread error:', e);
//     }
//     navigation.navigate('Chat', {
//       chatId: item.id,
//       expertName: item.expertName,
//       expertId: item.expertId,
//     });
//   }, [navigation]);

//   // ── Mark all read ─────────────────────────────────────────────────────────
//   const handleMarkAllRead = useCallback(async () => {
//     const unread = notifications.filter((n) => (n.unreadCount ?? 0) > 0);
//     if (!unread.length) return;
//     try {
//       const db = getFirestore();
//       const batch = writeBatch(db);
//       unread.forEach((n) =>
//         batch.update(doc(db, 'chats', n.id), { unreadCount: 0 }),
//       );
//       await batch.commit();
//     } catch (e) {
//       console.error('Mark all read error:', e);
//     }
//   }, [notifications]);

//   // ── Group ─────────────────────────────────────────────────────────────────
//   const GROUPS = ['Today', 'Yesterday', 'Earlier'];
//   const grouped = GROUPS.reduce((acc, g) => {
//     acc[g] = notifications.filter((n) => getGroup(n.updatedAt) === g);
//     return acc;
//   }, {});

//   const totalUnread = notifications.reduce((sum, n) => sum + (n.unreadCount ?? 0), 0);

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Hero */}
//         <LinearGradient
//           colors={['#0A4F4E', '#0D7B7A']}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//           style={styles.hero}
//         >
//           <View style={styles.heroTopBar}>
//             <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
//               <Icon name="arrow-left" size={18} color="#FFFFFF" />
//             </TouchableOpacity>
//             <Text style={styles.heroScreenTitle}>Notifications</Text>
//             <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.8}>
//               <Icon name="check" size={14} color="#FFFFFF" />
//             </TouchableOpacity>
//           </View>

//           <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: heroSlide }] }]}>
//             <View style={styles.bellIconWrap}>
//               <Icon name="bell" size={32} color="#FFFFFF" />
//               {totalUnread > 0 && (
//                 <View style={styles.heroBadge}>
//                   <Text style={styles.heroBadgeText}>{totalUnread}</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={styles.heroSubtitle}>
//               Expert replies aur important updates yahan dikhenge.
//             </Text>
//             <View style={styles.metaRow}>
//               <View style={styles.metaBadge}>
//                 <Icon name="bell" size={11} color="#0D7B7A" />
//                 <Text style={styles.metaBadgeText}>{totalUnread} Unread</Text>
//               </View>
//               <View style={styles.metaBadge}>
//                 <Icon name="list" size={11} color="#0D7B7A" />
//                 <Text style={styles.metaBadgeText}>{notifications.length} Chats</Text>
//               </View>
//             </View>
//           </Animated.View>
//         </LinearGradient>

//         {/* Loading */}
//         {loading && (
//           <View style={styles.loadingWrap}>
//             <ActivityIndicator size="large" color="#0D7B7A" />
//             <Text style={styles.loadingText}>Loading notifications…</Text>
//           </View>
//         )}

//         {/* Grouped cards */}
//         {!loading && notifications.length > 0 &&
//           GROUPS.map((group, idx) => {
//             const items = grouped[group];
//             if (!items?.length) return null;
//             return (
//               <GroupCard
//                 key={group}
//                 group={group}
//                 items={items}
//                 onPress={handleNotifPress}
//                 animStyle={{
//                   opacity: fadeAnim,
//                   transform: [{ translateY: slideAnims[idx] ?? slideAnims[2] }],
//                 }}
//               />
//             );
//           })
//         }

//         {/* Empty state */}
//         {!loading && notifications.length === 0 && (
//           <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
//             <View style={styles.emptyIconWrap}>
//               <Icon name="bell-off" size={32} color="#94A3B8" />
//             </View>
//             <Text style={styles.emptyTitle}>Koi notification nahi</Text>
//             <Text style={styles.emptySubtitle}>Jab expert reply karega, yahan dikhega.</Text>
//           </Animated.View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#EFF4F4' },
//   scrollContent: { paddingBottom: 56 },

//   hero: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
//   heroTopBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
//   backBtn: {
//     width: 36, height: 36, borderRadius: 12,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   heroScreenTitle: {
//     flex: 1, textAlign: 'center',
//     fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2,
//   },
//   markAllBtn: {
//     width: 36, height: 36, borderRadius: 12,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center', alignItems: 'center',
//   },
//   heroContent: { alignItems: 'center' },
//   bellIconWrap: {
//     width: 64, height: 64, borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center', alignItems: 'center',
//     marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
//   },
//   heroBadge: {
//     position: 'absolute', top: -4, right: -4,
//     minWidth: 18, height: 18, borderRadius: 9,
//     backgroundColor: '#EF4444',
//     justifyContent: 'center', alignItems: 'center',
//     paddingHorizontal: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
//   },
//   heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
//   heroSubtitle: {
//     fontSize: 13, color: 'rgba(255,255,255,0.78)',
//     textAlign: 'center', lineHeight: 20,
//     fontWeight: '500', paddingHorizontal: 8,
//   },
//   metaRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
//   metaBadge: {
//     flexDirection: 'row', alignItems: 'center', gap: 5,
//     backgroundColor: '#FFFFFF', paddingHorizontal: 11,
//     paddingVertical: 5, borderRadius: 20,
//   },
//   metaBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

//   groupCard: {
//     backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
//     borderRadius: 20, borderWidth: 1, borderColor: '#E0F2F1',
//     shadowColor: '#0D7B7A', shadowOpacity: 0.05,
//     shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
//     elevation: 3, overflow: 'hidden',
//   },
//   groupLabelRow: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
//   },
//   groupLabel: {
//     fontSize: 12, fontWeight: '800', color: '#94A3B8',
//     letterSpacing: 0.6, textTransform: 'uppercase',
//   },
//   groupBadge: {
//     backgroundColor: '#F0FDFA', borderRadius: 20,
//     paddingHorizontal: 8, paddingVertical: 2,
//     borderWidth: 1, borderColor: '#CCEFED',
//   },
//   groupBadgeText: { fontSize: 11, fontWeight: '700', color: '#0D7B7A' },

//   notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
//   notifRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F9FF' },
//   notifIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
//   notifTextWrap: { flex: 1 },
//   notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
//   notifTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', flex: 1, marginRight: 8 },
//   notifTitleUnread: { fontWeight: '800', color: '#0F172A' },
//   notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
//   notifCategory: { fontSize: 11, color: '#0D7B7A', fontWeight: '600', marginBottom: 3 },
//   notifMessage: { fontSize: 12, color: '#94A3B8', lineHeight: 18, fontWeight: '400' },
//   unreadBadge: {
//     minWidth: 20, height: 20, borderRadius: 10,
//     backgroundColor: '#0D7B7A',
//     justifyContent: 'center', alignItems: 'center',
//     paddingHorizontal: 5, marginTop: 4,
//   },
//   unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

//   loadingWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
//   loadingText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

//   emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
//   emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
//   emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
//   emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '400', textAlign: 'center' },
// });


/**
 * NotificationScreen.jsx
 *
 * Fetches real-time notifications from Firestore.
 * Shows chats where the expert has sent unread replies to the current user.
 *
 * Firestore structure (chats collection):
 *   chats/{chatId}
 *     - userId       : string    — the logged-in user's UID
 *     - expertId     : string    — the expert's UID
 *     - expertName   : string    — display name of the expert
 *     - categoryName : string    — e.g. "MEDICAL ADVISORY COMMITTEE"
 *     - lastMessage  : string    — last message text / "📷 Image" / "🎤 Voice message"
 *     - updatedAt    : Timestamp — last activity timestamp
 *     - unreadCount  : number    — messages not yet read by the user
 *     - userName     : string    — display name of the user
 *     - isActive     : boolean
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {
  getFirestore, collection, query, where,
  onSnapshot, doc, updateDoc, writeBatch,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ─── Utility: human-readable timestamp ───────────────────────────────────────
const timeAgo = (ts) => {
  if (!ts?.toDate) return '';
  const diffSecs = Math.floor((Date.now() - ts.toDate()) / 1000);
  if (diffSecs < 60)     return 'Just now';
  if (diffSecs < 3600)   return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400)  return `${Math.floor(diffSecs / 3600)}h ago`;
  if (diffSecs < 172800) return 'Yesterday';
  return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Utility: determine display group from timestamp ─────────────────────────
const getGroup = (ts) => {
  if (!ts?.toDate) return 'Earlier';
  const diffMs = Date.now() - ts.toDate();
  if (diffMs < 86400000)  return 'Today';
  if (diffMs < 172800000) return 'Yesterday';
  return 'Earlier';
};

// ─── Utility: icon + color based on last message type ────────────────────────
const getMessageStyle = (lastMessage = '') => {
  if (lastMessage.startsWith('📷'))
    return { icon: 'image',          iconColor: '#7C3AED', iconBg: '#F5F3FF' };
  if (lastMessage.startsWith('🎤'))
    return { icon: 'mic',            iconColor: '#D97706', iconBg: '#FFFBEB' };
  return   { icon: 'message-circle', iconColor: '#0D7B7A', iconBg: '#F0FDFA' };
};

// ─── Single notification row ──────────────────────────────────────────────────
const NotifRow = React.memo(({ item, isLast, onPress }) => {
  const msgStyle = getMessageStyle(item.lastMessage);
  const isUnread = (item.unreadCount ?? 0) > 0;

  return (
    <TouchableOpacity
      style={[styles.notifRow, !isLast && styles.notifRowBorder]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      {/* Message type icon */}
      <View style={[styles.notifIconWrap, { backgroundColor: msgStyle.iconBg }]}>
        <Icon name={msgStyle.icon} size={16} color={msgStyle.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.notifTextWrap}>
        <View style={styles.notifTitleRow}>
          <Text
            style={[styles.notifTitle, isUnread && styles.notifTitleUnread]}
            numberOfLines={1}
          >
            {item.expertName || 'Expert'}
          </Text>
          <Text style={styles.notifTime}>{timeAgo(item.updatedAt)}</Text>
        </View>

        {/* Category label */}
        {!!item.categoryName && (
          <Text style={styles.notifCategory} numberOfLines={1}>
            {item.categoryName}
          </Text>
        )}

        {/* Last message preview */}
        <Text style={styles.notifMessage} numberOfLines={2}>
          {item.lastMessage || 'Sent you a reply'}
        </Text>
      </View>

      {/* Unread count badge */}
      {isUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Grouped notification card ────────────────────────────────────────────────
const GroupCard = React.memo(({ group, items, animStyle, onPress }) => {
  const newCount = items.filter((i) => (i.unreadCount ?? 0) > 0).length;

  return (
    <Animated.View style={[styles.groupCard, animStyle]}>
      {/* Group header */}
      <View style={styles.groupLabelRow}>
        <Text style={styles.groupLabel}>{group}</Text>
        {newCount > 0 && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{newCount} new</Text>
          </View>
        )}
      </View>

      {/* Notification rows */}
      {items.map((item, idx) => (
        <NotifRow
          key={item.id}
          item={item}
          isLast={idx === items.length - 1}
          onPress={onPress}
        />
      ))}
    </Animated.View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const heroSlide  = useRef(new Animated.Value(-16)).current;
  const slideAnims = useRef([0, 1, 2].map(() => new Animated.Value(20))).current;
  const isMounted  = useRef(true);

  const uid = auth().currentUser?.uid;

  // Prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Firestore real-time listener ──────────────────────────────────────────
  // Uses a single `where` clause to avoid requiring a composite index.
  // Sorting and filtering are done in JavaScript after the snapshot arrives.
  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const db = getFirestore();

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted.current) return;

        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // Only show chats with unread messages from the expert
          .filter((chat) => (chat.unreadCount ?? 0) > 0)
          // Sort by most recently updated first
          .sort((a, b) => {
            const timeA = a.updatedAt?.toDate?.() ?? new Date(0);
            const timeB = b.updatedAt?.toDate?.() ?? new Date(0);
            return timeB - timeA;
          });

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error('Notifications fetch error:', error);
        if (!isMounted.current) return;
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  // ── Run entrance animations once data has loaded ──────────────────────────
  useEffect(() => {
    if (loading) return;

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
    ]).start();

    slideAnims.forEach((anim, i) =>
      Animated.spring(anim, {
        toValue: 0, tension: 68, friction: 14,
        delay: 80 + i * 60, useNativeDriver: true,
      }).start(),
    );
  }, [loading]);

  // ── Mark a single notification as read, then open the chat ───────────────
  const handleNotifPress = useCallback(async (item) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'chats', item.id), { unreadCount: 0 });
    } catch (error) {
      console.error('Failed to reset unread count:', error);
    }
    navigation.navigate('Chat', {
      chatId    : item.id,
      expertName: item.expertName,
      expertId  : item.expertId,
    });
  }, [navigation]);

  // ── Mark all notifications as read in a single batch write ───────────────
  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => (n.unreadCount ?? 0) > 0);
    if (!unread.length) return;

    try {
      const db    = getFirestore();
      const batch = writeBatch(db);
      unread.forEach((n) =>
        batch.update(doc(db, 'chats', n.id), { unreadCount: 0 }),
      );
      await batch.commit();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [notifications]);

  // ── Group notifications by time period ───────────────────────────────────
  const GROUPS = ['Today', 'Yesterday', 'Earlier'];
  const grouped = GROUPS.reduce((acc, group) => {
    acc[group] = notifications.filter((n) => getGroup(n.updatedAt) === group);
    return acc;
  }, {});

  const totalUnread = notifications.reduce((sum, n) => sum + (n.unreadCount ?? 0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero header ── */}
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Top navigation bar */}
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.heroScreenTitle}>Notifications</Text>

            {/* Mark all as read button */}
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.8}
            >
              <Icon name="check" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Animated hero content */}
          <Animated.View
            style={[
              styles.heroContent,
              { opacity: fadeAnim, transform: [{ translateY: heroSlide }] },
            ]}
          >
            {/* Bell icon with unread badge */}
            <View style={styles.bellIconWrap}>
              <Icon name="bell" size={32} color="#FFFFFF" />
              {totalUnread > 0 && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{totalUnread}</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroSubtitle}>
              Stay updated with expert replies and important alerts.
            </Text>

            {/* Summary badges */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Icon name="bell" size={11} color="#0D7B7A" />
                <Text style={styles.metaBadgeText}>{totalUnread} Unread</Text>
              </View>
              <View style={styles.metaBadge}>
                <Icon name="list" size={11} color="#0D7B7A" />
                <Text style={styles.metaBadgeText}>{notifications.length} Chats</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Loading indicator ── */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0D7B7A" />
            <Text style={styles.loadingText}>Loading notifications…</Text>
          </View>
        )}

        {/* ── Grouped notification cards ── */}
        {!loading && notifications.length > 0 &&
          GROUPS.map((group, idx) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <GroupCard
                key={group}
                group={group}
                items={items}
                onPress={handleNotifPress}
                animStyle={{
                  opacity  : fadeAnim,
                  transform: [{ translateY: slideAnims[idx] ?? slideAnims[2] }],
                }}
              />
            );
          })
        }

        {/* ── Empty state ── */}
        {!loading && notifications.length === 0 && (
          <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconWrap}>
              <Icon name="bell-off" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! You'll be notified when an expert replies.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#EFF4F4' },
  scrollContent: { paddingBottom: 56 },

  // Hero
  hero        : { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  heroTopBar  : { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backBtn     : {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroScreenTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2,
  },
  markAllBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroContent : { alignItems: 'center' },
  bellIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  heroSubtitle : {
    fontSize: 13, color: 'rgba(255,255,255,0.78)',
    textAlign: 'center', lineHeight: 20,
    fontWeight: '500', paddingHorizontal: 8,
  },
  metaRow  : { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
  },
  metaBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

  // Group card
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3, overflow: 'hidden',
  },
  groupLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  groupLabel: {
    fontSize: 12, fontWeight: '800', color: '#94A3B8',
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  groupBadge: {
    backgroundColor: '#F0FDFA', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#CCEFED',
  },
  groupBadgeText: { fontSize: 11, fontWeight: '700', color: '#0D7B7A' },

  // Notification row
  notifRow      : { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  notifRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F9FF' },
  notifIconWrap : { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  notifTextWrap : { flex: 1 },
  notifTitleRow : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  notifTitle    : { fontSize: 13, fontWeight: '600', color: '#64748B', flex: 1, marginRight: 8 },
  notifTitleUnread: { fontWeight: '800', color: '#0F172A' },
  notifTime     : { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  notifCategory : { fontSize: 11, color: '#0D7B7A', fontWeight: '600', marginBottom: 3 },
  notifMessage  : { fontSize: 12, color: '#94A3B8', lineHeight: 18, fontWeight: '400' },
  unreadBadge   : {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#0D7B7A',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, marginTop: 4,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  // Loading
  loadingWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  loadingText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  // Empty state
  emptyWrap    : { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle   : { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '400', textAlign: 'center' },
});