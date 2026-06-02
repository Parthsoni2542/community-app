// // import React, { useEffect, useState } from 'react';
// // import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
// // import firestore from '@react-native-firebase/firestore';

// // export default function ViewAllChats() {
// //   const [chats, setChats]     = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const unsubscribe = firestore()
// //       .collection('chats')
// //       .orderBy('updatedAt', 'desc')
// //       .onSnapshot((snap) => {
// //         setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// //         setLoading(false);
// //       });
// //     return unsubscribe;
// //   }, []);

// //   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.title}>All Chats</Text>
// //       <FlatList
// //         data={chats}
// //         keyExtractor={(item) => item.id}
// //         renderItem={({ item }) => (
// //           <View style={styles.card}>
// //             <Text style={styles.chatIcon}>💬</Text>
// //             <View style={{ flex: 1 }}>
// //               <Text style={styles.name}>{item.userName || 'User'} → {item.expertName || 'Expert'}</Text>
// //               <Text style={styles.last} numberOfLines={1}>{item.lastMessage || 'No message yet'}</Text>
// //             </View>
// //             <View style={[styles.badge, { backgroundColor: item.isActive ? '#D1FAE5' : '#F3F4F6' }]}>
// //               <Text style={{ fontSize: 11, color: item.isActive ? '#065F46' : '#6B7280' }}>
// //                 {item.isActive ? 'Active' : 'Closed'}
// //               </Text>
// //             </View>
// //           </View>
// //         )}
// //         ListEmptyComponent={<Text style={styles.empty}>Koi chat nahi hai</Text>}
// //       />
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
// //   title    : { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
// //   card     : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
// //   chatIcon : { fontSize: 24, marginRight: 12 },
// //   name     : { fontSize: 14, fontWeight: '600', color: '#111827' },
// //   last     : { fontSize: 12, color: '#6B7280', marginTop: 2 },
// //   badge    : { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
// //   empty    : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
// // });


// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   ActivityIndicator, StatusBar, TextInput, Modal,
//   ScrollView,
// } from 'react-native';
// import {
//   getFirestore, collection, onSnapshot, query,
//   orderBy, doc, updateDoc, where,
// } from '@react-native-firebase/firestore';

// export default function ViewAllChats() {
//   const [chats, setChats]         = useState([]);
//   const [filtered, setFiltered]   = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [search, setSearch]       = useState('');
//   const [selected, setSelected]   = useState(null);
//   const [filterTab, setFilterTab] = useState('all'); // all | active | closed

//   // ─── Realtime listener ───────────────────────────────────────────
//   useEffect(() => {
//     const db    = getFirestore();
//     const q     = query(
//       collection(db, 'chats'),
//       orderBy('updatedAt', 'desc'),
//     );
//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         setChats(list);
//         setLoading(false);
//       },
//       (err) => {
//         console.error('Chats fetch error:', err);
//         setLoading(false);
//       },
//     );
//     return unsub;
//   }, []);

//   // ─── Search + Tab filter ─────────────────────────────────────────
//   useEffect(() => {
//     let list = [...chats];
//     if (filterTab === 'active') list = list.filter((c) => c.isActive);
//     if (filterTab === 'closed') list = list.filter((c) => !c.isActive);
//     if (search.trim()) {
//       const s = search.toLowerCase();
//       list = list.filter(
//         (c) =>
//           c.userName?.toLowerCase().includes(s)   ||
//           c.expertName?.toLowerCase().includes(s) ||
//           c.lastMessage?.toLowerCase().includes(s),
//       );
//     }
//     setFiltered(list);
//   }, [search, filterTab, chats]);

//   // ─── Toggle chat status ──────────────────────────────────────────
//   const toggleStatus = async (id, isActive) => {
//     const db = getFirestore();
//     await updateDoc(doc(db, 'chats', id), { isActive: !isActive });
//     if (selected?.id === id) setSelected((p) => ({ ...p, isActive: !isActive }));
//   };

//   // ─── Helpers ─────────────────────────────────────────────────────
//   const formatTime = (ts) => {
//     if (!ts?.toDate) return '—';
//     const d   = ts.toDate();
//     const now = new Date();
//     const diff = Math.floor((now - d) / 60000); // minutes
//     if (diff < 1)   return 'Just now';
//     if (diff < 60)  return `${diff}m ago`;
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
//   const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

//   const TABS = [
//     { key: 'all',    label: 'All',    count: chats.length },
//     { key: 'active', label: 'Active', count: chats.filter((c) => c.isActive).length },
//     { key: 'closed', label: 'Closed', count: chats.filter((c) => !c.isActive).length },
//   ];

