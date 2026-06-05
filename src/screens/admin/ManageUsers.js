// // import React, { useEffect, useState } from 'react';
// // import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
// // import firestore from '@react-native-firebase/firestore';

// // export default function ManageUsers() {
// //   const [users, setUsers]     = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const unsubscribe = firestore()
// //       .collection('users')
// //       .where('role', '==', 'user')
// //       .onSnapshot((snap) => {
// //         setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// //         setLoading(false);
// //       });
// //     return unsubscribe;
// //   }, []);

// //   const handleBlock = async (id, blocked) => {
// //     await firestore().collection('users').doc(id).update({ isBlocked: !blocked });
// //   };

// //   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.title}>Manage Users</Text>
// //       <FlatList
// //         data={users}
// //         keyExtractor={(item) => item.id}
// //         renderItem={({ item }) => (
// //           <View style={styles.card}>
// //             <View style={styles.avatar}>
// //               <Text style={{ fontSize: 20 }}>👤</Text>
// //             </View>
// //             <View style={{ flex: 1 }}>
// //               <Text style={styles.name}>{item.name}</Text>
// //               <Text style={styles.email}>{item.email}</Text>
// //             </View>
// //             <TouchableOpacity
// //               style={[styles.badge, { backgroundColor: item.isBlocked ? '#FEE2E2' : '#D1FAE5' }]}
// //               onPress={() => handleBlock(item.id, item.isBlocked)}
// //             >
// //               <Text style={{ color: item.isBlocked ? '#DC2626' : '#065F46', fontSize: 12, fontWeight: '600' }}>
// //                 {item.isBlocked ? 'Blocked' : 'Active'}
// //               </Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //         ListEmptyComponent={<Text style={styles.empty}>Koi user nahi hai</Text>}
// //       />
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
// //   title    : { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
// //   card     : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
// //   avatar   : { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
// //   name     : { fontSize: 15, fontWeight: '600', color: '#111827' },
// //   email    : { fontSize: 12, color: '#6B7280' },
// //   badge    : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
// //   empty    : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
// // });



// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   ActivityIndicator, StatusBar, TextInput, Modal,
//   Alert, ScrollView,
// } from 'react-native';
// import {
//   getFirestore, collection, onSnapshot, query,
//   orderBy, updateDoc, deleteDoc, doc, where,
// } from '@react-native-firebase/firestore';

// export default function ManageUsers() {
//   const [users, setUsers] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [selected, setSelected] = useState(null); // detail modal
//   const [filterTab, setFilterTab] = useState('all'); // all | active | blocked

//   useEffect(() => {
//     const db = getFirestore();
//     const q = query(
//       collection(db, 'users'),
//       where('role', '==', 'user'),
//       orderBy('createdAt', 'desc'),
//     );
//     const unsub = onSnapshot(q,
//       (snap) => {
//         const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         setUsers(list);
//         setFiltered(list);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('Firestore error:', error);
//         setLoading(false);
//       }
//     );
//   }, []);

//   // Search + Filter
//   useEffect(() => {
//     let list = [...users];

//     // Tab filter
//     if (filterTab === 'active') list = list.filter((u) => !u.isBlocked);
//     if (filterTab === 'blocked') list = list.filter((u) => u.isBlocked);

//     // Search filter
//     if (search.trim()) {
//       const s = search.toLowerCase();
//       list = list.filter(
//         (u) =>
//           u.name?.toLowerCase().includes(s) ||
//           u.email?.toLowerCase().includes(s) ||
//           u.mobile?.toLowerCase().includes(s),
//       );
//     }
//     setFiltered(list);
//   }, [search, filterTab, users]);

//   const toggleBlock = async (id, blocked) => {
//     const db = getFirestore();
//     await updateDoc(doc(db, 'users', id), { isBlocked: !blocked });
//     if (selected?.id === id) {
//       setSelected((p) => ({ ...p, isBlocked: !blocked }));
//     }
//   };

//   const handleDelete = (id, name) => {
//     Alert.alert('Delete User?', `"${name}" permanently delete hoga`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive',
//         onPress: async () => {
//           const db = getFirestore();
//           await deleteDoc(doc(db, 'users', id));
//           setSelected(null);
//         },
//       },
//     ]);
//   };

