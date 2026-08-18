// // // // import React, {
// // // //   useEffect, useState, useCallback, useMemo, useRef, memo,
// // // // } from 'react';
// // // // import {
// // // //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// // // //   StatusBar, RefreshControl, Modal,
// // // //   Animated, Platform, Dimensions,
// // // // } from 'react-native';
// // // // import LinearGradient from 'react-native-linear-gradient';
// // // // import {
// // // //   getFirestore, collection, query, where,
// // // //   onSnapshot, doc, updateDoc, orderBy,
// // // // } from '@react-native-firebase/firestore';
// // // // import auth from '@react-native-firebase/auth';
// // // // import { useDispatch } from 'react-redux';
// // // // import { logout } from '../../store/slices/authSlice';
// // // // import Icon     from 'react-native-vector-icons/Ionicons';
// // // // import MatIcon  from 'react-native-vector-icons/MaterialCommunityIcons';

// // // // const { width: SW } = Dimensions.get('window');

// // // // // ─── Constants ────────────────────────────────────────────────────────────────
// // // // const TABS = [
// // // //   { key: 'pending',   label: 'Pending',   icon: 'time-outline'       },
// // // //   { key: 'active',    label: 'Active',    icon: 'chatbubbles-outline' },
// // // //   { key: 'broadcast', label: 'Broadcast', icon: 'megaphone-outline'  },
// // // //   { key: 'closed',    label: 'Closed',    icon: 'lock-closed-outline' },
// // // // ];

// // // // const AVATAR_COLORS = [
// // // //   '#2563EB','#7C3AED','#DB2777',
// // // //   '#059669','#D97706','#DC2626','#0891B2',
// // // // ];
// // // // const getColor    = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
// // // // const getInitials = (name) => {
// // // //   if (!name) return '?';
// // // //   const p = name.trim().split(' ');
// // // //   return p.length >= 2 ? p[0][0].toUpperCase() + p[1][0].toUpperCase() : p[0][0].toUpperCase();
// // // // };
// // // // const formatTime = (ts) => {
// // // //   if (!ts?.toDate) return '';
// // // //   const d = ts.toDate(), diff = Date.now() - d.getTime();
// // // //   if (diff < 60_000)     return 'Just now';
// // // //   if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
// // // //   if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
// // // //   return d.toLocaleDateString('en-IN');
// // // // };

// // // // // ─── SkeletonBox ──────────────────────────────────────────────────────────────
// // // // const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
// // // //   const anim = useRef(new Animated.Value(0.4)).current;
// // // //   useEffect(() => {
// // // //     Animated.loop(Animated.sequence([
// // // //       Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
// // // //       Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
// // // //     ])).start();
// // // //   }, [anim]);
// // // //   return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: anim }, style]} />;
// // // // });

// // // // // ─── ProfileCard ──────────────────────────────────────────────────────────────
// // // // const ProfileCard = memo(({ profile }) => (
// // // //   <View style={styles.profileCard}>
// // // //     <View style={styles.profileInfo}>
// // // //       <Text style={styles.profileCategory}>
// // // //         {profile?.categoryName || 'No Category'}
// // // //         {profile?.subcategoryName ? `  ·  ${profile.subcategoryName}` : ''}
// // // //       </Text>
// // // //       <View style={styles.profileMetaRow}>
// // // //         <MatIcon name="school-outline" size={13} color="#7C3AED" />
// // // //         <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
// // // //       </View>
// // // //       {!!profile?.experience && (
// // // //         <View style={styles.profileMetaRow}>
// // // //           <MatIcon name="briefcase-outline" size={13} color="#7C3AED" />
// // // //           <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
// // // //         </View>
// // // //       )}
// // // //     </View>
// // // //     <View style={[styles.statusPill, { backgroundColor: profile?.isActive === false ? '#FEE2E2' : '#D1FAE5' }]}>
// // // //       <View style={[styles.statusDot, { backgroundColor: profile?.isActive === false ? '#DC2626' : '#10B981' }]} />
// // // //       <Text style={[styles.statusPillText, { color: profile?.isActive === false ? '#DC2626' : '#065F46' }]}>
// // // //         {profile?.isActive === false ? 'Inactive' : 'Active'}
// // // //       </Text>
// // // //     </View>
// // // //   </View>
// // // // ));

// // // // // ─── TabButton ────────────────────────────────────────────────────────────────
// // // // const TabButton = memo(({ tab, isActive, count, onPress }) => {
// // // //   const isBcast = tab.key === 'broadcast';
// // // //   return (
// // // //     <TouchableOpacity
// // // //       style={[
// // // //         styles.tab,
// // // //         isActive && styles.tabActive,
// // // //         isBcast && styles.tabBroadcast,
// // // //         isBcast && isActive && styles.tabBroadcastActive,
// // // //       ]}
// // // //       onPress={() => onPress(tab.key)}
// // // //       activeOpacity={0.75}
// // // //     >
// // // //       <Icon
// // // //         name={tab.icon}
// // // //         size={14}
// // // //         color={isBcast ? (isActive ? '#D97706' : '#94A3B8') : (isActive ? '#7C3AED' : '#94A3B8')}
// // // //       />
// // // //       <Text style={[
// // // //         styles.tabText,
// // // //         isActive && (isBcast ? styles.tabTextBroadcast : styles.tabTextActive),
// // // //       ]}>
// // // //         {tab.label}
// // // //       </Text>
// // // //       {count > 0 && (
// // // //         <View style={[
// // // //           styles.tabBadge,
// // // //           isActive && (isBcast ? styles.tabBadgeBroadcastActive : styles.tabBadgeActive),
// // // //         ]}>
// // // //           <Text style={[
// // // //             styles.tabBadgeText,
// // // //             isActive && (isBcast ? { color: '#92400E' } : styles.tabBadgeTextActive),
// // // //           ]}>{count}</Text>
// // // //         </View>
// // // //       )}
// // // //     </TouchableOpacity>
// // // //   );
// // // // });

// // // // // ─── NormalChatCard ───────────────────────────────────────────────────────────
// // // // const NormalChatCard = memo(({ item, onPress }) => {
// // // //   const isNew = !item.expertAccepted && item.isActive;
// // // //   return (
// // // //     <TouchableOpacity style={styles.chatCard} onPress={() => onPress(item)} activeOpacity={0.85}>
// // // //       <View style={[styles.chatAvatar, { backgroundColor: getColor(item.userName) }]}>
// // // //         <Text style={styles.chatAvatarText}>{getInitials(item.userName)}</Text>
// // // //         <View style={[styles.chatStatusDot, { backgroundColor: item.isActive ? '#10B981' : '#CBD5E1' }]} />
// // // //       </View>
// // // //       <View style={styles.chatContent}>
// // // //         <View style={styles.chatTopRow}>
// // // //           <Text style={styles.chatUser} numberOfLines={1}>{item.userName || 'User'}</Text>
// // // //           <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
// // // //         </View>
// // // //         <View style={styles.chatBottomRow}>
// // // //           <Text style={styles.chatLast} numberOfLines={1}>
// // // //             {item.lastMessage || 'No message yet'}
// // // //           </Text>
// // // //           {isNew && (
// // // //             <View style={styles.newBadge}>
// // // //               <Text style={styles.newBadgeText}>NEW</Text>
// // // //             </View>
// // // //           )}
// // // //         </View>
// // // //         {!!item.categoryName && (
// // // //           <View style={styles.categoryPill}>
// // // //             <MatIcon name="tag-outline" size={10} color="#7C3AED" />
// // // //             <Text style={styles.categoryText}>{item.categoryName}</Text>
// // // //           </View>
// // // //         )}
// // // //       </View>
// // // //       <Icon name="chevron-forward" size={16} color="#CBD5E1" />
// // // //     </TouchableOpacity>
// // // //   );
// // // // });

// // // // // ─── BroadcastCard — rich card with inline Reply action ───────────────────────
// // // // const BroadcastCard = memo(({ item, onReply }) => {
// // // //   const expertCount = item.expertIds?.length ?? 0;

// // // //   return (
// // // //     <View style={styles.bcastCard}>
// // // //       {/* Amber left stripe */}
// // // //       <View style={styles.bcastStripe} />

// // // //       <View style={styles.bcastBody}>
// // // //         {/* Top row: avatar + user info + time */}
// // // //         <View style={styles.bcastTopRow}>
// // // //           <View style={[styles.bcastAvatar, { backgroundColor: getColor(item.userName) }]}>
// // // //             <Text style={styles.bcastAvatarText}>{getInitials(item.userName)}</Text>
// // // //             {item.isActive && (
// // // //               <View style={styles.bcastAvatarDot} />
// // // //             )}
// // // //           </View>
// // // //           <View style={styles.bcastUserInfo}>
// // // //             <Text style={styles.bcastUserName} numberOfLines={1}>{item.userName || 'User'}</Text>
// // // //             <Text style={styles.bcastTime}>{formatTime(item.updatedAt)}</Text>
// // // //           </View>
// // // //           {/* Broadcast pill */}
// // // //           <View style={styles.bcastPill}>
// // // //             <Icon name="megaphone-outline" size={10} color="#92400E" />
// // // //             <Text style={styles.bcastPillText}>Broadcast</Text>
// // // //           </View>
// // // //         </View>

// // // //         {/* Last message preview */}
// // // //         <View style={styles.bcastMsgRow}>
// // // //           <Text style={styles.bcastMsgText} numberOfLines={1}>
// // // //             {item.lastMessage || 'Tap Reply to respond to this broadcast'}
// // // //           </Text>
// // // //         </View>

// // // //         {/* Footer: expert count + Reply CTA */}
// // // //         <View style={styles.bcastFooter}>
// // // //           <View style={styles.bcastExpertCountWrap}>
// // // //             <MatIcon name="account-group-outline" size={13} color="#D97706" />
// // // //             <Text style={styles.bcastExpertCountText}>
// // // //               {expertCount} expert{expertCount !== 1 ? 's' : ''} receiving
// // // //             </Text>
// // // //           </View>
// // // //           {/* Inline Reply button — no modal needed for broadcast */}
// // // //           <TouchableOpacity
// // // //             style={styles.bcastReplyBtn}
// // // //             onPress={() => onReply(item)}
// // // //             activeOpacity={0.82}
// // // //           >
// // // //             <LinearGradient
// // // //               colors={['#F59E0B', '#D97706']}
// // // //               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
// // // //               style={styles.bcastReplyGrad}
// // // //             >
// // // //               <Icon name="chatbubble-ellipses-outline" size={14} color="#FFFFFF" />
// // // //               <Text style={styles.bcastReplyText}>Reply</Text>
// // // //             </LinearGradient>
// // // //           </TouchableOpacity>
// // // //         </View>
// // // //       </View>
// // // //     </View>
// // // //   );
// // // // });

// // // // // ─── ChatDetailModal (Normal chats only) ──────────────────────────────────────
// // // // const ChatDetailModal = memo(({ chat, onClose, onAccept, onOpen }) => {
// // // //   if (!chat) return null;

// // // //   const rows = [
// // // //     { label: 'Last Message', value: chat.lastMessage || '—', icon: 'chat-outline' },
// // // //     {
// // // //       label: 'Started',
// // // //       value: chat.createdAt?.toDate ? chat.createdAt.toDate().toLocaleDateString('en-IN') : '—',
// // // //       icon: 'calendar-outline',
// // // //     },
// // // //     { label: 'Last Active', value: formatTime(chat.updatedAt), icon: 'clock-outline' },
// // // //   ];

// // // //   const statusLabel = chat.expertAccepted ? 'Active' : chat.isActive ? 'Pending' : 'Closed';
// // // //   const statusColor = chat.expertAccepted ? '#10B981' : chat.isActive ? '#F59E0B' : '#94A3B8';
// // // //   const statusBg    = chat.expertAccepted ? '#D1FAE5' : chat.isActive ? '#FEF3C7' : '#F1F5F9';

// // // //   return (
// // // //     <View style={styles.modalOverlay}>
// // // //       <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
// // // //       <View style={styles.modalBox}>
// // // //         <View style={styles.modalHandle} />

// // // //         <View style={styles.modalHeader}>
// // // //           <View style={[styles.modalAvatar, { backgroundColor: getColor(chat.userName) }]}>
// // // //             <Text style={styles.modalAvatarText}>{getInitials(chat.userName)}</Text>
// // // //           </View>
// // // //           <Text style={styles.modalUserName}>{chat.userName || 'User'}</Text>
// // // //           <View style={[styles.statusPill, { backgroundColor: statusBg, marginTop: 6 }]}>
// // // //             <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
// // // //             <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
// // // //           </View>
// // // //         </View>

// // // //         <View style={styles.modalSection}>
// // // //           {rows.map(({ label, value, icon }, idx) => (
// // // //             <View key={label}>
// // // //               <View style={styles.modalRow}>
// // // //                 <View style={styles.modalRowLeft}>
// // // //                   <MatIcon name={icon} size={15} color="#94A3B8" />
// // // //                   <Text style={styles.modalLabel}>{label}</Text>
// // // //                 </View>
// // // //                 <Text style={styles.modalValue} numberOfLines={2}>{value}</Text>
// // // //               </View>
// // // //               {idx < rows.length - 1 && <View style={styles.modalDivider} />}
// // // //             </View>
// // // //           ))}
// // // //         </View>

// // // //         {/* Pending → Accept & auto-open */}
// // // //         {!chat.expertAccepted && chat.isActive && (
// // // //           <TouchableOpacity style={[styles.actionBtn, styles.actionAccept]} onPress={() => onAccept(chat.id)}>
// // // //             <Icon name="checkmark-circle-outline" size={18} color="#065F46" />
// // // //             <Text style={[styles.actionBtnText, { color: '#065F46' }]}>Accept & Reply</Text>
// // // //           </TouchableOpacity>
// // // //         )}