//   // ─── Render each chat card ───────────────────────────────────────
//   const renderChat = ({ item }) => (
//     <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
//       {/* Avatar — user initials */}
//       <View style={[styles.avatar, { backgroundColor: getColor(item.userName) }]}>
//         <Text style={styles.avatarText}>{getInitials(item.userName)}</Text>
//       </View>

//       {/* Middle info */}
//       <View style={{ flex: 1 }}>
//         <View style={styles.nameRow}>
//           <Text style={styles.chatName} numberOfLines={1}>
//             {item.userName || 'User'} → {item.expertName || 'Expert'}
//           </Text>
//           {!item.isActive && (
//             <View style={styles.closedBadge}>
//               <Text style={styles.closedBadgeText}>Closed</Text>
//             </View>
//           )}
//         </View>
//         <Text style={styles.lastMsg} numberOfLines={1}>
//           {item.lastMessage || 'No message yet'}
//         </Text>
//         <Text style={styles.category}>{item.category || ''}</Text>
//       </View>

//       {/* Time + arrow */}
//       <View style={{ alignItems: 'flex-end', gap: 6 }}>
//         <Text style={styles.timeText}>{formatTime(item.updatedAt)}</Text>
//         <Text style={styles.arrow}>›</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   if (loading) return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#2563EB" />
//     </View>
//   );

//   // ─── Main UI ─────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.headerTitle}>All Chats</Text>
//           <Text style={styles.headerSub}>{chats.length} total conversations</Text>
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Text style={styles.searchIcon}>🔍</Text>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="User, expert ya message search karo..."
//           placeholderTextColor="#9CA3AF"
//           value={search}
//           onChangeText={setSearch}
//         />
//         {search ? (
//           <TouchableOpacity onPress={() => setSearch('')}>
//             <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
//           </TouchableOpacity>
//         ) : null}
//       </View>

//       {/* Filter Tabs */}
//       <View style={styles.tabRow}>
//         {TABS.map((tab) => (
//           <TouchableOpacity
//             key={tab.key}
//             style={[styles.tab, filterTab === tab.key && styles.tabActive]}
//             onPress={() => setFilterTab(tab.key)}
//           >
//             <Text style={[styles.tabText, filterTab === tab.key && styles.tabTextActive]}>
//               {tab.label}
//             </Text>
//             <View style={[styles.tabBadge, filterTab === tab.key && styles.tabBadgeActive]}>
//               <Text style={[styles.tabBadgeText, filterTab === tab.key && styles.tabBadgeTextActive]}>
//                 {tab.count}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Chat List */}
//       <FlatList
//         data={filtered}
//         keyExtractor={(item) => item.id}
//         renderItem={renderChat}
//         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//         ListEmptyComponent={
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>💬</Text>
//             <Text style={styles.emptyText}>
//               {search ? 'Koi result nahi mila' : 'Koi chat nahi hai'}
//             </Text>
//           </View>
//         }
//       />

//       {/* ── Detail Modal ── */}
//       <Modal
//         visible={!!selected}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setSelected(null)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <View style={styles.modalHandle} />

//             {selected && (
//               <ScrollView showsVerticalScrollIndicator={false}>

//                 {/* Top avatars */}
//                 <View style={styles.detailTop}>
//                   <View style={styles.avatarPair}>
//                     <View style={[styles.detailAvatar, { backgroundColor: getColor(selected.userName) }]}>
//                       <Text style={styles.detailAvatarText}>{getInitials(selected.userName)}</Text>
//                     </View>
//                     <View style={styles.arrowCircle}>
//                       <Text style={{ fontSize: 16 }}>💬</Text>
//                     </View>
//                     <View style={[styles.detailAvatar, { backgroundColor: getColor(selected.expertName) }]}>
//                       <Text style={styles.detailAvatarText}>{getInitials(selected.expertName)}</Text>
//                     </View>
//                   </View>

//                   <Text style={styles.detailTitle}>
//                     {selected.userName || 'User'} → {selected.expertName || 'Expert'}
//                   </Text>

