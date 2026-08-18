import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated, Dimensions,
  Image,
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
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OTP_BOX_SIZE = Math.min(Math.floor((SCREEN_WIDTH - 40 - 48 - 40) / 6), 52);

// ─── Steps ────────────────────────────────────
const STEP_INFO = 'INFO';      // Name + Phone + Email(opt)
const STEP_OTP = 'OTP';       // 6-digit OTP verify
const OTP_LENGTH = 6;

// ─── Reusable Field ───────────────────────────
const Field = React.memo(({
  id, label, placeholder, value, onChange,
  keyboardType, secureEntry, toggleSecure, showSecure,
  icon, optional, error, focused, onFocus, onBlur, editable,
  maxLength,
}) => {
  const isFocused = focused === id;
  const hasError = !!error;
  const isValid = value.length > 0 && !hasError;

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.optionalTag}>optional</Text>}
      </View>
      <View style={[
        styles.inputRow,
        isFocused && styles.inputFocused,
        hasError && styles.inputErrorBorder,
        isValid && !hasError && styles.inputValid,
      ]}>
        <Icon
          name={icon}
          size={17}
          color={isFocused ? '#0D7B7A' : hasError ? '#EF4444' : '#94A3B8'}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#C0CDD6"
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoComplete={keyboardType === 'email-address' ? 'email' : 'off'}
          autoCorrect={false}
          secureTextEntry={!!secureEntry}
          editable={editable}
          blurOnSubmit={false}
          maxLength={maxLength}
        />
        {toggleSecure != null && (
          <TouchableOpacity onPress={toggleSecure} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name={showSecure ? 'eye' : 'eye-off'} size={17} color="#94A3B8" />
          </TouchableOpacity>
        )}
        {isValid && toggleSecure == null && (
          <Icon name="check-circle" size={16} color="#10B981" />
        )}
      </View>
      {hasError && (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={12} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

// ─────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(STEP_INFO);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');
  const [confirm, setConfirm] = useState(null);   // Firebase confirmation
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([...Array(OTP_LENGTH)].map(() => React.createRef()));

  // KEY FIX #1: keep a ref mirror of `form` so we never lose name/email/phone
  // even if something causes this component to re-render/re-mount between
  // Step 1 (send OTP) and Step 2 (verify OTP). State can theoretically reset
  // on remount; a ref captured at the right time cannot.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

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

  // ── Stable handlers ────────────────────────
  const handleChange = useCallback((field) => (val) => {
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  }, []);
  const handleFocus = useCallback((id) => () => setFocused(id), []);
  const handleBlur = useCallback(() => () => setFocused(''), []);

  // ── Validators ─────────────────────────────
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));

  // ── Step 1 validate, send OTP, go to Step 2 ─────────
  const handleNextToInfo = async () => {
    const { name, phone, email } = form;
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!phone.trim()) e.phone = 'Mobile number is required';
    else if (!validatePhone(phone)) e.phone = 'Enter valid 10-digit mobile number';
    if (email.trim() && !validateEmail(email)) e.email = 'Enter a valid email address';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const auth = getAuth();
      const phoneNo = `+91${form.phone.replace(/\D/g, '')}`;
      console.log('[Register] Sending OTP to', phoneNo, 'with name in state:', form.name);
      const confirmation = await signInWithPhoneNumber(auth, phoneNo);
      setConfirm(confirmation);
      setStep(STEP_OTP);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);
    } catch (err) {
      console.log('[Register] OTP send failed:', err?.code, err?.message);
      Alert.alert("adddd",err?.message)
      // Alert.alert('Error', 'Failed to send OTP. Please check your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ───────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.current?.focus();
  };
  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.current?.focus();
  };

  // ── Step 2: Verify OTP & Register ──────────
  const handleVerifyAndRegister = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter the 6-digit OTP.');
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      let userCred;
      if (confirm?.confirm) {
        userCred = await confirm.confirm(code);
      } else {
        const credential = PhoneAuthProvider.credential(confirm.verificationId, code);
        userCred = await signInWithCredential(getAuth(), credential);
      }

      if (!userCred?.user?.uid) {
        Alert.alert('Error', 'Could not get user ID.');
        return;
      }

      // KEY FIX #2: read from formRef (always current) instead of `form`
      // directly, and guard against an empty name instead of silently
      // writing a blank profile.
      const currentForm = formRef.current;
      const trimmedName = (currentForm.name || '').trim();

      console.log('[Register] OTP verified. UID:', userCred.user.uid);
      console.log('[Register] Form snapshot at write time:', JSON.stringify(currentForm));

      if (!trimmedName) {
        // This should never happen since Step 1 validates it, but if it
        // does, we want a loud signal instead of a quietly-empty doc.
        console.log('[Register] WARNING: name is empty at write time. Form state may have reset.');
      }

      const db = getFirestore();
      // Log which project this Firestore instance is actually talking to —
      // this is the fastest way to catch a "wrong project / wrong config"
      // mismatch between the app and the console you're checking.
      console.log('[Register] Firestore app/project:', db.app?.options?.projectId);

      const userRef = doc(db, 'users', userCred.user.uid);

      const profileData = {
        name: trimmedName,
        phone: `+91${currentForm.phone.replace(/\D/g, '')}`,
        email: currentForm.email.trim() || '',
        role: 'user',
        createdAt: serverTimestamp(),
      };
      console.log('[Register] Writing profile:', JSON.stringify(profileData), 'to path users/' + userCred.user.uid);

      // ── Firestore write with retry ──
      let writeSuccess = false;
      let lastWriteErr = null;
      let retryCount = 0;

      while (!writeSuccess && retryCount < 3) {
        try {
          await setDoc(userRef, profileData);
          writeSuccess = true;
        } catch (writeErr) {
          lastWriteErr = writeErr;
          retryCount++;
          console.log(`[Register] Firestore write attempt ${retryCount} failed:`, writeErr.code, writeErr.message);
          if (retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!writeSuccess) {
        Alert.alert(
          'Partial Error',
          `Account created but profile save failed (${lastWriteErr?.code || 'unknown error'}). Please contact support.`,
        );
        return;
      }

      // KEY FIX #3: verify the write actually landed by reading it straight
      // back. This catches "succeeded locally due to offline cache, never
      // reached server" cases that setDoc alone won't surface as an error.
      try {
        const verifySnap = await getDoc(userRef);
        if (verifySnap.exists()) {
          console.log('[Register] Verified doc after write:', JSON.stringify(verifySnap.data()));
        } else {
          console.log('[Register] WARNING: setDoc resolved but getDoc immediately after shows doc does NOT exist. Likely offline-only write or wrong project.');
        }
      } catch (verifyErr) {
        console.log('[Register] Verification read failed:', verifyErr.code, verifyErr.message);
      }

      // ✅ Success
      Alert.alert('🎉 Welcome!', 'Your account has been created successfully!', [
        { text: 'Continue', onPress: () => navigation.navigate('Login') },
      ]);

    } catch (err) {
      console.log('[Register] Verification error code:', err.code);
      console.log('[Register] Verification error message:', err.message);
      let msg = 'Verification failed. Please try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP entered.';
      if (err.code === 'auth/code-expired') msg = 'OTP expired. Please resend.';
      Alert.alert('Error', msg);
    } finally {
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
      const phoneNo = `+91${form.phone.replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNo, true);
      setConfirm(confirmation);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 300);
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#0A4F4E', '#0D7B7A', '#14B8A6']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoCircle}>
              <Image
                style={styles.ImageLogoSize}
                resizeMode='contain'
                source={require('../../asserts/image/Logo.png')}
              />
            </View>
            <Text style={styles.brandName}>Join Kapol Setu</Text>
            <Text style={styles.brandTagline}>Create your free account today</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* ── STEP 1: INFO ── */}
            {step === STEP_INFO && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Icon name="arrow-left" size={16} color="#0D7B7A" />
                  <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>

                <Text style={styles.cardTitle}>Personal Info</Text>
                <Text style={styles.cardSub}>Tell us who you are</Text>

                <Field
                  id="name" label="Full Name" placeholder="John Doe"
                  value={form.name} onChange={handleChange('name')}
                  icon="user" error={errors.name}
                  focused={focused} onFocus={handleFocus('name')} onBlur={handleBlur()}
                  editable={!loading}
                />

                {/* Phone with +91 prefix */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Mobile Number</Text>
                  <View style={[
                    styles.inputRow,
                    focused === 'phone' && styles.inputFocused,
                    errors.phone && styles.inputErrorBorder,
                    form.phone.length === 10 && !errors.phone && styles.inputValid,
                  ]}>
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
                      value={form.phone}
                      onFocus={handleFocus('phone')}
                      onBlur={handleBlur()}
                      onChangeText={(t) => {
                        setForm((p) => ({ ...p, phone: t.replace(/\D/g, '') }));
                        setErrors((p) => ({ ...p, phone: '' }));
                      }}
                      editable={!loading}
                    />
                    {form.phone.length === 10 && (
                      <Icon name="check-circle" size={16} color="#10B981" />
                    )}
                  </View>
                  {errors.phone ? (
                    <View style={styles.errorRow}>
                      <Icon name="alert-circle" size={12} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    </View>
                  ) : null}
                </View>

                <Field
                  id="email" label="Email Address" placeholder="you@example.com"
                  value={form.email} onChange={handleChange('email')}
                  keyboardType="email-address" icon="mail" optional
                  error={errors.email}
                  focused={focused} onFocus={handleFocus('email')} onBlur={handleBlur()}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleNextToInfo}
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
                          <Icon name="arrow-right" size={16} color="#FFF" />
                          <Text style={styles.primaryBtnText}>Continue</Text>
                        </>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.secondaryBtn}>
                  <Icon name="log-in" size={15} color="#0D7B7A" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === STEP_OTP && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <TouchableOpacity onPress={() => setStep(STEP_INFO)} style={styles.backBtn}>
                  <Icon name="arrow-left" size={16} color="#0D7B7A" />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.stepIcon}>
                  <MatIcon name="shield-key-outline" size={28} color="#0D7B7A" />
                </View>
                <Text style={styles.cardTitle}>Verify Mobile</Text>
                <Text style={styles.cardSub}>
                  OTP sent to{' '}
                  <Text style={styles.phoneHighlight}>
                    +91 {form.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
                  </Text>
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

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    loading && { opacity: 0.65 }
                  ]}
                  onPress={handleVerifyAndRegister}
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
                          <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
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
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  ImageLogoSize: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(20,184,166,0.1)', bottom: 60, left: -60 },

  brandWrap: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 100, height: 100, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  brandName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4, marginTop: 10 },
  brandTagline: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  phoneHighlight: { color: '#0D7B7A', fontWeight: '700' },

  stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDFC', borderWidth: 1.5, borderColor: '#CCFBF1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },

  fieldWrap: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  optionalTag: { fontSize: 10, color: '#94A3B8', fontWeight: '500', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 50 },
  inputFocused: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
  inputErrorBorder: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  inputValid: { borderColor: '#10B981' },
  input: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },

  // Country code prefix
  countryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  inputDivider: { width: 1, height: 22, backgroundColor: '#E2E8F0', marginHorizontal: 12 },

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
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
    color: '#0F172A',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    padding: 0,
  },
  otpBoxFilled: {
    borderColor: '#0D7B7A',
    backgroundColor: '#F0FDFC',
    color: '#0D7B7A',
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resendLabel: { fontSize: 12, color: '#94A3B8' },
  resendTimer: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  resendLink: { fontSize: 12, color: '#0D7B7A', fontWeight: '800' },

  // Buttons
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },

  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0D7B7A', borderRadius: 14, paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, color: '#0D7B7A', fontWeight: '800' },
});