// // // //         {/* Active → Open */}
// // // //         {chat.expertAccepted && chat.isActive && (
// // // //           <TouchableOpacity style={[styles.actionBtn, styles.actionOpen]} onPress={() => onOpen(chat)}>
// // // //             <Icon name="chatbubble-outline" size={18} color="#2563EB" />
// // // //             <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Open Chat</Text>
// // // //           </TouchableOpacity>
// // // //         )}

// // // //         <TouchableOpacity style={[styles.actionBtn, styles.actionClose]} onPress={onClose}>
// // // //           <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Dismiss</Text>
// // // //         </TouchableOpacity>

// // // //         <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
// // // //       </View>
// // // //     </View>
// // // //   );
// // // // });

// // // // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // // // export default function ExpertDashboard({ navigation }) {
// // // //   const dispatch = useDispatch();

// // // //   // ── FlatList ref for scroll-to-top fix ────────────────────────────────────
// // // //   const flatListRef = useRef(null);

// // // //   const [profile,        setProfile]        = useState(null);
// // // //   const [chats,          setChats]          = useState([]);
// // // //   const [broadcastChats, setBroadcastChats] = useState([]);
// // // //   const [loading,        setLoading]        = useState(true);
// // // //   const [refreshing,     setRefreshing]     = useState(false);
// // // //   const [activeTab,      setActiveTab]      = useState('pending');
// // // //   const [selectedChat,   setSelectedChat]   = useState(null);
// // // //   const [error,          setError]          = useState(null);

// // // //   const db  = useMemo(() => getFirestore(), []);
// // // //   const uid = useMemo(() => auth().currentUser?.uid, []);

// // // //   // ── FIX: Scroll to top when user navigates back to this screen ────────────
// // // //   useEffect(() => {
// // // //     const unsubscribe = navigation?.addListener('focus', () => {
// // // //       flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// // // //     });
// // // //     return unsubscribe;
// // // //   }, [navigation]);

// // // //   // ── FIX: Scroll to top when tab changes ───────────────────────────────────
// // // //   useEffect(() => {
// // // //     flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// // // //   }, [activeTab]);

// // // //   // ── Profile ───────────────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     if (!uid) return;
// // // //     return onSnapshot(
// // // //       doc(db, 'users', uid),
// // // //       (snap) => { if (snap.exists()) setProfile(snap.data()); },
// // // //       (err) => { console.error('Profile:', err); setError('Failed to load profile.'); },
// // // //     );
// // // //   }, [db, uid]);

// // // //   // ── Normal chats ──────────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     if (!uid) return;
// // // //     return onSnapshot(
// // // //       query(collection(db, 'chats'), where('expertId', '==', uid), orderBy('updatedAt', 'desc')),
// // // //       (snap) => { setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
// // // //       (err) => { console.error('Chats:', err); setError('Failed to load chats.'); setLoading(false); },
// // // //     );
// // // //   }, [db, uid]);

// // // //   // ── Broadcast chats ───────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     if (!uid) return;
// // // //     return onSnapshot(
// // // //       query(collection(db, 'broadcastChats'), where('expertIds', 'array-contains', uid)),
// // // //       (snap) => {
// // // //         setBroadcastChats(
// // // //           snap.docs
// // // //             .map((d) => ({ id: d.id, ...d.data() }))
// // // //             .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
// // // //         );
// // // //       },
// // // //       (err) => { console.error('BroadcastChats:', err); },
// // // //     );
// // // //   }, [db, uid]);

// // // //   // ── Derived ───────────────────────────────────────────────────────────────
// // // //   const pendingChats = useMemo(() => chats.filter((c) =>  c.isActive && !c.expertAccepted), [chats]);
// // // //   const activeChats  = useMemo(() => chats.filter((c) =>  c.isActive &&  c.expertAccepted), [chats]);
// // // //   const closedChats  = useMemo(() => chats.filter((c) => !c.isActive), [chats]);

// // // //   const tabData = useMemo(() => ({
// // // //     pending:   pendingChats,
// // // //     active:    activeChats,
// // // //     broadcast: broadcastChats,
// // // //     closed:    closedChats,
// // // //   }), [pendingChats, activeChats, broadcastChats, closedChats]);

// // // //   const tabCounts = useMemo(() => ({
// // // //     pending:   pendingChats.length,
// // // //     active:    activeChats.length,
// // // //     broadcast: broadcastChats.length,
// // // //     closed:    closedChats.length,
// // // //   }), [pendingChats.length, activeChats.length, broadcastChats.length, closedChats.length]);

// // // //   // ── Navigate to chat ───────────────────────────────────────────────────────
// // // //   const navigateToChat = useCallback((chat, isBroadcast = false) => {
// // // //     navigation?.navigate('Chats', {
// // // //       screen: 'ExpertReplyChat',
// // // //       params: {
// // // //         chatId         : chat.id,
// // // //         userName       : chat.userName,
// // // //         isBroadcast    : !!isBroadcast,
// // // //         subcategoryName: chat.subcategoryName ?? '',
// // // //         categoryName   : chat.categoryName    ?? '',
// // // //         expertIds      : chat.expertIds       ?? [],
// // // //       },
// // // //     });
// // // //   }, [navigation]);

// // // //   // ── Accept & immediately open ─────────────────────────────────────────────
// // // //   const handleAcceptChat = useCallback(async (chatId) => {
// // // //     try {
// // // //       await updateDoc(doc(db, 'chats', chatId), { expertAccepted: true });
// // // //       setSelectedChat(null);
// // // //       const chat = chats.find((c) => c.id === chatId);
// // // //       if (chat) navigateToChat({ ...chat, expertAccepted: true }, false);
// // // //     } catch (e) { console.error('Accept error:', e); }
// // // //   }, [db, chats, navigateToChat]);

// // // //   // ── Open normal active chat ───────────────────────────────────────────────
// // // //   const handleOpenChat = useCallback((chat) => {
// // // //     setSelectedChat(null);
// // // //     navigateToChat(chat, false);
// // // //   }, [navigateToChat]);

// // // //   // ── Broadcast: direct reply (no modal) ───────────────────────────────────
// // // //   const handleBroadcastReply = useCallback((chat) => {
// // // //     navigateToChat(chat, true);
// // // //   }, [navigateToChat]);

// // // //   // ── Normal card press → modal ─────────────────────────────────────────────
// // // //   const handleChatPress  = useCallback((chat) => setSelectedChat(chat), []);
// // // //   const handleModalClose = useCallback(() => setSelectedChat(null), []);

// // // //   const handleLogout = useCallback(async () => {
// // // //     try { await auth().signOut(); dispatch(logout()); }
// // // //     catch (e) { console.error('Logout:', e); }
// // // //   }, [dispatch]);

// // // //   const handleTabPress = useCallback((key) => setActiveTab(key), []);
// // // //   const onRefresh      = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }, []);
// // // //   const keyExtractor   = useCallback((item) => item.id, []);

// // // //   // ── renderItem — broadcast tab uses BroadcastCard, others NormalChatCard ──
// // // //   const renderItem = useCallback(({ item }) => {
// // // //     if (activeTab === 'broadcast') {
// // // //       return <BroadcastCard item={item} onReply={handleBroadcastReply} />;
// // // //     }
// // // //     return <NormalChatCard item={item} onPress={handleChatPress} />;
// // // //   }, [activeTab, handleBroadcastReply, handleChatPress]);

// // // //   const renderTabsHeader = useCallback(() => (
// // // //     <View style={styles.tabRow}>
// // // //       {TABS.map((tab) => (
// // // //         <TabButton
// // // //           key={tab.key}
// // // //           tab={tab}
// // // //           isActive={activeTab === tab.key}
// // // //           count={tabCounts[tab.key]}
// // // //           onPress={handleTabPress}
// // // //         />
// // // //       ))}
// // // //     </View>
// // // //   ), [activeTab, tabCounts, handleTabPress]);

// // // //   const ListHeaderComponent = useCallback(() => (
// // // //     <View>
// // // //       <ProfileCard profile={profile} />
// // // //       <Text style={styles.sectionLabel}>My Chats</Text>
// // // //       {renderTabsHeader()}
// // // //     </View>
// // // //   ), [profile, renderTabsHeader]);

// // // //   const ListEmptyComponent = useCallback(() => (
// // // //     <View style={styles.empty}>
// // // //       <View style={styles.emptyIconWrap}>
// // // //         <MatIcon
// // // //           name={
// // // //             activeTab === 'pending'   ? 'clock-time-four-outline' :
// // // //             activeTab === 'active'    ? 'chat-outline'            :
// // // //             activeTab === 'broadcast' ? 'bullhorn-outline'        :
// // // //             'lock-outline'
// // // //           }
// // // //           size={40}
// // // //           color={activeTab === 'broadcast' ? '#D97706' : '#CBD5E1'}
// // // //         />
// // // //       </View>
// // // //       <Text style={styles.emptyTitle}>
// // // //         {activeTab === 'pending'   ? 'No Pending Chats'      :
// // // //          activeTab === 'active'    ? 'No Active Chats'       :
// // // //          activeTab === 'broadcast' ? 'No Broadcast Requests' :
// // // //          'No Closed Chats'}
// // // //       </Text>
// // // //       <Text style={styles.emptySubtitle}>
// // // //         {activeTab === 'pending'   ? 'New chat requests will appear here'        :
// // // //          activeTab === 'active'    ? 'Accepted chats will appear here'           :
// // // //          activeTab === 'broadcast' ? 'Broadcast requests from users appear here' :
// // // //          'Completed chats will appear here'}
// // // //       </Text>
// // // //     </View>
// // // //   ), [activeTab]);

// // // //   // ── Loading ────────────────────────────────────────────────────────────────
// // // //   if (loading) {
// // // //     return (
// // // //       <View style={styles.container}>
// // // //         <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
// // // //         <View style={styles.header}>
// // // //           <View style={styles.headerLeft}>
// // // //             <SkeletonBox width={44} height={44} borderRadius={22} />
// // // //             <View style={{ gap: 6 }}>
// // // //               <SkeletonBox width={80}  height={12} />
// // // //               <SkeletonBox width={120} height={16} />
// // // //             </View>
// // // //           </View>
// // // //           <SkeletonBox width={72} height={34} borderRadius={20} />
// // // //         </View>
// // // //         <View style={{ padding: 16, gap: 12 }}>
// // // //           <SkeletonBox width="100%" height={120} borderRadius={16} />
// // // //           {[1,2,3].map((k) => <SkeletonBox key={k} width="100%" height={80} borderRadius={14} />)}
// // // //         </View>
// // // //       </View>
// // // //     );
// // // //   }

// // // //   if (error) {
// // // //     return (
// // // //       <View style={[styles.container, styles.centered]}>
// // // //         <MatIcon name="alert-circle-outline" size={52} color="#DC2626" />
// // // //         <Text style={styles.errorTitle}>Something went wrong</Text>
// // // //         <Text style={styles.errorSubtitle}>{error}</Text>
// // // //       </View>
// // // //     );
// // // //   }

// // // //   // ── Render ─────────────────────────────────────────────────────────────────
// // // //   return (
// // // //     <View style={styles.container}>
// // // //       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

// // // //       <View style={styles.header}>
// // // //         <View style={styles.headerLeft}>
// // // //           <View style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}>
// // // //             <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
// // // //           </View>
// // // //           <View>
// // // //             <Text style={styles.headerGreeting}>Welcome back 👋</Text>
// // // //             <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
// // // //           </View>
// // // //         </View>
// // // //         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
// // // //           <Icon name="log-out-outline" size={16} color="#DC2626" />
// // // //           <Text style={styles.logoutText}>Logout</Text>
// // // //         </TouchableOpacity>
// // // //       </View>

// // // //       <FlatList
// // // //         ref={flatListRef}                          // ✅ FIX: ref added
// // // //         data={tabData[activeTab]}
// // // //         keyExtractor={keyExtractor}
// // // //         renderItem={renderItem}
// // // //         ListHeaderComponent={ListHeaderComponent}
// // // //         ListEmptyComponent={ListEmptyComponent}
// // // //         ListFooterComponent={<View style={{ height: 48 }} />}
// // // //         showsVerticalScrollIndicator={false}
// // // //         refreshControl={
// // // //           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} tintColor="#7C3AED" />
// // // //         }
// // // //         initialNumToRender={8}
// // // //         maxToRenderPerBatch={8}
// // // //         windowSize={7}
// // // //         removeClippedSubviews={Platform.OS === 'android'}
// // // //         contentContainerStyle={styles.listContent}
// // // //       />

// // // //       {/* Modal only for normal chats */}
// // // //       <Modal
// // // //         visible={!!selectedChat}
// // // //         transparent
// // // //         animationType="slide"
// // // //         statusBarTranslucent
// // // //         onRequestClose={handleModalClose}
// // // //       >
// // // //         <ChatDetailModal
// // // //           chat={selectedChat}
// // // //           onClose={handleModalClose}
// // // //           onAccept={handleAcceptChat}
// // // //           onOpen={handleOpenChat}
// // // //         />
// // // //       </Modal>
// // // //     </View>
// // // //   );
// // // // }

// // // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // // const styles = StyleSheet.create({
// // // //   container  : { flex: 1, backgroundColor: '#F8FAFC' },
// // // //   centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
// // // //   listContent: { paddingBottom: 20 },

// // // //   // Header
// // // //   header: {
// // // //     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
// // // //     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
// // // //     paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
// // // //     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
// // // //     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
// // // //   },
// // // //   headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: 12 },
// // // //   headerAvatar    : { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
// // // //   headerAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
// // // //   headerGreeting  : { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
// // // //   headerName      : { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 1 },
// // // //   logoutBtn       : { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA' },
// // // //   logoutText      : { color: '#DC2626', fontWeight: '600', fontSize: 13 },

// // // //   // Profile card
// // // //   profileCard    : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 14 },
// // // //   profileInfo    : { flex: 1, gap: 7 },
// // // //   profileCategory: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
// // // //   profileMetaRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
// // // //   profileMeta    : { fontSize: 12, color: '#64748B', fontWeight: '500', flex: 1 },
// // // //   statusPill     : { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
// // // //   statusDot      : { width: 6, height: 6, borderRadius: 3 },
// // // //   statusPillText : { fontSize: 11, fontWeight: '700' },

