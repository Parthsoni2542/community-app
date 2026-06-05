// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
//   ScrollView, Animated,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon    from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
// import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

// // ─────────────────────────────────────────────────────────────
// // Field extracted OUTSIDE so it never remounts on parent render
// // ─────────────────────────────────────────────────────────────
// const Field = ({
//   id, label, placeholder, value, onChange,
//   keyboardType, secureEntry, toggleSecure, showSecure,
//   icon, optional, error, focused, onFocus, onBlur, editable,
// }) => {
//   const isFocused = focused === id;
//   const hasError  = !!error;
//   const isValid   = value.length > 0 && !hasError;

//   return (
//     <View style={styles.fieldWrap}>
//       <View style={styles.labelRow}>
//         <Text style={styles.fieldLabel}>{label}</Text>
//         {optional && <Text style={styles.optionalTag}>optional</Text>}
//       </View>
//       <View style={[
//         styles.inputRow,
//         isFocused  && styles.inputFocused,
//         hasError   && styles.inputErrorBorder,
//         isValid && !hasError && styles.inputValid,
//       ]}>
//         <Icon
//           name={icon}
//           size={17}
//           color={isFocused ? '#0D7B7A' : hasError ? '#EF4444' : '#94A3B8'}
//           style={{ marginRight: 10 }}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder={placeholder}
//           placeholderTextColor="#C0CDD6"
//           value={value}
//           onChangeText={onChange}
//           onFocus={onFocus}
//           onBlur={onBlur}
//           keyboardType={keyboardType || 'default'}
//           autoCapitalize={keyboardType === 'email-address' ? 'none' : 'none'}
//           autoComplete={keyboardType === 'email-address' ? 'email' : 'off'}
//           autoCorrect={false}
//           secureTextEntry={!!secureEntry}
//           editable={editable}
//           blurOnSubmit={false}
//         />
//         {toggleSecure != null && (
//           <TouchableOpacity
//             onPress={toggleSecure}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Icon name={showSecure ? 'eye' : 'eye-off'} size={17} color="#94A3B8" />
//           </TouchableOpacity>
//         )}
//         {isValid && toggleSecure == null && (
//           <Icon name="check-circle" size={16} color="#10B981" />
//         )}
//       </View>
//       {hasError && (
//         <View style={styles.errorRow}>
//           <Icon name="alert-circle" size={12} color="#EF4444" />
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// // ─────────────────────────────────────────────────────────────
// export default function RegisterScreen({ navigation }) {
//   const [form, setForm] = useState({
//     name: '', email: '', password: '', confirmPassword: '', phone: '',
//   });
//   const [showPass,    setShowPass]    = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading,     setLoading]     = useState(false);
//   const [errors,      setErrors]      = useState({});
//   const [focused,     setFocused]     = useState('');

//   // Animations
//   const fadeAnim  = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;
//   const scaleAnim = useRef(new Animated.Value(0.96)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim,  { toValue: 1, duration: 650, useNativeDriver: true }),
//       Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
//       Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

//   // Stable handlers via useCallback so Field never re-creates them
//   const handleChange = useCallback((field) => (val) => {
//     setForm((p) => ({ ...p, [field]: val }));
//     setErrors((p) => ({ ...p, [field]: '' }));
//   }, []);

//   const handleFocus = useCallback((id) => () => setFocused(id), []);
//   const handleBlur  = useCallback(() => () => setFocused(''), []);

//   // Password strength
//   const passStrength = () => {
//     const p = form.password;
//     if (!p) return 0;
//     let s = 0;
//     if (p.length >= 6)             s++;
//     if (p.length >= 10)            s++;
//     if (/[A-Z]/.test(p))           s++;
//     if (/[0-9]/.test(p))           s++;
//     if (/[^A-Za-z0-9]/.test(p))    s++;
//     return s;
//   };
//   const strength      = passStrength();
//   const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
//   const strengthColor = ['#E2E8F0', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'][strength];

