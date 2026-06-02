// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
// import firestore from '@react-native-firebase/firestore';

// export default function ManageUsers() {
//   const [users, setUsers]     = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = firestore()
//       .collection('users')
//       .where('role', '==', 'user')
//       .onSnapshot((snap) => {
//         setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//       });
//     return unsubscribe;
//   }, []);

//   const handleBlock = async (id, blocked) => {
//     await firestore().collection('users').doc(id).update({ isBlocked: !blocked });
//   };

//   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Manage Users</Text>
//       <FlatList
//         data={users}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <View style={styles.avatar}>
//               <Text style={{ fontSize: 20 }}>👤</Text>
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.name}>{item.name}</Text>
//               <Text style={styles.email}>{item.email}</Text>
//             </View>
//             <TouchableOpacity
//               style={[styles.badge, { backgroundColor: item.isBlocked ? '#FEE2E2' : '#D1FAE5' }]}
//               onPress={() => handleBlock(item.id, item.isBlocked)}
//             >
//               <Text style={{ color: item.isBlocked ? '#DC2626' : '#065F46', fontSize: 12, fontWeight: '600' }}>
//                 {item.isBlocked ? 'Blocked' : 'Active'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>Koi user nahi hai</Text>}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   title    : { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
//   card     : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
//   avatar   : { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   name     : { fontSize: 15, fontWeight: '600', color: '#111827' },
//   email    : { fontSize: 12, color: '#6B7280' },
//   badge    : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
//   empty    : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
// });



import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, Modal,
  Alert, ScrollView,
} from 'react-native';
import {
  getFirestore, collection, onSnapshot, query,
  orderBy, updateDoc, deleteDoc, doc, where,
} from '@react-native-firebase/firestore';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // detail modal
  const [filterTab, setFilterTab] = useState('all'); // all | active | blocked

  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'user'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
        setFiltered(list);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore error:', error);
        setLoading(false);
      }
    );
  }, []);

  // Search + Filter
  useEffect(() => {
    let list = [...users];

    // Tab filter
    if (filterTab === 'active') list = list.filter((u) => !u.isBlocked);
    if (filterTab === 'blocked') list = list.filter((u) => u.isBlocked);

    // Search filter
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.mobile?.toLowerCase().includes(s),
      );
    }
    setFiltered(list);
  }, [search, filterTab, users]);

  const toggleBlock = async (id, blocked) => {
    const db = getFirestore();
    await updateDoc(doc(db, 'users', id), { isBlocked: !blocked });
    if (selected?.id === id) {
      setSelected((p) => ({ ...p, isBlocked: !blocked }));
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete User?', `"${name}" permanently delete hoga`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const db = getFirestore();
          await deleteDoc(doc(db, 'users', id));
          setSelected(null);
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const AVATAR_COLORS = [
    '#2563EB', '#7C3AED', '#DB2777', '#059669',
    '#D97706', '#DC2626', '#0891B2',
  ];
  const getColor = (name) =>
    AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const TABS = [
    { key: 'all', label: 'All', count: users.length },
    { key: 'active', label: 'Active', count: users.filter((u) => !u.isBlocked).length },
    { key: 'blocked', label: 'Blocked', count: users.filter((u) => u.isBlocked).length },
  ];

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.name || 'No Name'}</Text>
          {item.isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>Blocked</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        {item.mobile ? (
          <Text style={styles.userMobile}>📱 {item.mobile}</Text>
        ) : null}
      </View>

      {/* Arrow */}
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>{users.length} registered users</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Name, email ya mobile search karo..."
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

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filterTab === tab.key && styles.tabActive]}
            onPress={() => setFilterTab(tab.key)}
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {search ? 'Koi result nahi mila' : 'Koi user nahi hai'}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
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
              <ScrollView showsVerticalScrollIndicator={false}>

                {/* User Avatar + Name */}
                <View style={styles.detailTop}>
                  <View style={[styles.detailAvatar, { backgroundColor: getColor(selected.name) }]}>
                    <Text style={styles.detailAvatarText}>
                      {getInitials(selected.name)}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selected.name || 'No Name'}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selected.isBlocked ? '#FEE2E2' : '#D1FAE5' },
                  ]}>
                    <Text style={{
                      fontSize: 12, fontWeight: '700',
                      color: selected.isBlocked ? '#DC2626' : '#065F46',
                    }}>
                      {selected.isBlocked ? '🚫 Blocked' : '✅ Active'}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📋 User Details</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selected.email || '—'}</Text>
                  </View>
                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mobile</Text>
                    <Text style={styles.detailValue}>{selected.mobile || '—'}</Text>
                  </View>
                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selected.address || '—'}</Text>
                  </View>
                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined</Text>
                    <Text style={styles.detailValue}>
                      {selected.createdAt?.toDate
                        ? selected.createdAt.toDate().toLocaleDateString('en-IN')
                        : '—'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: selected.isBlocked ? '#D1FAE5' : '#FEF3C7' },
                  ]}
                  onPress={() => toggleBlock(selected.id, selected.isBlocked)}
                >
                  <Text style={{
                    fontWeight: '700', fontSize: 15,
                    color: selected.isBlocked ? '#065F46' : '#92400E',
                  }}>
                    {selected.isBlocked ? '✅ Unblock User' : '🚫 Block User'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleDelete(selected.id, selected.name)}
                >
                  <Text style={{ fontWeight: '700', fontSize: 15, color: '#DC2626' }}>
                    🗑️ Delete User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => setSelected(null)}
                >
                  <Text style={{ fontWeight: '700', fontSize: 15, color: '#64748B' }}>
                    Close
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: 16,
    marginTop: 12, marginBottom: 4, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingVertical: 10, gap: 6,
  },
  tabActive: { backgroundColor: '#EFF6FF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#2563EB' },
  tabBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabBadgeActive: { backgroundColor: '#BFDBFE' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabBadgeTextActive: { color: '#1D4ED8' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  blockedBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  blockedBadgeText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  userEmail: { fontSize: 12, color: '#64748B', marginTop: 3 },
  userMobile: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  arrow: { fontSize: 22, color: '#CBD5E1', marginLeft: 8 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  detailTop: { alignItems: 'center', paddingVertical: 16 },
  detailAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  detailAvatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  detailName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

  detailSection: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    padding: 16, marginVertical: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  detailDivider: { height: 1, backgroundColor: '#F1F5F9' },

  actionBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
});