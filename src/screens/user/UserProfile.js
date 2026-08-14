/**
 * UserProfile.jsx
 *
 * Change vs previous version:
 *  - Added "Report a Concern" row to the Account card (between Terms of
 *    Service and Sign Out). Navigates to the new ReportConcern screen.
 *    This satisfies Google Play's child safety standards requirement that
 *    users must be able to report concerns in-app.
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
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';
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
    <View style={[styles.detailCard, { gap: 14, marginTop: 16 }]}>
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
        <Text style={styles.detailLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
    {!isLast && <View style={styles.rowDivider} />}
  </>
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

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slide1    = useRef(new Animated.Value(24)).current;
  const slide2    = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const isMounted = useRef(true);

  const animPlayed = useRef(false);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    const db     = getFirestore();
    const docRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isMounted.current) return;
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
        setLoading(false);
        setLoadError(false);
      },
      (_error) => {
        if (!isMounted.current) return;
        setLoading(false);
        setLoadError(true);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setLoading(true);
    const db     = getFirestore();
    const docRef = doc(db, 'users', uid);
    onSnapshot(docRef, (snapshot) => {
      if (!isMounted.current) return;
      if (snapshot.exists()) setProfile(snapshot.data());
      setLoading(false);
    }, () => {
      if (!isMounted.current) return;
      setLoading(false);
      setLoadError(true);
    });
  }, [uid]);

  useEffect(() => {
    if (loading || animPlayed.current) return;
    animPlayed.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 13, useNativeDriver: true }),
      Animated.spring(slide1,    { toValue: 0, tension: 68, friction: 14, delay: 100, useNativeDriver: true }),
      Animated.spring(slide2,    { toValue: 0, tension: 68, friction: 14, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const palette = useMemo(() => getPalette(profile?.name), [profile?.name]);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt?.toDate) return null;
    return profile.createdAt.toDate().toLocaleDateString('en-IN', {
      month: 'short', year: 'numeric',
    });
  }, [profile?.createdAt]);

  const infoRows = useMemo(() => [
    { featherIcon: 'mail',  matIcon: null,               label: 'Email Address', value: profile?.email  },
    { featherIcon: 'phone', matIcon: null,               label: 'Mobile Number', value: profile?.phone  },
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
        <ErrorState onRetry={handleRetry} />
      </View>
    );
  }

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
          <View style={styles.heroTopBar}>
            <Text style={styles.heroScreenTitle}>My Profile</Text>
          </View>

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
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <MenuRow
            matIcon="file-document-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          {/* Google Play child safety standards requirement: users must be
              able to report a concern in-app. */}
          <MenuRow
            featherIcon="flag"
            label="Report a Concern"
            iconBg="#FFF7ED"
            iconColor="#EA580C"
            onPress={() => navigation.navigate('ReportConcern')}
          />
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

  hero: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20 },
  heroTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  heroScreenTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },

  avatarBlock     : { alignItems: 'center' },
  avatarShadowWrap: { position: 'relative', marginBottom: 14 },
  avatarGrad: {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText    : { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  profileName   : { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  profileEmail  : { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '500' },
  memberBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  memberBadge   : {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', paddingHorizontal: 11,
    paddingVertical: 5, borderRadius: 20,
  },
  memberBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

  detailCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardHeader     : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardHeaderIcon : {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  detailRow    : { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11 },
  detailIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  detailText : { flex: 1 },
  detailLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginTop: 3 },
  rowDivider : { height: 1, backgroundColor: '#F0FDFA', marginLeft: 48 },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  menuRowText: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600' },

  errorIconWrap : {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorTitle    : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  errorSubtitle : { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  retryBtn      : {
    marginTop: 20, backgroundColor: '#0D7B7A',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryBtnText  : { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  versionText: { textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 20 },
});