// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   ActivityIndicator, StatusBar, FlatList, Modal, RefreshControl,
// } from 'react-native';
// import {
//   getFirestore, collection, onSnapshot, query,
//   orderBy, where, doc, updateDoc, getDoc,
// } from '@react-native-firebase/firestore';
// import { getAuth } from '@react-native-firebase/auth';

// export default function ExpertDashboard({ navigation }) {
//   const [profile, setProfile]         = useState(null);
//   const [chats, setChats]             = useState([]);
//   const [notifications, setNotifs]    = useState([]);
//   const [loading, setLoading]         = useState(true);
//   const [refreshing, setRefreshing]   = useState(false);
//   const [activeTab, setActiveTab]     = useState('pending'); // pending | active | closed
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [notifModal, setNotifModal]   = useState(false);

//   const auth = getAuth();
//   const uid  = auth.currentUser?.uid;
//   const db   = getFirestore();

//   // ─── Load Expert Profile ─────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) return;
//     const unsub = onSnapshot(doc(db, 'experts', uid), (snap) => {
//         console.log(snap);
//       if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
//       setLoading(false);
//     }, (err) => { console.error(err); setLoading(false); });
//     return unsub;
//   }, [uid]);

//   // ─── Load Chats for this expert ──────────────────────────────────
//   useEffect(() => {
//     if (!uid) return;
//     const q = query(
//       collection(db, 'chats'),
//       where('expertId', '==', uid),
//       orderBy('updatedAt', 'desc'),
//     );
//     const unsub = onSnapshot(q,
//       (snap) => setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
//       (err)  => console.error('Chats error:', err),
//     );
//     return unsub;
//   }, [uid]);

//   // ─── Load Notifications ──────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) return;
//     const q = query(
//       collection(db, 'notifications'),
//       where('expertId', '==', uid),
//       orderBy('createdAt', 'desc'),
//     );
//     const unsub = onSnapshot(q,
//       (snap) => setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
//       (err)  => console.error('Notif error:', err),
//     );
//     return unsub;
//   }, [uid]);

//   // ─── Helpers ─────────────────────────────────────────────────────
//   const formatTime = (ts) => {
//     if (!ts?.toDate) return '—';
//     const d    = ts.toDate();
//     const diff = Math.floor((new Date() - d) / 60000);
//     if (diff < 1)    return 'Just now';
//     if (diff < 60)   return `${diff}m ago`;
//     if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
//     return d.toLocaleDateString('en-IN');
//   };

//   const getInitials = (name) => {
//     if (!name) return '?';
//     const p = name.trim().split(' ');
//     return p.length >= 2
//       ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
//       : p[0][0].toUpperCase();
//   };

//   const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626', '#0891B2'];
//   const getColor  = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

//   const pendingChats  = chats.filter((c) => !c.expertAccepted && c.isActive);
//   const activeChats   = chats.filter((c) => c.expertAccepted  && c.isActive);
//   const closedChats   = chats.filter((c) => !c.isActive);
//   const unreadNotifs  = notifications.filter((n) => !n.isRead).length;

//   const tabData = {
//     pending : pendingChats,
//     active  : activeChats,
//     closed  : closedChats,
//   };

//   // ─── Accept chat ─────────────────────────────────────────────────
//   const acceptChat = async (chatId) => {
//     await updateDoc(doc(db, 'chats', chatId), { expertAccepted: true });
//     setSelectedChat(null);
//   };

//   // ─── Mark notification read ──────────────────────────────────────
//   const markAllRead = async () => {
//     const unread = notifications.filter((n) => !n.isRead);
//     await Promise.all(
//       unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { isRead: true })),
//     );
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   if (loading) return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#2563EB" />
//     </View>
//   );

//   // ─── STAT CARDS data ─────────────────────────────────────────────
//   const STATS = [
//     { label: 'Total Chats',   value: chats.length,         color: '#2563EB', bg: '#EFF6FF', icon: '💬' },
//     { label: 'Pending',       value: pendingChats.length,  color: '#D97706', bg: '#FFFBEB', icon: '⏳' },
//     { label: 'Active',        value: activeChats.length,   color: '#059669', bg: '#ECFDF5', icon: '🟢' },
//     { label: 'Closed',        value: closedChats.length,   color: '#64748B', bg: '#F1F5F9', icon: '🔒' },
//   ];

//   const TABS = [
//     { key: 'pending', label: 'Pending', count: pendingChats.length },
//     { key: 'active',  label: 'Active',  count: activeChats.length  },
//     { key: 'closed',  label: 'Closed',  count: closedChats.length  },
//   ];