//                   {/* Status badge */}
//                   <View style={[
//                     styles.statusBadge,
//                     { backgroundColor: selected.isActive ? '#D1FAE5' : '#F1F5F9' },
//                   ]}>
//                     <Text style={{
//                       fontSize: 12, fontWeight: '700',
//                       color: selected.isActive ? '#065F46' : '#64748B',
//                     }}>
//                       {selected.isActive ? '🟢 Active' : '⚫ Closed'}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Chat Details */}
//                 <View style={styles.detailSection}>
//                   <Text style={styles.detailSectionTitle}>📋 Chat Details</Text>

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>User</Text>
//                     <Text style={styles.detailValue}>{selected.userName || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Expert</Text>
//                     <Text style={styles.detailValue}>{selected.expertName || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Category</Text>
//                     <Text style={styles.detailValue}>{selected.category || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Last Message</Text>
//                     <Text style={[styles.detailValue, { maxWidth: '55%' }]} numberOfLines={2}>
//                       {selected.lastMessage || '—'}
//                     </Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Last Updated</Text>
//                     <Text style={styles.detailValue}>{formatTime(selected.updatedAt)}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Started</Text>
//                     <Text style={styles.detailValue}>
//                       {selected.createdAt?.toDate
//                         ? selected.createdAt.toDate().toLocaleDateString('en-IN')
//                         : '—'}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Action Buttons */}
//                 <TouchableOpacity
//                   style={[
//                     styles.actionBtn,
//                     { backgroundColor: selected.isActive ? '#FEF3C7' : '#D1FAE5' },
//                   ]}
//                   onPress={() => toggleStatus(selected.id, selected.isActive)}
//                 >
//                   <Text style={{
//                     fontWeight: '700', fontSize: 15,
//                     color: selected.isActive ? '#92400E' : '#065F46',
//                   }}>
//                     {selected.isActive ? '🔒 Close Chat' : '🔓 Reopen Chat'}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
//                   onPress={() => setSelected(null)}
//                 >
//                   <Text style={{ fontWeight: '700', fontSize: 15, color: '#64748B' }}>
//                     Close
//                   </Text>
//                 </TouchableOpacity>

//                 <View style={{ height: 20 }} />
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// // ─── Styles (ManageUsers se match) ──────────────────────────────────────────
// const styles = StyleSheet.create({
//   container        : { flex: 1, backgroundColor: '#F8FAFC' },
//   centered         : { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header           : {
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   headerTitle      : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
//   headerSub        : { fontSize: 12, color: '#94A3B8', marginTop: 2 },

//   searchWrap       : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
//     borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
//     borderWidth: 1, borderColor: '#E2E8F0',
//   },
//   searchIcon       : { fontSize: 16, marginRight: 8 },
//   searchInput      : { flex: 1, fontSize: 14, color: '#1E293B' },

//   tabRow           : {
//     flexDirection: 'row', marginHorizontal: 16,
//     marginTop: 12, marginBottom: 4, gap: 8,
//   },
//   tab              : {
//     flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 10, gap: 6,
//   },
//   tabActive        : { backgroundColor: '#EFF6FF' },
//   tabText          : { fontSize: 13, fontWeight: '600', color: '#64748B' },
//   tabTextActive    : { color: '#2563EB' },
//   tabBadge         : { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
//   tabBadgeActive   : { backgroundColor: '#BFDBFE' },
//   tabBadgeText     : { fontSize: 11, fontWeight: '700', color: '#64748B' },
//   tabBadgeTextActive: { color: '#1D4ED8' },

//   card             : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 14, marginBottom: 10,
//     borderWidth: 1, borderColor: '#F1F5F9',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   avatar           : {
//     width: 48, height: 48, borderRadius: 24,
//     justifyContent: 'center', alignItems: 'center', marginRight: 12,
//   },
//   avatarText       : { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
//   nameRow          : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
//   chatName         : { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
//   closedBadge      : { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
//   closedBadgeText  : { fontSize: 10, fontWeight: '700', color: '#64748B' },
//   lastMsg          : { fontSize: 12, color: '#64748B', marginTop: 2 },
//   category         : { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   timeText         : { fontSize: 11, color: '#94A3B8' },
//   arrow            : { fontSize: 22, color: '#CBD5E1' },

//   empty            : { alignItems: 'center', paddingTop: 80 },
//   emptyIcon        : { fontSize: 52, marginBottom: 14 },
//   emptyText        : { fontSize: 16, fontWeight: '700', color: '#1E293B' },

//   modalOverlay     : { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
//   modalBox         : {
//     backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     paddingHorizontal: 22, paddingTop: 12, maxHeight: '85%',
//   },
//   modalHandle      : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

//   detailTop        : { alignItems: 'center', paddingVertical: 16 },
//   avatarPair       : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
//   detailAvatar     : { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
//   detailAvatarText : { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
//   arrowCircle      : { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
//   detailTitle      : { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 10, textAlign: 'center' },
//   statusBadge      : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

