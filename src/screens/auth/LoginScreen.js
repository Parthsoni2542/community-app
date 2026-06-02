// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useDispatch } from 'react-redux';
// import { setUser, setRole } from '../../store/slices/authSlice';

// export default function LoginScreen({ navigation }) {
//   const dispatch = useDispatch();
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading]   = useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Email aur Password dono bharo');
//       return;
//     }
//     setLoading(true);
//     try {
//       const res = await auth().signInWithEmailAndPassword(email, password);
//       const doc = await firestore().collection('users').doc(res.user.uid).get();

//       if (doc.exists) {
//         dispatch(setUser({ uid: res.user.uid, email: res.user.email }));
//         dispatch(setRole(doc.data().role));
//       }
//     } catch (error) {
//       Alert.alert('Login Failed', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <Text style={styles.title}>Welcome Back 👋</Text>
//       <Text style={styles.subtitle}>Login to continue</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email Address"
//         placeholderTextColor="#9CA3AF"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         value={email}
//         onChangeText={setEmail}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor="#9CA3AF"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//       />

//       <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//         {loading
//           ? <ActivityIndicator color="#fff" />
//           : <Text style={styles.buttonText}>Login</Text>
//         }
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.link}>Account nahi hai? Register karo</Text>
//       </TouchableOpacity>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container : { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
//   title     : { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 },
//   subtitle  : { fontSize: 14, color: '#6B7280', marginBottom: 32 },
//   input     : {
//     backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
//     borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
//   },
//   button    : {
//     backgroundColor: '#2563EB', borderRadius: 12,
//     padding: 16, alignItems: 'center', marginTop: 8,
//   },
//   buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
//   link      : { textAlign: 'center', marginTop: 20, color: '#2563EB', fontSize: 14 },
// });


import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUser, setRole } from '../../store/slices/authSlice';


const COLORS = {
  primary: '#0D7B7A',
  accent: '#14B8A6',
  lightTeal: '#A7E9E7',
  background: '#B3E9E6',
  white: '#FFFFFF',
  textPrimary: '#0D7B7A',
  textSecondary: '#80B2B0',
  border: '#D6F4F2',
  error: '#EF4444',
};

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleLogin = async () => {
    const newErrors = { email: '', password: '' };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);
    try {
      const res = await auth().signInWithEmailAndPassword(email, password);
      const doc = await firestore().collection('users').doc(res.user.uid).get();

      if (doc.exists) {
        dispatch(setUser({ uid: res.user.uid, email: res.user.email }));
        dispatch(setRole(doc.data().role));
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      }
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#A7E9E7', '#B3E9E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Decorative Shapes */}
          <View style={styles.topDecoration} />

          {/* Card Container */}
          <View style={styles.card}>
            {/* Decorative elements inside card top */}
            <View style={styles.cardDecoration1} />
            <View style={styles.cardDecoration2} />

            {/* Greeting Section */}
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.greetingSubtitle}>
                Welcome to your community
              </Text>
            </View>

            {/* Title */}
            {/* <Text style={styles.cardTitle}>Login</Text> */}

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.fieldContainer}>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrors({ ...errors, email: '' });
                    }}
                    editable={!loading}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.fieldContainer}>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrors({ ...errors, password: '' });
                    }}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={!password}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁' : '👁‍🗨'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
            </View>

            {/* Forgot Password Link */}
            {/* <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotLink}>Forgot Password</Text>
            </TouchableOpacity> */}

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Social Login Section */}
            {/* <View style={styles.socialSection}>
              <Text style={styles.socialText}>Or login with</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialIcon}>🍎</Text>
                </TouchableOpacity>
              </View>
            </View> */}

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  topDecoration: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -40,
    right: -40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 40,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  cardDecoration1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(167, 233, 231, 0.2)',
    top: -20,
    right: 20,
  },
  cardDecoration2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    bottom: 100,
    left: -30,
  },
  greetingSection: {
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D7B7A',
    letterSpacing: 0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#80B2B0',
    marginTop: 3,
    fontWeight: '400',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0D7B7A',
    marginBottom: 24,
  },
  form: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FFFE',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D6F4F2',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0D7B7A',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 16,
    fontWeight: '500',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotLink: {
    fontSize: 12,
    color: '#0D7B7A',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0D7B7A',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  socialSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  socialText: {
    fontSize: 12,
    color: '#80B2B0',
    marginBottom: 12,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5FFFE',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D7B7A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#80B2B0',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 13,
    color: '#0D7B7A',
    fontWeight: '700',
  },
});