//   // ─── Chat Card ───────────────────────────────────────────────────
//   const ChatCard = ({ item }) => (
//     <TouchableOpacity style={styles.chatCard} onPress={() => setSelectedChat(item)}>
//       <View style={[styles.chatAvatar, { backgroundColor: getColor(item.userName) }]}>
//         <Text style={styles.chatAvatarText}>{getInitials(item.userName)}</Text>
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.chatUser}>{item.userName || 'User'}</Text>
//         <Text style={styles.chatLast} numberOfLines={1}>{item.lastMessage || 'No message yet'}</Text>
//         <Text style={styles.chatCategory}>{item.category || ''}</Text>
//       </View>
//       <View style={{ alignItems: 'flex-end', gap: 4 }}>
//         <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
//         {!item.expertAccepted && item.isActive && (
//           <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
//         )}
//         <Text style={styles.arrow}>›</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   // ─── Main Render ─────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.greeting}>Hello,</Text>
//           <Text style={styles.expertName}>{profile?.name || 'Expert'} 👋</Text>
//         </View>
//         <TouchableOpacity
//           style={styles.notifBtn}
//           onPress={() => { setNotifModal(true); markAllRead(); }}
//         >
//           <Text style={{ fontSize: 22 }}>🔔</Text>
//           {unreadNotifs > 0 && (
//             <View style={styles.notifDot}>
//               <Text style={styles.notifDotText}>{unreadNotifs}</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
//       >
//         {/* ── Profile Card ── */}
//         <TouchableOpacity
//           style={styles.profileCard}
//           onPress={() => navigation?.navigate('ExpertProfile')}
//         >
//           <View style={[styles.profileAvatar, { backgroundColor: getColor(profile?.name) }]}>
//             <Text style={styles.profileAvatarText}>{getInitials(profile?.name)}</Text>
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.profileName}>{profile?.name || '—'}</Text>
//             <Text style={styles.profileSpecialty}>{profile?.specialty || profile?.category || '—'}</Text>
//             <Text style={styles.profileEmail}>{profile?.email || '—'}</Text>
//           </View>
//           <View style={[
//             styles.onlineBadge,
//             { backgroundColor: profile?.isOnline ? '#D1FAE5' : '#F1F5F9' },
//           ]}>
//             <Text style={{ fontSize: 11, fontWeight: '700', color: profile?.isOnline ? '#065F46' : '#64748B' }}>
//               {profile?.isOnline ? '🟢 Online' : '⚫ Offline'}
//             </Text>
//           </View>
//         </TouchableOpacity>

//         {/* ── Stats Grid ── */}
//         <Text style={styles.sectionTitle}>📊 Overview</Text>
//         <View style={styles.statsGrid}>
//           {STATS.map((s) => (
//             <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
//               <Text style={styles.statIcon}>{s.icon}</Text>
//               <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
//               <Text style={styles.statLabel}>{s.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* ── Chat Tabs ── */}
//         <Text style={styles.sectionTitle}>💬 My Chats</Text>
//         <View style={styles.tabRow}>
//           {TABS.map((tab) => (
//             <TouchableOpacity
//               key={tab.key}
//               style={[styles.tab, activeTab === tab.key && styles.tabActive]}
//               onPress={() => setActiveTab(tab.key)}
//             >
//               <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
//                 {tab.label}
//               </Text>
//               <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
//                 <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
//                   {tab.count}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Chat List */}
//         {tabData[activeTab].length === 0 ? (
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>
//               {activeTab === 'pending' ? '⏳' : activeTab === 'active' ? '💬' : '🔒'}
//             </Text>
//             <Text style={styles.emptyText}>
//               {activeTab === 'pending' ? 'Koi pending chat nahi'
//                 : activeTab === 'active' ? 'Koi active chat nahi'
//                 : 'Koi closed chat nahi'}
//             </Text>
//           </View>
//         ) : (
//           tabData[activeTab].map((item) => <ChatCard key={item.id} item={item} />)
//         )}

//         <View style={{ height: 40 }} />
//       </ScrollView>

//       {/* ── Chat Detail Modal ── */}
//       <Modal
//         visible={!!selectedChat}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setSelectedChat(null)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <View style={styles.modalHandle} />
//             {selectedChat && (
//               <ScrollView showsVerticalScrollIndicator={false}>