// // // //   sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginLeft: 20, marginTop: 24, marginBottom: 12 },

// // // //   // Tabs
// // // //   tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 6 },
// // // //   tab   : { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: 'transparent' },
// // // //   tabActive           : { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' },
// // // //   tabBroadcast        : { backgroundColor: '#FFFBEB' },
// // // //   tabBroadcastActive  : { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
// // // //   tabText             : { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
// // // //   tabTextActive       : { color: '#7C3AED' },
// // // //   tabTextBroadcast    : { color: '#D97706' },
// // // //   tabBadge            : { backgroundColor: '#E2E8F0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
// // // //   tabBadgeActive      : { backgroundColor: '#DDD6FE' },
// // // //   tabBadgeBroadcastActive: { backgroundColor: '#FDE68A' },
// // // //   tabBadgeText        : { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
// // // //   tabBadgeTextActive  : { color: '#7C3AED' },

// // // //   // Normal chat card
// // // //   chatCard     : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 10, marginTop: 2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, gap: 12 },
// // // //   chatAvatar   : { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// // // //   chatAvatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
// // // //   chatStatusDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF' },
// // // //   chatContent  : { flex: 1, gap: 3 },
// // // //   chatTopRow   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
// // // //   chatBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
// // // //   chatUser     : { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
// // // //   chatLast     : { fontSize: 12, color: '#64748B', flex: 1 },
// // // //   chatTime     : { fontSize: 11, color: '#94A3B8' },
// // // //   newBadge     : { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
// // // //   newBadgeText : { fontSize: 9, fontWeight: '800', color: '#D97706', letterSpacing: 0.5 },
// // // //   categoryPill : { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
// // // //   categoryText : { fontSize: 10, color: '#7C3AED', fontWeight: '600' },

// // // //   // ── Broadcast Card ────────────────────────────────────────────────────────
// // // //   bcastCard: {
// // // //     flexDirection: 'row',
// // // //     marginHorizontal: 16, marginBottom: 12, marginTop: 2,
// // // //     borderRadius: 18,
// // // //     backgroundColor: '#FFFDF5',
// // // //     borderWidth: 1.5, borderColor: '#FDE68A',
// // // //     shadowColor: '#D97706', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
// // // //     elevation: 3,
// // // //     overflow: 'hidden',
// // // //   },
// // // //   bcastStripe: { width: 5, backgroundColor: '#F59E0B' },
// // // //   bcastBody  : { flex: 1, padding: 14, gap: 8 },

// // // //   bcastTopRow  : { flexDirection: 'row', alignItems: 'center', gap: 10 },
// // // //   bcastAvatar  : { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// // // //   bcastAvatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
// // // //   bcastAvatarDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFDF5' },
// // // //   bcastUserInfo: { flex: 1 },
// // // //   bcastUserName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
// // // //   bcastTime    : { fontSize: 11, color: '#94A3B8', marginTop: 1 },
// // // //   bcastPill    : { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
// // // //   bcastPillText: { fontSize: 10, fontWeight: '800', color: '#92400E' },

// // // //   bcastCatRow  : { flexDirection: 'row', alignItems: 'center', gap: 5 },
// // // //   bcastCatText : { fontSize: 12, color: '#D97706', fontWeight: '600', flex: 1 },

// // // //   bcastMsgRow  : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8E7', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
// // // //   bcastMsgText : { fontSize: 12, color: '#78716C', flex: 1 },

// // // //   bcastFooter       : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
// // // //   bcastExpertCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
// // // //   bcastExpertCountText: { fontSize: 11, color: '#D97706', fontWeight: '600' },

// // // //   bcastReplyBtn : { borderRadius: 12, overflow: 'hidden' },
// // // //   bcastReplyGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9 },
// // // //   bcastReplyText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

// // // //   // Empty
// // // //   emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
// // // //   empty        : { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
// // // //   emptyTitle   : { fontSize: 16, fontWeight: '700', color: '#64748B', marginBottom: 6 },
// // // //   emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

// // // //   // Error
// // // //   errorTitle   : { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 6 },
// // // //   errorSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

// // // //   // Modal
// // // //   modalOverlay   : { flex: 1, justifyContent: 'flex-end' },
// // // //   modalBackdrop  : { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
// // // //   modalBox       : { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
// // // //   modalHandle    : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
// // // //   modalHeader    : { alignItems: 'center', paddingBottom: 16 },
// // // //   modalAvatar    : { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
// // // //   modalAvatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
// // // //   modalUserName  : { fontSize: 20, fontWeight: '800', color: '#0F172A' },
// // // //   modalSection   : { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: '#F1F5F9' },
// // // //   modalRow       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
// // // //   modalRowLeft   : { flexDirection: 'row', alignItems: 'center', gap: 8 },
// // // //   modalLabel     : { fontSize: 13, color: '#64748B', fontWeight: '500' },
// // // //   modalValue     : { fontSize: 13, color: '#1E293B', fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
// // // //   modalDivider   : { height: 1, backgroundColor: '#F1F5F9' },
// // // //   actionBtn      : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 15, marginBottom: 10 },
// // // //   actionAccept   : { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
// // // //   actionOpen     : { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
// // // //   actionClose    : { backgroundColor: '#F1F5F9' },
// // // //   actionBtnText  : { fontSize: 15, fontWeight: '700' },
// // // // });


// // // import React, {
// // //   useEffect, useState, useCallback, useMemo, useRef, memo,
// // // } from 'react';
// // // import {
// // //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// // //   StatusBar, RefreshControl, Modal,
// // //   Animated, Platform, Dimensions,
// // // } from 'react-native';
// // // import LinearGradient from 'react-native-linear-gradient';
// // // import {
// // //   getFirestore, collection, query, where,
// // //   onSnapshot, doc, updateDoc, orderBy,
// // // } from '@react-native-firebase/firestore';
// // // import auth from '@react-native-firebase/auth';
// // // import { useDispatch } from 'react-redux';
// // // import { logout } from '../../store/slices/authSlice';
// // // import Icon from 'react-native-vector-icons/Ionicons';
// // // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// // // const { width: SW } = Dimensions.get('window');

// // // // ─── Constants ────────────────────────────────────────────────────────────────
// // // const TABS = [
// // //   { key: 'broadcast', label: 'Chat', icon: 'megaphone-outline' },
// // //   { key: 'closed', label: 'Closed', icon: 'lock-closed-outline' },
// // // ];

// // // const AVATAR_COLORS = [
// // //   '#2563EB', '#7C3AED', '#DB2777',
// // //   '#059669', '#D97706', '#DC2626', '#0891B2',
// // // ];
// // // const getColor = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
// // // const getInitials = (name) => {
// // //   if (!name) return '?';
// // //   const p = name.trim().split(' ');
// // //   return p.length >= 2 ? p[0][0].toUpperCase() + p[1][0].toUpperCase() : p[0][0].toUpperCase();
// // // };
// // // const formatTime = (ts) => {
// // //   if (!ts?.toDate) return '';
// // //   const d = ts.toDate(), diff = Date.now() - d.getTime();
// // //   if (diff < 60_000) return 'Just now';
// // //   if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
// // //   if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
// // //   return d.toLocaleDateString('en-IN');
// // // };

// // // // ─── SkeletonBox ──────────────────────────────────────────────────────────────
// // // const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
// // //   const anim = useRef(new Animated.Value(0.4)).current;
// // //   useEffect(() => {
// // //     Animated.loop(Animated.sequence([
// // //       Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
// // //       Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
// // //     ])).start();
// // //   }, [anim]);
// // //   return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: anim }, style]} />;
// // // });

// // // // ─── ProfileCard ──────────────────────────────────────────────────────────────
// // // const ProfileCard = memo(({ profile }) => (
// // //   <View style={styles.profileCard}>
// // //     <View style={styles.profileInfo}>
// // //       <Text style={styles.profileCategory}>
// // //         {profile?.categoryName || 'No Category'}
// // //         {profile?.subcategoryName ? `  ·  ${profile.subcategoryName}` : ''}
// // //       </Text>
// // //       <View style={styles.profileMetaRow}>
// // //         <MatIcon name="school-outline" size={13} color="#7C3AED" />
// // //         <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
// // //       </View>
// // //       {!!profile?.experience && (
// // //         <View style={styles.profileMetaRow}>
// // //           <MatIcon name="briefcase-outline" size={13} color="#7C3AED" />
// // //           <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
// // //         </View>
// // //       )}
// // //     </View>
// // //     <View style={[styles.statusPill, { backgroundColor: profile?.isActive === false ? '#FEE2E2' : '#D1FAE5' }]}>
// // //       <View style={[styles.statusDot, { backgroundColor: profile?.isActive === false ? '#DC2626' : '#10B981' }]} />
// // //       <Text style={[styles.statusPillText, { color: profile?.isActive === false ? '#DC2626' : '#065F46' }]}>
// // //         {profile?.isActive === false ? 'Inactive' : 'Active'}
// // //       </Text>
// // //     </View>
// // //   </View>
// // // ));

// // // // ─── TabButton ────────────────────────────────────────────────────────────────
// // // const TabButton = memo(({ tab, isActive, count, onPress }) => {
// // //   const isBcast = tab.key === 'broadcast';
// // //   return (
// // //     <TouchableOpacity
// // //       style={[
// // //         styles.tab,
// // //         isActive && styles.tabActive,
// // //         isBcast && styles.tabBroadcast,
// // //         isBcast && isActive && styles.tabBroadcastActive,
// // //       ]}
// // //       onPress={() => onPress(tab.key)}
// // //       activeOpacity={0.75}
// // //     >
// // //       <Icon
// // //         name={tab.icon}
// // //         size={14}
// // //         color={isBcast ? (isActive ? '#D97706' : '#94A3B8') : (isActive ? '#7C3AED' : '#94A3B8')}
// // //       />
// // //       <Text style={[
// // //         styles.tabText,
// // //         isActive && (isBcast ? styles.tabTextBroadcast : styles.tabTextActive),
// // //       ]}>
// // //         {tab.label}
// // //       </Text>
// // //       {count > 0 && (
// // //         <View style={[
// // //           styles.tabBadge,
// // //           isActive && (isBcast ? styles.tabBadgeBroadcastActive : styles.tabBadgeActive),
// // //         ]}>
// // //           <Text style={[
// // //             styles.tabBadgeText,
// // //             isActive && (isBcast ? { color: '#92400E' } : styles.tabBadgeTextActive),
// // //           ]}>{count}</Text>
// // //         </View>
// // //       )}
// // //     </TouchableOpacity>
// // //   );
// // // });

// // // // ─── NormalChatCard ───────────────────────────────────────────────────────────
// // // const NormalChatCard = memo(({ item, onPress }) => {
// // //   const isNew = !item.expertAccepted && item.isActive;
// // //   return (
// // //     <TouchableOpacity style={styles.chatCard} onPress={() => onPress(item)} activeOpacity={0.85}>
// // //       <View style={[styles.chatAvatar, { backgroundColor: getColor(item.userName) }]}>
// // //         <Text style={styles.chatAvatarText}>{getInitials(item.userName)}</Text>
// // //         <View style={[styles.chatStatusDot, { backgroundColor: item.isActive ? '#10B981' : '#CBD5E1' }]} />
// // //       </View>
// // //       <View style={styles.chatContent}>
// // //         <View style={styles.chatTopRow}>
// // //           <Text style={styles.chatUser} numberOfLines={1}>{item.userName || 'User'}</Text>
// // //           <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
// // //         </View>
// // //         <View style={styles.chatBottomRow}>
// // //           <Text style={styles.chatLast} numberOfLines={1}>
// // //             {item.lastMessage || 'No message yet'}
// // //           </Text>
// // //           {isNew && (
// // //             <View style={styles.newBadge}>
// // //               <Text style={styles.newBadgeText}>NEW</Text>
// // //             </View>
// // //           )}
// // //         </View>
// // //         {!!item.categoryName && (
// // //           <View style={styles.categoryPill}>
// // //             <MatIcon name="tag-outline" size={10} color="#7C3AED" />
// // //             <Text style={styles.categoryText}>{item.categoryName}</Text>
// // //           </View>
// // //         )}
// // //       </View>
// // //       <Icon name="chevron-forward" size={16} color="#CBD5E1" />
// // //     </TouchableOpacity>
// // //   );
// // // });

// // // // ─── BroadcastCard ────────────────────────────────────────────────────────────
// // // const BroadcastCard = memo(({ item, onReply }) => {
// // //   const expertCount = item.expertIds?.length ?? 0;
// // //   return (
// // //     <View style={styles.bcastCard}>
// // //       <View style={styles.bcastStripe} />
// // //       <View style={styles.bcastBody}>
// // //         <View style={styles.bcastTopRow}>
// // //           <View style={[styles.bcastAvatar, { backgroundColor: getColor(item.userName) }]}>
// // //             <Text style={styles.bcastAvatarText}>{getInitials(item.userName)}</Text>
// // //             {item.isActive && <View style={styles.bcastAvatarDot} />}
// // //           </View>
// // //           <View style={styles.bcastUserInfo}>
// // //             <Text style={styles.bcastUserName} numberOfLines={1}>{item.userName || 'User'}</Text>
// // //             <Text style={styles.bcastTime}>{formatTime(item.updatedAt)}</Text>
// // //           </View>
// // //           <View style={styles.bcastPill}>
// // //             <Icon name="megaphone-outline" size={10} color="#92400E" />
// // //             <Text style={styles.bcastPillText}>Chat</Text>
// // //           </View>
// // //         </View>
// // //         <View style={styles.bcastMsgRow}>
// // //           <Text style={styles.bcastMsgText} numberOfLines={1}>
// // //             {item.lastMessage || 'Tap Reply to respond to this broadcast'}
// // //           </Text>
// // //         </View>
// // //         <View style={styles.bcastFooter}>
// // //           {/* <View style={styles.bcastExpertCountWrap}>
// // //             <MatIcon name="account-group-outline" size={13} color="#D97706" />
// // //             <Text style={styles.bcastExpertCountText}>
// // //               {expertCount} expert{expertCount !== 1 ? 's' : ''} receiving
// // //             </Text>
// // //           </View> */}
// // //           <TouchableOpacity
// // //             style={styles.bcastReplyBtn}
// // //             onPress={() => onReply(item)}
// // //             activeOpacity={0.82}
// // //           >
// // //             {/* <LinearGradient
// // //               colors={['#F59E0B', '#D97706']}
// // //               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
// // //               style={styles.bcastReplyGrad}
// // //             >
// // //               <Icon name="chatbubble-ellipses-outline" size={14} color="#FFFFFF" />
// // //               <Text style={styles.bcastReplyText}>Reply</Text>
// // //             </LinearGradient> */}
// // //           </TouchableOpacity>
// // //         </View>
// // //       </View>
// // //     </View>
// // //   );
// // // });

