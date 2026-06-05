// // import React, { useState } from 'react';
// // import {
// //   View, Text, TextInput, TouchableOpacity,
// //   StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
// // } from 'react-native';
// // import auth from '@react-native-firebase/auth';
// // import firestore from '@react-native-firebase/firestore';
// // import { useDispatch } from 'react-redux';
// // import { setUser, setRole } from '../../store/slices/authSlice';

// // export default function LoginScreen({ navigation }) {
// //   const dispatch = useDispatch();
// //   const [email, setEmail]       = useState('');
// //   const [password, setPassword] = useState('');
// //   const [loading, setLoading]   = useState(false);

// //   const handleLogin = async () => {
// //     if (!email || !password) {
// //       Alert.alert('Error', 'Email aur Password dono bharo');
// //       return;
// //     }
// //     setLoading(true);
// //     try {
// //       const res = await auth().signInWithEmailAndPassword(email, password);
// //       const doc = await firestore().collection('users').doc(res.user.uid).get();

// //       if (doc.exists) {
// //         dispatch(setUser({ uid: res.user.uid, email: res.user.email }));
// //         dispatch(setRole(doc.data().role));
// //       }
// //     } catch (error) {
// //       Alert.alert('Login Failed', error.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <KeyboardAvoidingView
// //       style={styles.container}
// //       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
// //     >
// //       <Text style={styles.title}>Welcome Back 👋</Text>
// //       <Text style={styles.subtitle}>Login to continue</Text>

// //       <TextInput
// //         style={styles.input}
// //         placeholder="Email Address"
// //         placeholderTextColor="#9CA3AF"
// //         keyboardType="email-address"
// //         autoCapitalize="none"
// //         value={email}
// //         onChangeText={setEmail}
// //       />

// //       <TextInput
// //         style={styles.input}
// //         placeholder="Password"
// //         placeholderTextColor="#9CA3AF"
// //         secureTextEntry
// //         value={password}
// //         onChangeText={setPassword}
// //       />

// //       <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
// //         {loading
// //           ? <ActivityIndicator color="#fff" />
// //           : <Text style={styles.buttonText}>Login</Text>
// //         }
// //       </TouchableOpacity>

// //       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
// //         <Text style={styles.link}>Account nahi hai? Register karo</Text>
// //       </TouchableOpacity>
// //     </KeyboardAvoidingView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container : { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
// //   title     : { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 },
// //   subtitle  : { fontSize: 14, color: '#6B7280', marginBottom: 32 },
// //   input     : {
// //     backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
// //     borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
// //   },
// //   button    : {
// //     backgroundColor: '#2563EB', borderRadius: 12,
// //     padding: 16, alignItems: 'center', marginTop: 8,
// //   },
// //   buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
// //   link      : { textAlign: 'center', marginTop: 20, color: '#2563EB', fontSize: 14 },
// // });


// // import React, { useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   StyleSheet,
// //   Alert,
// //   ActivityIndicator,
// //   KeyboardAvoidingView,
// //   Platform,
// //   ScrollView,
// // } from 'react-native';
// // import LinearGradient from 'react-native-linear-gradient';
// // import auth from '@react-native-firebase/auth';
// // import firestore from '@react-native-firebase/firestore';
// // import { useDispatch } from 'react-redux';
// // import { setUser, setRole } from '../../store/slices/authSlice';


// // const COLORS = {
// //   primary: '#0D7B7A',
// //   accent: '#14B8A6',
// //   lightTeal: '#A7E9E7',
// //   background: '#B3E9E6',
// //   white: '#FFFFFF',
// //   textPrimary: '#0D7B7A',
// //   textSecondary: '#80B2B0',
// //   border: '#D6F4F2',
// //   error: '#EF4444',
// // };

// // export default function LoginScreen({ navigation }) {
// //   const dispatch = useDispatch();
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [errors, setErrors] = useState({ email: '', password: '' });

// //   const validateEmail = (value) => {
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     return emailRegex.test(value);
// //   };

// //   const handleLogin = async () => {
// //     const newErrors = { email: '', password: '' };

// //     if (!email.trim()) {
// //       newErrors.email = 'Email is required';
// //     } else if (!validateEmail(email)) {
// //       newErrors.email = 'Enter a valid email';
// //     }

// //     if (!password.trim()) {
// //       newErrors.password = 'Password is required';
// //     } else if (password.length < 6) {
// //       newErrors.password = 'Password must be at least 6 characters';
// //     }