//   detailSection    : {
//     backgroundColor: '#F8FAFC', borderRadius: 16,
//     padding: 16, marginVertical: 14,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
//   detailRow        : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
//   detailLabel      : { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
//   detailValue      : { fontSize: 13, color: '#1E293B', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
//   detailDivider    : { height: 1, backgroundColor: '#F1F5F9' },

//   actionBtn        : { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
// });


import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, Modal,
  ScrollView, Image,
} from 'react-native';
import {
  getFirestore, collection, onSnapshot, query,
  orderBy, updateDoc, doc,
} from '@react-native-firebase/firestore';

export default function ViewAllChats() {
  const [chats, setChats]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterTab, setFilter]      = useState('all');
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    const db    = getFirestore();
    const q     = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChats(list);
      setFiltered(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let list = [...chats];
    if (filterTab === 'active') list = list.filter((c) => c.isActive);
    if (filterTab === 'closed') list = list.filter((c) => !c.isActive);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.userName?.toLowerCase().includes(s)   ||
          c.expertName?.toLowerCase().includes(s) ||
          c.lastMessage?.toLowerCase().includes(s),
      );
    }
    setFiltered(list);
  }, [search, filterTab, chats]);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    setMsgLoading(true);
    const db    = getFirestore();
    const q     = query(
      collection(db, 'chats', selected.id, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMsgLoading(false);
    });
    return unsub;
  }, [selected]);

  const toggleChatStatus = async (id, current) => {
    const db = getFirestore();
    await updateDoc(doc(db, 'chats', id), { isActive: !current });
    if (selected?.id === id) setSelected((p) => ({ ...p, isActive: !current }));
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

  const formatMsgTime = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const TABS = [
    { key: 'all',    label: 'All',    count: chats.length },
    { key: 'active', label: 'Active', count: chats.filter((c) => c.isActive).length },
    { key: 'closed', label: 'Closed', count: chats.filter((c) => !c.isActive).length },
  ];

  const renderChat = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#94A3B8' }]} />
      <View style={[styles.chatIcon, { backgroundColor: item.isActive ? '#D1FAE5' : '#F1F5F9' }]}>
        <Text style={{ fontSize: 20 }}>💬</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {item.userName || 'User'} → {item.expertName || 'Expert'}
          </Text>
          <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No message yet'}
        </Text>
        <View style={styles.tagRow}>
          {item.categoryName ? (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{item.categoryName}</Text>
            </View>
          ) : null}
          <View style={[styles.statusTag, { backgroundColor: item.isActive ? '#D1FAE5' : '#F1F5F9' }]}>
            <Text style={[styles.statusTagText, { color: item.isActive ? '#065F46' : '#64748B' }]}>
              {item.isActive ? '● Active' : '● Closed'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Message bubble — text + image dono handle ───────────────────────────
  const renderMsgBubble = (msg) => {
    const isUser = msg.senderRole === 'user';

    return (
      <View
        key={msg.id}
        style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowExpert]}
      >
        {!isUser && (
          <Text style={styles.senderLabel}>🩺 {selected?.expertName}</Text>
        )}

        {/* ── Text message ── */}
        {(msg.type === 'text' || !msg.type) && (
          <View style={[
            styles.msgBubble,
            isUser ? styles.msgBubbleUser : styles.msgBubbleExpert,
          ]}>
            <Text style={[
              styles.msgText,
              isUser ? styles.msgTextUser : styles.msgTextExpert,
            ]}>
              {msg.text}
            </Text>
            <Text style={[styles.msgTime, isUser && { color: '#BFDBFE' }]}>
              {formatMsgTime(msg.createdAt)}
            </Text>
          </View>
        )}

        {/* ── Image message ── */}
        {msg.type === 'image' && (
          <View style={[
            styles.imgBubble,
            isUser ? styles.msgBubbleUser : styles.msgBubbleExpert,
          ]}>
            <Image
              source={{ uri: msg.imageUrl }}
              style={styles.msgImage}
              resizeMode="cover"
            />
            <Text style={[styles.msgTime, isUser && { color: '#BFDBFE' }]}>
              {formatMsgTime(msg.createdAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>All Chats</Text>
          <Text style={styles.headerSub}>{chats.length} total conversations</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="User, expert ya message search karo..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filterTab === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filterTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, filterTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, filterTab === tab.key && styles.tabBadgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{chats.filter((c) => c.isActive).length}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{chats.filter((c) => !c.isActive).length}</Text>
          <Text style={styles.statLbl}>Closed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{chats.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>
              {search ? 'Koi result nahi mila' : 'Koi chat nahi hai'}
            </Text>
          </View>
        }
      />

      {/* Chat Detail Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />

            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {selected.userName} → {selected.expertName}
                    </Text>
                    <View style={styles.modalMetaRow}>
                      {selected.categoryName ? (
                        <View style={styles.catTag}>
                          <Text style={styles.catTagText}>{selected.categoryName}</Text>
                        </View>
                      ) : null}
                      <View style={[
                        styles.statusTag,
                        { backgroundColor: selected.isActive ? '#D1FAE5' : '#FEE2E2' },
                      ]}>
                        <Text style={[
                          styles.statusTagText,
                          { color: selected.isActive ? '#065F46' : '#DC2626' },
                        ]}>
                          {selected.isActive ? '● Active' : '● Closed'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.msgContainer}>
                  {msgLoading ? (
                    <ActivityIndicator color="#2563EB" style={{ flex: 1 }} />
                  ) : messages.length === 0 ? (
                    <View style={styles.noMsg}>
                      <Text style={styles.noMsgText}>Koi message nahi hai</Text>
                    </View>
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ padding: 12 }}
                    >
                      {messages.map((msg) => renderMsgBubble(msg))}
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: selected.isActive ? '#FEF3C7' : '#D1FAE5' },
                  ]}
                  onPress={() => toggleChatStatus(selected.id, selected.isActive)}
                >
                  <Text style={{
                    fontWeight: '700', fontSize: 15,
                    color: selected.isActive ? '#92400E' : '#065F46',
                  }}>
                    {selected.isActive ? '🔒 Close Chat' : '🔓 Reopen Chat'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container        : { flex: 1, backgroundColor: '#F8FAFC' },
  centered         : { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header           : {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle      : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub        : { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  searchWrap       : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchIcon       : { fontSize: 16, marginRight: 8 },
  searchInput      : { flex: 1, fontSize: 14, color: '#1E293B' },

  tabRow           : { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, gap: 8 },
  tab              : {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 10, gap: 6,
  },
  tabActive        : { backgroundColor: '#EFF6FF' },
  tabText          : { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive    : { color: '#2563EB' },
  tabBadge         : { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabBadgeActive   : { backgroundColor: '#BFDBFE' },
  tabBadgeText     : { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabBadgeTextActive: { color: '#1D4ED8' },

  statsBar         : {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginTop: 12, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#F1F5F9',
  },
  statItem         : { flex: 1, alignItems: 'center' },
  statNum          : { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  statLbl          : { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statDivider      : { width: 1, backgroundColor: '#F1F5F9' },

  card             : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statusDot        : { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  chatIcon         : { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatTopRow       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatTitle        : { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  chatTime         : { fontSize: 11, color: '#94A3B8', marginLeft: 8 },
  lastMsg          : { fontSize: 12, color: '#64748B', marginTop: 4 },
  tagRow           : { flexDirection: 'row', gap: 6, marginTop: 6 },
  catTag           : { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catTagText       : { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },
  statusTag        : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusTagText    : { fontSize: 10, fontWeight: '700' },

  empty            : { alignItems: 'center', paddingTop: 80 },
  emptyIcon        : { fontSize: 52, marginBottom: 14 },
  emptyText        : { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  modalOverlay     : { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalBox         : {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 12, height: '85%',
  },
  modalHandle      : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  modalHeader      : { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle       : { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  modalMetaRow     : { flexDirection: 'row', gap: 8 },
  closeBtn         : { padding: 6 },
  closeBtnText     : { fontSize: 18, color: '#94A3B8' },

  msgContainer     : { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  noMsg            : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noMsgText        : { color: '#94A3B8', fontSize: 14 },

  msgRow           : { marginBottom: 10 },
  msgRowUser       : { alignItems: 'flex-end' },
  msgRowExpert     : { alignItems: 'flex-start' },
  senderLabel      : { fontSize: 11, color: '#94A3B8', marginBottom: 4, marginLeft: 4 },

  // Text bubble
  msgBubble        : { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleUser    : { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  msgBubbleExpert  : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText          : { fontSize: 14, lineHeight: 20 },
  msgTextUser      : { color: '#FFFFFF' },
  msgTextExpert    : { color: '#1E293B' },
  msgTime          : { fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right' },

  // Image bubble  ← NEW
  imgBubble        : { maxWidth: '78%', borderRadius: 16, padding: 4, overflow: 'hidden' },
  msgImage         : { width: 200, height: 200, borderRadius: 12 },

  toggleBtn        : { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
});