// // // // ─── ChatDetailModal (Closed chats only) ─────────────────────────────────────
// // // const ChatDetailModal = memo(({ chat, onClose, onOpen }) => {
// // //   if (!chat) return null;

// // //   const rows = [
// // //     { label: 'Last Message', value: chat.lastMessage || '—', icon: 'chat-outline' },
// // //     {
// // //       label: 'Started',
// // //       value: chat.createdAt?.toDate ? chat.createdAt.toDate().toLocaleDateString('en-IN') : '—',
// // //       icon: 'calendar-outline',
// // //     },
// // //     { label: 'Last Active', value: formatTime(chat.updatedAt), icon: 'clock-outline' },
// // //   ];

// // //   return (
// // //     <View style={styles.modalOverlay}>
// // //       <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
// // //       <View style={styles.modalBox}>
// // //         <View style={styles.modalHandle} />
// // //         <View style={styles.modalHeader}>
// // //           <View style={[styles.modalAvatar, { backgroundColor: getColor(chat.userName) }]}>
// // //             <Text style={styles.modalAvatarText}>{getInitials(chat.userName)}</Text>
// // //           </View>
// // //           <Text style={styles.modalUserName}>{chat.userName || 'User'}</Text>
// // //           <View style={[styles.statusPill, { backgroundColor: '#F1F5F9', marginTop: 6 }]}>
// // //             <View style={[styles.statusDot, { backgroundColor: '#94A3B8' }]} />
// // //             <Text style={[styles.statusPillText, { color: '#94A3B8' }]}>Closed</Text>
// // //           </View>
// // //         </View>
// // //         <View style={styles.modalSection}>
// // //           {rows.map(({ label, value, icon }, idx) => (
// // //             <View key={label}>
// // //               <View style={styles.modalRow}>
// // //                 <View style={styles.modalRowLeft}>
// // //                   <MatIcon name={icon} size={15} color="#94A3B8" />
// // //                   <Text style={styles.modalLabel}>{label}</Text>
// // //                 </View>
// // //                 <Text style={styles.modalValue} numberOfLines={2}>{value}</Text>
// // //               </View>
// // //               {idx < rows.length - 1 && <View style={styles.modalDivider} />}
// // //             </View>
// // //           ))}
// // //         </View>
// // //         <TouchableOpacity style={[styles.actionBtn, styles.actionClose]} onPress={onClose}>
// // //           <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Dismiss</Text>
// // //         </TouchableOpacity>
// // //         <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
// // //       </View>
// // //     </View>
// // //   );
// // // });

// // // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // // export default function ExpertDashboard({ navigation }) {
// // //   const dispatch = useDispatch();

// // //   const flatListRef = useRef(null);

// // //   const [profile, setProfile] = useState(null);
// // //   const [chats, setChats] = useState([]);
// // //   const [broadcastChats, setBroadcastChats] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [refreshing, setRefreshing] = useState(false);
// // //   const [activeTab, setActiveTab] = useState('broadcast');
// // //   const [selectedChat, setSelectedChat] = useState(null);
// // //   const [error, setError] = useState(null);

// // //   const db = useMemo(() => getFirestore(), []);
// // //   const uid = useMemo(() => auth().currentUser?.uid, []);

// // //   // ── Scroll to top on screen focus ────────────────────────────────────────
// // //   useEffect(() => {
// // //     const unsubscribe = navigation?.addListener('focus', () => {
// // //       flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// // //     });
// // //     return unsubscribe;
// // //   }, [navigation]);

// // //   // ── Scroll to top on tab change ───────────────────────────────────────────
// // //   useEffect(() => {
// // //     flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// // //   }, [activeTab]);

// // //   // ── Profile ───────────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     if (!uid) return;
// // //     return onSnapshot(
// // //       doc(db, 'users', uid),
// // //       (snap) => { if (snap.exists()) setProfile(snap.data()); },
// // //       (err) => { console.error('Profile:', err); setError('Failed to load profile.'); },
// // //     );
// // //   }, [db, uid]);

// // //   // ── Normal chats ──────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     if (!uid) return;
// // //     return onSnapshot(
// // //       query(collection(db, 'chats'), where('expertId', '==', uid), orderBy('updatedAt', 'desc')),
// // //       (snap) => { setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
// // //       (err) => { console.error('Chats:', err); setError('Failed to load chats.'); setLoading(false); },
// // //     );
// // //   }, [db, uid]);

// // //   // ── Broadcast chats ───────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     if (!uid) return;
// // //     return onSnapshot(
// // //       query(collection(db, 'broadcastChats'), where('expertIds', 'array-contains', uid)),
// // //       (snap) => {
// // //         setBroadcastChats(
// // //           snap.docs
// // //             .map((d) => ({ id: d.id, ...d.data() }))
// // //             .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
// // //         );
// // //       },
// // //       (err) => { console.error('BroadcastChats:', err); },
// // //     );
// // //   }, [db, uid]);

// // //   // ── Derived ───────────────────────────────────────────────────────────────
// // //   const closedChats = useMemo(() => chats.filter((c) => !c.isActive), [chats]);

// // //   const tabData = useMemo(() => ({
// // //     broadcast: broadcastChats,
// // //     closed: closedChats,
// // //   }), [broadcastChats, closedChats]);

// // //   const tabCounts = useMemo(() => ({
// // //     broadcast: broadcastChats.length,
// // //     closed: closedChats.length,
// // //   }), [broadcastChats.length, closedChats.length]);

// // //   // ── Navigate to chat ──────────────────────────────────────────────────────
// // //   const navigateToChat = useCallback((chat, isBroadcast = false) => {
// // //     navigation?.navigate('Chats', {
// // //       screen: 'ExpertReplyChat',
// // //       params: {
// // //         chatId: chat.id,
// // //         userName: chat.userName,
// // //         isBroadcast: !!isBroadcast,
// // //         subcategoryName: chat.subcategoryName ?? '',
// // //         categoryName: chat.categoryName ?? '',
// // //         expertIds: chat.expertIds ?? [],
// // //       },
// // //     });
// // //   }, [navigation]);

// // //   // ── Broadcast: direct reply ───────────────────────────────────────────────
// // //   const handleBroadcastReply = useCallback((chat) => {
// // //     navigateToChat(chat, true);
// // //   }, [navigateToChat]);

// // //   // ── Closed chat card press → modal ────────────────────────────────────────
// // //   const handleChatPress = useCallback((chat) => setSelectedChat(chat), []);
// // //   const handleModalClose = useCallback(() => setSelectedChat(null), []);

// // //   const handleLogout = useCallback(async () => {
// // //     try { await auth().signOut(); dispatch(logout()); }
// // //     catch (e) { console.error('Logout:', e); }
// // //   }, [dispatch]);

// // //   const handleTabPress = useCallback((key) => setActiveTab(key), []);
// // //   const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }, []);
// // //   const keyExtractor = useCallback((item) => item.id, []);

// // //   // ── renderItem ────────────────────────────────────────────────────────────
// // //   const renderItem = useCallback(({ item }) => {
// // //     if (activeTab === 'broadcast') {
// // //       return <BroadcastCard item={item} onReply={handleBroadcastReply} />;
// // //     }
// // //     return <NormalChatCard item={item} onPress={handleChatPress} />;
// // //   }, [activeTab, handleBroadcastReply, handleChatPress]);

// // //   const renderTabsHeader = useCallback(() => (
// // //     <View style={styles.tabRow}>
// // //       {TABS.map((tab) => (
// // //         <TabButton
// // //           key={tab.key}
// // //           tab={tab}
// // //           isActive={activeTab === tab.key}
// // //           count={tabCounts[tab.key]}
// // //           onPress={handleTabPress}
// // //         />
// // //       ))}
// // //     </View>
// // //   ), [activeTab, tabCounts, handleTabPress]);

// // //   const ListHeaderComponent = useCallback(() => (
// // //     <View>
// // //       <ProfileCard profile={profile} />
// // //       <Text style={styles.sectionLabel}>My Chats</Text>
// // //       {renderTabsHeader()}
// // //     </View>
// // //   ), [profile, renderTabsHeader]);

// // //   const ListEmptyComponent = useCallback(() => (
// // //     <View style={styles.empty}>
// // //       <View style={styles.emptyIconWrap}>
// // //         <MatIcon
// // //           name={activeTab === 'broadcast' ? 'bullhorn-outline' : 'lock-outline'}
// // //           size={40}
// // //           color={activeTab === 'broadcast' ? '#D97706' : '#CBD5E1'}
// // //         />
// // //       </View>
// // //       <Text style={styles.emptyTitle}>
// // //         {activeTab === 'broadcast' ? 'No Broadcast Requests' : 'No Closed Chats'}
// // //       </Text>
// // //       <Text style={styles.emptySubtitle}>
// // //         {activeTab === 'broadcast'
// // //           ? 'Broadcast requests from users appear here'
// // //           : 'Completed chats will appear here'}
// // //       </Text>
// // //     </View>
// // //   ), [activeTab]);

// // //   // ── Loading ───────────────────────────────────────────────────────────────
// // //   if (loading) {
// // //     return (
// // //       <View style={styles.container}>
// // //         <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
// // //         <View style={styles.header}>
// // //           <View style={styles.headerLeft}>
// // //             <SkeletonBox width={44} height={44} borderRadius={22} />
// // //             <View style={{ gap: 6 }}>
// // //               <SkeletonBox width={80} height={12} />
// // //               <SkeletonBox width={120} height={16} />
// // //             </View>
// // //           </View>
// // //           <SkeletonBox width={72} height={34} borderRadius={20} />
// // //         </View>
// // //         <View style={{ padding: 16, gap: 12 }}>
// // //           <SkeletonBox width="100%" height={120} borderRadius={16} />
// // //           {[1, 2, 3].map((k) => <SkeletonBox key={k} width="100%" height={80} borderRadius={14} />)}
// // //         </View>
// // //       </View>
// // //     );
// // //   }

// // //   if (error) {
// // //     return (
// // //       <View style={[styles.container, styles.centered]}>
// // //         <MatIcon name="alert-circle-outline" size={52} color="#DC2626" />
// // //         <Text style={styles.errorTitle}>Something went wrong</Text>
// // //         <Text style={styles.errorSubtitle}>{error}</Text>
// // //       </View>
// // //     );
// // //   }

// // //   // ── Render ────────────────────────────────────────────────────────────────
// // //   return (
// // //     <View style={styles.container}>
// // //       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

// // //       <View style={styles.header}>
// // //         <View style={styles.headerLeft}>
// // //           <View style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}>
// // //             <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
// // //           </View>
// // //           <View>
// // //             <Text style={styles.headerGreeting}>Welcome back 👋</Text>
// // //             <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
// // //           </View>
// // //         </View>
// // //         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
// // //           <Icon name="log-out-outline" size={16} color="#DC2626" />
// // //           <Text style={styles.logoutText}>Logout</Text>
// // //         </TouchableOpacity>
// // //       </View>

// // //       <FlatList
// // //         ref={flatListRef}
// // //         data={tabData[activeTab]}
// // //         keyExtractor={keyExtractor}
// // //         renderItem={renderItem}
// // //         ListHeaderComponent={ListHeaderComponent}
// // //         ListEmptyComponent={ListEmptyComponent}
// // //         ListFooterComponent={<View style={{ height: 48 }} />}
// // //         showsVerticalScrollIndicator={false}
// // //         refreshControl={
// // //           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} tintColor="#7C3AED" />
// // //         }
// // //         initialNumToRender={8}
// // //         maxToRenderPerBatch={8}
// // //         windowSize={7}
// // //         removeClippedSubviews={Platform.OS === 'android'}
// // //         contentContainerStyle={styles.listContent}
// // //       />

// // //       {/* Modal only for closed chats */}
// // //       <Modal
// // //         visible={!!selectedChat}
// // //         transparent
// // //         animationType="slide"
// // //         statusBarTranslucent
// // //         onRequestClose={handleModalClose}
// // //       >
// // //         <ChatDetailModal
// // //           chat={selectedChat}
// // //           onClose={handleModalClose}
// // //         />
// // //       </Modal>
// // //     </View>
// // //   );
// // // }

// // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // const styles = StyleSheet.create({
// // //   container: { flex: 1, backgroundColor: '#F8FAFC' },
// // //   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
// // //   listContent: { paddingBottom: 20 },

// // //   header: {
// // //     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
// // //     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
// // //     paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
// // //     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
// // //     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
// // //   },
// // //   headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
// // //   headerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
// // //   headerAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
// // //   headerGreeting: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
// // //   headerName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 1 },
// // //   logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA' },
// // //   logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },

// // //   profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 14 },
// // //   profileInfo: { flex: 1, gap: 7 },
// // //   profileCategory: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
// // //   profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
// // //   profileMeta: { fontSize: 12, color: '#64748B', fontWeight: '500', flex: 1 },
// // //   statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
// // //   statusDot: { width: 6, height: 6, borderRadius: 3 },
// // //   statusPillText: { fontSize: 11, fontWeight: '700' },

// // //   sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginLeft: 20, marginTop: 24, marginBottom: 12 },

