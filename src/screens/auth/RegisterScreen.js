// import React, { useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';

// export default function RegisterScreen({ navigation }) {
//   const [name, setName]         = useState('');
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading]   = useState(false);

//   const handleRegister = async () => {
//     if (!name || !email || !password) {
//       Alert.alert('Error', 'Saare fields bharo');
//       return;
//     }
//     setLoading(true);
//     try {
//       const res = await auth().createUserWithEmailAndPassword(email, password);
//       await firestore().collection('users').doc(res.user.uid).set({
//         name,
//         email,
//         role     : 'user',  // default role
//         createdAt: firestore.FieldValue.serverTimestamp(),
//       });
//       Alert.alert('Success', 'Account ban gaya!');
//     } catch (error) {
//       Alert.alert('Register Failed', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
//         <Text style={styles.title}>Create Account 🎉</Text>
//         <Text style={styles.subtitle}>Aaj hi join karo</Text>

//         <TextInput style={styles.input} placeholder="Full Name"       placeholderTextColor="#9CA3AF" value={name}     onChangeText={setName}     />
//         <TextInput style={styles.input} placeholder="Email Address"   placeholderTextColor="#9CA3AF" value={email}    onChangeText={setEmail}    keyboardType="email-address" autoCapitalize="none" />
//         <TextInput style={styles.input} placeholder="Password"        placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />

//         <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
//           {loading
//             ? <ActivityIndicator color="#fff" />
//             : <Text style={styles.buttonText}>Register</Text>
//           }
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//           <Text style={styles.link}>Pehle se account hai? Login karo</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container : { flex: 1, backgroundColor: '#F9FAFB', padding: 24 },
//   title     : { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 },
//   subtitle  : { fontSize: 14, color: '#6B7280', marginBottom: 32 },
//   input     : {
//     backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
//     borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
//   },
//   button    : { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleRegister = async () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

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

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (
      newErrors.name ||
      newErrors.email ||
      newErrors.password ||
      newErrors.confirmPassword
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await auth().createUserWithEmailAndPassword(email, password);
      await firestore()
        .collection('users')
        .doc(res.user.uid)
        .set({
          name,
          email,
          phone: phone || null,
          role: 'user',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login');
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }
      Alert.alert('Registration Error', errorMessage);
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

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back to login</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.cardTitle}>Sign Up</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.fieldContainer}>
                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#A0A0A0"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrors({ ...errors, name: '' });
                    }}
                    editable={!loading}
                  />
                </View>
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

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

              {/* Confirm Password Input */}
              <View style={styles.fieldContainer}>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setErrors({ ...errors, confirmPassword: '' });
                    }}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!confirmPassword}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? '👁' : '👁‍🗨'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Phone Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📱</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
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
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    color: '#0D7B7A',
    fontWeight: '600',
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
  loginLink: {
    fontSize: 13,
    color: '#0D7B7A',
    fontWeight: '700',
  },
});