//                 <View style={styles.detailTop}>
//                   <View style={[styles.detailAvatar, { backgroundColor: getColor(selectedChat.userName) }]}>
//                     <Text style={styles.detailAvatarText}>{getInitials(selectedChat.userName)}</Text>
//                   </View>
//                   <Text style={styles.detailName}>{selectedChat.userName || 'User'}</Text>
//                   <View style={[
//                     styles.statusBadge,
//                     { backgroundColor: selectedChat.isActive ? '#D1FAE5' : '#F1F5F9' },
//                   ]}>
//                     <Text style={{ fontSize: 12, fontWeight: '700', color: selectedChat.isActive ? '#065F46' : '#64748B' }}>
//                       {selectedChat.expertAccepted ? '🟢 Active' : selectedChat.isActive ? '⏳ Pending' : '🔒 Closed'}
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.detailSection}>
//                   <Text style={styles.detailSectionTitle}>📋 Chat Info</Text>
//                   {[
//                     ['User',         selectedChat.userName     || '—'],
//                     ['Category',     selectedChat.category     || '—'],
//                     ['Last Message', selectedChat.lastMessage  || '—'],
//                     ['Started',      selectedChat.createdAt?.toDate
//                       ? selectedChat.createdAt.toDate().toLocaleDateString('en-IN') : '—'],
//                     ['Last Updated', formatTime(selectedChat.updatedAt)],
//                   ].map(([label, value]) => (
//                     <View key={label}>
//                       <View style={styles.detailRow}>
//                         <Text style={styles.detailLabel}>{label}</Text>
//                         <Text style={[styles.detailValue, { maxWidth: '55%' }]} numberOfLines={2}>{value}</Text>
//                       </View>
//                       <View style={styles.detailDivider} />
//                     </View>
//                   ))}
//                 </View>

//                 {/* Accept button — only for pending chats */}
//                 {!selectedChat.expertAccepted && selectedChat.isActive && (
//                   <TouchableOpacity
//                     style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]}
//                     onPress={() => acceptChat(selectedChat.id)}
//                   >
//                     <Text style={{ fontWeight: '700', fontSize: 15, color: '#065F46' }}>
//                       ✅ Accept & Reply
//                     </Text>
//                   </TouchableOpacity>
//                 )}

//                 {/* Reply button — for accepted chats */}
//                 {selectedChat.expertAccepted && selectedChat.isActive && (
//                   <TouchableOpacity
//                     style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
//                     onPress={() => {
//                       setSelectedChat(null);
//                       navigation?.navigate('ReplyChat', { chatId: selectedChat.id });
//                     }}
//                   >
//                     <Text style={{ fontWeight: '700', fontSize: 15, color: '#2563EB' }}>
//                       💬 Open Chat
//                     </Text>
//                   </TouchableOpacity>
//                 )}

//                 <TouchableOpacity
//                   style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
//                   onPress={() => setSelectedChat(null)}
//                 >
//                   <Text style={{ fontWeight: '700', fontSize: 15, color: '#64748B' }}>Close</Text>
//                 </TouchableOpacity>

//                 <View style={{ height: 20 }} />
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* ── Notifications Modal ── */}
//       <Modal
//         visible={notifModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setNotifModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <View style={styles.modalHandle} />
//             <Text style={styles.notifModalTitle}>🔔 Notifications</Text>

//             <ScrollView showsVerticalScrollIndicator={false}>
//               {notifications.length === 0 ? (
//                 <View style={styles.empty}>
//                   <Text style={styles.emptyIcon}>🔔</Text>
//                   <Text style={styles.emptyText}>Koi notification nahi</Text>
//                 </View>
//               ) : (
//                 notifications.map((n) => (
//                   <View key={n.id} style={[styles.notifCard, !n.isRead && styles.notifUnread]}>
//                     <Text style={styles.notifMessage}>{n.message || 'New notification'}</Text>
//                     <Text style={styles.notifTime}>{formatTime(n.createdAt)}</Text>
//                   </View>
//                 ))
//               )}
//               <View style={{ height: 20 }} />
//             </ScrollView>

//             <TouchableOpacity
//               style={[styles.actionBtn, { backgroundColor: '#F1F5F9', marginHorizontal: 0 }]}
//               onPress={() => setNotifModal(false)}
//             >
//               <Text style={{ fontWeight: '700', fontSize: 15, color: '#64748B' }}>Close</Text>
//             </TouchableOpacity>
//             <View style={{ height: 16 }} />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container          : { flex: 1, backgroundColor: '#F8FAFC' },
//   centered           : { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   // Header
//   header             : {
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//   },
//   greeting           : { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
//   expertName         : { fontSize: 20, fontWeight: '800', color: '#0F172A' },
//   notifBtn           : { position: 'relative', padding: 4 },
//   notifDot           : {
//     position: 'absolute', top: 0, right: 0,
//     backgroundColor: '#DC2626', borderRadius: 10,
//     minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
//     paddingHorizontal: 4,
//   },
//   notifDotText       : { fontSize: 10, color: '#fff', fontWeight: '800' },