// // //   tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 6 },
// // //   tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: 'transparent' },
// // //   tabActive: { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' },
// // //   tabBroadcast: { backgroundColor: '#FFFBEB' },
// // //   tabBroadcastActive: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
// // //   tabText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
// // //   tabTextActive: { color: '#7C3AED' },
// // //   tabTextBroadcast: { color: '#D97706' },
// // //   tabBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
// // //   tabBadgeActive: { backgroundColor: '#DDD6FE' },
// // //   tabBadgeBroadcastActive: { backgroundColor: '#FDE68A' },
// // //   tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
// // //   tabBadgeTextActive: { color: '#7C3AED' },

// // //   chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 10, marginTop: 2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, gap: 12 },
// // //   chatAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// // //   chatAvatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
// // //   chatStatusDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF' },
// // //   chatContent: { flex: 1, gap: 3 },
// // //   chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
// // //   chatBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
// // //   chatUser: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
// // //   chatLast: { fontSize: 12, color: '#64748B', flex: 1 },
// // //   chatTime: { fontSize: 11, color: '#94A3B8' },
// // //   newBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
// // //   newBadgeText: { fontSize: 9, fontWeight: '800', color: '#D97706', letterSpacing: 0.5 },
// // //   categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
// // //   categoryText: { fontSize: 10, color: '#7C3AED', fontWeight: '600' },

// // //   bcastCard: {
// // //     flexDirection: 'row',
// // //     marginHorizontal: 16, marginBottom: 12, marginTop: 2,
// // //     borderRadius: 18,
// // //     backgroundColor: '#FFFDF5',
// // //     borderWidth: 1.5, borderColor: '#FDE68A',
// // //     shadowColor: '#D97706', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
// // //     elevation: 3,
// // //     overflow: 'hidden',
// // //   },
// // //   bcastStripe: { width: 5, backgroundColor: '#F59E0B' },
// // //   bcastBody: { flex: 1, padding: 14, gap: 8 },
// // //   bcastTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
// // //   bcastAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// // //   bcastAvatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
// // //   bcastAvatarDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFDF5' },
// // //   bcastUserInfo: { flex: 1 },
// // //   bcastUserName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
// // //   bcastTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
// // //   bcastPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
// // //   bcastPillText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
// // //   bcastMsgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8E7', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
// // //   bcastMsgText: { fontSize: 12, color: '#78716C', flex: 1 },
// // //   bcastFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
// // //   bcastExpertCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
// // //   bcastExpertCountText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
// // //   bcastReplyBtn: { borderRadius: 12, overflow: 'hidden' },
// // //   bcastReplyGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9 },
// // //   bcastReplyText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

// // //   emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
// // //   empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
// // //   emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748B', marginBottom: 6 },
// // //   emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

// // //   errorTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 6 },
// // //   errorSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

// // //   modalOverlay: { flex: 1, justifyContent: 'flex-end' },
// // //   modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
// // //   modalBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
// // //   modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
// // //   modalHeader: { alignItems: 'center', paddingBottom: 16 },
// // //   modalAvatar: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
// // //   modalAvatarText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
// // //   modalUserName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
// // //   modalSection: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: '#F1F5F9' },
// // //   modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
// // //   modalRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
// // //   modalLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
// // //   modalValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
// // //   modalDivider: { height: 1, backgroundColor: '#F1F5F9' },
// // //   actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 15, marginBottom: 10 },
// // //   actionAccept: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
// // //   actionOpen: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
// // //   actionClose: { backgroundColor: '#F1F5F9' },
// // //   actionBtnText: { fontSize: 15, fontWeight: '700' },
// // // });


// // import React, {
// //   useEffect, useState, useCallback, useMemo, useRef, memo,
// // } from 'react';
// // import {
// //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// //   StatusBar, RefreshControl, Modal,
// //   Animated, Platform, Dimensions,
// // } from 'react-native';
// // import {
// //   getFirestore, collection, query, where,
// //   onSnapshot, doc, orderBy,
// // } from '@react-native-firebase/firestore';
// // import auth from '@react-native-firebase/auth';
// // import { useDispatch } from 'react-redux';
// // import { logout } from '../../store/slices/authSlice';
// // import Icon from 'react-native-vector-icons/Ionicons';
// // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// // const { width: SW } = Dimensions.get('window');

// // // ─── Design Tokens ────────────────────────────────────────────────────────────
// // const T = {
// //   primary      : '#0D7B7A',
// //   primaryLight : '#F0FDFA',
// //   primaryBorder: '#E0F2F1',
// //   primaryMid   : '#0F6E56',
// //   bg           : '#F4FAFA',
// //   surface      : '#FFFFFF',
// //   textMain     : '#0F172A',
// //   textSub      : '#64748B',
// //   inactive     : '#94A3B8',
// //   border       : '#F1F5F9',
// //   success      : '#065F46',
// //   successBg    : '#D1FAE5',
// //   danger       : '#DC2626',
// //   dangerBg     : '#FEE2E2',
// // };

// // // ─── Constants ────────────────────────────────────────────────────────────────
// // const TABS = [
// //   { key: 'broadcast', label: 'Chat',   icon: 'megaphone-outline'   },
// //   { key: 'closed',   label: 'Closed', icon: 'lock-closed-outline' },
// // ];

// // const AVATAR_COLORS = [
// //   '#0D7B7A', '#7C3AED', '#DB2777',
// //   '#059669', '#0891B2', '#DC2626', '#2563EB',
// // ];
// // const getColor = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
// // const getInitials = (name) => {
// //   if (!name) return '?';
// //   const p = name.trim().split(' ');
// //   return p.length >= 2
// //     ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
// //     : p[0][0].toUpperCase();
// // };
// // const formatTime = (ts) => {
// //   if (!ts?.toDate) return '';
// //   const d = ts.toDate(), diff = Date.now() - d.getTime();
// //   if (diff < 60_000)     return 'Just now';
// //   if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
// //   if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
// //   return d.toLocaleDateString('en-IN');
// // };

// // // ─── SkeletonBox ──────────────────────────────────────────────────────────────
// // const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
// //   const anim = useRef(new Animated.Value(0.4)).current;
// //   useEffect(() => {
// //     Animated.loop(Animated.sequence([
// //       Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
// //       Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
// //     ])).start();
// //   }, [anim]);
// //   return (
// //     <Animated.View
// //       style={[{ width, height, borderRadius, backgroundColor: '#C8EEEB', opacity: anim }, style]}
// //     />
// //   );
// // });

// // // ─── ProfileCard ──────────────────────────────────────────────────────────────
// // const ProfileCard = memo(({ profile }) => (
// //   <View style={styles.profileCard}>
// //     <View style={styles.profileInfo}>
// //       <Text style={styles.profileCategory}>
// //         {profile?.categoryName || 'No Category'}
// //         {profile?.subcategoryName ? `  ·  ${profile.subcategoryName}` : ''}
// //       </Text>
// //       <View style={styles.profileMetaRow}>
// //         <MatIcon name="school-outline" size={13} color={T.primary} />
// //         <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
// //       </View>
// //       {!!profile?.experience && (
// //         <View style={styles.profileMetaRow}>
// //           <MatIcon name="briefcase-outline" size={13} color={T.primary} />
// //           <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
// //         </View>
// //       )}
// //     </View>
// //     <View style={[
// //       styles.statusPill,
// //       { backgroundColor: profile?.isActive === false ? T.dangerBg : T.successBg },
// //     ]}>
// //       <View style={[
// //         styles.statusDot,
// //         { backgroundColor: profile?.isActive === false ? T.danger : '#10B981' },
// //       ]} />
// //       <Text style={[
// //         styles.statusPillText,
// //         { color: profile?.isActive === false ? T.danger : T.success },
// //       ]}>
// //         {profile?.isActive === false ? 'Inactive' : 'Active'}
// //       </Text>
// //     </View>
// //   </View>
// // ));

// // // ─── TabButton ────────────────────────────────────────────────────────────────
// // const TabButton = memo(({ tab, isActive, count, onPress }) => (
// //   <TouchableOpacity
// //     style={[styles.tab, isActive && styles.tabActive]}
// //     onPress={() => onPress(tab.key)}
// //     activeOpacity={0.75}
// //   >
// //     <Icon
// //       name={tab.icon}
// //       size={14}
// //       color={isActive ? T.primary : T.inactive}
// //     />
// //     <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
// //       {tab.label}
// //     </Text>
// //     {count > 0 && (
// //       <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
// //         <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
// //           {count}
// //         </Text>
// //       </View>
// //     )}
// //   </TouchableOpacity>
// // ));

// // // ─── NormalChatCard ───────────────────────────────────────────────────────────
// // const NormalChatCard = memo(({ item, onPress }) => {
// //   const isNew = !item.expertAccepted && item.isActive;
// //   return (
// //     <TouchableOpacity style={styles.chatCard} onPress={() => onPress(item)} activeOpacity={0.85}>
// //       <View style={[styles.chatAvatar, { backgroundColor: getColor(item.userName) }]}>
// //         <Text style={styles.chatAvatarText}>{getInitials(item.userName)}</Text>
// //         <View style={[
// //           styles.chatStatusDot,
// //           { backgroundColor: item.isActive ? '#10B981' : '#CBD5E1' },
// //         ]} />
// //       </View>
// //       <View style={styles.chatContent}>
// //         <View style={styles.chatTopRow}>
// //           <Text style={styles.chatUser} numberOfLines={1}>{item.userName || 'User'}</Text>
// //           <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
// //         </View>
// //         <View style={styles.chatBottomRow}>
// //           <Text style={styles.chatLast} numberOfLines={1}>
// //             {item.lastMessage || 'No message yet'}
// //           </Text>
// //           {isNew && (
// //             <View style={styles.newBadge}>
// //               <Text style={styles.newBadgeText}>NEW</Text>
// //             </View>
// //           )}
// //         </View>
// //         {!!item.categoryName && (
// //           <View style={styles.categoryPill}>
// //             <MatIcon name="tag-outline" size={10} color={T.primary} />
// //             <Text style={styles.categoryText}>{item.categoryName}</Text>
// //           </View>
// //         )}
// //       </View>
// //       <Icon name="chevron-forward" size={16} color={T.primaryBorder} />
// //     </TouchableOpacity>
// //   );
// // });

// // // ─── BroadcastCard ────────────────────────────────────────────────────────────
// // const BroadcastCard = memo(({ item, onReply }) => {
// //   const expertCount = item.expertIds?.length ?? 0;
// //   const topic = item.subcategoryName || item.categoryName || 'Broadcast';

// //   return (
// //     <View style={styles.bcastCard}>
// //       <View style={styles.bcastStripe} />
// //       <View style={styles.bcastBody}>

// //         {/* Top row: avatar + name/time + pill */}
// //         <View style={styles.bcastTopRow}>
// //           <View style={[styles.bcastAvatar, { backgroundColor: getColor(item.userName) }]}>
// //             <Text style={styles.bcastAvatarText}>{getInitials(item.userName)}</Text>
// //             {item.isActive && <View style={styles.bcastAvatarDot} />}
// //           </View>
// //           <View style={styles.bcastUserInfo}>
// //             <Text style={styles.bcastUserName} numberOfLines={1}>
// //               {item.userName || 'User'}
// //             </Text>
// //             <Text style={styles.bcastTime}>{formatTime(item.updatedAt)}</Text>
// //           </View>
// //           <View style={styles.bcastPill}>
// //             <Icon name="megaphone-outline" size={10} color={T.primaryMid} />
// //             <Text style={styles.bcastPillText}>Chat</Text>
// //           </View>
// //         </View>

// //         {/* Topic row */}
// //         <View style={styles.bcastTopicRow}>
// //           <MatIcon name="shape-outline" size={11} color={T.primary} />
// //           <Text style={styles.bcastTopicText} numberOfLines={1}>{topic}</Text>
// //         </View>

// //         {/* Message preview */}
// //         <View style={styles.bcastMsgRow}>
// //           <Icon name="chatbubble-ellipses-outline" size={12} color={T.primary} />
// //           <Text style={styles.bcastMsgText} numberOfLines={1}>
// //             {item.lastMessage || 'Tap Reply to respond'}
// //           </Text>
// //         </View>

// //         {/* Footer */}
// //         <View style={styles.bcastFooter}>
// //           {expertCount > 0 && (
// //             <View style={styles.bcastExpertWrap}>
// //               <MatIcon name="account-group-outline" size={12} color={T.primary} />
// //               <Text style={styles.bcastExpertText}>
// //                 {expertCount} expert{expertCount !== 1 ? 's' : ''}
// //               </Text>
// //             </View>
// //           )}
// //           {/* <TouchableOpacity
// //             style={styles.bcastReplyBtn}
// //             onPress={() => onReply(item)}
// //             activeOpacity={0.82}
// //           >
// //             <Icon name="chatbubble-ellipses-outline" size={13} color={T.surface} />
// //             <Text style={styles.bcastReplyText}>Reply</Text>
// //           </TouchableOpacity> */}
// //         </View>

// //       </View>
// //     </View>
// //   );
// // });

// // // ─── ChatDetailModal ──────────────────────────────────────────────────────────
// // const ChatDetailModal = memo(({ chat, onClose }) => {
// //   if (!chat) return null;

// //   const rows = [
// //     { label: 'Last Message', value: chat.lastMessage || '—',           icon: 'chat-outline'     },
// //     {
// //       label: 'Started',
// //       value: chat.createdAt?.toDate
// //         ? chat.createdAt.toDate().toLocaleDateString('en-IN') : '—',
// //       icon: 'calendar-outline',
// //     },
// //     { label: 'Last Active',  value: formatTime(chat.updatedAt),         icon: 'clock-outline'    },
// //   ];