//   const handleRegister = async () => {
//     const { name, email, password, confirmPassword } = form;
//     const e = {};
//     if (!name.trim())                       e.name            = 'Full name is required';
//     if (!email.trim())                      e.email           = 'Email is required';
//     else if (!validateEmail(email))         e.email           = 'Enter a valid email';
//     if (!password.trim())                   e.password        = 'Password is required';
//     else if (password.length < 6)          e.password        = 'Minimum 6 characters';
//     if (!confirmPassword.trim())           e.confirmPassword = 'Please confirm password';
//     else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
//     setErrors(e);
//     if (Object.keys(e).length) return;

//     setLoading(true);
//     try {
//       const auth = getAuth();
//       const res  = await createUserWithEmailAndPassword(auth, email, password);
//       const db   = getFirestore();
//       await setDoc(doc(db, 'users', res.user.uid), {
//         name,
//         email,
//         phone    : form.phone || null,
//         role     : 'user',
//         createdAt: serverTimestamp(),
//       });
//       Alert.alert('🎉 Welcome!', 'Your account has been created.', [
//         { text: 'Sign In', onPress: () => navigation.navigate('Login') },
//       ]);
//     } catch (error) {
//       let msg = 'Registration failed. Please try again.';
//       if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
//       if (error.code === 'auth/weak-password')        msg = 'Password is too weak.';
//       Alert.alert('Error', msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <LinearGradient
//       colors={['#0A4F4E', '#0D7B7A', '#14B8A6']}
//       start={{ x: 0.1, y: 0 }}
//       end={{ x: 0.9, y: 1 }}
//       style={styles.container}
//     >
//       <View style={styles.bgCircle1} />
//       <View style={styles.bgCircle2} />

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//           keyboardDismissMode="none"
//         >
//           {/* Brand */}
//           <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//             <View style={styles.logoCircle}>
//               <MatIcon name="account-plus" size={36} color="#14B8A6" />
//             </View>
//             <Text style={styles.brandName}>Join ExpertConnect</Text>
//             <Text style={styles.brandTagline}>Create your free account today</Text>
//           </Animated.View>

//           {/* Card */}
//           <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

//             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//               <Icon name="arrow-left" size={16} color="#0D7B7A" />
//               <Text style={styles.backText}>Back to Login</Text>
//             </TouchableOpacity>

//             <Text style={styles.cardTitle}>Create Account</Text>
//             <Text style={styles.cardSub}>Fill in your details to get started</Text>

//             {/* ── Personal ── */}
//             <View style={styles.sectionBlock}>
//               <View style={styles.sectionHeader}>
//                 <MatIcon name="account-outline" size={16} color="#0D7B7A" />
//                 <Text style={styles.sectionTitle}>Personal Info</Text>
//               </View>
//               <Field
//                 id="name" label="Full Name" placeholder="John Doe"
//                 value={form.name} onChange={handleChange('name')}
//                 icon="user" error={errors.name}
//                 focused={focused} onFocus={handleFocus('name')} onBlur={handleBlur()}
//                 editable={!loading}
//               />
//               <Field
//                 id="email" label="Email Address" placeholder="you@example.com"
//                 value={form.email} onChange={handleChange('email')}
//                 keyboardType="email-address" icon="mail" error={errors.email}
//                 focused={focused} onFocus={handleFocus('email')} onBlur={handleBlur()}
//                 editable={!loading}
//               />
//             </View>

//             {/* ── Security ── */}
//             <View style={styles.sectionBlock}>
//               <View style={styles.sectionHeader}>
//                 <MatIcon name="shield-lock-outline" size={16} color="#0D7B7A" />
//                 <Text style={styles.sectionTitle}>Security</Text>
//               </View>

//               <Field
//                 id="password" label="Password" placeholder="Min. 6 characters"
//                 value={form.password} onChange={handleChange('password')}
//                 icon="lock" secureEntry={!showPass}
//                 toggleSecure={() => setShowPass((p) => !p)} showSecure={showPass}
//                 error={errors.password}
//                 focused={focused} onFocus={handleFocus('password')} onBlur={handleBlur()}
//                 editable={!loading}
//               />