//   const getInitials = (name) => {
//     if (!name) return '?';
//     const parts = name.trim().split(' ');
//     return parts.length >= 2
//       ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
//       : parts[0][0].toUpperCase();
//   };

//   const AVATAR_COLORS = [
//     '#2563EB', '#7C3AED', '#DB2777', '#059669',
//     '#D97706', '#DC2626', '#0891B2',
//   ];
//   const getColor = (name) =>
//     AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

//   const TABS = [
//     { key: 'all', label: 'All', count: users.length },
//     { key: 'active', label: 'Active', count: users.filter((u) => !u.isBlocked).length },
//     { key: 'blocked', label: 'Blocked', count: users.filter((u) => u.isBlocked).length },
//   ];

//   const renderUser = ({ item }) => (
//     <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
//       {/* Avatar */}
//       <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
//         <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
//       </View>

//       {/* Info */}
//       <View style={{ flex: 1 }}>
//         <View style={styles.nameRow}>
//           <Text style={styles.userName}>{item.name || 'No Name'}</Text>
//           {item.isBlocked && (
//             <View style={styles.blockedBadge}>
//               <Text style={styles.blockedBadgeText}>Blocked</Text>
//             </View>
//           )}
//         </View>
//         <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
//         {item.mobile ? (
//           <Text style={styles.userMobile}>📱 {item.mobile}</Text>
//         ) : null}
//       </View>

//       {/* Arrow */}
//       <Text style={styles.arrow}>›</Text>
//     </TouchableOpacity>
//   );

//   if (loading) return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#2563EB" />
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.headerTitle}>Users</Text>
//           <Text style={styles.headerSub}>{users.length} registered users</Text>
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Text style={styles.searchIcon}>🔍</Text>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Name, email ya mobile search karo..."
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

//       {/* List */}
//       <FlatList
//         data={filtered}
//         keyExtractor={(item) => item.id}
//         renderItem={renderUser}
//         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//         ListEmptyComponent={
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>👥</Text>
//             <Text style={styles.emptyText}>
//               {search ? 'Koi result nahi mila' : 'Koi user nahi hai'}
//             </Text>
//           </View>
//         }
//       />

//       {/* Detail Modal */}
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

//                 {/* User Avatar + Name */}
//                 <View style={styles.detailTop}>
//                   <View style={[styles.detailAvatar, { backgroundColor: getColor(selected.name) }]}>
//                     <Text style={styles.detailAvatarText}>
//                       {getInitials(selected.name)}
//                     </Text>
//                   </View>
//                   <Text style={styles.detailName}>{selected.name || 'No Name'}</Text>
//                   <View style={[
//                     styles.statusBadge,
//                     { backgroundColor: selected.isBlocked ? '#FEE2E2' : '#D1FAE5' },
//                   ]}>
//                     <Text style={{
//                       fontSize: 12, fontWeight: '700',
//                       color: selected.isBlocked ? '#DC2626' : '#065F46',
//                     }}>
//                       {selected.isBlocked ? '🚫 Blocked' : '✅ Active'}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Details */}
//                 <View style={styles.detailSection}>
//                   <Text style={styles.detailSectionTitle}>📋 User Details</Text>

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Email</Text>
//                     <Text style={styles.detailValue}>{selected.email || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Mobile</Text>
//                     <Text style={styles.detailValue}>{selected.mobile || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Address</Text>
//                     <Text style={styles.detailValue}>{selected.address || '—'}</Text>
//                   </View>
//                   <View style={styles.detailDivider} />

//                   <View style={styles.detailRow}>
//                     <Text style={styles.detailLabel}>Joined</Text>
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
//                     { backgroundColor: selected.isBlocked ? '#D1FAE5' : '#FEF3C7' },
//                   ]}
//                   onPress={() => toggleBlock(selected.id, selected.isBlocked)}
//                 >
//                   <Text style={{
//                     fontWeight: '700', fontSize: 15,
//                     color: selected.isBlocked ? '#065F46' : '#92400E',
//                   }}>
//                     {selected.isBlocked ? '✅ Unblock User' : '🚫 Block User'}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
//                   onPress={() => handleDelete(selected.id, selected.name)}
//                 >
//                   <Text style={{ fontWeight: '700', fontSize: 15, color: '#DC2626' }}>
//                     🗑️ Delete User
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

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8FAFC' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header: {
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
//   headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

