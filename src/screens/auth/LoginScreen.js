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
  setDoc,      // ← add
  deleteDoc,   // ← add
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
  // const handleSendOtp = async () => {
  //   if (!phone.trim()) { setPhoneError('Phone number is required'); return; }
  //   if (!validatePhone(phone)) { setPhoneError('Enter a valid 10-digit mobile number'); return; }
  //   setPhoneError('');
  //   setLoading(true);
  //   try {
  //     const auth        = getAuth();
  //     const confirmation = await signInWithPhoneNumber(auth, formattedPhone());
  //     setConfirm(confirmation);
  //     setStep(STEP_OTP);
  //     setResendTimer(30);
  //     setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);
  //   } catch (err) {
  //     console.log("ssdddssd",err);
  //     Alert.alert('Error', 'Failed to send OTP. Check your number and try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSendOtp = async () => {
    if (!phone.trim()) { setPhoneError('Phone number is required'); return; }
    if (!validatePhone(phone)) { setPhoneError('Enter a valid 10-digit mobile number'); return; }
    setPhoneError('');
    setLoading(true);

    try {
      // ── Step 1: Check if user exists in Firestore FIRST ──
      const db = getFirestore();
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', formattedPhone()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // No account found — block login

        const q2 = query(usersRef, where('phone', '==', phone)); // sirf 10 digit
        const snap2 = await getDocs(q2);
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



      // ── Step 2: User exists, now send OTP ──
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone());
      setConfirm(confirmation);
      setStep(STEP_OTP);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);

    } catch (err) {
      console.log("sdddsdsd", err)
      console.log('handleSendOtp error:', err);
      Alert.alert('Error', err);
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
  // const handleVerifyOtp = async () => {
  //   const code = otp.join('');
  //   if (code.length < OTP_LENGTH) {
  //     Alert.alert('Incomplete', 'Please enter the 6-digit OTP.');
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     // Verify via confirmation object (Firebase v9 modular)
  //     let userCred;
  //     if (confirm?.confirm) {
  //       // compat style
  //       userCred = await confirm.confirm(code);
  //     } else {
  //       const credential = PhoneAuthProvider.credential(
  //         confirm.verificationId,
  //         code,
  //       );
  //       userCred = await signInWithCredential(getAuth(), credential);
  //     }

  //     // Fetch role from Firestore
  //     const db = getFirestore();
  //     const snap = await getDoc(doc(db, 'users', userCred.user.uid));

  //     if (snap.exists()) {
  //       dispatch(setUser({ uid: userCred.user.uid, phone: userCred.user.phoneNumber }));
  //       dispatch(setRole(snap.data().role));
  //       // Navigation is handled by your auth listener / RootNavigator
  //     } else {
  //       // New user — send to Register
  //       Alert.alert(
  //         'Account Not Found',
  //         'No account linked to this number. Please register first.',
  //         [{ text: 'Register', onPress: () => navigation.navigate('Register') }, { text: 'Cancel' }],
  //       );
  //     }
  //   } catch (err) {
  //     let msg = 'Invalid OTP. Please try again.';
  //     if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP entered.';
  //     if (err.code === 'auth/code-expired') msg = 'OTP has expired. Please resend.';
  //     Alert.alert('Verification Failed', msg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      if (!snap.exists()) {
        const q = query(
          collection(db, 'users'),
          where('phone', '==', userCred.user.phoneNumber),
        );
        const qSnap = await getDocs(q);

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
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait.'; // ← ADD
      if (err.code === 'firestore/permission-denied') msg = 'Access error. Contact support.'; // ← ADD
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
    } catch {
      Alert.alert('Error', 'Could not resend OTP. Try again.');
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* <View style={styles.logoCircle}> */}
            <Image
              style={styles.ImageLogoSize}
              resizeMode='contain'
              source={require('../../asserts/image/Logo.png')}
            />
            {/* <MatIcon name="leaf-circle" size={42} color="#14B8A6" /> */}
            {/* </View> */}
            <Text style={styles.brandName}>Kapol Setu</Text>
            <Text style={styles.brandTagline}>Your wellness community</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* ── PHONE STEP ── */}
            {step === STEP_PHONE && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                {/* <View style={styles.stepIcon}>
                  <MatIcon name="cellphone" size={28} color="#0D7B7A" />
                </View> */}
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
                  {/* <Text style={styles.dividerLine}></Text>
                  <View style={styles.dividerLine} /> */}
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
                      textAlignVertical="center"      // ← ADD
                      selectTextOnFocus
                      editable={!loading}
                      caretHidden={true}              // ← ADD — cursor hide karo box mein
                      contextMenuHidden={true}        // ← ADD — long press menu disable
                    />
                    // <TextInput
                    //   key={idx}
                    //   ref={otpRefs.current[idx]}
                    //   style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    //   value={digit}
                    //   onChangeText={(v) => handleOtpChange(v, idx)}
                    //   onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    //   keyboardType="number-pad"
                    //   maxLength={1}
                    //   textAlign="center"
                    //   selectTextOnFocus
                    //   editable={!loading}
                    // />
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
  // otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  // otpBox: { width: 46, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  // otpBoxFilled: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC', color: '#0D7B7A' },

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


/**
 * LoginScreen.jsx
 * ─────────────────────────────────────────────
 * Flow: Phone Number → SMS OTP → Firestore role check → navigate
 * Country code: WhatsApp-style bottom sheet with search
 * ─────────────────────────────────────────────
 */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
//   ScrollView, Animated, Image, Dimensions, FlatList, Modal,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {
//   getAuth,
//   signInWithPhoneNumber,
//   PhoneAuthProvider,
//   signInWithCredential,
// } from '@react-native-firebase/auth';
// import {
//   getFirestore,
//   doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc,
// } from '@react-native-firebase/firestore';
// import { useDispatch } from 'react-redux';
// import { setUser, setRole } from '../../store/slices/authSlice';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// const OTP_BOX_SIZE = Math.min(Math.floor((SCREEN_WIDTH - 40 - 26 - 26 - (5 * 10)) / 6), 52);

// const STEP_PHONE = 'PHONE';
// const STEP_OTP = 'OTP';
// const OTP_LENGTH = 6;

// // ─── Country data ─────────────────────────────────────────────────────────────
// const COUNTRIES = [
//   { name: 'India', code: '+91', flag: '🇮🇳', iso: 'IN' },
//   { name: 'United States', code: '+1', flag: '🇺🇸', iso: 'US' },
//   { name: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB' },
//   { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE' },
//   { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', iso: 'SA' },
//   { name: 'Australia', code: '+61', flag: '🇦🇺', iso: 'AU' },
//   { name: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA' },
//   { name: 'Singapore', code: '+65', flag: '🇸🇬', iso: 'SG' },
//   { name: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE' },
//   { name: 'France', code: '+33', flag: '🇫🇷', iso: 'FR' },
//   { name: 'South Africa', code: '+27', flag: '🇿🇦', iso: 'ZA' },
//   { name: 'Nigeria', code: '+234', flag: '🇳🇬', iso: 'NG' },
//   { name: 'Kenya', code: '+254', flag: '🇰🇪', iso: 'KE' },
//   { name: 'Pakistan', code: '+92', flag: '🇵🇰', iso: 'PK' },
//   { name: 'Bangladesh', code: '+880', flag: '🇧🇩', iso: 'BD' },
//   { name: 'Sri Lanka', code: '+94', flag: '🇱🇰', iso: 'LK' },
//   { name: 'Nepal', code: '+977', flag: '🇳🇵', iso: 'NP' },
//   { name: 'New Zealand', code: '+64', flag: '🇳🇿', iso: 'NZ' },
//   { name: 'Japan', code: '+81', flag: '🇯🇵', iso: 'JP' },
//   { name: 'China', code: '+86', flag: '🇨🇳', iso: 'CN' },
//   { name: 'Hong Kong', code: '+852', flag: '🇭🇰', iso: 'HK' },
//   { name: 'Malaysia', code: '+60', flag: '🇲🇾', iso: 'MY' },
//   { name: 'Indonesia', code: '+62', flag: '🇮🇩', iso: 'ID' },
//   { name: 'Thailand', code: '+66', flag: '🇹🇭', iso: 'TH' },
//   { name: 'Philippines', code: '+63', flag: '🇵🇭', iso: 'PH' },
//   { name: 'Qatar', code: '+974', flag: '🇶🇦', iso: 'QA' },
//   { name: 'Kuwait', code: '+965', flag: '🇰🇼', iso: 'KW' },
//   { name: 'Bahrain', code: '+973', flag: '🇧🇭', iso: 'BH' },
//   { name: 'Oman', code: '+968', flag: '🇴🇲', iso: 'OM' },
//   { name: 'Jordan', code: '+962', flag: '🇯🇴', iso: 'JO' },
//   { name: 'Italy', code: '+39', flag: '🇮🇹', iso: 'IT' },
//   { name: 'Spain', code: '+34', flag: '🇪🇸', iso: 'ES' },
//   { name: 'Netherlands', code: '+31', flag: '🇳🇱', iso: 'NL' },
//   { name: 'Sweden', code: '+46', flag: '🇸🇪', iso: 'SE' },
//   { name: 'Switzerland', code: '+41', flag: '🇨🇭', iso: 'CH' },
//   { name: 'Brazil', code: '+55', flag: '🇧🇷', iso: 'BR' },
//   { name: 'Mexico', code: '+52', flag: '🇲🇽', iso: 'MX' },
//   { name: 'Argentina', code: '+54', flag: '🇦🇷', iso: 'AR' },
//   { name: 'Russia', code: '+7', flag: '🇷🇺', iso: 'RU' },
//   { name: 'Turkey', code: '+90', flag: '🇹🇷', iso: 'TR' },
// ];

// // ─── CountryPickerSheet ───────────────────────────────────────────────────────
// const CountryPickerSheet = ({ visible, selected, onSelect, onClose }) => {
//   const [search, setSearch] = useState('');
//   const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
//   const backdropAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       setSearch('');
//       Animated.parallel([
//         Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
//         Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
//       ]).start();
//     } else {
//       Animated.parallel([
//         Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }),
//         Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
//       ]).start();
//     }
//   }, [visible]);

//   const filtered = useMemo(() => {
//     const s = search.trim().toLowerCase();
//     if (!s) return COUNTRIES;
//     return COUNTRIES.filter(
//       (c) =>
//         c.name.toLowerCase().includes(s) ||
//         c.code.includes(s) ||
//         c.iso.toLowerCase().includes(s),
//     );
//   }, [search]);

//   const renderItem = ({ item }) => {
//     const isSelected = item.iso === selected.iso;
//     return (
//       <TouchableOpacity
//         style={[styles.countryRow, isSelected && styles.countryRowSelected]}
//         onPress={() => { onSelect(item); onClose(); }}
//         activeOpacity={0.75}
//       >
//         <Text style={styles.countryRowFlag}>{item.flag}</Text>
//         <Text style={[styles.countryRowName, isSelected && styles.countryRowNameSelected]}
//           numberOfLines={1}>
//           {item.name}
//         </Text>
//         <Text style={[styles.countryRowCode, isSelected && styles.countryRowCodeSelected]}>
//           {item.code}
//         </Text>
//         {isSelected && (
//           <Icon name="check-circle" size={16} color="#0D7B7A" style={{ marginLeft: 4 }} />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   if (!visible) return null;

//   return (
//     <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
//       {/* Backdrop */}
//       <Animated.View style={[styles.sheetBackdrop, { opacity: backdropAnim }]}>
//         <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
//       </Animated.View>

//       {/* Sheet */}
//       <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
//         {/* Handle */}
//         <View style={styles.sheetHandle} />

//         {/* Header */}
//         <View style={styles.sheetHeader}>
//           <Text style={styles.sheetTitle}>Select Country</Text>
//           <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//             <Icon name="x" size={20} color="#64748B" />
//           </TouchableOpacity>
//         </View>

//         {/* Search */}
//         {/* <View style={styles.sheetSearch}>
//           <Icon name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
//           <TextInput
//             style={styles.sheetSearchInput}
//             placeholder="Search country or code…"
//             placeholderTextColor="#C0CDD6"
//             value={search}
//             onChangeText={setSearch}
//             autoCapitalize="none"
//             autoCorrect={false}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//               <Icon name="x-circle" size={16} color="#94A3B8" />
//             </TouchableOpacity>
//           )}
//         </View> */}

//         {/* List */}
//         <FlatList
//           data={filtered}
//           keyExtractor={(item) => item.iso}
//           renderItem={renderItem}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//           ListEmptyComponent={
//             <View style={styles.sheetEmpty}>
//               <Text style={styles.sheetEmptyText}>No countries found</Text>
//             </View>
//           }
//           contentContainerStyle={{ paddingBottom: 24 }}
//         />
//       </Animated.View>
//     </Modal>
//   );
// };

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function LoginScreen({ navigation }) {
//   const dispatch = useDispatch();

//   const [step, setStep] = useState(STEP_PHONE);
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [confirm, setConfirm] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [resendTimer, setResendTimer] = useState(0);
//   const [phoneFocused, setPhoneFocused] = useState(false);
//   const [phoneError, setPhoneError] = useState('');

//   // ── Country code state ──────────────────────────────────────────────────────
//   const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // India default
//   const [showPicker, setShowPicker] = useState(false);

//   const otpRefs = useRef([...Array(OTP_LENGTH)].map(() => React.createRef()));

//   // ── Animations ──────────────────────────────────────────────────────────────
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;
//   const scaleAnim = useRef(new Animated.Value(0.96)).current;
//   const stepAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
//       Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
//       Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   useEffect(() => {
//     stepAnim.setValue(30);
//     Animated.spring(stepAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
//   }, [step]);

//   // ── Resend countdown ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
//     return () => clearTimeout(t);
//   }, [resendTimer]);

//   // ── Helpers ─────────────────────────────────────────────────────────────────
//   const formattedPhone = () => `${selectedCountry.code}${phone.replace(/\D/g, '')}`;

//   const validatePhone = (v) => {
//     const clean = v.replace(/\D/g, '');
//     // India: 10 digits starting 6-9. Others: 6-15 digits.
//     if (selectedCountry.iso === 'IN') return /^[6-9]\d{9}$/.test(clean);
//     return clean.length >= 6 && clean.length <= 15;
//   };

//   // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
//   const handleSendOtp = async () => {
//     if (!phone.trim()) { setPhoneError('Phone number is required'); return; }
//     if (!validatePhone(phone)) {
//       setPhoneError(
//         selectedCountry.iso === 'IN'
//           ? 'Enter a valid 10-digit mobile number'
//           : 'Enter a valid phone number',
//       );
//       return;
//     }
//     setPhoneError('');
//     setLoading(true);

//     try {
//       const db = getFirestore();
//       const usersRef = collection(db, 'users');
//       const fullPhone = formattedPhone();

//       const q = query(usersRef, where('phone', '==', fullPhone));
//       const snapshot = await getDocs(q);

//       if (snapshot.empty) {
//         Alert.alert(
//           'Account Not Found',
//           'No account is linked to this number. Please register first.',
//           [
//             { text: 'Register', onPress: () => navigation.navigate('Register') },
//             { text: 'Cancel', style: 'cancel' },
//           ],
//         );
//         setLoading(false);
//         return;
//       }

//       const auth = getAuth();
//       const confirmation = await signInWithPhoneNumber(auth, fullPhone);
//       setConfirm(confirmation);
//       setStep(STEP_OTP);
//       setResendTimer(30);
//       setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);
//     } catch (err) {
//       console.log('handleSendOtp error:', err);
//       Alert.alert('Error', 'Something went wrong. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── OTP input handler ────────────────────────────────────────────────────────
//   const handleOtpChange = (val, idx) => {
//     if (!/^\d*$/.test(val)) return;
//     const next = [...otp];
//     next[idx] = val.slice(-1);
//     setOtp(next);
//     if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.current?.focus();
//   };

//   const handleOtpKeyPress = (e, idx) => {
//     if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
//       otpRefs.current[idx - 1]?.current?.focus();
//     }
//   };

//   // ── Step 2: Verify OTP ───────────────────────────────────────────────────────
//   const handleVerifyOtp = async () => {
//     const code = otp.join('');
//     if (code.length < OTP_LENGTH) { Alert.alert('Incomplete', 'Please enter the 6-digit OTP.'); return; }
//     setLoading(true);
//     try {
//       let userCred;
//       if (confirm?.confirm) {
//         userCred = await confirm.confirm(code);
//       } else {
//         const credential = PhoneAuthProvider.credential(confirm.verificationId, code);
//         userCred = await signInWithCredential(getAuth(), credential);
//       }

//       const db = getFirestore();
//       let snap = await getDoc(doc(db, 'users', userCred.user.uid));

//       if (!snap.exists()) {
//         const q = query(collection(db, 'users'), where('phone', '==', userCred.user.phoneNumber));
//         const qSnap = await getDocs(q);
//         if (!qSnap.empty) {
//           const oldDoc = qSnap.docs[0];
//           await setDoc(doc(db, 'users', userCred.user.uid), { ...oldDoc.data() });
//           await deleteDoc(doc(db, 'users', oldDoc.id));
//           snap = await getDoc(doc(db, 'users', userCred.user.uid));
//         }
//       }

//       if (snap.exists()) {
//         dispatch(setUser({ uid: userCred.user.uid, phone: userCred.user.phoneNumber }));
//         dispatch(setRole(snap.data().role));
//       } else {
//         Alert.alert('Account Not Found', 'No account linked to this number. Please contact admin.');
//       }
//     } catch (err) {
//       let msg = 'Invalid OTP. Please try again.';
//       if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP entered.';
//       if (err.code === 'auth/code-expired') msg = 'OTP has expired. Please resend.';
//       if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait.';
//       Alert.alert('Verification Failed', msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Resend OTP ───────────────────────────────────────────────────────────────
//   const handleResend = async () => {
//     if (resendTimer > 0) return;
//     setOtp(['', '', '', '', '', '']);
//     setLoading(true);
//     try {
//       const auth = getAuth();
//       const confirmation = await signInWithPhoneNumber(auth, formattedPhone());
//       setConfirm(confirmation);
//       setResendTimer(30);
//       setTimeout(() => otpRefs.current[0]?.current?.focus(), 300);
//     } catch {
//       Alert.alert('Error', 'Could not resend OTP. Try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <LinearGradient
//       colors={['#0A4F4E', '#0D7B7A', '#14B8A6']}
//       start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
//       style={styles.container}
//     >
//       <View style={styles.bgCircle1} />
//       <View style={styles.bgCircle2} />
//       <View style={styles.bgCircle3} />

//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Brand */}
//           <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//             <Image
//               style={styles.ImageLogoSize}
//               resizeMode="contain"
//               source={require('../../asserts/image/Logo.png')}
//             />
//             <Text style={styles.brandName}>Kapol Setu</Text>
//             <Text style={styles.brandTagline}>Your wellness community</Text>
//           </Animated.View>

//           {/* Card */}
//           <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

//             {/* ── PHONE STEP ── */}
//             {step === STEP_PHONE && (
//               <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
//                 <Text style={styles.cardTitle}>Welcome back</Text>
//                 <Text style={styles.cardSub}>Enter your mobile number to continue</Text>

//                 <View style={styles.fieldWrap}>
//                   <Text style={styles.fieldLabel}>Mobile Number</Text>
//                   <View style={[
//                     styles.inputRow,
//                     phoneFocused && styles.inputFocused,
//                     phoneError && styles.inputErrorBorder,
//                   ]}>
//                     {/* ── Country Picker Trigger ── */}
//                     <TouchableOpacity
//                       style={styles.countryBadge}
//                       onPress={() => setShowPicker(true)}
//                       activeOpacity={0.75}
//                     >
//                       <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
//                       <Text style={styles.countryCode}>{selectedCountry.code}</Text>
//                       <Icon name="chevron-down" size={13} color="#64748B" style={{ marginLeft: 2 }} />
//                     </TouchableOpacity>

//                     <View style={styles.inputDivider} />

//                     <TextInput
//                       style={styles.input}
//                       placeholder={selectedCountry.iso === 'IN' ? '98765 43210' : 'Phone number'}
//                       placeholderTextColor="#C0CDD6"
//                       keyboardType="phone-pad"
//                       maxLength={15}
//                       value={phone}
//                       onFocus={() => setPhoneFocused(true)}
//                       onBlur={() => setPhoneFocused(false)}
//                       onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setPhoneError(''); }}
//                       editable={!loading}
//                     />
//                     {validatePhone(phone) && (
//                       <Icon name="check-circle" size={17} color="#10B981" />
//                     )}
//                   </View>

//                   {phoneError ? (
//                     <View style={styles.errorRow}>
//                       <Icon name="alert-circle" size={12} color="#EF4444" />
//                       <Text style={styles.errorText}>{phoneError}</Text>
//                     </View>
//                   ) : null}
//                 </View>

//                 <Text style={styles.otpHint}>
//                   An OTP will be sent to this number via SMS
//                 </Text>

//                 <TouchableOpacity
//                   style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
//                   onPress={handleSendOtp}
//                   disabled={loading}
//                   activeOpacity={0.88}
//                 >
//                   <LinearGradient
//                     colors={['#0D7B7A', '#0A5F5E']}
//                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                     style={styles.primaryBtnGrad}
//                   >
//                     {loading
//                       ? <ActivityIndicator color="#FFF" size="small" />
//                       : <Text style={styles.primaryBtnText}>Send OTP</Text>
//                     }
//                   </LinearGradient>
//                 </TouchableOpacity>

//                 <View style={styles.dividerRow}>
//                   <View style={styles.dividerLine} />
//                 </View>

//                 <TouchableOpacity
//                   onPress={() => navigation.navigate('Register')}
//                   style={styles.secondaryBtn}
//                 >
//                   <Icon name="user-plus" size={15} color="#0D7B7A" style={{ marginRight: 6 }} />
//                   <Text style={styles.secondaryBtnText}>Create Account</Text>
//                 </TouchableOpacity>
//               </Animated.View>
//             )}

//             {/* ── OTP STEP ── */}
//             {step === STEP_OTP && (
//               <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
//                 <TouchableOpacity
//                   onPress={() => { setStep(STEP_PHONE); setOtp(['', '', '', '', '', '']); }}
//                   style={styles.backBtn}
//                 >
//                   <Icon name="arrow-left" size={16} color="#0D7B7A" />
//                   <Text style={styles.backText}>Change Number</Text>
//                 </TouchableOpacity>

//                 <View style={styles.stepIcon}>
//                   <MatIcon name="shield-key-outline" size={28} color="#0D7B7A" />
//                 </View>
//                 <Text style={styles.cardTitle}>Verify OTP</Text>
//                 <Text style={styles.cardSub}>
//                   Sent to{' '}
//                   <Text style={styles.phoneHighlight}>
//                     {selectedCountry.code} {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
//                   </Text>
//                 </Text>

//                 <View style={styles.otpRow}>
//                   {otp.map((digit, idx) => (
//                     <TextInput
//                       key={idx}
//                       ref={otpRefs.current[idx]}
//                       style={[styles.otpBox, digit && styles.otpBoxFilled]}
//                       value={digit}
//                       onChangeText={(v) => handleOtpChange(v, idx)}
//                       onKeyPress={(e) => handleOtpKeyPress(e, idx)}
//                       keyboardType="number-pad"
//                       maxLength={1}
//                       textAlign="center"
//                       textAlignVertical="center"
//                       selectTextOnFocus
//                       editable={!loading}
//                       caretHidden={true}
//                       contextMenuHidden={true}
//                     />
//                   ))}
//                 </View>

//                 <View style={styles.resendRow}>
//                   <Text style={styles.resendLabel}>Didn't receive it? </Text>
//                   {resendTimer > 0
//                     ? <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
//                     : (
//                       <TouchableOpacity onPress={handleResend} disabled={loading}>
//                         <Text style={styles.resendLink}>Resend OTP</Text>
//                       </TouchableOpacity>
//                     )
//                   }
//                 </View>

//                 <TouchableOpacity
//                   style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
//                   onPress={handleVerifyOtp}
//                   disabled={loading}
//                   activeOpacity={0.88}
//                 >
//                   <LinearGradient
//                     colors={['#0D7B7A', '#0A5F5E']}
//                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                     style={styles.primaryBtnGrad}
//                   >
//                     {loading
//                       ? <ActivityIndicator color="#FFF" size="small" />
//                       : (
//                         <>
//                           <MatIcon name="shield-check" size={18} color="#FFF" style={{ marginRight: 8 }} />
//                           <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
//                         </>
//                       )
//                     }
//                   </LinearGradient>
//                 </TouchableOpacity>
//               </Animated.View>
//             )}

//           </Animated.View>
//         </ScrollView>
//         <CountryPickerSheet
//           visible={showPicker}
//           selected={selectedCountry}
//           onSelect={(c) => { setSelectedCountry(c); setPhone(''); setPhoneError(''); }}
//           onClose={() => setShowPicker(false)}
//         />
//       </KeyboardAvoidingView>

//       {/* Country Picker Bottom Sheet */}

//     </LinearGradient>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 48 },
//   ImageLogoSize: { width: 130, height: 130, borderRadius: 100 },

//   bgCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80 },
//   bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: '30%', left: -60 },
//   bgCircle3: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(20,184,166,0.12)', bottom: 40, right: -40 },

//   brandWrap: { alignItems: 'center', marginBottom: 28 },
//   logoCircle: { width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
//   brandName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginTop: 10 },
//   brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

//   card: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 26, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },

//   stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDFC', borderWidth: 1.5, borderColor: '#CCFBF1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
//   cardTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
//   cardSub: { fontSize: 13, color: '#94A3B8', marginBottom: 24 },
//   phoneHighlight: { color: '#0D7B7A', fontWeight: '700' },

//   backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
//   backText: { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },

//   fieldWrap: { marginBottom: 10 },
//   fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
//   inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 54 },
//   inputFocused: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
//   inputErrorBorder: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },

//   // ── Country badge (now tappable) ──────────────────────────────────────────
//   countryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
//   countryFlag: { fontSize: 20 },
//   countryCode: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

//   inputDivider: { width: 1, height: 22, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
//   input: { flex: 1, fontSize: 16, color: '#0F172A', fontWeight: '600', letterSpacing: 1 },
//   errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
//   errorText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
//   otpHint: { fontSize: 11, color: '#94A3B8', marginBottom: 22, marginTop: 4 },

//   otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, paddingHorizontal: 2 },
//   otpBox: {
//     width: OTP_BOX_SIZE, height: OTP_BOX_SIZE + 6,
//     borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
//     backgroundColor: '#F8FAFC',
//     fontSize: Math.min(OTP_BOX_SIZE * 0.45, 22),
//     fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
//     color: '#0F172A', textAlign: 'center', textAlignVertical: 'center',
//     includeFontPadding: false, padding: 0,
//   },
//   otpBoxFilled: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC', color: '#0D7B7A' },

//   resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
//   resendLabel: { fontSize: 12, color: '#94A3B8' },
//   resendTimer: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
//   resendLink: { fontSize: 12, color: '#0D7B7A', fontWeight: '800' },

//   primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
//   primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 4 },
//   primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

//   dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
//   dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },

//   secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0D7B7A', borderRadius: 14, paddingVertical: 12 },
//   secondaryBtnText: { fontSize: 14, color: '#0D7B7A', fontWeight: '800' },

//   // ── Country Picker Sheet ──────────────────────────────────────────────────
//   sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
//   sheet: {
//     position: 'absolute', bottom: 0, left: 0, right: 0,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     maxHeight: SCREEN_HEIGHT * 0.78,
//     paddingTop: 12,
//     shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
//     elevation: 24,
//   },
//   sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 14 },
//   sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
//   sheetTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
//   sheetSearch: {
//     flexDirection: 'row', alignItems: 'center',
//     marginHorizontal: 16, marginBottom: 10,
//     backgroundColor: '#F8FAFC', borderRadius: 14,
//     borderWidth: 1.5, borderColor: '#E2E8F0',
//     paddingHorizontal: 14, height: 46,
//     marginTop: 40
//   },
//   sheetSearchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
//   sheetEmpty: { alignItems: 'center', paddingVertical: 32 },
//   sheetEmptyText: { fontSize: 14, color: '#94A3B8' },

//   countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 12 },
//   countryRowSelected: { backgroundColor: '#F0FDFC' },
//   countryRowFlag: { fontSize: 24 },
//   countryRowName: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
//   countryRowNameSelected: { color: '#0D7B7A', fontWeight: '700' },
//   countryRowCode: { fontSize: 14, color: '#64748B', fontWeight: '600' },
//   countryRowCodeSelected: { color: '#0D7B7A', fontWeight: '700' },
// });