// //   return (
// //     <View style={styles.modalOverlay}>
// //       <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
// //       <View style={styles.modalBox}>
// //         <View style={styles.modalHandle} />
// //         <View style={styles.modalHeader}>
// //           <View style={[styles.modalAvatar, { backgroundColor: getColor(chat.userName) }]}>
// //             <Text style={styles.modalAvatarText}>{getInitials(chat.userName)}</Text>
// //           </View>
// //           <Text style={styles.modalUserName}>{chat.userName || 'User'}</Text>
// //           <View style={[styles.statusPill, { backgroundColor: '#F1F5F9', marginTop: 6 }]}>
// //             <View style={[styles.statusDot, { backgroundColor: T.inactive }]} />
// //             <Text style={[styles.statusPillText, { color: T.inactive }]}>Closed</Text>
// //           </View>
// //         </View>
// //         <View style={styles.modalSection}>
// //           {rows.map(({ label, value, icon }, idx) => (
// //             <View key={label}>
// //               <View style={styles.modalRow}>
// //                 <View style={styles.modalRowLeft}>
// //                   <View style={styles.modalRowIcon}>
// //                     <MatIcon name={icon} size={14} color={T.primary} />
// //                   </View>
// //                   <Text style={styles.modalLabel}>{label}</Text>
// //                 </View>
// //                 <Text style={styles.modalValue} numberOfLines={2}>{value}</Text>
// //               </View>
// //               {idx < rows.length - 1 && <View style={styles.modalDivider} />}
// //             </View>
// //           ))}
// //         </View>
// //         <TouchableOpacity style={styles.actionClose} onPress={onClose}>
// //           <Icon name="close-outline" size={16} color={T.textSub} />
// //           <Text style={styles.actionCloseText}>Dismiss</Text>
// //         </TouchableOpacity>
// //         <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
// //       </View>
// //     </View>
// //   );
// // });

// // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // export default function ExpertDashboard({ navigation }) {
// //   const dispatch = useDispatch();
// //   const flatListRef = useRef(null);

// //   const [profile,        setProfile]        = useState(null);
// //   const [chats,          setChats]          = useState([]);
// //   const [broadcastChats, setBroadcastChats] = useState([]);
// //   const [loading,        setLoading]        = useState(true);
// //   const [refreshing,     setRefreshing]     = useState(false);
// //   const [activeTab,      setActiveTab]      = useState('broadcast');
// //   const [selectedChat,   setSelectedChat]   = useState(null);
// //   const [error,          setError]          = useState(null);

// //   const db  = useMemo(() => getFirestore(), []);
// //   const uid = useMemo(() => auth().currentUser?.uid, []);

// //   useEffect(() => {
// //     const unsub = navigation?.addListener('focus', () => {
// //       flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// //     });
// //     return unsub;
// //   }, [navigation]);

// //   useEffect(() => {
// //     flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
// //   }, [activeTab]);

// //   useEffect(() => {
// //     if (!uid) return;
// //     return onSnapshot(
// //       doc(db, 'users', uid),
// //       (snap) => { if (snap.exists()) setProfile(snap.data()); },
// //       (err)  => { console.error('Profile:', err); setError('Failed to load profile.'); },
// //     );
// //   }, [db, uid]);

// //   useEffect(() => {
// //     if (!uid) return;
// //     return onSnapshot(
// //       query(collection(db, 'chats'), where('expertId', '==', uid), orderBy('updatedAt', 'desc')),
// //       (snap) => { setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
// //       (err)  => { console.error('Chats:', err); setError('Failed to load chats.'); setLoading(false); },
// //     );
// //   }, [db, uid]);

// //   useEffect(() => {
// //     if (!uid) return;
// //     return onSnapshot(
// //       query(collection(db, 'broadcastChats'), where('expertIds', 'array-contains', uid)),
// //       (snap) => {
// //         setBroadcastChats(
// //           snap.docs
// //             .map((d) => ({ id: d.id, ...d.data() }))
// //             .sort((a, b) => (b.updatedAt?.toDate?.() ?? 0) - (a.updatedAt?.toDate?.() ?? 0)),
// //         );
// //       },
// //       (err) => { console.error('BroadcastChats:', err); },
// //     );
// //   }, [db, uid]);

// //   const closedChats = useMemo(() => chats.filter((c) => !c.isActive), [chats]);

// //   const tabData = useMemo(() => ({
// //     broadcast: broadcastChats,
// //     closed   : closedChats,
// //   }), [broadcastChats, closedChats]);

// //   const tabCounts = useMemo(() => ({
// //     broadcast: broadcastChats.length,
// //     closed   : closedChats.length,
// //   }), [broadcastChats.length, closedChats.length]);

// //   const navigateToChat = useCallback((chat, isBroadcast = false) => {
// //     navigation?.navigate('Chats', {
// //       screen: 'ExpertReplyChat',
// //       params: {
// //         chatId         : chat.id,
// //         userName       : chat.userName,
// //         isBroadcast    : !!isBroadcast,
// //         subcategoryName: chat.subcategoryName ?? '',
// //         categoryName   : chat.categoryName    ?? '',
// //         expertIds      : chat.expertIds       ?? [],
// //       },
// //     });
// //   }, [navigation]);

// //   const handleBroadcastReply = useCallback((chat) => navigateToChat(chat, true),  [navigateToChat]);
// //   const handleChatPress      = useCallback((chat) => setSelectedChat(chat),        []);
// //   const handleModalClose     = useCallback(()     => setSelectedChat(null),        []);
// //   const handleTabPress       = useCallback((key)  => setActiveTab(key),            []);
// //   const handleLogout         = useCallback(async () => {
// //     try { await auth().signOut(); dispatch(logout()); }
// //     catch (e) { console.error('Logout:', e); }
// //   }, [dispatch]);

// //   const onRefresh      = useCallback(() => {
// //     setRefreshing(true); setTimeout(() => setRefreshing(false), 800);
// //   }, []);
// //   const keyExtractor   = useCallback((item) => item.id, []);

// //   const renderItem = useCallback(({ item }) => {
// //     if (activeTab === 'broadcast') {
// //       return <BroadcastCard item={item} onReply={handleBroadcastReply} />;
// //     }
// //     return <NormalChatCard item={item} onPress={handleChatPress} />;
// //   }, [activeTab, handleBroadcastReply, handleChatPress]);

// //   const renderTabsHeader = useCallback(() => (
// //     <View style={styles.tabRow}>
// //       {TABS.map((tab) => (
// //         <TabButton
// //           key={tab.key}
// //           tab={tab}
// //           isActive={activeTab === tab.key}
// //           count={tabCounts[tab.key]}
// //           onPress={handleTabPress}
// //         />
// //       ))}
// //     </View>
// //   ), [activeTab, tabCounts, handleTabPress]);

// //   const ListHeaderComponent = useCallback(() => (
// //     <View>
// //       <ProfileCard profile={profile} />
// //       <Text style={styles.sectionLabel}>My Chats</Text>
// //       {renderTabsHeader()}
// //     </View>
// //   ), [profile, renderTabsHeader]);

// //   const ListEmptyComponent = useCallback(() => (
// //     <View style={styles.empty}>
// //       <View style={styles.emptyIconWrap}>
// //         <MatIcon
// //           name={activeTab === 'broadcast' ? 'bullhorn-outline' : 'lock-outline'}
// //           size={40}
// //           color={activeTab === 'broadcast' ? T.primary : '#CBD5E1'}
// //         />
// //       </View>
// //       <Text style={styles.emptyTitle}>
// //         {activeTab === 'broadcast' ? 'No Broadcast Requests' : 'No Closed Chats'}
// //       </Text>
// //       <Text style={styles.emptySubtitle}>
// //         {activeTab === 'broadcast'
// //           ? 'Broadcast requests from users appear here'
// //           : 'Completed chats will appear here'}
// //       </Text>
// //     </View>
// //   ), [activeTab]);

// //   // ── Loading ───────────────────────────────────────────────────────────────
// //   if (loading) {
// //     return (
// //       <View style={styles.container}>
// //         <StatusBar barStyle="dark-content" backgroundColor={T.surface} />
// //         <View style={styles.header}>
// //           <View style={styles.headerLeft}>
// //             <SkeletonBox width={44} height={44} borderRadius={22} />
// //             <View style={{ gap: 6 }}>
// //               <SkeletonBox width={80}  height={12} />
// //               <SkeletonBox width={120} height={16} />
// //             </View>
// //           </View>
// //           <SkeletonBox width={72} height={34} borderRadius={20} />
// //         </View>
// //         <View style={{ padding: 16, gap: 12 }}>
// //           <SkeletonBox width="100%" height={120} borderRadius={16} />
// //           {[1, 2, 3].map((k) => <SkeletonBox key={k} width="100%" height={80} borderRadius={14} />)}
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <View style={[styles.container, styles.centered]}>
// //         <MatIcon name="alert-circle-outline" size={52} color={T.danger} />
// //         <Text style={styles.errorTitle}>Something went wrong</Text>
// //         <Text style={styles.errorSubtitle}>{error}</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="dark-content" backgroundColor={T.surface} />

// //       <View style={styles.header}>
// //         <View style={styles.headerLeft}>
// //           <View style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}>
// //             <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
// //           </View>
// //           <View>
// //             <Text style={styles.headerGreeting}>Welcome back 👋</Text>
// //             <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
// //           </View>
// //         </View>
// //         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
// //           <Icon name="log-out-outline" size={16} color={T.danger} />
// //           <Text style={styles.logoutText}>Logout</Text>
// //         </TouchableOpacity>
// //       </View>

// //       <FlatList
// //         ref={flatListRef}
// //         data={tabData[activeTab]}
// //         keyExtractor={keyExtractor}
// //         renderItem={renderItem}
// //         ListHeaderComponent={ListHeaderComponent}
// //         ListEmptyComponent={ListEmptyComponent}
// //         ListFooterComponent={<View style={{ height: 48 }} />}
// //         showsVerticalScrollIndicator={false}
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={refreshing}
// //             onRefresh={onRefresh}
// //             colors={[T.primary]}
// //             tintColor={T.primary}
// //           />
// //         }
// //         initialNumToRender={8}
// //         maxToRenderPerBatch={8}
// //         windowSize={7}
// //         removeClippedSubviews={Platform.OS === 'android'}
// //         contentContainerStyle={styles.listContent}
// //       />

// //       <Modal
// //         visible={!!selectedChat}
// //         transparent
// //         animationType="slide"
// //         statusBarTranslucent
// //         onRequestClose={handleModalClose}
// //       >
// //         <ChatDetailModal chat={selectedChat} onClose={handleModalClose} />
// //       </Modal>
// //     </View>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────
// // const styles = StyleSheet.create({
// //   container  : { flex: 1, backgroundColor: T.bg },
// //   centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
// //   listContent: { paddingBottom: 20 },

// //   // Header
// //   header: {
// //     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
// //     backgroundColor: T.surface, paddingHorizontal: 20,
// //     paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
// //     borderBottomWidth: 1, borderBottomColor: T.primaryBorder,
// //   },
// //   headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: 12 },
// //   headerAvatar    : { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
// //   headerAvatarText: { fontSize: 17, fontWeight: '800', color: T.surface },
// //   headerGreeting  : { fontSize: 11, color: T.inactive, fontWeight: '500' },
// //   headerName      : { fontSize: 16, fontWeight: '700', color: T.textMain, marginTop: 1 },
// //   logoutBtn       : {
// //     flexDirection: 'row', alignItems: 'center', gap: 5,
// //     backgroundColor: T.dangerBg, paddingHorizontal: 12, paddingVertical: 8,
// //     borderRadius: 20, borderWidth: 1, borderColor: '#FECACA',
// //   },
// //   logoutText: { color: T.danger, fontWeight: '600', fontSize: 13 },

// //   // Profile card
// //   profileCard: {
// //     flexDirection: 'row', alignItems: 'center',
// //     backgroundColor: T.surface, marginHorizontal: 16, marginTop: 16,
// //     borderRadius: 18, padding: 16,
// //     borderWidth: 1, borderColor: T.primaryBorder,
// //     shadowColor: T.primary, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
// //     gap: 14,
// //   },
// //   profileInfo    : { flex: 1, gap: 7 },
// //   profileCategory: { fontSize: 14, fontWeight: '800', color: T.textMain, marginBottom: 2 },
// //   profileMetaRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
// //   profileMeta    : { fontSize: 12, color: T.textSub, fontWeight: '500', flex: 1 },
// //   statusPill     : { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
// //   statusDot      : { width: 6, height: 6, borderRadius: 3 },
// //   statusPillText : { fontSize: 11, fontWeight: '700' },

// //   // Section label
// //   sectionLabel: {
// //     fontSize: 11, fontWeight: '700', color: T.inactive,
// //     letterSpacing: 1.2, textTransform: 'uppercase',
// //     marginLeft: 20, marginTop: 24, marginBottom: 12,
// //   },

// //   // Tabs
// //   tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 6 },
// //   tab: {
// //     flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
// //     backgroundColor: T.surface, borderRadius: 12, paddingVertical: 9, gap: 4,
// //     borderWidth: 1, borderColor: T.primaryBorder,
// //   },
// //   tabActive        : { backgroundColor: T.primaryLight, borderColor: T.primary },
// //   tabText          : { fontSize: 11, fontWeight: '600', color: T.inactive },
// //   tabTextActive    : { color: T.primary },
// //   tabBadge         : { backgroundColor: '#E2E8F0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
// //   tabBadgeActive   : { backgroundColor: T.primary },
// //   tabBadgeText     : { fontSize: 10, fontWeight: '700', color: T.inactive },
// //   tabBadgeTextActive: { color: T.surface },