//               {form.password.length > 0 && (
//                 <View style={styles.strengthWrap}>
//                   <View style={styles.strengthBars}>
//                     {[1,2,3,4,5].map((i) => (
//                       <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColor : '#E2E8F0' }]} />
//                     ))}
//                   </View>
//                   <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
//                 </View>
//               )}

//               <Field
//                 id="confirmPassword" label="Confirm Password" placeholder="Re-enter password"
//                 value={form.confirmPassword} onChange={handleChange('confirmPassword')}
//                 icon="lock" secureEntry={!showConfirm}
//                 toggleSecure={() => setShowConfirm((p) => !p)} showSecure={showConfirm}
//                 error={errors.confirmPassword}
//                 focused={focused} onFocus={handleFocus('confirmPassword')} onBlur={handleBlur()}
//                 editable={!loading}
//               />
//             </View>

//             {/* ── Contact ── */}
//             <View style={styles.sectionBlock}>
//               <View style={styles.sectionHeader}>
//                 <MatIcon name="phone-outline" size={16} color="#0D7B7A" />
//                 <Text style={styles.sectionTitle}>Contact</Text>
//               </View>
//               <Field
//                 id="phone" label="Phone Number" placeholder="+91 98765 43210"
//                 value={form.phone} onChange={handleChange('phone')}
//                 keyboardType="phone-pad" icon="phone" optional
//                 focused={focused} onFocus={handleFocus('phone')} onBlur={handleBlur()}
//                 editable={!loading}
//               />
//             </View>

//             {/* Register Button */}
//             <TouchableOpacity
//               style={[styles.registerBtn, loading && { opacity: 0.75 }]}
//               onPress={handleRegister}
//               disabled={loading}
//               activeOpacity={0.88}
//             >
//               <LinearGradient
//                 colors={['#0D7B7A', '#0A5F5E']}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                 style={styles.registerBtnGrad}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#FFFFFF" size="small" />
//                 ) : (
//                   <>
//                     <Text style={styles.registerBtnText}>Create Account</Text>
//                     {/* <View style={styles.registerBtnArrow}>
//                       <Icon name="user-plus" size={17} color="#0D7B7A" />
//                     </View> */}
//                   </>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* Divider */}
//             <View style={styles.dividerRow}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerText}>already a member?</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
//               <Icon name="log-in" size={15} color="#0D7B7A" style={{ marginRight: 6 }} />
//               <Text style={styles.loginBtnText}>Sign In Instead</Text>
//             </TouchableOpacity>
//           </Animated.View>

//           {/* <Animated.View style={[styles.bottomTip, { opacity: fadeAnim }]}>
//             <Icon name="shield" size={13} color="rgba(255,255,255,0.5)" />
//             <Text style={styles.bottomTipText}>Your data is encrypted & safe</Text>
//           </Animated.View> */}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container   : { flex: 1 },
//   scroll      : { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },

//   bgCircle1   : { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, right: -80 },
//   bgCircle2   : { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(20,184,166,0.1)', bottom: 60, left: -60 },

//   brandWrap   : { alignItems: 'center', marginBottom: 24 },
//   logoCircle  : { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
//   brandName   : { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
//   brandTagline: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

//   card        : { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
//   backBtn     : { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
//   backText    : { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },
//   cardTitle   : { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
//   cardSub     : { fontSize: 13, color: '#94A3B8', marginBottom: 20 },

//   sectionBlock : { marginBottom: 18 },
//   sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
//   sectionTitle : { fontSize: 12, fontWeight: '800', color: '#0D7B7A', textTransform: 'uppercase', letterSpacing: 0.5 },

//   fieldWrap   : { marginBottom: 12 },
//   labelRow    : { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
//   fieldLabel  : { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
//   optionalTag : { fontSize: 10, color: '#94A3B8', fontWeight: '500', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
//   inputRow    : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 50 },
//   inputFocused    : { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
//   inputErrorBorder: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
//   inputValid      : { borderColor: '#10B981' },
//   input           : { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500' },
//   errorRow        : { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
//   errorText       : { fontSize: 11, color: '#EF4444', fontWeight: '600' },

