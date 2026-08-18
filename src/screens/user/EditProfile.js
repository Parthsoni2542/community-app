/**
 * EditProfile.jsx
 * Edit profile screen — mirrors UserProfile design language exactly.
 * Fields: name (editable), email (editable), mobile (read-only)
 * On save: updateDoc → Firestore, then goBack()
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Animated, Alert,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ─── Palette (same as UserProfile) ───────────────────────────────────────────
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
        style, { opacity },
      ]}
    />
  );
});

// 3 skeleton fields (name, email, mobile) — address removed
const EditSkeleton = React.memo(() => (
  <View style={{ flex: 1, backgroundColor: '#EFF4F4' }}>
    <LinearGradient colors={['#0A4F4E', '#0D7B7A']} style={styles.hero}>
      <View style={styles.heroTopBar}>
        <SkeletonBlock width={80} height={16} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <SkeletonBlock width={90} height={90} style={{ borderRadius: 28, marginBottom: 14, opacity: 0.4 }} />
        <SkeletonBlock width={140} height={18} style={{ marginBottom: 8 }} />
        <SkeletonBlock width={190} height={13} />
      </View>
    </LinearGradient>
    <View style={[styles.formCard, { gap: 16 }]}>
      {[1, 2, 3].map((k) => (
        <View key={k}>
          <SkeletonBlock width={80} height={11} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="100%" height={50} style={{ borderRadius: 14 }} />
        </View>
      ))}
    </View>
  </View>
));

// ─── Field component ──────────────────────────────────────────────────────────
const Field = React.memo(({
  featherIcon, matIcon, label, value, onChangeText,
  keyboardType, editable = true, placeholder,
  isFocused, onFocus, onBlur,
}) => {
  const borderColor = !editable
    ? '#E0F2F1'
    : isFocused ? '#0D7B7A' : '#E2E8F0';

  const bgColor = !editable ? '#F8FFFE' : '#FFFFFF';

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <View style={[styles.fieldBox, { borderColor, backgroundColor: bgColor }]}>
        <View style={styles.fieldIcon}>
          {matIcon
            ? <MatIcon name={matIcon} size={17} color={isFocused ? '#0D7B7A' : '#94A3B8'} />
            : <Icon name={featherIcon} size={17} color={isFocused ? '#0D7B7A' : '#94A3B8'} />
          }
        </View>
        <TextInput
          style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          keyboardType={keyboardType || 'default'}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="none"
        />
        {!editable && (
          <Icon name="lock" size={14} color="#CBD5E1" style={{ marginRight: 14 }} />
        )}
      </View>
      {!editable && (
        <Text style={styles.fieldHint}>This field cannot be changed</Text>
      )}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditProfile({ navigation }) {
  const uid = auth().currentUser?.uid;

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Form fields — address removed
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [mobile, setMobile] = useState('');

  // Original values — to detect changes (name + email only; mobile is read-only)
  const original = useRef({});

  // Focus state
  const [focused, setFocused] = useState('');

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slide0    = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Fetch existing profile ────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      const db = getFirestore();
      const d  = await getDoc(doc(db, 'users', uid));
      if (!isMounted.current) return;
      if (d.exists()) {
        const data = d.data();
        const fetchedName  = data.name  || '';
        const fetchedEmail = data.email || '';
        const fetchedPhone = data.phone || '';   // ← read from 'phone' field

        setName(fetchedName);
        setEmail(fetchedEmail);
        setMobile(fetchedPhone);

        // Store originals for change-detection (mobile excluded — read-only)
        original.current = {
          name:  fetchedName,
          email: fetchedEmail,
        };
      }
      setLoading(false);
    } catch {
      if (!isMounted.current) return;
      setLoading(false);
      setLoadError(true);
    }
  }, [uid]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 13, useNativeDriver: true }),
      Animated.spring(slide0,    { toValue: 0, tension: 68, friction: 14, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Has changes? (name or email changed) ─────────────────────────────────
  const hasChanges = useMemo(() => (
    name.trim()  !== original.current.name ||
    email.trim() !== original.current.email
  ), [name, email]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Email cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', uid), {
        name:  name.trim(),
        email: email.trim(),
        // mobile/phone is NOT updated — read-only
      });
      if (!isMounted.current) return;
      navigation.goBack();
    } catch {
      if (!isMounted.current) return;
      Alert.alert('Save Failed', 'Could not update profile. Please try again.');
    } finally {
      if (isMounted.current) setSaving(false);
    }
  }, [hasChanges, name, email, uid, navigation]);

  // ── Discard guard ─────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (!hasChanges) { navigation.goBack(); return; }
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to go back?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  }, [hasChanges, navigation]);

  const palette = useMemo(() => getPalette(name), [name]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <EditSkeleton />;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          style={[styles.hero, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Text style={styles.heroScreenTitle}>Edit Profile</Text>
        </LinearGradient>
        <View style={styles.centered}>
          <View style={styles.errorIconWrap}>
            <Icon name="wifi-off" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={['#0A4F4E', '#0D7B7A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Icon name="arrow-left" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.heroScreenTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={[
                  styles.saveHeaderBtn,
                  (!hasChanges || saving) && { opacity: 0.5 },
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#0D7B7A" />
                  : <Text style={styles.saveHeaderText}>Save</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <Animated.View
              style={[
                styles.avatarBlock,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={palette.grad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.avatarGrad}
              >
                <Text style={styles.avatarText}>
                  {name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
              <Text style={styles.profileName}>{name || 'Your Name'}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </Animated.View>
          </LinearGradient>

          {/* ── Form Card ── */}
          <Animated.View
            style={[
              styles.formCard,
              { opacity: fadeAnim, transform: [{ translateY: slide0 }] },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Icon name="edit-2" size={14} color="#0D7B7A" />
              </View>
              <Text style={styles.cardHeaderTitle}>Personal Information</Text>
            </View>

            {/* Full Name — editable */}
            <Field
              featherIcon="user"
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              editable
              isFocused={focused === 'name'}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused('')}
            />

            {/* Email — editable */}
            <Field
              featherIcon="mail"
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              editable
              isFocused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
            />

            {/* Mobile — read-only */}
            <Field
              featherIcon="phone"
              label="Mobile Number"
              value={mobile}
              onChangeText={() => {}}
              placeholder="—"
              keyboardType="phone-pad"
              editable={false}
              isFocused={false}
              onFocus={() => {}}
              onBlur={() => {}}
            />
          </Animated.View>

          {/* ── Save Button ── */}
          <Animated.View
            style={[
              styles.saveBtnWrap,
              { opacity: fadeAnim, transform: [{ translateY: slide0 }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!hasChanges || saving) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasChanges || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>
                    {hasChanges ? 'Save Changes' : 'No Changes'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#EFF4F4' },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  hero:            { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20 },
  heroTopBar:      { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  heroScreenTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  saveHeaderBtn: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, minWidth: 52, alignItems: 'center',
  },
  saveHeaderText:  { color: '#0D7B7A', fontWeight: '800', fontSize: 13 },

  // Avatar
  avatarBlock:  { alignItems: 'center' },
  avatarGrad: {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', marginBottom: 14,
  },
  avatarText:    { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  profileName:   { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  profileEmail:  { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '500' },

  // Form card
  formCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  cardHeaderIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  // Fields
  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5, marginBottom: 7 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, height: 52, overflow: 'hidden',
  },
  fieldIcon:          { width: 48, justifyContent: 'center', alignItems: 'center' },
  fieldInput:         { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500', paddingRight: 14 },
  fieldInputDisabled: { color: '#94A3B8' },
  fieldHint:          { fontSize: 11, color: '#CBD5E1', marginTop: 5, marginLeft: 4 },

  // Save button
  saveBtnWrap: { marginHorizontal: 16, marginTop: 16 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0D7B7A', borderRadius: 16, paddingVertical: 16,
    shadowColor: '#0D7B7A', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0, elevation: 0 },
  saveBtnText:     { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  // Error state
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorTitle:    { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  errorSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, backgroundColor: '#0D7B7A',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});