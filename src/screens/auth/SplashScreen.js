import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale    = useRef(new Animated.Value(0.5)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const dotOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up & fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 380,
        delay: 60,
        useNativeDriver: true,
      }),
      // Dots appear
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation?.replace('Login');
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Subtle bg shapes — very light, not distracting */}
      <View style={styles.shapeTL} />
      <View style={styles.shapeBR} />

      {/* Center content */}
      <View style={styles.centerContent}>

        {/* Logo */}
        <Animated.View style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
          <Image
            style={styles.logo}
            resizeMode="contain"
            source={require('../../asserts/image/Logo.png')}
          />
        </Animated.View>

        {/* Brand text */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={styles.brandName}>Kapol Setu</Text>
          <Text style={styles.taglineGuj}>સેવા · સહકાર · સંસ્કાર</Text>
          <Text style={styles.taglineEng}>Your wellness community</Text>
        </Animated.View>

        {/* Loading indicator — pill + dots */}
        <Animated.View style={[styles.dotsRow, { opacity: dotOpacity }]}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotPill]} />
          <View style={[styles.dot, styles.dotFaint]} />
        </Animated.View>
      </View>

      {/* Bottom label */}
      <Text style={styles.bottomLabel}>Powered by Kapol Setu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Subtle background shapes ──────────────
  shapeTL: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F0F4FF',   // very light blue
    top: -100,
    right: -100,
  },
  shapeBR: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF4EC',   // very light orange
    bottom: -60,
    left: -60,
  },

  // ── Center section ────────────────────────
  centerContent: {
    alignItems: 'center',
    gap: 0,
  },

  // ── Logo ─────────────────────────────────
  logoWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    // Soft blue ring — brand subtle
    borderWidth: 2,
    borderColor: '#E8EDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // Shadow for depth on white bg
    shadowColor: '#1E3FA3',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  // ── Brand text ────────────────────────────
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3FA3',             // brand blue
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  taglineGuj: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F47920',             // brand orange
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  taglineEng: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 48,
  },

  // ── Dot loader ────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    backgroundColor: '#1E3FA3',  // blue
  },
  dotPill: {
    width: 22,
    backgroundColor: '#F47920',  // orange — brand accent, wider pill
  },
  dotFaint: {
    width: 8,
    backgroundColor: '#1E3FA3',
    opacity: 0.25,
  },

  // ── Bottom label ──────────────────────────
  bottomLabel: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11,
    color: '#CBD5E1',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
});