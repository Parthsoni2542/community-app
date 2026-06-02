// import React, { useEffect } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// export default function SplashScreen() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.logo}>🏥</Text>
//       <Text style={styles.title}>Community Advisory</Text>
//       <Text style={styles.subtitle}>Expert Help at Your Fingertips</Text>
//       <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex           : 1,
//     backgroundColor: '#EFF6FF',
//     justifyContent : 'center',
//     alignItems     : 'center',
//   },
//   logo: {
//     fontSize   : 70,
//     marginBottom: 16,
//   },
//   title: {
//     fontSize  : 28,
//     fontWeight: '700',
//     color     : '#1E3A8A',
//   },
//   subtitle: {
//     fontSize  : 14,
//     color     : '#6B7280',
//     marginTop : 8,
//   },
// });


import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const COLORS = {
  primary: '#0D7B7A',
  accent: '#14B8A6',
  lightTeal: '#A7E9E7',
  background: '#B3E9E6',
  white: '#FFFFFF',
};

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo scale animation
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Title fade in
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Subtitle fade in
    Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.lightTeal, COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative Elements */}
      <View style={styles.decoration1} />
      <View style={styles.decoration2} />

      {/* Content */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoBg}>
          <Text style={styles.logo}>🏥</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
          },
        ]}
      >
        <Text style={styles.title}>Community Advisory</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.subtitleContainer,
          {
            opacity: subtitleOpacity,
          },
        ]}
      >
        <Text style={styles.subtitle}>Expert Help at Your Fingertips</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>

      {/* Bottom Branding */}
      <Animated.Text
        style={[
          styles.brandText,
          {
            opacity: subtitleOpacity,
          },
        ]}
      >
        Connecting Communities
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoration1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -50,
    right: -50,
  },
  decoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -30,
    left: -30,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 50,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  loaderContainer: {
    marginBottom: 60,
  },
  brandText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