// //     setErrors(newErrors);

// //     if (newErrors.email || newErrors.password) {
// //       return;
// //     }

// //     setLoading(true);
// //     try {
// //       const res = await auth().signInWithEmailAndPassword(email, password);
// //       const doc = await firestore().collection('users').doc(res.user.uid).get();

// //       if (doc.exists) {
// //         dispatch(setUser({ uid: res.user.uid, email: res.user.email }));
// //         dispatch(setRole(doc.data().role));
// //       }
// //     } catch (error) {
// //       let errorMessage = 'Login failed. Please try again.';
// //       if (error.code === 'auth/user-not-found') {
// //         errorMessage = 'No account found with this email.';
// //       } else if (error.code === 'auth/wrong-password') {
// //         errorMessage = 'Incorrect password.';
// //       }
// //       Alert.alert('Login Error', errorMessage);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <LinearGradient
// //       colors={['#A7E9E7', '#B3E9E6']}
// //       start={{ x: 0, y: 0 }}
// //       end={{ x: 1, y: 1 }}
// //       style={styles.container}
// //     >
// //       <KeyboardAvoidingView
// //         style={styles.wrapper}
// //         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
// //       >
// //         <ScrollView
// //           contentContainerStyle={styles.scrollContent}
// //           showsVerticalScrollIndicator={false}
// //         >
// //           {/* Top Decorative Shapes */}
// //           <View style={styles.topDecoration} />

// //           {/* Card Container */}
// //           <View style={styles.card}>
// //             {/* Decorative elements inside card top */}
// //             <View style={styles.cardDecoration1} />
// //             <View style={styles.cardDecoration2} />

// //             {/* Greeting Section */}
// //             <View style={styles.greetingSection}>
// //               <Text style={styles.greeting}>Hello!</Text>
// //               <Text style={styles.greetingSubtitle}>
// //                 Welcome to your community
// //               </Text>
// //             </View>

// //             {/* Title */}
// //             {/* <Text style={styles.cardTitle}>Login</Text> */}

// //             {/* Form */}
// //             <View style={styles.form}>
// //               {/* Email Input */}
// //               <View style={styles.fieldContainer}>
// //                 <View style={[styles.inputContainer, errors.email && styles.inputError]}>
// //                   <Text style={styles.inputIcon}>✉️</Text>
// //                   <TextInput
// //                     style={styles.input}
// //                     placeholder="Email"
// //                     placeholderTextColor="#A0A0A0"
// //                     keyboardType="email-address"
// //                     autoCapitalize="none"
// //                     autoComplete="email"
// //                     value={email}
// //                     onChangeText={(text) => {
// //                       setEmail(text);
// //                       setErrors({ ...errors, email: '' });
// //                     }}
// //                     editable={!loading}
// //                   />
// //                 </View>
// //                 {errors.email && (
// //                   <Text style={styles.errorText}>{errors.email}</Text>
// //                 )}
// //               </View>

// //               {/* Password Input */}
// //               <View style={styles.fieldContainer}>
// //                 <View style={[styles.inputContainer, errors.password && styles.inputError]}>
// //                   <Text style={styles.inputIcon}>🔐</Text>
// //                   <TextInput
// //                     style={styles.input}
// //                     placeholder="Password"
// //                     placeholderTextColor="#A0A0A0"
// //                     secureTextEntry={!showPassword}
// //                     value={password}
// //                     onChangeText={(text) => {
// //                       setPassword(text);
// //                       setErrors({ ...errors, password: '' });
// //                     }}
// //                     editable={!loading}
// //                   />
// //                   <TouchableOpacity
// //                     onPress={() => setShowPassword(!showPassword)}
// //                     disabled={!password}
// //                     style={styles.eyeButton}
// //                   >
// //                     <Text style={styles.eyeIcon}>
// //                       {showPassword ? '👁' : '👁‍🗨'}
// //                     </Text>
// //                   </TouchableOpacity>
// //                 </View>
// //                 {errors.password && (
// //                   <Text style={styles.errorText}>{errors.password}</Text>
// //                 )}
// //               </View>
// //             </View>

// //             {/* Forgot Password Link */}
// //             {/* <TouchableOpacity
// //               onPress={() => navigation.navigate('ForgotPassword')}
// //               style={styles.forgotContainer}
// //             >
// //               <Text style={styles.forgotLink}>Forgot Password</Text>
// //             </TouchableOpacity> */}

