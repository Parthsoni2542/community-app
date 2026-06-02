import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput,
} from 'react-native';
import {
  getFirestore, collection, query,
  where, onSnapshot,
} from '@react-native-firebase/firestore';

export default function ExpertListScreen({ route, navigation }) {
  const { categoryId, categoryName, categoryIcon } = route.params;

  const [experts, setExperts]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const db    = getFirestore();
    const q     = query(
      collection(db, 'users'),
      where('role',       '==', 'expert'),
      where('categoryId', '==', categoryId),
      where('isActive',   '==', true),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExperts(list);
      setFiltered(list);
      setLoading(false);
    });
    return unsub;
  }, [categoryId]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(experts); return; }
    const s = search.toLowerCase();
    setFiltered(
      experts.filter((e) =>
        e.name?.toLowerCase().includes(s) ||
        e.subcategoryName?.toLowerCase().includes(s) ||
        e.degree?.toLowerCase().includes(s),
      ),
    );
  }, [search, experts]);

  const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#059669','#D97706'];
  const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const renderExpert = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ExpertDetail', { expert: item })}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.expertName}>{item.name}</Text>
        {item.subcategoryName ? (
          <Text style={styles.expertSpec}>{item.subcategoryName}</Text>
        ) : null}
        {item.degree ? (
          <Text style={styles.expertDegree}>🎓 {item.degree}</Text>
        ) : null}
        <View style={styles.tagRow}>
          {item.experience ? (
            <View style={styles.expTag}>
              <Text style={styles.expTagText}>⭐ {item.experience} yrs exp</Text>
            </View>
          ) : null}
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>● Available</Text>
          </View>
        </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.catIcon}>{categoryIcon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSub}>{filtered.length} experts available</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Expert ya specialization search karo..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderExpert}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Koi expert nahi mila</Text>
            <Text style={styles.emptySub}>Is category mein abhi koi expert nahi hai</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: '#F8FAFC' },
  centered    : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header      : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: 52, paddingBottom: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn     : { padding: 4 },
  backArrow   : { fontSize: 24, color: '#2563EB', fontWeight: '700' },
  catIcon     : { fontSize: 24 },
  headerTitle : { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub   : { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  searchWrap  : {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput : { flex: 1, fontSize: 14, color: '#1E293B' },
  card        : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar      : {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText  : { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  expertName  : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  expertSpec  : { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  expertDegree: { fontSize: 12, color: '#7C3AED', marginTop: 3 },
  tagRow      : { flexDirection: 'row', gap: 6, marginTop: 6 },
  expTag      : { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  expTagText  : { fontSize: 11, fontWeight: '700', color: '#92400E' },
  activeTag   : { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeTagText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  arrow       : { fontSize: 26, color: '#CBD5E1', marginLeft: 8 },
  empty       : { alignItems: 'center', paddingTop: 80 },
  emptyIcon   : { fontSize: 52, marginBottom: 14 },
  emptyText   : { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub    : { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
});