import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import {
  getFirestore, collection, query,
  where, onSnapshot, orderBy,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ChatHistoryScreen({ navigation }) {
  const [chats, setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const db    = getFirestore();
    const q     = query(
      collection(db, 'chats'),
      where('userId', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const d    = ts.toDate();
    const diff = new Date() - d;
    if (diff < 60000)    return 'Just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN');
  };

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ChatFromHistory', {
        chatId    : item.id,
        expertName: item.expertName || 'Expert',
        expertId  : item.expertId,
      })}
    >
      <View style={[styles.dot, { backgroundColor: item.isActive ? '#10B981' : '#94A3B8' }]} />
      <View style={styles.avatar}>
        <Text style={{ fontSize: 20 }}>🩺</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.expertName}>{item.expertName || 'Expert'}</Text>
          <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
        </View>
        <Text style={styles.category}>{item.categoryName || ''}</Text>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No message yet'}
        </Text>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.isActive ? '#D1FAE5' : '#F1F5F9' },
      ]}>
        <Text style={[
          styles.statusText,
          { color: item.isActive ? '#065F46' : '#64748B' },
        ]}>
          {item.isActive ? 'Active' : 'Closed'}
        </Text>
      </View>
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <Text style={styles.headerSub}>{chats.length} conversations</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Koi chat history nahi hai</Text>
            <Text style={styles.emptySub}>Kisi expert se chat karo!</Text>
            <TouchableOpacity
              style={styles.goBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.goBtnText}>Experts Dekhein →</Text>
            </TouchableOpacity>
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
    backgroundColor: '#EFF6FF', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  topRow      : { flexDirection: 'row', justifyContent: 'space-between' },
  expertName  : { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  time        : { fontSize: 11, color: '#94A3B8' },
  category    : { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  lastMsg     : { fontSize: 12, color: '#64748B', marginTop: 3 },
  statusBadge : { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText  : { fontSize: 11, fontWeight: '700' },
  empty       : { alignItems: 'center', paddingTop: 80 },
  emptyIcon   : { fontSize: 52, marginBottom: 14 },
  emptyText   : { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub    : { fontSize: 13, color: '#94A3B8', marginTop: 6 },
  goBtn       : { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  goBtnText   : { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});