// //             {/* Sign In Button */}
// //             <TouchableOpacity
// //               style={[styles.button, loading && styles.buttonDisabled]}
// //               onPress={handleLogin}
// //               disabled={loading}
// //               activeOpacity={0.85}
// //             >
// //               {loading ? (
// //                 <ActivityIndicator color={COLORS.white} size="small" />
// //               ) : (
// //                 <Text style={styles.buttonText}>Login</Text>
// //               )}
// //             </TouchableOpacity>

// //             {/* Divider */}
// //             <View style={styles.divider} />

// //             {/* Social Login Section */}
// //             {/* <View style={styles.socialSection}>
// //               <Text style={styles.socialText}>Or login with</Text>
// //               <View style={styles.socialButtons}>
// //                 <TouchableOpacity style={styles.socialButton}>
// //                   <Text style={styles.socialIcon}>f</Text>
// //                 </TouchableOpacity>
// //                 <TouchableOpacity style={styles.socialButton}>
// //                   <Text style={styles.socialIcon}>G</Text>
// //                 </TouchableOpacity>
// //                 <TouchableOpacity style={styles.socialButton}>
// //                   <Text style={styles.socialIcon}>🍎</Text>
// //                 </TouchableOpacity>
// //               </View>
// //             </View> */}

// //             {/* Sign Up Link */}
// //             <View style={styles.footer}>
// //               <Text style={styles.footerText}>Don't have an account? </Text>
// //               <TouchableOpacity onPress={() => navigation.navigate('Register')}>
// //                 <Text style={styles.signupLink}>Sign Up</Text>
// //               </TouchableOpacity>
// //             </View>
// //           </View>
// //         </ScrollView>
// //       </KeyboardAvoidingView>
// //     </LinearGradient>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   wrapper: {
// //     flex: 1,
// //   },
// //   scrollContent: {
// //     flexGrow: 1,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     paddingHorizontal: 16,
// //     paddingVertical: 20,
// //   },
// //   topDecoration: {
// //     position: 'absolute',
// //     width: 180,
// //     height: 180,
// //     borderRadius: 90,
// //     backgroundColor: 'rgba(255, 255, 255, 0.15)',
// //     top: -40,
// //     right: -40,
// //   },
// //   card: {
// //     backgroundColor: COLORS.white,
// //     borderRadius: 40,
// //     padding: 28,
// //     width: '100%',
// //     maxWidth: 360,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 15 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 25,
// //     elevation: 10,
// //   },
// //   cardDecoration1: {
// //     position: 'absolute',
// //     width: 120,
// //     height: 120,
// //     borderRadius: 60,
// //     backgroundColor: 'rgba(167, 233, 231, 0.2)',
// //     top: -20,
// //     right: 20,
// //   },
// //   cardDecoration2: {
// //     position: 'absolute',
// //     width: 90,
// //     height: 90,
// //     borderRadius: 45,
// //     backgroundColor: 'rgba(20, 184, 166, 0.1)',
// //     bottom: 100,
// //     left: -30,
// //   },
// //   greetingSection: {
// //     marginBottom: 20,
// //     marginTop: 10,
// //   },
// //   greeting: {
// //     fontSize: 24,
// //     fontWeight: '700',
// //     color: '#0D7B7A',
// //     letterSpacing: 0.5,
// //   },
// //   greetingSubtitle: {
// //     fontSize: 13,
// //     color: '#80B2B0',
// //     marginTop: 3,
// //     fontWeight: '400',
// //   },
// //   cardTitle: {
// //     fontSize: 32,
// //     fontWeight: '700',
// //     color: '#0D7B7A',
// //     marginBottom: 24,
// //   },
// //   form: {
// //     marginBottom: 16,
// //   },
// //   fieldContainer: {
// //     marginBottom: 14,
// //   },
// //   inputContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#F5FFFE',
// //     borderRadius: 24,
// //     borderWidth: 1.5,
// //     borderColor: '#D6F4F2',
// //     paddingHorizontal: 16,
// //     height: 56,
// //   },
// //   inputError: {
// //     borderColor: '#EF4444',
// //   },
// //   inputIcon: {
// //     fontSize: 20,
// //     marginRight: 12,
// //   },
// //   input: {
// //     flex: 1,
// //     fontSize: 15,
// //     color: '#0D7B7A',
// //     fontWeight: '500',
// //   },
// //   eyeButton: {
// //     padding: 8,
// //     marginRight: -8,
// //   },
// //   eyeIcon: {
// //     fontSize: 18,
// //   },
// //   errorText: {
// //     fontSize: 11,
// //     color: '#EF4444',
// //     marginTop: 4,
// //     marginLeft: 16,
// //     fontWeight: '500',
// //   },
// //   forgotContainer: {
// //     alignSelf: 'flex-end',
// //     marginBottom: 20,
// //   },
// //   forgotLink: {
// //     fontSize: 12,
// //     color: '#0D7B7A',
// //     fontWeight: '600',
// //   },
// //   button: {
// //     backgroundColor: '#0D7B7A',
// //     borderRadius: 25,
// //     paddingVertical: 14,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     marginBottom: 18,
// //   },
// //   buttonDisabled: {
// //     opacity: 0.7,
// //   },
// //   buttonText: {
// //     color: COLORS.white,
// //     fontWeight: '700',
// //     fontSize: 16,
// //     letterSpacing: 0.5,
// //   },
// //   divider: {
// //     height: 1,
// //     backgroundColor: '#E0E0E0',
// //     marginBottom: 16,
// //   },
// //   socialSection: {
// //     alignItems: 'center',
// //     marginBottom: 18,
// //   },
// //   socialText: {
// //     fontSize: 12,
// //     color: '#80B2B0',
// //     marginBottom: 12,
// //     fontWeight: '500',
// //   },
// //   socialButtons: {
// //     flexDirection: 'row',
// //     justifyContent: 'center',
// //     gap: 20,
// //   },
// //   socialButton: {
// //     width: 48,
// //     height: 48,
// //     borderRadius: 24,
// //     backgroundColor: '#F5FFFE',
// //     borderWidth: 1.5,
// //     borderColor: '#E0E0E0',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   socialIcon: {
// //     fontSize: 20,
// //     fontWeight: '700',
// //     color: '#0D7B7A',
// //   },
// //   footer: {
// //     flexDirection: 'row',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   footerText: {
// //     fontSize: 13,
// //     color: '#80B2B0',
// //     fontWeight: '500',
// //   },
// //   signupLink: {
// //     fontSize: 13,
// //     color: '#0D7B7A',
// //     fontWeight: '700',
// //   },
// // });



// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Animated,
//   Dimensions,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Feather';
// import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
// import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
// import { useDispatch } from 'react-redux';
// import { setUser, setRole } from '../../store/slices/authSlice';

// const { width, height } = Dimensions.get('window');

// export default function LoginScreen({ navigation }) {
//   const dispatch = useDispatch();
//   const [email, setEmail]               = useState('');
//   const [password, setPassword]         = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading]           = useState(false);
//   const [errors, setErrors]             = useState({ email: '', password: '' });
//   const [emailFocused, setEmailFocused] = useState(false);
//   const [passFocused, setPassFocused]   = useState(false);

//   // Animations
//   const fadeAnim   = useRef(new Animated.Value(0)).current;
//   const slideAnim  = useRef(new Animated.Value(40)).current;
//   const scaleCard  = useRef(new Animated.Value(0.95)).current;
//   const pulse      = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
//       Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
//       Animated.spring(scaleCard, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
//     ]).start();

//     // Pulse the button subtly
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
//         Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);

//   const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

//   const handleLogin = async () => {
//     const newErrors = { email: '', password: '' };
//     if (!email.trim())          newErrors.email    = 'Email is required';
//     else if (!validateEmail(email)) newErrors.email = 'Enter a valid email';
//     if (!password.trim())       newErrors.password = 'Password is required';
//     else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
//     setErrors(newErrors);
//     if (newErrors.email || newErrors.password) return;

//     setLoading(true);
//     try {
//       const auth = getAuth();
//       const res  = await signInWithEmailAndPassword(auth, email, password);
//       const db   = getFirestore();
//       const snap = await getDoc(doc(db, 'users', res.user.uid));
//       if (snap.exists()) {
//         dispatch(setUser({ uid: res.user.uid, email: res.user.email }));
//         dispatch(setRole(snap.data().role));
//       }
//     } catch (error) {
//       let msg = 'Login failed. Please try again.';
//       if (error.code === 'auth/user-not-found')  msg = 'No account found with this email.';
//       if (error.code === 'auth/wrong-password')  msg = 'Incorrect password.';
//       if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
//       Alert.alert('Login Error', msg);
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
//       {/* Background decorative circles */}
//       <View style={styles.bgCircle1} />
//       <View style={styles.bgCircle2} />
//       <View style={styles.bgCircle3} />

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Logo / Brand */}
//           <Animated.View style={[styles.brandWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//             <View style={styles.logoCircle}>
//               <MaterialIcon name="leaf-circle" size={42} color="#14B8A6" />
//             </View>
//             <Text style={styles.brandName}>ExpertConnect</Text>
//             <Text style={styles.brandTagline}>Your wellness community</Text>
//           </Animated.View>