//   strengthWrap  : { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 12 },
//   strengthBars  : { flexDirection: 'row', gap: 4, flex: 1 },
//   strengthBar   : { flex: 1, height: 4, borderRadius: 2 },
//   strengthLabel : { fontSize: 11, fontWeight: '700', minWidth: 65 },

//   registerBtn     : { borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
//   registerBtnGrad : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
//   registerBtnText : { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
//   registerBtnArrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },

//   dividerRow  : { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
//   dividerLine : { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
//   dividerText : { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

//   loginBtn    : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0D7B7A', borderRadius: 14, paddingVertical: 12 },
//   loginBtnText: { fontSize: 14, color: '#0D7B7A', fontWeight: '800' },

//   bottomTip     : { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 6 },
//   bottomTipText : { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
// });


/**
 * RegisterScreen.jsx
 * ─────────────────────────────────────────────
 * Step 1: Personal Info (Name, Phone, Email optional)
 * Step 2: Security (Password + Confirm)
 * Step 3: OTP Verify (Firebase Phone Auth)
 * On success: write to Firestore → auto login
 * ─────────────────────────────────────────────
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
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
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

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

// ─── Step Progress Bar ────────────────────────
const StepBar = ({ current }) => {
  const steps = [
    { key: STEP_INFO, label: 'Info', icon: 'user' },
    { key: STEP_OTP, label: 'Verify', icon: 'shield' },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <View style={styles.stepBarWrap}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <View style={styles.stepItemWrap}>
            <View style={[styles.stepDot, i <= idx && styles.stepDotActive]}>
              <Icon name={s.icon} size={12} color={i <= idx ? '#FFF' : '#94A3B8'} />
            </View>
            <Text style={[styles.stepLabel, i <= idx && styles.stepLabelActive]}>{s.label}</Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[styles.stepConnector, i < idx && styles.stepConnectorActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

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

  // ── Password strength ──────────────────────
  const passStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['#E2E8F0', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'][strength];

  // ── Step 1 validate & go to Step 2 ─────────
  // const handleNextToPassword = () => {
  //   const { name, phone, email } = form;
  //   const e = {};
  //   if (!name.trim()) e.name = 'Full name is required';
  //   if (!phone.trim()) e.phone = 'Mobile number is required';
  //   else if (!validatePhone(phone)) e.phone = 'Enter valid 10-digit mobile number';
  //   if (email.trim() && !validateEmail(email)) e.email = 'Enter a valid email address';
  //   setErrors(e);
  //   if (Object.keys(e).length) return;
  //   setStep(STEP_PASSWORD);
  // };
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
      const confirmation = await signInWithPhoneNumber(auth, phoneNo);
      setConfirm(confirmation);
      setStep(STEP_OTP);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);
    } catch {
      Alert.alert('Error', 'Failed to send OTP. Please check your mobile number.');
    } finally {
      setLoading(false);
    }
  };
  // ── Step 2 validate & send OTP ─────────────
  const handleSendOtp = async () => {
    const { password, confirmPassword } = form;
    const e = {};
    if (!password.trim()) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (!confirmPassword.trim()) e.confirmPassword = 'Please confirm password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const auth = getAuth();
      const phoneNo = `+91${form.phone.replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNo);
      setConfirm(confirmation);
      setStep(STEP_OTP);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.current?.focus(), 400);
    } catch {
      Alert.alert('Error', 'Failed to send OTP. Please check your mobile number.');
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

  // ── Step 3: Verify OTP & Register ──────────
  const handleVerifyAndRegister = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      // Verify OTP
      let userCred;
      if (confirm?.confirm) {
        userCred = await confirm.confirm(code);
      } else {
        const credential = PhoneAuthProvider.credential(confirm.verificationId, code);
        userCred = await signInWithCredential(getAuth(), credential);
      }

      // Write user profile to Firestore
      const db = getFirestore();
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: form.name.trim(),
        phone: `+91${form.phone}`,
        email: form.email.trim() || null,
        role: 'user',
        createdAt: serverTimestamp(),
      })

      Alert.alert('🎉 Welcome!', 'Your account has been created successfully!', [
        { text: 'Continue', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      let msg = 'Verification failed. Please try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP entered.';
      if (err.code === 'auth/code-expired') msg = 'OTP expired. Please go back and resend.';
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
      const confirmation = await signInWithPhoneNumber(auth, phoneNo);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <MatIcon name="account-plus" size={36} color="#14B8A6" />
            </View>
            <Text style={styles.brandName}>Join ExpertConnect</Text>
            <Text style={styles.brandTagline}>Create your free account today</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* Step progress */}
            <StepBar current={step} />

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
                    <Text style={styles.primaryBtnText}>Continue</Text>
                    <Icon name="arrow-right" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>already a member?</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.secondaryBtn}>
                  <Icon name="log-in" size={15} color="#0D7B7A" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Sign In Instead</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── STEP 2: PASSWORD ── */}
            {/* {step === STEP_PASSWORD && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <TouchableOpacity onPress={() => setStep(STEP_INFO)} style={styles.backBtn}>
                  <Icon name="arrow-left" size={16} color="#0D7B7A" />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.cardTitle}>Set Password</Text>
                <Text style={styles.cardSub}>Create a strong password for your account</Text>

                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeader}>
                    <MatIcon name="shield-lock-outline" size={16} color="#0D7B7A" />
                    <Text style={styles.sectionTitle}>Security</Text>
                  </View>

                  <Field
                    id="password" label="Password" placeholder="Min. 6 characters"
                    value={form.password} onChange={handleChange('password')}
                    icon="lock" secureEntry={!showPass}
                    toggleSecure={() => setShowPass((p) => !p)} showSecure={showPass}
                    error={errors.password}
                    focused={focused} onFocus={handleFocus('password')} onBlur={handleBlur()}
                    editable={!loading}
                  />

                  {form.password.length > 0 && (
                    <View style={styles.strengthWrap}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColor : '#E2E8F0' }]} />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                    </View>
                  )}

                  <Field
                    id="confirmPassword" label="Confirm Password" placeholder="Re-enter password"
                    value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                    icon="lock" secureEntry={!showConfirm}
                    toggleSecure={() => setShowConfirm((p) => !p)} showSecure={showConfirm}
                    error={errors.confirmPassword}
                    focused={focused} onFocus={handleFocus('confirmPassword')} onBlur={handleBlur()}
                    editable={!loading}
                  />
                </View>

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
                      : (
                        <>
                          <Text style={styles.primaryBtnText}>Send OTP to Verify</Text>
                          <MatIcon name="message-text-outline" size={16} color="#FFF" />
                        </>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )} */}

            {/* ── STEP 3: OTP ── */}
            {step === STEP_OTP && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <TouchableOpacity onPress={() => setStep(STEP_PASSWORD)} style={styles.backBtn}>
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
                      selectTextOnFocus
                      editable={!loading}
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
                  style={[styles.primaryBtn, loading && { opacity: 0.75 }]}
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

  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(20,184,166,0.1)', bottom: 60, left: -60 },

  brandWrap: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  brandName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
  brandTagline: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },

  // Step bar
  stepBarWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepItemWrap: { alignItems: 'center', gap: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#0D7B7A', borderColor: '#0D7B7A' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  stepLabelActive: { color: '#0D7B7A', fontWeight: '800' },
  stepConnector: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 6, marginBottom: 14 },
  stepConnectorActive: { backgroundColor: '#0D7B7A' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  phoneHighlight: { color: '#0D7B7A', fontWeight: '700' },

  stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDFC', borderWidth: 1.5, borderColor: '#CCFBF1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },

  sectionBlock: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#0D7B7A', textTransform: 'uppercase', letterSpacing: 0.5 },

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

  // Password strength
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 12 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 65 },

  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  otpBox: { width: 46, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  otpBoxFilled: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC', color: '#0D7B7A' },

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
  dividerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#0D7B7A', borderRadius: 14, paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, color: '#0D7B7A', fontWeight: '800' },
});