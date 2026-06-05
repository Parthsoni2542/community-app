// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView,
//   TouchableOpacity, StatusBar, ActivityIndicator, Switch,
// } from 'react-native';
// import {
//   getFirestore, doc, getDoc, updateDoc,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { useDispatch } from 'react-redux';
// import { logout } from '../../store/slices/authSlice';

// export default function ExpertProfile() {
//   const dispatch          = useDispatch();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const uid = auth().currentUser?.uid;

//   useEffect(() => {
//     if (!uid) return;
//     const db = getFirestore();
//     getDoc(doc(db, 'users', uid)).then((d) => {
//       if (d.exists()) setProfile(d.data());
//       setLoading(false);
//     });
//   }, [uid]);

//   const toggleActive = async () => {
//     const db  = getFirestore();
//     const val = !(profile?.isActive !== false);
//     await updateDoc(doc(db, 'users', uid), { isActive: val });
//     setProfile((p) => ({ ...p, isActive: val }));
//   };

//   const handleLogout = async () => {
//     await auth().signOut();
//     dispatch(logout());
//   };

//   if (loading) return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#7C3AED" />
//     </View>
//   );

//   const rows = [
//     { icon: '📧', label: 'Email',       value: profile?.email      },
//     { icon: '📱', label: 'Mobile',      value: profile?.mobile     },
//     { icon: '📍', label: 'Address',     value: profile?.address    },
//     { icon: '📂', label: 'Category',    value: profile?.categoryName },
//     { icon: '🔖', label: 'Specialization', value: profile?.subcategoryName },
//     { icon: '🎓', label: 'Degree',      value: profile?.degree     },
//     { icon: '📜', label: 'Certifications', value: profile?.certDetails },
//     { icon: '⭐', label: 'Experience',  value: profile?.experience ? `${profile.experience} years` : null },
//   ];

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>My Profile</Text>
//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>

//         {/* Avatar */}
//         <View style={styles.avatarSection}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>
//               {profile?.name?.charAt(0)?.toUpperCase() || '?'}
//             </Text>
//           </View>
//           <Text style={styles.profileName}>{profile?.name || 'Expert'}</Text>
//           <Text style={styles.profileCat}>
//             {profile?.categoryName || ''}
//             {profile?.subcategoryName ? ` › ${profile.subcategoryName}` : ''}
//           </Text>
//         </View>

//         {/* Active Toggle */}
//         <View style={styles.toggleCard}>
//           <View>
//             <Text style={styles.toggleTitle}>Available for Queries</Text>
//             <Text style={styles.toggleSub}>
//               {profile?.isActive !== false
//                 ? 'Users can send you questions'
//                 : 'You are not accepting queries'}
//             </Text>
//           </View>
//           <Switch
//             value={profile?.isActive !== false}
//             onValueChange={toggleActive}
//             trackColor={{ true: '#7C3AED', false: '#E2E8F0' }}
//             thumbColor="#FFFFFF"
//           />
//         </View>

//         {/* Details */}
//         <View style={styles.detailCard}>
//           <Text style={styles.detailTitle}>📋 Profile Details</Text>
//           {rows.map((row) => row.value ? (
//             <View key={row.label}>
//               <View style={styles.detailRow}>
//                 <Text style={styles.detailIcon}>{row.icon}</Text>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.detailLabel}>{row.label}</Text>
//                   <Text style={styles.detailValue}>{row.value}</Text>
//                 </View>
//               </View>
//               <View style={styles.divider} />
//             </View>
//           ) : null)}
//         </View>

//         <View style={{ height: 30 }} />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container     : { flex: 1, backgroundColor: '#F8FAFC' },
//   centered      : { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header        : {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   headerTitle   : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
//   logoutBtn     : { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
//   logoutText    : { color: '#DC2626', fontWeight: '600', fontSize: 13 },

//   avatarSection : { alignItems: 'center', paddingVertical: 28 },
//   avatar        : {
//     width: 80, height: 80, borderRadius: 40,
//     backgroundColor: '#7C3AED', justifyContent: 'center',
//     alignItems: 'center', marginBottom: 12,
//   },
//   avatarText    : { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
//   profileName   : { fontSize: 22, fontWeight: '800', color: '#0F172A' },
//   profileCat    : { fontSize: 14, color: '#7C3AED', marginTop: 4 },

//   toggleCard    : {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#FFFFFF', marginHorizontal: 16,
//     borderRadius: 16, padding: 16, marginBottom: 14,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   toggleTitle   : { fontSize: 15, fontWeight: '700', color: '#0F172A' },
//   toggleSub     : { fontSize: 12, color: '#94A3B8', marginTop: 3 },

//   detailCard    : {
//     backgroundColor: '#FFFFFF', marginHorizontal: 16,
//     borderRadius: 16, padding: 16,
//     borderWidth: 1, borderColor: '#F1F5F9',
//   },
//   detailTitle   : { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
//   detailRow     : { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
//   detailIcon    : { fontSize: 20, marginTop: 2 },
//   detailLabel   : { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
//   detailValue   : { fontSize: 14, color: '#1E293B', fontWeight: '500', marginTop: 3 },
//   divider       : { height: 1, backgroundColor: '#F8FAFC' },
// });