//           {/* Card */}
//           <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleCard }] }]}>

//             <Text style={styles.cardTitle}>Welcome back</Text>
//             <Text style={styles.cardSub}>Sign in to continue</Text>

//             {/* Email Field */}
//             <View style={styles.fieldWrap}>
//               <Text style={styles.fieldLabel}>Email address</Text>
//               <View style={[
//                 styles.inputRow,
//                 emailFocused && styles.inputFocused,
//                 errors.email  && styles.inputErrorBorder,
//               ]}>
//                 <Icon
//                   name="mail"
//                   size={18}
//                   color={emailFocused ? '#0D7B7A' : errors.email ? '#EF4444' : '#94A3B8'}
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="you@example.com"
//                   placeholderTextColor="#C0CDD6"
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   autoComplete="email"
//                   value={email}
//                   onFocus={() => setEmailFocused(true)}
//                   onBlur={() => setEmailFocused(false)}
//                   onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
//                   editable={!loading}
//                 />
//                 {email.length > 0 && validateEmail(email) && (
//                   <Icon name="check-circle" size={17} color="#10B981" />
//                 )}
//               </View>
//               {errors.email ? (
//                 <View style={styles.errorRow}>
//                   <Icon name="alert-circle" size={12} color="#EF4444" />
//                   <Text style={styles.errorText}>{errors.email}</Text>
//                 </View>
//               ) : null}
//             </View>

//             {/* Password Field */}
//             <View style={styles.fieldWrap}>
//               <Text style={styles.fieldLabel}>Password</Text>
//               <View style={[
//                 styles.inputRow,
//                 passFocused && styles.inputFocused,
//                 errors.password && styles.inputErrorBorder,
//               ]}>
//                 <Icon
//                   name="lock"
//                   size={18}
//                   color={passFocused ? '#0D7B7A' : errors.password ? '#EF4444' : '#94A3B8'}
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Min. 6 characters"
//                   placeholderTextColor="#C0CDD6"
//                   secureTextEntry={!showPassword}
//                   value={password}
//                   onFocus={() => setPassFocused(true)}
//                   onBlur={() => setPassFocused(false)}
//                   onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
//                   editable={!loading}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                 >
//                   <Icon
//                     name={showPassword ? 'eye' : 'eye-off'}
//                     size={18}
//                     color="#94A3B8"
//                   />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? (
//                 <View style={styles.errorRow}>
//                   <Icon name="alert-circle" size={12} color="#EF4444" />
//                   <Text style={styles.errorText}>{errors.password}</Text>
//                 </View>
//               ) : null}
//             </View>

//             {/* Forgot Password */}
//             {/* <TouchableOpacity
//               style={styles.forgotWrap}
//               onPress={() => navigation.navigate('ForgotPassword')}
//             >
//               <Text style={styles.forgotText}>Forgot password?</Text>
//             </TouchableOpacity> */}

//             {/* Login Button */}
//             <Animated.View style={{ transform: [{ scale: loading ? 1 : pulse }] }}>
//               <TouchableOpacity
//                 style={[styles.loginBtn, loading && { opacity: 0.75 }]}
//                 onPress={handleLogin}
//                 disabled={loading}
//                 activeOpacity={0.88}
//               >
//                 <LinearGradient
//                   colors={['#0D7B7A', '#0A5F5E']}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 0 }}
//                   style={styles.loginBtnGrad}
//                 >
//                   {loading ? (
//                     <ActivityIndicator color="#FFFFFF" size="small" />
//                   ) : (
//                     <>
//                       <Text style={styles.loginBtnText}>Sign In</Text>
//                       {/* <View style={styles.loginBtnArrow}>
//                         <Icon name="arrow-right" size={18} color="#0D7B7A" />
//                       </View> */}
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>
//             </Animated.View>