// //   // Closed chat card
// //   chatCard: {
// //     flexDirection: 'row', alignItems: 'center',
// //     backgroundColor: T.surface, marginHorizontal: 16, marginBottom: 10, marginTop: 2,
// //     borderRadius: 16, padding: 14,
// //     borderWidth: 1, borderColor: T.primaryBorder,
// //     shadowColor: T.primary, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
// //     gap: 12,
// //   },
// //   chatAvatar    : { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// //   chatAvatarText: { fontSize: 16, fontWeight: '800', color: T.surface },
// //   chatStatusDot : { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: T.surface },
// //   chatContent   : { flex: 1, gap: 3 },
// //   chatTopRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
// //   chatBottomRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
// //   chatUser      : { fontSize: 14, fontWeight: '700', color: T.textMain, flex: 1, marginRight: 8 },
// //   chatLast      : { fontSize: 12, color: T.textSub, flex: 1 },
// //   chatTime      : { fontSize: 11, color: T.inactive },
// //   newBadge      : { backgroundColor: T.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
// //   newBadgeText  : { fontSize: 9, fontWeight: '800', color: T.primaryMid, letterSpacing: 0.5 },
// //   categoryPill  : {
// //     flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
// //     backgroundColor: T.primaryLight, paddingHorizontal: 7, paddingVertical: 2,
// //     borderRadius: 8, marginTop: 2,
// //   },
// //   categoryText: { fontSize: 10, color: T.primary, fontWeight: '600' },

// //   // Broadcast card
// //   bcastCard: {
// //     flexDirection: 'row',
// //     marginHorizontal: 16, marginBottom: 12, marginTop: 2,
// //     borderRadius: 18,
// //     backgroundColor: T.primaryLight,
// //     borderWidth: 1.5, borderColor: T.primaryBorder,
// //     shadowColor: T.primary, shadowOpacity: 0.10, shadowRadius: 8,
// //     shadowOffset: { width: 0, height: 3 }, elevation: 3,
// //     overflow: 'hidden',
// //   },
// //   bcastStripe    : { width: 5, backgroundColor: T.primary },
// //   bcastBody      : { flex: 1, padding: 14, gap: 8 },
// //   bcastTopRow    : { flexDirection: 'row', alignItems: 'center', gap: 10 },
// //   bcastAvatar    : { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', position: 'relative' },
// //   bcastAvatarText: { fontSize: 15, fontWeight: '800', color: T.surface },
// //   bcastAvatarDot : { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: T.primaryLight },
// //   bcastUserInfo  : { flex: 1 },
// //   bcastUserName  : { fontSize: 14, fontWeight: '800', color: T.textMain },
// //   bcastTime      : { fontSize: 11, color: T.inactive, marginTop: 1 },
// //   bcastPill      : {
// //     flexDirection: 'row', alignItems: 'center', gap: 3,
// //     backgroundColor: T.surface, paddingHorizontal: 8, paddingVertical: 3,
// //     borderRadius: 10, borderWidth: 1, borderColor: T.primaryBorder,
// //   },
// //   bcastPillText: { fontSize: 10, fontWeight: '800', color: T.primaryMid },

// //   bcastTopicRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
// //   bcastTopicText: { fontSize: 12, fontWeight: '600', color: T.primary, flexShrink: 1 },

// //   bcastMsgRow : {
// //     flexDirection: 'row', alignItems: 'center', gap: 7,
// //     backgroundColor: T.surface, paddingHorizontal: 10, paddingVertical: 8,
// //     borderRadius: 10, borderWidth: 1, borderColor: T.primaryBorder,
// //   },
// //   bcastMsgText: { fontSize: 12, color: T.textSub, flex: 1 },

// //   bcastFooter    : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
// //   bcastExpertWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
// //   bcastExpertText: { fontSize: 11, color: T.primary, fontWeight: '600' },
// //   bcastReplyBtn  : {
// //     flexDirection: 'row', alignItems: 'center', gap: 6,
// //     backgroundColor: T.primary, borderRadius: 10,
// //     paddingHorizontal: 16, paddingVertical: 8,
// //   },
// //   bcastReplyText: { fontSize: 13, fontWeight: '800', color: T.surface },

// //   // Empty state
// //   emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
// //   empty        : { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
// //   emptyTitle   : { fontSize: 16, fontWeight: '700', color: T.textSub, marginBottom: 6 },
// //   emptySubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center', lineHeight: 18 },

// //   // Error
// //   errorTitle   : { fontSize: 18, fontWeight: '700', color: T.textMain, marginTop: 16, marginBottom: 6 },
// //   errorSubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center' },

// //   // Modal
// //   modalOverlay : { flex: 1, justifyContent: 'flex-end' },
// //   modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
// //   modalBox     : {
// //     backgroundColor: T.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
// //     paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%',
// //   },
// //   modalHandle  : { width: 40, height: 4, backgroundColor: T.primaryBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
// //   modalHeader  : { alignItems: 'center', paddingBottom: 16 },
// //   modalAvatar  : { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
// //   modalAvatarText: { fontSize: 26, fontWeight: '800', color: T.surface },
// //   modalUserName: { fontSize: 20, fontWeight: '800', color: T.textMain },
// //   modalSection : { backgroundColor: T.bg, borderRadius: 16, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: T.primaryBorder },
// //   modalRow     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
// //   modalRowLeft : { flexDirection: 'row', alignItems: 'center', gap: 8 },
// //   modalRowIcon : { width: 28, height: 28, borderRadius: 8, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.primaryBorder },
// //   modalLabel   : { fontSize: 13, color: T.textSub, fontWeight: '500' },
// //   modalValue   : { fontSize: 13, color: T.textMain, fontWeight: '600', textAlign: 'right', maxWidth: '55%' },
// //   modalDivider : { height: 1, backgroundColor: T.primaryBorder },
// //   actionClose  : {
// //     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
// //     borderRadius: 14, padding: 15, marginBottom: 10,
// //     backgroundColor: T.bg, borderWidth: 1, borderColor: T.primaryBorder,
// //   },
// //   actionCloseText: { fontSize: 15, fontWeight: '700', color: T.textSub },
// // });


// // ExpertDashboard.jsx — Chat tabs hata ke Category List add ki

// import React, {
//   useEffect, useState, useCallback, useMemo, useRef, memo,
// } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   StatusBar, RefreshControl, Image,
//   Animated, Platform,
// } from 'react-native';
// import {
//   getFirestore, collection, query,
//   onSnapshot, doc, orderBy,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// const T = {
//   primary      : '#0D7B7A',
//   primaryLight : '#F0FDFA',
//   primaryBorder: '#E0F2F1',
//   primaryMid   : '#0F6E56',
//   bg           : '#F4FAFA',
//   surface      : '#FFFFFF',
//   textMain     : '#0F172A',
//   textSub      : '#64748B',
//   inactive     : '#94A3B8',
//   border       : '#F1F5F9',
//   success      : '#065F46',
//   successBg    : '#D1FAE5',
//   danger       : '#DC2626',
//   dangerBg     : '#FEE2E2',
// };

// const CARD_COLORS = [
//   { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A' },
//   { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB' },
//   { bg: '#FFF7ED', border: '#FDC08A', icon: '#EA580C' },
//   { bg: '#FDF4FF', border: '#E09FFF', icon: '#9333EA' },
//   { bg: '#FFF1F2', border: '#FDA4AF', icon: '#E11D48' },
//   { bg: '#F0FDFA', border: '#5EEAD4', icon: '#0D9488' },
//   { bg: '#FEFCE8', border: '#FDE047', icon: '#CA8A04' },
//   { bg: '#F0F9FF', border: '#7DD3FC', icon: '#0284C7' },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const AVATAR_COLORS = ['#0D7B7A','#7C3AED','#DB2777','#059669','#0891B2','#DC2626','#2563EB'];
// const getColor    = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
// const getInitials = (name) => {
//   if (!name) return '?';
//   const p = name.trim().split(' ');
//   return p.length >= 2
//     ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
//     : p[0][0].toUpperCase();
// };

// // ─── SkeletonBox ──────────────────────────────────────────────────────────────
// const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
//   const anim = useRef(new Animated.Value(0.4)).current;
//   useEffect(() => {
//     Animated.loop(Animated.sequence([
//       Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
//       Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
//     ])).start();
//   }, [anim]);
//   return (
//     <Animated.View
//       style={[{ width, height, borderRadius, backgroundColor: '#C8EEEB', opacity: anim }, style]}
//     />
//   );
// });

// // ─── ProfileCard ──────────────────────────────────────────────────────────────
// const ProfileCard = memo(({ profile }) => (
//   <View style={styles.profileCard}>
//     <View style={styles.profileInfo}>
//       <Text style={styles.profileCategory}>
//         {profile?.categoryName || 'No Category'}
//         {profile?.subcategoryName ? `  ·  ${profile.subcategoryName}` : ''}
//       </Text>
//       <View style={styles.profileMetaRow}>
//         <MatIcon name="school-outline" size={13} color={T.primary} />
//         <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
//       </View>
//       {!!profile?.experience && (
//         <View style={styles.profileMetaRow}>
//           <MatIcon name="briefcase-outline" size={13} color={T.primary} />
//           <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
//         </View>
//       )}
//     </View>
//     <View style={[
//       styles.statusPill,
//       { backgroundColor: profile?.isActive === false ? T.dangerBg : T.successBg },
//     ]}>
//       <View style={[
//         styles.statusDot,
//         { backgroundColor: profile?.isActive === false ? T.danger : '#10B981' },
//       ]} />
//       <Text style={[
//         styles.statusPillText,
//         { color: profile?.isActive === false ? T.danger : T.success },
//       ]}>
//         {profile?.isActive === false ? 'Inactive' : 'Active'}
//       </Text>
//     </View>
//   </View>
// ));

// // ─── CategoryRow ──────────────────────────────────────────────────────────────
// const CategoryRow = memo(({ item, index, onPress }) => {
//   const palette = CARD_COLORS[index % CARD_COLORS.length];
//   return (
//     <TouchableOpacity
//       style={[styles.catRow, { backgroundColor: palette.bg, borderColor: palette.border }]}
//       onPress={onPress}
//       activeOpacity={0.78}
//     >
//       <View style={[styles.catIconWrap, { backgroundColor: palette.border + '55' }]}>
//         {item.icon ? (
//           <Image source={{ uri: item.icon }} style={styles.catImage} resizeMode="cover" />
//         ) : (
//           <Text style={styles.catEmoji}>📁</Text>
//         )}
//       </View>
//       <View style={styles.catTextWrap}>
//         <Text style={styles.catName}>{item.name}</Text>
//         {item.description ? (
//           <Text style={styles.catDesc} numberOfLines={2}>{item.description}</Text>
//         ) : null}
//       </View>
//       <View style={[styles.catArrow, { backgroundColor: palette.border }]}>
//         <Icon name="chevron-forward" size={15} color={palette.icon} />
//       </View>
//     </TouchableOpacity>
//   );
// });

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function ExpertDashboard({ navigation }) {
//   const dispatch = useDispatch();
//   const flatListRef = useRef(null);

//   const [profile,    setProfile]    = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [loading,    setLoading]    = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error,      setError]      = useState(null);

//   const db  = useMemo(() => getFirestore(), []);
//   const uid = useMemo(() => auth().currentUser?.uid, []);

//   // Profile listener
//   useEffect(() => {
//     if (!uid) return;
//     return onSnapshot(
//       doc(db, 'users', uid),
//       (snap) => { if (snap.exists()) setProfile(snap.data()); },
//       (err)  => { console.error('Profile:', err); setError('Failed to load profile.'); },
//     );
//   }, [db, uid]);

//   // Categories listener — same query as HomeScreen
//   useEffect(() => {
//     const q = query(collection(db, 'categories'), orderBy('subcategoryCount', 'desc'));
//     return onSnapshot(q, (snap) => {
//       setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//       setLoading(false);
//     }, (err) => {
//       console.error('Categories:', err);
//       setError('Failed to load categories.');
//       setLoading(false);
//     });
//   }, [db]);

//   const handleLogout = useCallback(async () => {
//     try { await auth().signOut(); dispatch(logout()); }
//     catch (e) { console.error('Logout:', e); }
//   }, [dispatch]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 800);
//   }, []);

//   // Navigate to subcategory list or expert list (same logic as HomeScreen)
//   const handleCategoryPress = useCallback((item) => {
//     navigation?.navigate('SubCategoryList', {
//       categoryId  : item.id,
//     categoryName: item.name,
//       categoryIcon: item.icon,
//     });
//   }, [navigation]);

//   const keyExtractor = useCallback((item) => item.id, []);

//   const renderItem = useCallback(({ item, index }) => (
//     <CategoryRow item={item} index={index} onPress={() => handleCategoryPress(item)} />
//   ), [handleCategoryPress]);

//   const ListHeaderComponent = useCallback(() => (
//     <View>
//       <ProfileCard profile={profile} />
//       <Text style={styles.sectionLabel}>Browse Categories</Text>
//     </View>
//   ), [profile]);

//   const ListEmptyComponent = useCallback(() => (
//     <View style={styles.empty}>
//       <View style={styles.emptyIconWrap}>
//         <MatIcon name="shape-outline" size={40} color={T.primary} />
//       </View>
//       <Text style={styles.emptyTitle}>No Categories Found</Text>
//       <Text style={styles.emptySubtitle}>Categories will appear here once added</Text>
//     </View>
//   ), []);

//   // ── Loading ───────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor={T.surface} />
//         <View style={styles.header}>
//           <View style={styles.headerLeft}>
//             <SkeletonBox width={44} height={44} borderRadius={22} />
//             <View style={{ gap: 6 }}>
//               <SkeletonBox width={80}  height={12} />
//               <SkeletonBox width={120} height={16} />
//             </View>
//           </View>
//           <SkeletonBox width={72} height={34} borderRadius={20} />
//         </View>
//         <View style={{ padding: 16, gap: 12 }}>
//           <SkeletonBox width="100%" height={120} borderRadius={16} />
//           {[1,2,3,4].map((k) => <SkeletonBox key={k} width="100%" height={72} borderRadius={14} />)}
//         </View>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <MatIcon name="alert-circle-outline" size={52} color={T.danger} />
//         <Text style={styles.errorTitle}>Something went wrong</Text>
//         <Text style={styles.errorSubtitle}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={T.surface} />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <View style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}>
//             <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
//           </View>
//           <View>
//             <Text style={styles.headerGreeting}>Welcome back 👋</Text>
//             <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
//           <Icon name="log-out-outline" size={16} color={T.danger} />
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         ref={flatListRef}
//         data={categories}
//         keyExtractor={keyExtractor}
//         renderItem={renderItem}
//         ListHeaderComponent={ListHeaderComponent}
//         ListEmptyComponent={ListEmptyComponent}
//         ListFooterComponent={<View style={{ height: 48 }} />}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[T.primary]}
//             tintColor={T.primary}
//           />
//         }
//         initialNumToRender={10}
//         maxToRenderPerBatch={8}
//         windowSize={7}
//         removeClippedSubviews={Platform.OS === 'android'}
//         contentContainerStyle={styles.listContent}
//       />
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container  : { flex: 1, backgroundColor: T.bg },
//   centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   listContent: { paddingBottom: 20 },

//   header: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: T.surface, paddingHorizontal: 20,
//     paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: T.primaryBorder,
//   },
//   headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   headerAvatar    : { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
//   headerAvatarText: { fontSize: 17, fontWeight: '800', color: T.surface },
//   headerGreeting  : { fontSize: 11, color: T.inactive, fontWeight: '500' },
//   headerName      : { fontSize: 16, fontWeight: '700', color: T.textMain, marginTop: 1 },
//   logoutBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 5,
//     backgroundColor: T.dangerBg, paddingHorizontal: 12, paddingVertical: 8,
//     borderRadius: 20, borderWidth: 1, borderColor: '#FECACA',
//   },
//   logoutText: { color: T.danger, fontWeight: '600', fontSize: 13 },

//   profileCard: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: T.surface, marginHorizontal: 16, marginTop: 16,
//     borderRadius: 18, padding: 16,
//     borderWidth: 1, borderColor: T.primaryBorder,
//     shadowColor: T.primary, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
//     gap: 14,
//   },
//   profileInfo    : { flex: 1, gap: 7 },
//   profileCategory: { fontSize: 14, fontWeight: '800', color: T.textMain, marginBottom: 2 },
//   profileMetaRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   profileMeta    : { fontSize: 12, color: T.textSub, fontWeight: '500', flex: 1 },
//   statusPill     : { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
//   statusDot      : { width: 6, height: 6, borderRadius: 3 },
//   statusPillText : { fontSize: 11, fontWeight: '700' },

//   sectionLabel: {
//     fontSize: 11, fontWeight: '700', color: T.inactive,
//     letterSpacing: 1.2, textTransform: 'uppercase',
//     marginLeft: 20, marginTop: 24, marginBottom: 12,
//   },

//   // Category rows — same as HomeScreen
//   catRow: {
//     flexDirection: 'row', alignItems: 'center',
//     borderRadius: 18, marginHorizontal: 16, marginBottom: 10,
//     padding: 14, borderWidth: 1.5, gap: 14,
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 }, elevation: 2,
//   },
//   catIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
//   catImage   : { width: '100%', height: '100%', borderRadius: 10 },
//   catEmoji   : { fontSize: 26 },
//   catTextWrap: { flex: 1 },
//   catName    : { fontSize: 15, fontWeight: '800', color: T.textMain, marginBottom: 3 },
//   catDesc    : { fontSize: 12, color: T.textSub, lineHeight: 17 },
//   catArrow   : { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