//   // Profile Card
//   profileCard        : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
//     borderRadius: 18, padding: 16,
//     borderWidth: 1, borderColor: '#E2E8F0',
//     shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
//     gap: 12,
//   },
//   profileAvatar      : { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
//   profileAvatarText  : { fontSize: 20, fontWeight: '800', color: '#fff' },
//   profileName        : { fontSize: 16, fontWeight: '800', color: '#0F172A' },
//   profileSpecialty   : { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 2 },
//   profileEmail       : { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   onlineBadge        : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },

//   // Section title
//   sectionTitle       : { fontSize: 14, fontWeight: '700', color: '#64748B', marginLeft: 16, marginTop: 22, marginBottom: 10 },

//   // Stats
//   statsGrid          : { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
//   statCard           : { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
//   statIcon           : { fontSize: 24 },
//   statValue          : { fontSize: 26, fontWeight: '800' },
//   statLabel          : { fontSize: 12, color: '#64748B', fontWeight: '600' },

//   // Tabs
//   tabRow             : { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 8 },
//   tab                : {
//     flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 10, gap: 6,
//   },
//   tabActive          : { backgroundColor: '#EFF6FF' },
//   tabText            : { fontSize: 13, fontWeight: '600', color: '#64748B' },
//   tabTextActive      : { color: '#2563EB' },
//   tabBadge           : { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
//   tabBadgeActive     : { backgroundColor: '#BFDBFE' },
//   tabBadgeText       : { fontSize: 11, fontWeight: '700', color: '#64748B' },
//   tabBadgeTextActive : { color: '#1D4ED8' },

//   // Chat Card
//   chatCard           : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 14, marginHorizontal: 16, marginBottom: 10,
//     borderWidth: 1, borderColor: '#F1F5F9',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   chatAvatar         : { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   chatAvatarText     : { fontSize: 15, fontWeight: '800', color: '#fff' },
//   chatUser           : { fontSize: 14, fontWeight: '700', color: '#0F172A' },
//   chatLast           : { fontSize: 12, color: '#64748B', marginTop: 2 },
//   chatCategory       : { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   chatTime           : { fontSize: 11, color: '#94A3B8' },
//   newBadge           : { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
//   newBadgeText       : { fontSize: 10, fontWeight: '800', color: '#D97706' },
//   arrow              : { fontSize: 22, color: '#CBD5E1' },

//   // Empty
//   empty              : { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
//   emptyIcon          : { fontSize: 44, marginBottom: 12 },
//   emptyText          : { fontSize: 15, fontWeight: '700', color: '#94A3B8' },

//   // Modal
//   modalOverlay       : { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
//   modalBox           : {
//     backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     paddingHorizontal: 22, paddingTop: 12, maxHeight: '88%',
//   },
//   modalHandle        : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

//   detailTop          : { alignItems: 'center', paddingVertical: 12 },
//   detailAvatar       : { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
//   detailAvatarText   : { fontSize: 26, fontWeight: '800', color: '#fff' },
//   detailName         : { fontSize: 19, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
//   statusBadge        : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

//   detailSection      : {
//     backgroundColor: '#F8FAFC', borderRadius: 16,
//     padding: 16, marginVertical: 14,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   detailSectionTitle : { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
//   detailRow          : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
//   detailLabel        : { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
//   detailValue        : { fontSize: 13, color: '#1E293B', fontWeight: '600', textAlign: 'right' },
//   detailDivider      : { height: 1, backgroundColor: '#F1F5F9' },

//   actionBtn          : { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },

//   // Notifications
//   notifModalTitle    : { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
//   notifCard          : {
//     backgroundColor: '#F8FAFC', borderRadius: 12,
//     padding: 14, marginBottom: 8,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   notifUnread        : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
//   notifMessage       : { fontSize: 13, fontWeight: '600', color: '#1E293B' },
//   notifTime          : { fontSize: 11, color: '#94A3B8', marginTop: 4 },
// });