//             {/* Divider */}
//             <View style={styles.dividerRow}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             {/* Sign Up */}
//             <View style={styles.footerRow}>
//               <Text style={styles.footerText}>Don't have an account?</Text>
//               <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginLeft: 6 }}>
//                 <Text style={styles.signupText}>Create one</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>

//           {/* Bottom tip */}
//           {/* <Animated.View style={[styles.bottomTip, { opacity: fadeAnim }]}>
//             <Icon name="shield" size={13} color="rgba(255,255,255,0.5)" />
//             <Text style={styles.bottomTipText}>256-bit encrypted & secure</Text>
//           </Animated.View> */}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container  : { flex: 1 },
//   scroll     : { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },

//   // Background decorations
//   bgCircle1  : {
//     position: 'absolute', width: 280, height: 280, borderRadius: 140,
//     backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80,
//   },
//   bgCircle2  : {
//     position: 'absolute', width: 180, height: 180, borderRadius: 90,
//     backgroundColor: 'rgba(255,255,255,0.06)', top: height * 0.3, left: -60,
//   },
//   bgCircle3  : {
//     position: 'absolute', width: 220, height: 220, borderRadius: 110,
//     backgroundColor: 'rgba(20,184,166,0.12)', bottom: 40, right: -40,
//   },

//   // Brand
//   brandWrap  : { alignItems: 'center', marginBottom: 28 },
//   logoCircle : {
//     width: 72, height: 72, borderRadius: 36,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     justifyContent: 'center', alignItems: 'center', marginBottom: 12,
//     borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
//   },
//   brandName  : { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
//   brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

//   // Card
//   card       : {
//     width: '100%', maxWidth: 380,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 28, padding: 28,
//     shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30,
//     shadowOffset: { width: 0, height: 12 }, elevation: 16,
//   },
//   cardTitle  : { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
//   cardSub    : { fontSize: 13, color: '#94A3B8', marginBottom: 24 },

//   // Field
//   fieldWrap  : { marginBottom: 16 },
//   fieldLabel : { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
//   inputRow   : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#F8FAFC', borderRadius: 14,
//     borderWidth: 1.5, borderColor: '#E2E8F0',
//     paddingHorizontal: 14, height: 52,
//   },
//   inputFocused     : { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
//   inputErrorBorder : { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
//   inputIcon  : { marginRight: 10 },
//   input      : { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
//   errorRow   : { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
//   errorText  : { fontSize: 11, color: '#EF4444', fontWeight: '600' },

//   // Forgot
//   forgotWrap : { alignSelf: 'flex-end', marginBottom: 22, marginTop: -4 },
//   forgotText : { fontSize: 12, color: '#0D7B7A', fontWeight: '700' },

//   // Button
//   loginBtn     : { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
//   loginBtnGrad : {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     paddingVertical: 15, paddingHorizontal: 24, gap: 10,
//   },
//   loginBtnText : { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
//   loginBtnArrow: {
//     width: 30, height: 30, borderRadius: 15,
//     backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
//   },

//   // Divider
//   dividerRow  : { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
//   dividerLine : { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
//   dividerText : { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

//   // Footer
//   footerRow   : { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
//   footerText  : { fontSize: 13, color: '#64748B' },
//   signupText  : { fontSize: 13, color: '#0D7B7A', fontWeight: '800' },

//   // Bottom tip
//   bottomTip   : { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 6 },
//   bottomTipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
// });


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
      console.log('handleSendOtp error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
      Alert.alert('Verification Failed', msg);
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
            <View style={styles.logoCircle}>
              <MatIcon name="leaf-circle" size={42} color="#14B8A6" />
            </View>
            <Text style={styles.brandName}>ExpertConnect</Text>
            <Text style={styles.brandTagline}>Your wellness community</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

            {/* ── PHONE STEP ── */}
            {step === STEP_PHONE && (
              <Animated.View style={{ transform: [{ translateY: stepAnim }] }}>
                <View style={styles.stepIcon}>
                  <MatIcon name="cellphone" size={28} color="#0D7B7A" />
                </View>
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
                  <Text style={styles.dividerText}>new here?</Text>
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

  bgCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80 },
  bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: '30%', left: -60 },
  bgCircle3: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(20,184,166,0.12)', bottom: 40, right: -40 },

  brandWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  brandName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
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
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  otpBox: { width: 46, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  otpBoxFilled: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC', color: '#0D7B7A' },

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