import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, where, getDocs,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ExpertDetailScreen({ route, navigation }) {
  const { expert }    = route.params;
  const [loading, setLoading] = useState(false);

  const uid      = auth().currentUser?.uid;
  const userName = auth().currentUser?.displayName || 'User';

  const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#059669','#D97706'];
  const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const startChat = async () => {
    setLoading(true);
    try {
      const db = getFirestore();

      // Check existing chat
      const existing = await getDocs(
        query(
          collection(db, 'chats'),
          where('userId',   '==', uid),
          where('expertId', '==', expert.id),
        ),
      );

      let chatId;
      if (!existing.empty) {
        chatId = existing.docs[0].id;
      } else {
        // New chat create karo
        const ref = await addDoc(collection(db, 'chats'), {
          userId        : uid,
          userName      : userName,
          expertId      : expert.id,
          expertName    : expert.name,
          categoryId    : expert.categoryId,
          categoryName  : expert.categoryName,
          lastMessage   : '',
          isActive      : true,
          createdAt     : serverTimestamp(),
          updatedAt     : serverTimestamp(),
        });
        chatId = ref.id;
      }

      navigation.navigate('Chat', {
        chatId    : chatId,
        expertName: expert.name,
        expertId  : expert.id,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const infoRows = [
    { icon: '📂', label: 'Category',       value: expert.categoryName },
    { icon: '🔖', label: 'Specialization', value: expert.subcategoryName },
    { icon: '🎓', label: 'Degree',         value: expert.degree },
    { icon: '📜', label: 'Certifications', value: expert.certDetails },
    { icon: '⭐', label: 'Experience',     value: expert.experience ? `${expert.experience} years` : null },
    { icon: '📍', label: 'Address',        value: expert.address },
    { icon: '📱', label: 'Mobile',         value: expert.mobile },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expert Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: getColor(expert.name) }]}>
            <Text style={styles.avatarText}>
              {expert.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.expertName}>{expert.name}</Text>
          {expert.subcategoryName ? (
            <Text style={styles.expertSpec}>{expert.subcategoryName}</Text>
          ) : (
            <Text style={styles.expertSpec}>{expert.categoryName}</Text>
          )}
          {expert.degree ? (
            <Text style={styles.expertDegree}>🎓 {expert.degree}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{expert.experience || '—'}</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>✅</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🟢</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>📋 Expert Details</Text>
          {infoRows.map((row) => row.value ? (
            <View key={row.label}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>{row.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </View>
          ) : null)}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Chat Button */}
      <View style={styles.chatBtnWrap}>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={startChat}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <>
                <Text style={styles.chatBtnIcon}>💬</Text>
                <Text style={styles.chatBtnText}>Chat Shuru Karo</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#F8FAFC' },
  header       : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn      : { width: 40, padding: 4 },
  backArrow    : { fontSize: 24, color: '#2563EB', fontWeight: '700' },
  headerTitle  : { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  profileCard  : {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar       : {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText   : { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  expertName   : { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  expertSpec   : { fontSize: 15, color: '#2563EB', fontWeight: '600', marginTop: 4 },
  expertDegree : { fontSize: 13, color: '#7C3AED', marginTop: 6 },
  statsRow     : { flexDirection: 'row', marginTop: 20, width: '100%' },
  statItem     : { flex: 1, alignItems: 'center' },
  statValue    : { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  statLabel    : { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  statDivider  : { width: 1, backgroundColor: '#F1F5F9' },

  detailCard   : {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  detailTitle  : { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
  detailRow    : { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  detailIcon   : { fontSize: 20, marginTop: 2 },
  detailLabel  : { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue  : { fontSize: 14, color: '#1E293B', fontWeight: '500', marginTop: 3 },
  divider      : { height: 1, backgroundColor: '#F8FAFC' },

  chatBtnWrap  : {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', padding: 16,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  chatBtn      : {
    backgroundColor: '#2563EB', borderRadius: 16,
    padding: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  chatBtnIcon  : { fontSize: 20 },
  chatBtnText  : { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});