//   searchWrap: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
//     borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
//     borderWidth: 1, borderColor: '#E2E8F0',
//   },
//   searchIcon: { fontSize: 16, marginRight: 8 },
//   searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

//   tabRow: {
//     flexDirection: 'row', marginHorizontal: 16,
//     marginTop: 12, marginBottom: 4, gap: 8,
//   },
//   tab: {
//     flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: '#F1F5F9', borderRadius: 12,
//     paddingVertical: 10, gap: 6,
//   },
//   tabActive: { backgroundColor: '#EFF6FF' },
//   tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
//   tabTextActive: { color: '#2563EB' },
//   tabBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
//   tabBadgeActive: { backgroundColor: '#BFDBFE' },
//   tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
//   tabBadgeTextActive: { color: '#1D4ED8' },

//   card: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 14, marginBottom: 10,
//     borderWidth: 1, borderColor: '#F1F5F9',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   avatar: {
//     width: 48, height: 48, borderRadius: 24,
//     justifyContent: 'center', alignItems: 'center', marginRight: 12,
//   },
//   avatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
//   nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   userName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
//   blockedBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
//   blockedBadgeText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
//   userEmail: { fontSize: 12, color: '#64748B', marginTop: 3 },
//   userMobile: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   arrow: { fontSize: 22, color: '#CBD5E1', marginLeft: 8 },

//   empty: { alignItems: 'center', paddingTop: 80 },
//   emptyIcon: { fontSize: 52, marginBottom: 14 },
//   emptyText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

//   modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
//   modalBox: {
//     backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     paddingHorizontal: 22, paddingTop: 12, maxHeight: '85%',
//   },
//   modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

//   detailTop: { alignItems: 'center', paddingVertical: 16 },
//   detailAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
//   detailAvatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
//   detailName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
//   statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

//   detailSection: {
//     backgroundColor: '#F8FAFC', borderRadius: 16,
//     padding: 16, marginVertical: 14,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
//   detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
//   detailLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
//   detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
//   detailDivider: { height: 1, backgroundColor: '#F1F5F9' },

//   actionBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
// });



import React, {
  useEffect, useState, useCallback, useMemo, memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  where,
} from '@react-native-firebase/firestore';

// ── Design tokens — unified with ManageCategories / ManageExperts ─────────────

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
  dangerText: '#991B1B',
  success: '#065F46',
  successBg: '#D1FAE5',
  shadow: '#0D7B7A',
  amber: '#92400E',
  amberBg: '#FEF3C7',
};

// Fixed card height → enables getItemLayout
const CARD_HEIGHT = 82;
const CARD_MARGIN = 10;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

// ── Module-level pure helpers (no re-creation on render) ──────────────────────

const AVATAR_COLORS = [
  '#0D7B7A', '#7C3AED', '#DB2777',
  '#059669', '#D97706', '#DC2626', '#0891B2',
];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
};

const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatDate = (timestamp) => {
  try {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    }
  } catch (_) { /* ignore */ }
  return '—';
};

// ── Tab definitions — module-level, never recreated ──────────────────────────

