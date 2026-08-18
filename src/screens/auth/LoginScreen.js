/**
 * LoginScreen.jsx
 * ─────────────────────────────────────────────
 * Flow: Phone Number → SMS OTP → Firestore role check → navigate
 * Works for Admin / Expert / User — role auto-detected
 * ─────────────────────────────────────────────
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getAuth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
} from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUser, setRole } from '../../store/slices/authSlice';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OTP_BOX_SIZE = Math.min(Math.floor((SCREEN_WIDTH - 40 - 26 - 26 - (5 * 10)) / 6), 52)


// ─── Step constants ───────────────────────────
const STEP_PHONE = 'PHONE';
const STEP_OTP = 'OTP';
const OTP_LENGTH = 6;

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();

  // ── State ──────────────────────────────────
  const [step, setStep] = useState(STEP_PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirm, setConfirm] = useState(null);   // Firebase confirmation
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // OTP input refs
  const otpRefs = useRef([...Array(OTP_LENGTH)].map(() => React.createRef()));

  // ── Animations ─────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animate on step change
  useEffect(() => {
    stepAnim.setValue(30);
    Animated.spring(stepAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, [step]);

  // ── Resend countdown ───────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Helpers ────────────────────────────────
  const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));

  const formattedPhone = () => {
    const clean = phone.replace(/\D/g, '');
    return `+91${clean}`;
  };

  // ── Step 1: Send OTP ───────────────────────
  const handleSendOtp = async () => {
    if (!phone.trim()) { setPhoneError('Phone number is required'); return; }
    if (!validatePhone(phone)) { setPhoneError('Enter a valid 10-digit mobile number'); return; }
    setPhoneError('');
    setLoading(true);

    try {
      // ── Step 1: Check if user exists in Firestore FIRST ──
      // FIX: Some accounts may have `phone` saved WITH the country code
      // (+91XXXXXXXXXX) and some WITHOUT (plain 10-digit XXXXXXXXXX),
      // depending on how they were created (self-registered vs admin-added).
      // We now check BOTH formats and only block login if NEITHER matches.
      // Previously the 10-digit fallback query was fetched but its result
      // was never checked, so valid accounts saved without +91 were
      // incorrectly told "Account Not Found".
      const db = getFirestore();
      const usersRef = collection(db, 'users');
      const cleanPhone = phone.replace(/\D/g, '');

      const qWithCode = query(usersRef, where('phone', '==', formattedPhone()));
      const qPlain = query(usersRef, where('phone', '==', cleanPhone));

      const [snapWithCode, snapPlain] = await Promise.all([
        getDocs(qWithCode),
        getDocs(qPlain),
      ]);

      if (snapWithCode.empty && snapPlain.empty) {
        // No account found in either format — block login
        Alert.alert(
          'Account Not Found',
          'No account is linked to this number. Please register first.',
          [
            { text: 'Register', onPress: () => navigation.navigate('Register') },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        setLoading(false);
        return; // ← stop here, don't send OTP
      }

      // ── Step 2: User exists (in either format), now send OTP ──
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone());
      setConfirm(confirmation);
      setStep(STEP_OTP);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);

    } catch (err) {
      console.log('handleSendOtp error:', err);
      // FIX: Alert.alert expects a string message, not an Error object.
      // Passing `err` directly rendered as "[object Object]" on screen.
      Alert.alert('Error', err?.message || 'Failed to send OTP. Check your number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handler ──────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;             // digits only
    const next = [...otp];
    next[idx] = val.slice(-1);                 // take last char
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.current?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.current?.focus();
    }
  };

  // ── Step 2: Verify OTP ─────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      let userCred;
      if (confirm?.confirm) {
        userCred = await confirm.confirm(code);
      } else {
        const credential = PhoneAuthProvider.credential(
          confirm.verificationId, code,
        );
        userCred = await signInWithCredential(getAuth(), credential);
      }

      const db = getFirestore();

      // ── Step 1: UID se try karo ──
      let snap = await getDoc(doc(db, 'users', userCred.user.uid));

      // ── Step 2: Nahi mila to phone se dhundo (Admin ne banaya hoga) ──
      // FIX: Also check the plain 10-digit format here, matching the
      // fallback logic in handleSendOtp — otherwise accounts saved without
      // +91 would fail this lookup too and get "Account Not Found" even
      // after successfully verifying the OTP.
      if (!snap.exists()) {
        const cleanPhone = userCred.user.phoneNumber?.replace(/\D/g, '').slice(-10) || '';

        const qWithCode = query(
          collection(db, 'users'),
          where('phone', '==', userCred.user.phoneNumber),
        );
        const qPlain = query(
          collection(db, 'users'),
          where('phone', '==', cleanPhone),
        );

        const [qSnapWithCode, qSnapPlain] = await Promise.all([
          getDocs(qWithCode),
          getDocs(qPlain),
        ]);

        const qSnap = !qSnapWithCode.empty ? qSnapWithCode : qSnapPlain;

        if (!qSnap.empty) {
          const oldDoc = qSnap.docs[0];

          // Data naye Auth UID pe copy karo
          await setDoc(doc(db, 'users', userCred.user.uid), {
            ...oldDoc.data(),
          });

          // Purana doc delete karo
          await deleteDoc(doc(db, 'users', oldDoc.id));

          // Fresh snap lo
          snap = await getDoc(doc(db, 'users', userCred.user.uid));
        }
      }

      // ── Step 3: Role check karo ──
      if (snap.exists()) {
        const data = snap.data();
        dispatch(setUser({ uid: userCred.user.uid, phone: userCred.user.phoneNumber }));
        dispatch(setRole(data.role));
        // RootNavigator role se automatically navigate karega
      } else {
        Alert.alert(
          'Account Not Found',
          'No account linked to this number. Please contact admin.',
          [{ text: 'OK' }],
        );
      }
    } catch (err) {
      let msg = 'Invalid OTP. Please try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP entered.';
      if (err.code === 'auth/code-expired') msg = 'OTP has expired. Please resend.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait.';
      if (err.code === 'firestore/permission-denied') msg = 'Access error. Contact support.';
      Alert.alert('Verification Failed', msg);
    }
    finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone());
      setConfirm(confirmation);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 300);
    } catch (err) {
      console.log('handleResend error:', err);
      Alert.alert('Error', err?.message || 'Could not resend OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────
  return (
    <LinearGradient
      colors={['#0A4F4E', '#0D7B7A', '#14B8A6']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Image
              style={styles.ImageLogoSize}
              resizeMode='contain'
              source={require('../../asserts/image/Logo.png')}
            />
            <Text style={styles.brandName}>Kapol Setu</Text>
            <Text style={styles.brandTagline}>Your wellness community</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* ── PHONE STEP ── */}
            {step === STEP_PHONE && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <Text style={styles.cardTitle}>Welcome back</Text>
                <Text style={styles.cardSub}>Enter your mobile number to continue</Text>

                {/* Phone Field */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <View style={[
                    styles.inputRow,
                    phoneFocused && styles.inputFocused,
                    phoneError && styles.inputErrorBorder,
                  ]}>
                    {/* Country code badge */}
                    <View style={styles.countryBadge}>
                      <Text style={styles.countryFlag}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>
                    <View style={styles.inputDivider} />
                    <TextInput
                      style={styles.input}
                      placeholder="98765 43210"
                      placeholderTextColor="#C0CDD6"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      onChangeText={(t) => {
                        setPhone(t.replace(/\D/g, ''));
                        setPhoneError('');
                      }}
                      editable={!loading}
                    />
                    {phone.length === 10 && (
                      <Icon name="check-circle" size={17} color="#10B981" />
                    )}
                  </View>
                  {phoneError ? (
                    <View style={styles.errorRow}>
                      <Icon name="alert-circle" size={12} color="#EF4444" />
                      <Text style={styles.errorText}>{phoneError}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.otpHint}>
                  <Icon name="info" size={11} color="#94A3B8" />{'  '}
                  An OTP will be sent to this number via SMS
                </Text>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0D7B7A', '#0A5F5E']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtnGrad}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Text style={styles.primaryBtnText}>Send OTP</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={styles.secondaryBtn}
                >
                  <Icon name="user-plus" size={15} color="#0D7B7A" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Create Account</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── OTP STEP ── */}
            {step === STEP_OTP && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                {/* Back */}
                <TouchableOpacity
                  onPress={() => { setStep(STEP_PHONE); setOtp(['', '', '', '', '', '']); }}
                  style={styles.backBtn}
                >
                  <Icon name="arrow-left" size={16} color="#0D7B7A" />
                  <Text style={styles.backText}>Change Number</Text>
                </TouchableOpacity>

                <View style={styles.stepIcon}>
                  <MatIcon name="shield-key-outline" size={28} color="#0D7B7A" />
                </View>
                <Text style={styles.cardTitle}>Verify OTP</Text>
                <Text style={styles.cardSub}>
                  Sent to{' '}
                  <Text style={styles.phoneHighlight}>+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</Text>
                </Text>

                {/* OTP Boxes */}
                <View style={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={otpRefs.current[idx]}
                      style={[styles.otpBox, digit && styles.otpBoxFilled]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      textAlignVertical="center"
                      selectTextOnFocus
                      editable={!loading}
                      caretHidden={true}
                      contextMenuHidden={true}
                    />
                  ))}
                </View>

                {/* Resend */}
                <View style={styles.resendRow}>
                  <Text style={styles.resendLabel}>Didn't receive it? </Text>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={loading}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0D7B7A', '#0A5F5E']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.primaryBtnGrad}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : (
                        <>
                          <MatIcon name="shield-check" size={18} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                        </>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 48 },
  ImageLogoSize: {
    width: 130,
    height: 130,
    borderRadius: 100,
  },
  bgCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80 },
  bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: '30%', left: -60 },
  bgCircle3: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(20,184,166,0.12)', bottom: 40, right: -40 },

  brandWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  brandName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginTop: 10 },
  brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

  card: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 26, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },

  stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDFC', borderWidth: 1.5, borderColor: '#CCFBF1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  phoneHighlight: { color: '#0D7B7A', fontWeight: '700' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  backText: { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },

  // Field
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 54 },
  inputFocused: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
  inputErrorBorder: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  countryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  inputDivider: { width: 1, height: 22, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  input: { flex: 1, fontSize: 16, color: '#0F172A', fontWeight: '600', letterSpacing: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  errorText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  otpHint: { fontSize: 11, color: '#94A3B8', marginBottom: 22, marginTop: 4 },

  // OTP Boxes
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  otpBox: {
    width: OTP_BOX_SIZE,
    height: OTP_BOX_SIZE + 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: Math.min(OTP_BOX_SIZE * 0.45, 22),
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold', // Android heavy weight fix
    color: '#0F172A',
    textAlign: 'center',
    textAlignVertical: 'center',     // Android vertical center fix
    includeFontPadding: false,       // Android font padding remove karo
    padding: 0,                      // Default padding hata do
  },
  otpBoxFilled: {
    borderColor: '#0D7B7A',
    backgroundColor: '#F0FDFC',
    color: '#0D7B7A',
  },

  // Resend
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  resendLabel: { fontSize: 12, color: '#94A3B8' },
  resendTimer: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  resendLink: { fontSize: 12, color: '#0D7B7A', fontWeight: '800' },

  // Buttons
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 4 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0D7B7A', borderRadius: 14, paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, color: '#0D7B7A', fontWeight: '800' },
});