/**
 * UserProfile.jsx
 *
 * Changes vs original:
 *  - try/catch + isMounted guard on getDoc → proper error state with retry
 *  - try/catch on signOut → prevents Redux/Firebase split-brain on failure
 *  - Duplicate Sign Out removed from hero top bar; single location in Account card
 *  - Hero top bar now shows an edit/settings button instead
 *  - Skeleton loading state (replaces bare ActivityIndicator)
 *  - palette, infoRows, joinedDate wrapped in useMemo
 *  - handleLogout wrapped in useCallback
 *  - InfoRow and ActionTile wrapped in React.memo
 *  - Three content sections use independent slideAnim refs for staggered reveal
 *  - Action tiles moved to a 2×2 grid (better fit on narrow screens)
 *  - color+'22' hex concatenation replaced with explicit iconBg prop
 *  - editBadge wired to navigation (edit profile) with activeOpacity
 *  - detailLabel uppercase written directly in string (avoids Android textTransform quirk)
 *  - useEffect dependency arrays corrected
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Animated, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import auth        from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout }  from '../../store/slices/authSlice';

// ─── Palette ──────────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { grad: ['#2563EB', '#1D4ED8'] },
  { grad: ['#7C3AED', '#6D28D9'] },
  { grad: ['#DB2777', '#BE185D'] },
  { grad: ['#059669', '#047857'] },
  { grad: ['#D97706', '#B45309'] },
  { grad: ['#0D7B7A', '#0A4F4E'] },
];
const getPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonBlock = React.memo(({ width: w, height: h, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: 8, backgroundColor: '#CBD5E1' },
        style,
        { opacity },
      ]}
    />
  );
});

const ProfileSkeleton = React.memo(() => (
  <View style={{ flex: 1, backgroundColor: '#EFF4F4' }}>
    {/* Hero skeleton */}
    <LinearGradient
      colors={['#0A4F4E', '#0D7B7A']}
      style={[styles.hero, { alignItems: 'center' }]}
    >
      <SkeletonBlock width={90} height={90} style={{ borderRadius: 28, marginBottom: 14, opacity: 0.4 }} />
      <SkeletonBlock width={140} height={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width={190} height={13} style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SkeletonBlock width={110} height={28} style={{ borderRadius: 20 }} />
        <SkeletonBlock width={90}  height={28} style={{ borderRadius: 20 }} />
      </View>
    </LinearGradient>
    {/* Actions skeleton */}
    <View style={styles.actionsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.actionTile, { backgroundColor: '#FFFFFF' }]}>
          <SkeletonBlock width={40} height={40} style={{ borderRadius: 12 }} />
          <SkeletonBlock width={48} height={11} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
    {/* Card skeleton */}
    <View style={[styles.detailCard, { gap: 14 }]}>
      {[80, 110, 70].map((w, i) => (
        <SkeletonBlock key={i} width={`${w}%`} height={13} />
      ))}
    </View>
  </View>
));

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = React.memo(({ featherIcon, matIcon, label, value, isLast }) => (
  <>
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        {matIcon
          ? <MatIcon name={matIcon} size={17} color="#0D7B7A" />
          : <Icon    name={featherIcon} size={17} color="#0D7B7A" />
        }
      </View>
      <View style={styles.detailText}>
        {/* uppercase written directly — avoids Android textTransform quirk */}
        <Text style={styles.detailLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
    {!isLast && <View style={styles.rowDivider} />}
  </>
));

// ─── Action Tile ──────────────────────────────────────────────────────────────
// iconBg is now an explicit prop — no more hex+'22' string concatenation
const ActionTile = React.memo(({
  featherIcon, matIcon, label, color, bg, iconBg, onPress,
}) => (
  <TouchableOpacity
    style={[styles.actionTile, { backgroundColor: bg }]}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
      {matIcon
        ? <MatIcon name={matIcon} size={20} color={color} />
        : <Icon    name={featherIcon} size={20} color={color} />
      }
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
));

// ─── Menu Row ─────────────────────────────────────────────────────────────────
const MenuRow = React.memo(({
  featherIcon, matIcon, label, labelColor, iconBg, iconColor,
  chevronColor, onPress, isLast,
}) => (
  <>
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg ?? '#F0FDFA' }]}>
        {matIcon
          ? <MatIcon name={matIcon} size={17} color={iconColor ?? '#0D7B7A'} />
          : <Icon    name={featherIcon} size={16} color={iconColor ?? '#0D7B7A'} />
        }
      </View>
      <Text style={[styles.menuRowText, labelColor ? { color: labelColor } : null]}>
        {label}
      </Text>
      <Icon name="chevron-right" size={16} color={chevronColor ?? '#CBD5E1'} />
    </TouchableOpacity>
    {!isLast && <View style={styles.rowDivider} />}
  </>
));

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const SectionCard = React.memo(({ iconName, iconLib, title, children, animStyle }) => (
  <Animated.View style={[styles.detailCard, animStyle]}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderIcon}>
        {iconLib === 'mat'
          ? <MatIcon name={iconName} size={14} color="#0D7B7A" />
          : <Icon    name={iconName} size={14} color="#0D7B7A" />
        }
      </View>
      <Text style={styles.cardHeaderTitle}>{title}</Text>
    </View>
    {children}
  </Animated.View>
));

