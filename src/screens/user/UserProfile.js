import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export default function UserProfile() {
  const dispatch          = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    getDoc(doc(db, 'users', uid)).then((d) => {
      if (d.exists()) setProfile(d.data());
      setLoading(false);
    });
  }, [uid]);

  const handleLogout = async () => {
    await auth().signOut();
    dispatch(logout());
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#059669','#D97706'];
  const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const rows = [
    { icon: '📧', label: 'Email',   value: profile?.email  },
    { icon: '📱', label: 'Mobile',  value: profile?.mobile },
    { icon: '📍', label: 'Address', value: profile?.address },
    { icon: '📅', label: 'Joined',  value: profile?.createdAt?.toDate
        ? profile.createdAt.toDate().toLocaleDateString('en-IN')
        : null },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: getColor(profile?.name) }]}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>👤 Community Member</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>📋 Profile Details</Text>
          {rows.map((row) => row.value ? (
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container     : { flex: 1, backgroundColor: '#F8FAFC' },
  centered      : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header        : {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle   : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  logoutBtn     : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutText    : { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  avatarSection : { alignItems: 'center', paddingVertical: 28 },
  avatar        : {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText    : { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  profileName   : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  profileEmail  : { fontSize: 14, color: '#64748B', marginTop: 4 },
  userBadge     : { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
  userBadgeText : { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  detailCard    : {
    backgroundColor: '#FFFFFF', marginHorizontal: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  detailTitle   : { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
  detailRow     : { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  detailIcon    : { fontSize: 20, marginTop: 2 },
  detailLabel   : { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue   : { fontSize: 14, color: '#1E293B', fontWeight: '500', marginTop: 3 },
  divider       : { height: 1, backgroundColor: '#F8FAFC' },
});