//   emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
//   empty        : { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
//   emptyTitle   : { fontSize: 16, fontWeight: '700', color: T.textSub, marginBottom: 6 },
//   emptySubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center', lineHeight: 18 },

//   errorTitle   : { fontSize: 18, fontWeight: '700', color: T.textMain, marginTop: 16, marginBottom: 6 },
//   errorSubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center' },
// });



// ExpertDashboard.jsx

import React, {
  useEffect, useState, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image,
  Animated, Platform,
} from 'react-native';
import {
  getFirestore, collection, query,
  onSnapshot, doc, orderBy,
  getDocs, limit,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  primary      : '#0D7B7A',
  primaryLight : '#F0FDFA',
  primaryBorder: '#E0F2F1',
  primaryMid   : '#0F6E56',
  bg           : '#F4FAFA',
  surface      : '#FFFFFF',
  textMain     : '#0F172A',
  textSub      : '#64748B',
  inactive     : '#94A3B8',
  border       : '#F1F5F9',
  success      : '#065F46',
  successBg    : '#D1FAE5',
  danger       : '#DC2626',
  dangerBg     : '#FEE2E2',
};

const CARD_COLORS = [
  { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A' },
  { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB' },
  { bg: '#FFF7ED', border: '#FDC08A', icon: '#EA580C' },
  { bg: '#FDF4FF', border: '#E09FFF', icon: '#9333EA' },
  { bg: '#FFF1F2', border: '#FDA4AF', icon: '#E11D48' },
  { bg: '#F0FDFA', border: '#5EEAD4', icon: '#0D9488' },
  { bg: '#FEFCE8', border: '#FDE047', icon: '#CA8A04' },
  { bg: '#F0F9FF', border: '#7DD3FC', icon: '#0284C7' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#0D7B7A', '#7C3AED', '#DB2777',
  '#059669', '#0891B2', '#DC2626', '#2563EB',
];
const getColor    = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2
    ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
    : p[0][0].toUpperCase();
};

// ─── SkeletonBox ───────────────────────────────────────────────────────────────
const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, [anim]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#C8EEEB', opacity: anim }, style]}
    />
  );
});

// ─── ProfileCard ───────────────────────────────────────────────────────────────
const ProfileCard = memo(({ profile }) => (
  <View style={styles.profileCard}>
    <View style={styles.profileInfo}>
      <Text style={styles.profileCategory}>
        {profile?.categoryName || 'No Category'}
        {profile?.subcategoryName ? `  ·  ${profile.subcategoryName}` : ''}
      </Text>
      <View style={styles.profileMetaRow}>
        <MatIcon name="school-outline" size={13} color={T.primary} />
        <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
      </View>
      {!!profile?.experience && (
        <View style={styles.profileMetaRow}>
          <MatIcon name="briefcase-outline" size={13} color={T.primary} />
          <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
        </View>
      )}
    </View>
    <View style={[
      styles.statusPill,
      { backgroundColor: profile?.isActive === false ? T.dangerBg : T.successBg },
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: profile?.isActive === false ? T.danger : '#10B981' },
      ]} />
      <Text style={[
        styles.statusPillText,
        { color: profile?.isActive === false ? T.danger : T.success },
      ]}>
        {profile?.isActive === false ? 'Inactive' : 'Active'}
      </Text>
    </View>
  </View>
));

// ─── CategoryRow ───────────────────────────────────────────────────────────────
const CategoryRow = memo(({ item, index, onPress }) => {
  const palette = CARD_COLORS[index % CARD_COLORS.length];
  return (
    <TouchableOpacity
      style={[styles.catRow, { backgroundColor: palette.bg, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.catIconWrap, { backgroundColor: palette.border + '55' }]}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.catImage} resizeMode="cover" />
        ) : (
          <Text style={styles.catEmoji}>📁</Text>
        )}
      </View>
      <View style={styles.catTextWrap}>
        <Text style={styles.catName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.catDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <View style={[styles.catArrow, { backgroundColor: palette.border }]}>
        <Icon name="chevron-forward" size={15} color={palette.icon} />
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ExpertDashboard({ navigation }) {
  const dispatch     = useDispatch();
  const flatListRef  = useRef(null);

  const [profile,      setProfile]      = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [hasSubcatMap, setHasSubcatMap] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);

  const db  = useMemo(() => getFirestore(), []);
  const uid = useMemo(() => auth().currentUser?.uid, []);

  // ── Profile listener ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => { if (snap.exists()) setProfile(snap.data()); },
      (err)  => { console.error('Profile:', err); setError('Failed to load profile.'); },
    );
  }, [db, uid]);

  // ── Categories listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('subcategoryCount', 'desc'));
    return onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Categories:', err);
      setError('Failed to load categories.');
      setLoading(false);
    });
  }, [db]);

  // ── Pre-check subcategory existence ─────────────────────────────────────────
  useEffect(() => {
    if (!categories.length) return;

    categories.forEach((cat) => {
      if (hasSubcatMap[cat.id] !== undefined) return;

      const subColRef = collection(db, 'categories', cat.id, 'subcategories');
      getDocs(query(subColRef, limit(1)))
        .then((snap) => {
          setHasSubcatMap((prev) => ({ ...prev, [cat.id]: !snap.empty }));
        })
        .catch(() => {
          setHasSubcatMap((prev) => ({ ...prev, [cat.id]: false }));
        });
    });
  }, [categories, hasSubcatMap, db]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try { await auth().signOut(); dispatch(logout()); }
    catch (e) { console.error('Logout:', e); }
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleCategoryPress = useCallback((item) => {
    const hasSub = hasSubcatMap[item.id];
    if (hasSub) {
      navigation.navigate('SubCategoryList', {
        categoryId  : item.id,
        categoryName: item.name,
        categoryIcon: item.icon,
      });
    } else {
      navigation.navigate('ExpertList', {
        categoryId  : item.id,
        categoryName: item.name,
      });
    }
  }, [navigation, hasSubcatMap]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item, index }) => (
    <CategoryRow
      item={item}
      index={index}
      onPress={() => handleCategoryPress(item)}
    />
  ), [handleCategoryPress]);

  const ListHeaderComponent = useCallback(() => (
    <View>
      <ProfileCard profile={profile} />
      <Text style={styles.sectionLabel}>Browse Services</Text>
    </View>
  ), [profile]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <MatIcon name="shape-outline" size={40} color={T.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Services Found</Text>
      <Text style={styles.emptySubtitle}>Services will appear here once added</Text>
    </View>
  ), []);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={T.surface} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
            <View style={{ gap: 6 }}>
              <SkeletonBox width={80}  height={12} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
          <SkeletonBox width={72} height={34} borderRadius={20} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBox width="100%" height={100} borderRadius={16} />
          {[1, 2, 3, 4].map((k) => (
            <SkeletonBox key={k} width="100%" height={72} borderRadius={14} />
          ))}
        </View>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MatIcon name="alert-circle-outline" size={52} color={T.danger} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={T.surface} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}>
            <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Welcome back 👋</Text>
            <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={16} color={T.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={categories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<View style={{ height: 80 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[T.primary]}
            tintColor={T.primary}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: T.bg,marginTop:40 },
  centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listContent: { paddingBottom: 20 ,},

  // Header
  header: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    backgroundColor  : T.surface,
    paddingHorizontal: 20,
    paddingTop       : Platform.OS === 'ios' ? 56 : 20,
    paddingBottom    : 16,
    borderBottomWidth: 1,
    borderBottomColor: T.primaryBorder,
  },
  headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar    : { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { fontSize: 17, fontWeight: '800', color: T.surface },
  headerGreeting  : { fontSize: 11, color: T.inactive, fontWeight: '500' },
  headerName      : { fontSize: 16, fontWeight: '700', color: T.textMain, marginTop: 1 },
  logoutBtn: {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : 5,
    backgroundColor : T.dangerBg,
    paddingHorizontal: 12,
    paddingVertical : 8,
    borderRadius    : 20,
    borderWidth     : 1,
    borderColor     : '#FECACA',
  },
  logoutText: { color: T.danger, fontWeight: '600', fontSize: 13 },

  // Profile card
  profileCard: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : T.surface,
    marginHorizontal : 16,
    marginTop        : 16,
    borderRadius     : 18,
    padding          : 16,
    borderWidth      : 1,
    borderColor      : T.primaryBorder,
    shadowColor      : T.primary,
    shadowOpacity    : 0.08,
    shadowRadius     : 10,
    elevation        : 3,
    gap              : 14,
  },
  profileInfo    : { flex: 1, gap: 7 },
  profileCategory: { fontSize: 14, fontWeight: '800', color: T.textMain, marginBottom: 2 },
  profileMetaRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileMeta    : { fontSize: 12, color: T.textSub, fontWeight: '500', flex: 1 },
  statusPill     : {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius  : 20,
  },
  statusDot      : { width: 6, height: 6, borderRadius: 3 },
  statusPillText : { fontSize: 11, fontWeight: '700' },

  // Section label
  sectionLabel: {
    fontSize       : 11,
    fontWeight     : '700',
    color          : T.inactive,
    letterSpacing  : 1.2,
    textTransform  : 'uppercase',
    marginLeft     : 20,
    marginTop      : 24,
    marginBottom   : 12,
  },

  // Category rows
  catRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    borderRadius     : 18,
    marginHorizontal : 16,
    marginBottom     : 10,
    padding          : 14,
    borderWidth      : 1.5,
    gap              : 14,
    shadowColor      : '#000',
    shadowOpacity    : 0.04,
    shadowRadius     : 6,
    shadowOffset     : { width: 0, height: 2 },
    elevation        : 2,
  },
  catIconWrap: {
    width          : 52,
    height         : 52,
    borderRadius   : 16,
    justifyContent : 'center',
    alignItems     : 'center',
    flexShrink     : 0,
  },
  catImage   : { width: '100%', height: '100%', borderRadius: 10 },
  catEmoji   : { fontSize: 26 },
  catTextWrap: { flex: 1 },
  catName    : { fontSize: 15, fontWeight: '800', color: T.textMain, marginBottom: 3 },
  catDesc    : { fontSize: 12, color: T.textSub, lineHeight: 17 },
  catArrow   : {
    width          : 30,
    height         : 30,
    borderRadius   : 15,
    justifyContent : 'center',
    alignItems     : 'center',
    flexShrink     : 0,
  },

  // Empty state
  emptyIconWrap: {
    width          : 80,
    height         : 80,
    borderRadius   : 24,
    backgroundColor: T.primaryLight,
    justifyContent : 'center',
    alignItems     : 'center',
    marginBottom   : 14,
  },
  empty        : { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle   : { fontSize: 16, fontWeight: '700', color: T.textSub, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center', lineHeight: 18 },

  // Error
  errorTitle   : { fontSize: 18, fontWeight: '700', color: T.textMain, marginTop: 16, marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: T.inactive, textAlign: 'center' },
});