// ─── Error State ──────────────────────────────────────────────────────────────
const ErrorState = React.memo(({ onRetry }) => (
  <View style={styles.centered}>
    <View style={styles.errorIconWrap}>
      <Icon name="wifi-off" size={32} color="#94A3B8" />
    </View>
    <Text style={styles.errorTitle}>Unable to Load Profile</Text>
    <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
      <Text style={styles.retryBtnText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserProfile({ navigation }) {
  const dispatch = useDispatch();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Independent animation values for staggered reveal
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slide0     = useRef(new Animated.Value(24)).current; // actions row
  const slide1     = useRef(new Animated.Value(24)).current; // details card
  const slide2     = useRef(new Animated.Value(24)).current; // account card
  const scaleAnim  = useRef(new Animated.Value(0.94)).current;
  const isMounted  = useRef(true);

  const uid = auth().currentUser?.uid;

  // ── Unmount guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      const db = getFirestore();
      const d  = await getDoc(doc(db, 'users', uid));
      if (!isMounted.current) return;
      if (d.exists()) setProfile(d.data());
      setLoading(false);
    } catch {
      if (!isMounted.current) return;
      setLoading(false);
      setLoadError(true);
    }
  }, [uid]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Entrance animation — staggered across 3 sections ─────────────────────
  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 13, useNativeDriver: true }),
      Animated.spring(slide0,    { toValue: 0, tension: 68, friction: 14, delay:  60, useNativeDriver: true }),
      Animated.spring(slide1,    { toValue: 0, tension: 68, friction: 14, delay: 140, useNativeDriver: true }),
      Animated.spring(slide2,    { toValue: 0, tension: 68, friction: 14, delay: 220, useNativeDriver: true }),
    ]).start();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Logout — single handler, try/catch ───────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text   : 'Sign Out',
          style  : 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              dispatch(logout());
            } catch {
              Alert.alert('Error', 'Sign out failed. Please try again.');
            }
          },
        },
      ],
    );
  }, [dispatch]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const palette = useMemo(() => getPalette(profile?.name), [profile?.name]);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt?.toDate) return null;
    return profile.createdAt.toDate().toLocaleDateString('en-IN', {
      month: 'short', year: 'numeric',
    });
  }, [profile?.createdAt]);

  const infoRows = useMemo(() => [
    { featherIcon: 'mail',    matIcon: null,                 label: 'Email Address', value: profile?.email   },
    { featherIcon: 'phone',   matIcon: null,                 label: 'Mobile Number', value: profile?.mobile  },
    { featherIcon: 'map-pin', matIcon: null,                 label: 'Address',       value: profile?.address },
    {
      featherIcon: null,
      matIcon    : 'calendar-outline',
      label      : 'Member Since',
      value      : profile?.createdAt?.toDate
        ? profile.createdAt.toDate().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : null,
    },
  ].filter((r) => r.value), [profile]);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return <ProfileSkeleton />;

  if (loadError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Text style={styles.heroScreenTitle}>My Profile</Text>
        </LinearGradient>
        <ErrorState onRetry={fetchProfile} />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Top bar — Sign Out removed from here; single location in Account card */}
          <View style={styles.heroTopBar}>
            <Text style={styles.heroScreenTitle}>My Profile</Text>
            {/* <TouchableOpacity
              style={styles.editHeaderBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.82}
            >
              <Icon name="edit-2" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={styles.editHeaderText}>Edit</Text>
            </TouchableOpacity> */}
          </View>

          {/* Avatar */}
          <Animated.View
            style={[
              styles.avatarBlock,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.avatarShadowWrap}>
              <LinearGradient
                colors={palette.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGrad}
              >
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
              {/* <TouchableOpacity
                style={styles.editBadge}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.8}
              >
                <Icon name="camera" size={13} color="#0D7B7A" />
              </TouchableOpacity> */}
            </View>

            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>

            <View style={styles.memberBadgeRow}>
              <View style={styles.memberBadge}>
                <MatIcon name="shield-check" size={13} color="#0D7B7A" />
                <Text style={styles.memberBadgeText}>Verified Member</Text>
              </View>
              {joinedDate && (
                <View style={styles.memberBadge}>
                  <Icon name="calendar" size={11} color="#0D7B7A" />
                  <Text style={styles.memberBadgeText}>Since {joinedDate}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Quick Actions — 2×2 grid ── */}
        {/* <Animated.View
          style={[
            styles.actionsGrid,
            { opacity: fadeAnim, transform: [{ translateY: slide0 }] },
          ]}
        >
          <ActionTile
            featherIcon="message-circle"
            label="My Chats"
            color="#0D7B7A"
            bg="#F0FDFA"
            iconBg="#CCEFED"
            onPress={() => navigation.navigate('ChatHistory')}
          />
          <ActionTile
            matIcon="bell-outline"
            label="Notifications"
            color="#7C3AED"
            bg="#F5F3FF"
            iconBg="#DDD6FE"
            onPress={() => {}}
          />
          <ActionTile
            featherIcon="settings"
            label="Settings"
            color="#D97706"
            bg="#FFFBEB"
            iconBg="#FDE68A"
            onPress={() => {}}
          />
          <ActionTile
            featherIcon="help-circle"
            label="Support"
            color="#2563EB"
            bg="#EFF6FF"
            iconBg="#BFDBFE"
            onPress={() => {}}
          />
        </Animated.View> */}

        {/* ── Profile Details Card ── */}
        {infoRows.length > 0 && (
          <SectionCard
            iconName="user"
            title="Profile Details"
            animStyle={{ opacity: fadeAnim, transform: [{ translateY: slide1 }] }}
          >
            {infoRows.map((row, idx) => (
              <InfoRow
                key={row.label}
                featherIcon={row.featherIcon}
                matIcon={row.matIcon}
                label={row.label}
                value={row.value}
                isLast={idx === infoRows.length - 1}
              />
            ))}
          </SectionCard>
        )}

        {/* ── Account Card ── */}
        <SectionCard
          iconName="shield"
          title="Account"
          animStyle={{ opacity: fadeAnim, transform: [{ translateY: slide2 }] }}
        >
          <MenuRow
            featherIcon="edit-2"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuRow
            featherIcon="lock"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <MenuRow
            matIcon="file-document-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
          {/* Single Sign Out location */}
          <MenuRow
            featherIcon="log-out"
            label="Sign Out"
            labelColor="#DC2626"
            iconBg="#FEF2F2"
            iconColor="#DC2626"
            chevronColor="#FCA5A5"
            onPress={handleLogout}
            isLast
          />
        </SectionCard>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#EFF4F4' },
  centered     : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#EFF4F4' },
  scrollContent: { paddingBottom: 48 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingTop       : 56,
    paddingBottom    : 32,
    paddingHorizontal: 20,
  },
  heroTopBar: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : 24,
  },
  heroScreenTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },

  // Edit button replaces the duplicate Sign Out in the hero
  editHeaderBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 6,
    backgroundColor  : 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : 20,
  },
  editHeaderText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 13 },

  avatarBlock     : { alignItems: 'center' },
  avatarShadowWrap: { position: 'relative', marginBottom: 14 },
  avatarGrad: {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  editBadge : {
    position       : 'absolute',
    bottom         : -4, right: -4,
    width          : 28, height: 28,
    borderRadius   : 9,
    backgroundColor: '#FFFFFF',
    justifyContent : 'center', alignItems: 'center',
    shadowColor    : '#000',
    shadowOpacity  : 0.12,
    shadowRadius   : 4,
    elevation      : 4,
  },
  profileName : { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '500' },
  memberBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  memberBadge: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 5,
    backgroundColor  : '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical  : 5,
    borderRadius     : 20,
  },
  memberBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

  // ── Quick Actions — 2×2 grid ──────────────────────────────────────────────
  actionsGrid: {
    flexDirection  : 'row',
    flexWrap       : 'wrap',
    marginHorizontal: 16,
    marginTop      : 16,
    gap            : 10,
  },
  actionTile: {
    // Each tile takes ~half the row minus gap, so it fits on any screen width
    width         : '47.5%',
    alignItems    : 'center',
    paddingVertical: 16,
    borderRadius  : 16,
    borderWidth   : 1,
    borderColor   : '#E0F2F1',
    gap           : 8,
  },
  actionIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '700' },

  // ── Cards ─────────────────────────────────────────────────────────────────
  detailCard: {
    backgroundColor  : '#FFFFFF',
    marginHorizontal : 16,
    marginTop        : 14,
    borderRadius     : 20,
    padding          : 18,
    borderWidth      : 1,
    borderColor      : '#E0F2F1',
    shadowColor      : '#0D7B7A',
    shadowOpacity    : 0.05,
    shadowRadius     : 8,
    shadowOffset     : { width: 0, height: 3 },
    elevation        : 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDFA',
    justifyContent : 'center', alignItems: 'center',
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  // ── Info rows ─────────────────────────────────────────────────────────────
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, paddingVertical: 11,
  },
  detailIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: '#F0FDFA',
    justifyContent : 'center', alignItems: 'center',
  },
  detailText : { flex: 1 },
  detailLabel: {
    fontSize: 11, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5,
  },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginTop: 3 },
  rowDivider : { height: 1, backgroundColor: '#F0FDFA', marginLeft: 48 },

  // ── Menu rows ─────────────────────────────────────────────────────────────
  menuRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : 12,
    paddingVertical: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  menuRowText: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600' },

  // ── Error state ───────────────────────────────────────────────────────────
  errorIconWrap : {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent : 'center', alignItems: 'center',
    marginBottom   : 16,
  },
  errorTitle    : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  errorSubtitle : { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  retryBtn      : {
    marginTop        : 20,
    backgroundColor  : '#0D7B7A',
    paddingHorizontal: 28,
    paddingVertical  : 12,
    borderRadius     : 14,
  },
  retryBtnText  : { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  versionText: {
    textAlign: 'center', fontSize: 12,
    color: '#94A3B8', fontWeight: '500', marginTop: 20,
  },
});