const TAB_KEYS = ['all', 'active', 'blocked'];

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonLines}>
      <View style={styles.skeletonLineA} />
      <View style={styles.skeletonLineB} />
    </View>
    <View style={styles.skeletonBadge} />
  </View>
));

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FilterTabs = memo(({ activeTab, counts, onSelect }) => (
  <View style={styles.tabRow}>
    {TAB_KEYS.map((key, index) => {
      const active = activeTab === key;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.tab,
            active && styles.tabActive,
            index < TAB_KEYS.length - 1 && { marginRight: 8 },
          ]}
          onPress={() => onSelect(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, active && styles.tabTextActive]}>
            {label}
          </Text>
          <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
              {counts[key]}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ── User card ─────────────────────────────────────────────────────────────────

const UserCard = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {/* Avatar */}
    <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
      <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
    </View>

    {/* Info */}
    <View style={styles.cardInfo}>
      <View style={styles.nameRow}>
        <Text style={styles.userName} numberOfLines={1}>{item.name || 'Unnamed User'}</Text>
        {item.isBlocked && (
          <View style={styles.blockedBadge}>
            <Icon name="slash" size={9} color={COLORS.danger} style={{ marginRight: 3 }} />
            <Text style={styles.blockedBadgeText}>Blocked</Text>
          </View>
        )}
      </View>
      <Text style={styles.userEmail} numberOfLines={1}>{item.email || '—'}</Text>
      {!!item.phone && (
        <View style={styles.mobileRow}>
          <Icon name="phone" size={10} color={COLORS.inactive} />
          <Text style={styles.userMobile}>{item.phone
          }</Text>
        </View>
      )}
    </View>

    {/* Chevron */}
    <Icon name="chevron-right" size={18} color={COLORS.primaryBorder} />
  </TouchableOpacity>
));

// ── Detail row inside the modal ───────────────────────────────────────────────

const DetailRow = memo(({ iconName, iconLib = 'feather', label, value, last }) => (
  <>
    <View style={styles.detailRow}>
      <View style={styles.detailRowIcon}>
        {iconLib === 'mat'
          ? <MatIcon name={iconName} size={15} color={COLORS.primary} />
          : <Icon name={iconName} size={14} color={COLORS.primary} />
        }
      </View>
      <View style={styles.detailRowContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>{value || '—'}</Text>
      </View>
    </View>
    {!last && <View style={styles.detailDivider} />}
  </>
));

// ── User detail modal ─────────────────────────────────────────────────────────

const UserDetailModal = memo(({ user, onClose, onToggleBlock, onDelete }) => {
  if (!user) return null;
  const isBlocked = user.isBlocked === true;

  return (
    <View style={styles.modalBox}>
      <View style={styles.modalHandle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + name + status */}
        <View style={styles.detailTop}>
          <View style={[styles.detailAvatar, { backgroundColor: getAvatarColor(user.name) }]}>
            <Text style={styles.detailAvatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.detailName}>{user.name || 'Unnamed User'}</Text>

          {/* Status badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: isBlocked ? COLORS.dangerBg : COLORS.successBg },
          ]}>
            <Icon
              name={isBlocked ? 'slash' : 'check-circle'}
              size={12}
              color={isBlocked ? COLORS.danger : COLORS.success}
              style={{ marginRight: 5 }}
            />
            <Text style={[
              styles.statusBadgeText,
              { color: isBlocked ? COLORS.danger : COLORS.success },
            ]}>
              {isBlocked ? 'Blocked' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <MatIcon name="account-details-outline" size={15} color={COLORS.primary} />
            <Text style={styles.detailSectionTitle}>User Details</Text>
          </View>

          <DetailRow
            iconName="mail"
            label="Email Address"
            value={user.email}
          />
          <DetailRow
            iconName="phone"
            label="Mobile Number"
            value={user.phone}
          />
          {/* <DetailRow
            iconName="map-pin"
            label="Address"
            value={user.address}
          /> */}
          <DetailRow
            iconName="calendar"
            label="Member Since"
            value={formatDate(user.createdAt)}
            last
          />
        </View>

        {/* Block / Unblock */}
        <TouchableOpacity
          style={[
            styles.modalActionBtn,
            { backgroundColor: isBlocked ? COLORS.successBg : COLORS.amberBg },
          ]}
          onPress={() => onToggleBlock(user.id, isBlocked)}
          activeOpacity={0.8}
        >
          <Icon
            name={isBlocked ? 'check-circle' : 'slash'}
            size={17}
            color={isBlocked ? COLORS.success : COLORS.amber}
            style={{ marginRight: 10 }}
          />
          <Text style={[
            styles.modalActionBtnText,
            { color: isBlocked ? COLORS.success : COLORS.amber },
          ]}>
            {isBlocked ? 'Unblock User' : 'Block User'}
          </Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.modalActionBtn, { backgroundColor: COLORS.dangerBg }]}
          onPress={() => onDelete(user.id, user.name)}
          activeOpacity={0.8}
        >
          <Icon
            name="trash-2"
            size={17}
            color={COLORS.danger}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.modalActionBtnText, { color: COLORS.danger }]}>
            Remove User
          </Text>
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity
          style={[styles.modalActionBtn, { backgroundColor: COLORS.background }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Icon
            name="x"
            size={17}
            color={COLORS.textSub}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.modalActionBtnText, { color: COLORS.textSub }]}>
            Close
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ManageUsers() {
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selected, setSelected] = useState(null);

  // ── Firestore listener ────────────────────────────────────────────────────
  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'user'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('Users snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );

    return unsub; // ← critical: was missing in original, causing memory leak
  }, []);

  // ── Tab counts — memoized, not derived state ──────────────────────────────
  const tabCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => !u.isBlocked).length,
    blocked: users.filter((u) => u.isBlocked).length,
  }), [users]);

  // ── Filtered list — memoized, replaces the derived-state anti-pattern ─────
  const filtered = useMemo(() => {
    let list = users;

    if (filterTab === 'active') list = list.filter((u) => !u.isBlocked);
    if (filterTab === 'blocked') list = list.filter((u) => u.isBlocked);

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.mobile?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [users, filterTab, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectUser = useCallback((item) => setSelected(item), []);
  const handleCloseModal = useCallback(() => setSelected(null), []);
  const handleTabSelect = useCallback((key) => setFilterTab(key), []);
  const handleClearSearch = useCallback(() => setSearch(''), []);

  const handleToggleBlock = useCallback(async (id, currentlyBlocked) => {
    try {
      await updateDoc(doc(getFirestore(), 'users', id), {
        isBlocked: !currentlyBlocked,
      });
      // Keep the modal data in sync without a full re-fetch
      setSelected((prev) =>
        prev?.id === id ? { ...prev, isBlocked: !currentlyBlocked } : prev,
      );
    } catch (err) {
      Alert.alert('Error', 'Could not update user status. Please try again.');
    }
  }, []);

  const handleDelete = useCallback((id, name) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to permanently remove "${name ?? 'this user'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(getFirestore(), 'users', id));
              setSelected(null);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove user. Please try again.');
            }
          },
        },
      ],
    );
  }, []);

  // ── FlatList helpers ──────────────────────────────────────────────────────

  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <UserCard item={item} onPress={() => handleSelectUser(item)} />
  ), [handleSelectUser]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyBox}>
      <MatIcon name="account-group-outline" size={52} color={COLORS.primaryBorder} />
      <Text style={styles.emptyTitle}>
        {search ? 'No Results Found' : 'No Users Yet'}
      </Text>
      <Text style={styles.emptySub}>
        {search
          ? 'Try adjusting your search or filter.'
          : 'Registered users will appear here.'}
      </Text>
    </View>
  ), [search]);

  // ── Header padding ────────────────────────────────────────────────────────
  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>Loading...</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((k) => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color={COLORS.inactive} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorSub}>Check your connection and try again.</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSub}>
          {users.length} {users.length === 1 ? 'user' : 'users'} registered
        </Text>
      </View>
      <View style={styles.headerDivider} />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={COLORS.inactive} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or mobile..."
          placeholderTextColor={COLORS.inactive}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={16} color={COLORS.inactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <FilterTabs
        activeTab={filterTab}
        counts={tabCounts}
        onSelect={handleTabSelect}
      />

      {/* User list */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <UserDetailModal
            user={selected}
            onClose={handleCloseModal}
            onToggleBlock={handleToggleBlock}
            onDelete={handleDelete}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.inactive,
    marginTop: 2,
    fontWeight: '500',
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // ── Filter tabs ───────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSub,
    marginRight: 5,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  tabBadgeTextActive: {
    color: COLORS.surface,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // ── User card ─────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: CARD_MARGIN,
    height: CARD_HEIGHT,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.surface,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 7,
    flexShrink: 1,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  userMobile: {
    fontSize: 12,
    color: COLORS.inactive,
    marginLeft: 4,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: CARD_MARGIN,
    height: CARD_HEIGHT,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D1F4F2',
    marginRight: 12,
  },
  skeletonLines: { flex: 1 },
  skeletonLineA: {
    height: 13,
    width: '55%',
    backgroundColor: '#D1F4F2',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineB: {
    height: 11,
    width: '40%',
    backgroundColor: '#E8F9F8',
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 52,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#D1F4F2',
    marginLeft: 10,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primaryBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Detail top
  detailTop: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.surface,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Detail section
  detailSection: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  detailRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  detailRowContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inactive,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // Modal action buttons
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  modalActionBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});