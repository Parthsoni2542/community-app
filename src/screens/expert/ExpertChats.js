import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput,
} from 'react-native';
import {
  getFirestore, collection, query,
  where, onSnapshot, orderBy,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ExpertChats({ navigation }) {
  const [chats, setChats]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('all');

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    const q  = query(
      collection(db, 'chats'),
      where('expertId', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChats(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    let list = [...chats];
    if (tab === 'active') list = list.filter((c) => c.isActive);
    if (tab === 'closed') list = list.filter((c) => !c.isActive);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.userName?.toLowerCase().includes(s));
    }
    setFiltered(list);
  }, [chats, tab, search]);

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const d    = ts.toDate();
    const diff = new Date() - d;
    if (diff < 60000)    return 'Just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN');
  };

  const TABS = [
    { key: 'all',    label: 'All',    count: chats.length },
    { key: 'active', label: 'Active', count: chats.filter((c) => c.isActive).length },
    { key: 'closed', label: 'Closed', count: chats.filter((c) => !c.isActive).length },
  ];

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ExpertReplyChat', {
        chatId  : item.id,
        userName: item.userName || 'User',
      })}
    >
      <View style={[styles.dot, { backgroundColor: item.isActive ? '#10B981' : '#94A3B8' }]} />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.userName?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.userName}>{item.userName || 'User'}</Text>
          <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No message yet'}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount} new</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Chats</Text>
        <Text style={styles.headerSub}>{chats.length} conversations</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="User search karo..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label} ({t.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Koi chat nahi hai</Text>
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
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub   : { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  searchWrap  : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchIcon  : { fontSize: 16, marginRight: 8 },
  searchInput : { flex: 1, fontSize: 14, color: '#1E293B' },
  tabRow      : { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, gap: 8 },
  tab         : { flex: 1, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 10 },
  tabActive   : { backgroundColor: '#EDE9FE' },
  tabText     : { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#7C3AED' },
  card        : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  dot         : { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  avatar      : {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EDE9FE', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  avatarText  : { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  topRow      : { flexDirection: 'row', justifyContent: 'space-between' },
  userName    : { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  time        : { fontSize: 11, color: '#94A3B8' },
  lastMsg     : { fontSize: 12, color: '#64748B', marginTop: 3 },
  unreadBadge : { backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  unreadText  : { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  empty       : { alignItems: 'center', paddingTop: 80 },
  emptyIcon   : { fontSize: 52, marginBottom: 14 },
  emptyText   : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
});