import React, {
  useEffect, useState, useCallback, useMemo, memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

// ── Design tokens — unified with entire admin/expert codebase ─────────────────

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
  success: '#065F46',
  successBg: '#D1FAE5',
  shadow: '#0D7B7A',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  purpleBorder: '#DDD6FE',
  amber: '#92400E',
  amberBg: '#FEF3C7',
};

// ── Row icon map — vector icons per field ─────────────────────────────────────
// Each entry: { iconName, iconLib, label, valueKey }
const PROFILE_ROWS = [
  { iconName: 'mail', iconLib: 'feather', label: 'Email', valueKey: 'email' },
  { iconName: 'phone', iconLib: 'feather', label: 'Mobile', valueKey: 'mobile' },
  { iconName: 'map-pin', iconLib: 'feather', label: 'Address', valueKey: 'address' },
  { iconName: 'layers', iconLib: 'feather', label: 'Category', valueKey: 'categoryName' },
  { iconName: 'tag', iconLib: 'feather', label: 'Specialization', valueKey: 'subcategoryName' },
  { iconName: 'school-outline', iconLib: 'mat', label: 'Degree', valueKey: 'degree' },
  { iconName: 'certificate-outline', iconLib: 'mat', label: 'Certifications', valueKey: 'certDetails' },
  {
    iconName: 'star', iconLib: 'feather', label: 'Experience', valueKey: 'experience',
    format: (v) => `${v} years`
  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonProfile = memo(() => (
  <View style={styles.skeletonWrap}>
    {/* Avatar skeleton */}
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonNameA} />
    <View style={styles.skeletonNameB} />

    {/* Toggle card skeleton */}
    <View style={styles.skeletonCard} />

    {/* Detail rows skeleton */}
    <View style={[styles.skeletonCard, { height: 220 }]}>
      {[1, 2, 3, 4].map((k) => (
        <View key={k} style={styles.skeletonRow}>
          <View style={styles.skeletonRowIcon} />
          <View style={styles.skeletonRowLines}>
            <View style={styles.skeletonLineA} />
            <View style={styles.skeletonLineB} />
          </View>
        </View>
      ))}
    </View>
  </View>
));

// ── Availability toggle card ───────────────────────────────────────────────────

const AvailabilityToggleCard = memo(({ isActive, onToggle }) => (
  <View style={styles.toggleCard}>
    <View style={styles.toggleLeft}>
      {/* Pulse indicator */}
      <View style={[
        styles.pulseOuter,
        { backgroundColor: isActive ? '#BBF7D0' : COLORS.background },
      ]}>
        <View style={[
          styles.pulseInner,
          { backgroundColor: isActive ? COLORS.success : COLORS.inactive },
        ]} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>Available for Queries</Text>
        <Text style={styles.toggleSub}>
          {isActive
            ? 'Users can currently send you questions'
            : 'You are not accepting new queries'}
        </Text>
      </View>
    </View>

    <Switch
      value={isActive}
      onValueChange={onToggle}
      trackColor={{ true: COLORS.primary, false: '#CBD5E1' }}
      thumbColor={COLORS.surface}
      ios_backgroundColor="#CBD5E1"
    />
  </View>
));

// ── Profile detail row ────────────────────────────────────────────────────────

const ProfileDetailRow = memo(({ iconName, iconLib, label, value, last }) => (
  <>
    <View style={styles.detailRow}>
      <View style={styles.detailRowIcon}>
        {iconLib === 'mat'
          ? <MatIcon name={iconName} size={16} color={COLORS.primary} />
          : <Icon name={iconName} size={15} color={COLORS.primary} />
        }
      </View>
      <View style={styles.detailRowContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
    {!last && <View style={styles.detailDivider} />}
  </>
));

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ExpertProfile() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const uid = auth().currentUser?.uid;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ── Real-time profile listener (replaces one-shot getDoc) ─────────────────
  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(
      doc(getFirestore(), 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        }
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('ExpertProfile snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );
    return unsub;
  }, [uid]);

  // ── Toggle availability ───────────────────────────────────────────────────
  const handleToggleActive = useCallback(async () => {
    if (!uid) return;
    const next = !(profile?.isActive !== false);
    try {
      await updateDoc(doc(getFirestore(), 'users', uid), { isActive: next });
      // Optimistic UI update — listener will confirm
      setProfile((prev) => ({ ...prev, isActive: next }));
    } catch (err) {
      Alert.alert('Error', 'Could not update availability. Please try again.');
    }
  }, [uid, profile?.isActive]);

  // ── Logout with confirmation ──────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              dispatch(logout());
            } catch (err) {
              Alert.alert('Error', 'Sign out failed. Please try again.');
            }
          },
        },
      ],
    );
  }, [dispatch]);

  // ── Build visible rows from profile data — memoized ──────────────────────
  const visibleRows = useMemo(() => {
    if (!profile) return [];
    return PROFILE_ROWS
      .map((row) => {
        const raw = profile[row.valueKey];
        if (!raw) return null;
        const value = row.format ? row.format(raw) : raw;
        return { ...row, value };
      })
      .filter(Boolean);
  }, [profile]);

  const isActive = profile?.isActive !== false;

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
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.headerDivider} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonProfile />
        </ScrollView>
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
        <Text style={styles.headerTitle}>My Profile</Text>

      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── Hero / Avatar section ─────────────────────────────────────── */}
        <View style={styles.heroSection}>
          {/* Teal accent ring */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          </View>

          <Text style={styles.profileName}>{profile?.name ?? 'Expert'}</Text>

          {/* Specialization breadcrumb */}
          {!!(profile?.categoryName) && (
            <View style={styles.categoryRow}>
              <Icon name="layers" size={13} color={COLORS.primary} style={{ marginRight: 5 }} />
              <Text style={styles.profileCat}>
                {profile.categoryName}
                {/* {profile.subcategoryName ? ` › ${profile.subcategoryName}` : ''} */}
              </Text>
            </View>
          )}
          {!!(profile?.subcategoryName) && (
            <View style={styles.categoryRow}>

              <Text style={styles.categoryName}>

                {profile.subcategoryName ? `  ${profile.subcategoryName}` : ''}
              </Text>
            </View>
          )}

          {/* Experience badge */}
          {!!profile?.experience && (
            <View style={styles.expBadge}>
              <Icon name="star" size={12} color={COLORS.amber} style={{ marginRight: 5 }} />
              <Text style={styles.expBadgeText}>
                {profile.experience} years experience
              </Text>
            </View>
          )}

          {/* Degree badge */}
          {/* {!!profile?.degree && (
            <View style={styles.degreeBadge}>
              <MatIcon
                name="school-outline"
                size={13}
                color={COLORS.purple}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.degreeBadgeText}>{profile.degree}</Text>
            </View>
          )} */}
        </View>

        {/* ── Availability toggle ───────────────────────────────────────── */}
        <AvailabilityToggleCard
          isActive={isActive}
          onToggle={handleToggleActive}
        />

        {/* ── Profile details ───────────────────────────────────────────── */}
        {visibleRows.length > 0 && (
          <View style={styles.detailCard}>
            {/* Section header */}
            <View style={styles.detailCardHeader}>
              <Icon name="user" size={15} color={COLORS.primary} />
              <Text style={styles.detailCardTitle}>Profile Details</Text>
            </View>

            {visibleRows.map((row, index) => (
              <ProfileDetailRow
                key={row.label}
                iconName={row.iconName}
                iconLib={row.iconLib}
                label={row.label}
                value={row.value}
                last={index === visibleRows.length - 1}
              />
            ))}
          </View>

        )}
        <TouchableOpacity
          style={styles.accountStrip}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="log-out" size={14} color={COLORS.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>


        {/* ── Account info strip ────────────────────────────────────────── */}
        {/* <View style={styles.accountStrip}>
          <Icon name="shield" size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.accountStripText}>
            Account ID: {uid?.slice(0, 8)?.toUpperCase() ?? '—'}
          </Text>
        </View> */}

      </ScrollView>
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
  scrollContent: {
    paddingTop: 8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
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

  // ── Hero section ──────────────────────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: COLORS.primaryBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.surface,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileCat: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amberBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },
  expBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
  },
  degreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  degreeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple,
  },

  // ── Availability toggle card ──────────────────────────────────────────────
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  pulseOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.inactive,
    marginTop: 3,
  },

  // ── Detail card ───────────────────────────────────────────────────────────
  detailCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,

  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },

  // ── Detail rows ───────────────────────────────────────────────────────────
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  detailRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  detailRowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inactive,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // ── Account strip ─────────────────────────────────────────────────────────
  accountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 70,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  accountStripText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonWrap: {
    alignItems: 'center',
    paddingTop: 28,
  },
  skeletonAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1F4F2',
    marginBottom: 14,
  },
  skeletonNameA: {
    height: 18,
    width: 160,
    backgroundColor: '#D1F4F2',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonNameB: {
    height: 13,
    width: 110,
    backgroundColor: '#E8F9F8',
    borderRadius: 6,
    marginBottom: 24,
  },
  skeletonCard: {
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2F1',
    alignSelf: 'stretch',
    marginLeft: 16,
    marginRight: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D1F4F2',
    marginRight: 12,
  },
  skeletonRowLines: { flex: 1 },
  skeletonLineA: {
    height: 11,
    width: '35%',
    backgroundColor: '#D1F4F2',
    borderRadius: 5,
    marginBottom: 7,
  },
  skeletonLineB: {
    height: 13,
    width: '65%',
    backgroundColor: '#E8F9F8',
    borderRadius: 5,
  },
});