import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import {
  getFirestore, collection, query, where,
  onSnapshot, doc, getDoc, orderBy, limit,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export default function ExpertDashboard({ navigation }) {
  const dispatch  = useDispatch();
  const [profile, setProfile]   = useState(null);
  const [counts, setCounts]     = useState({ total: 0, active: 0, closed: 0 });
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const uid = auth().currentUser?.uid;

  // Load expert profile
  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    getDoc(doc(db, 'users', uid)).then((d) => {
      if (d.exists()) setProfile(d.data());
    });
  }, [uid]);

  // Load chat counts + recent chats
  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    const q  = query(
      collection(db, 'chats'),
      where('expertId', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list   = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const active = list.filter((c) => c.isActive).length;
      setCounts({ total: list.length, active, closed: list.length - active });
      setRecent(list.slice(0, 5));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const handleLogout = async () => {
    await auth().signOut();
    dispatch(logout());
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const d    = ts.toDate();
    const diff = new Date() - d;
    if (diff < 60000)    return 'Just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN');
  };

  const cards = [
    { label: 'Total Chats',  value: counts.total,  icon: '💬', bg: '#EFF6FF', accent: '#2563EB' },
    { label: 'Active',       value: counts.active,  icon: '🟢', bg: '#F0FDF4', accent: '#16A34A' },
    { label: 'Closed',       value: counts.closed,  icon: '🔒', bg: '#FFF7ED', accent: '#D97706' },
  ];

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Welcome back 👋</Text>
            <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Expert Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📂</Text>
            <Text style={styles.infoText}>
              {profile?.categoryName || 'No Category'}
              {profile?.subcategoryName ? ` › ${profile.subcategoryName}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎓</Text>
            <Text style={styles.infoText}>{profile?.degree || 'No Degree Added'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⭐</Text>
            <Text style={styles.infoText}>
              {profile?.experience ? `${profile.experience} years experience` : 'Experience not added'}
            </Text>
          </View>
          <View style={[
            styles.activeBadge,
            { backgroundColor: profile?.isActive !== false ? '#D1FAE5' : '#FEE2E2' },
          ]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: profile?.isActive !== false ? '#065F46' : '#DC2626' }}>
              {profile?.isActive !== false ? '✅ Active — Accepting Queries' : '⏸ Currently Inactive'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          {cards.map((card) => (
            <View key={card.label} style={[styles.statCard, { backgroundColor: card.bg }]}>
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={[styles.statValue, { color: card.accent }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Chats */}
        <Text style={styles.sectionTitle}>Recent Chats</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyChats}>
            <Text style={styles.emptyChatsIcon}>💬</Text>
            <Text style={styles.emptyChatsText}>Abhi koi chat nahi hai</Text>
          </View>
        ) : (
          recent.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatCard}
              onPress={() => navigation.navigate('Chats', {
                screen : 'ExpertReplyChat',
                params : { chatId: chat.id, userName: chat.userName },
              })}
            >
              <View style={[styles.chatDot, { backgroundColor: chat.isActive ? '#10B981' : '#94A3B8' }]} />
              <View style={styles.chatAvatar}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatUser}>{chat.userName || 'User'}</Text>
                <Text style={styles.chatLast} numberOfLines={1}>
                  {chat.lastMessage || 'No message'}
                </Text>
              </View>
              <Text style={styles.chatTime}>{formatTime(chat.updatedAt)}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#F8FAFC' },
  centered       : { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header         : {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft     : { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar   : {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerGreeting : { fontSize: 12, color: '#94A3B8' },
  headerName     : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  logoutBtn      : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutText     : { color: '#DC2626', fontWeight: '600', fontSize: 13 },

  infoCard       : {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  infoRow        : { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIcon       : { fontSize: 18 },
  infoText       : { fontSize: 14, color: '#374151', fontWeight: '500' },
  activeBadge    : { borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 4 },

  sectionTitle   : { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginLeft: 20, marginTop: 22, marginBottom: 12, textTransform: 'uppercase' },

  statsRow       : { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  statCard       : { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon       : { fontSize: 22, marginBottom: 6 },
  statValue      : { fontSize: 24, fontWeight: '800' },
  statLabel      : { fontSize: 11, color: '#64748B', marginTop: 4, textAlign: 'center' },

  emptyChats     : { alignItems: 'center', paddingVertical: 30 },
  emptyChatsIcon : { fontSize: 40, marginBottom: 10 },
  emptyChatsText : { fontSize: 14, color: '#94A3B8' },

  chatCard       : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  chatDot        : { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  chatAvatar     : {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  chatUser       : { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  chatLast       : { fontSize: 12, color: '#64748B', marginTop: 2 },
  chatTime       : { fontSize: 11, color: '#94A3B8' },
});