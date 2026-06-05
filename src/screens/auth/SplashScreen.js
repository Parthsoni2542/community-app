import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from 'react-native/Libraries/NewAppScreen';
// shared theme

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Title fades in
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, delay: 80, useNativeDriver: true }),
      // Tagline + loader fade in together
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(loaderOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Route to the appropriate screen after splash duration
    const timer = setTimeout(() => {
      navigation?.replace('Login');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0A4F4E', '#0D7B7A', '#14B8A6']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* Decorative background circles — same as LoginScreen */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoCircle}>
          <Icon name="activity" size={38} color={Colors.accent} />
        </View>
      </Animated.View>

      {/* Brand name */}
      <Animated.Text style={[styles.brandName, { opacity: titleOpacity }]}>
        ExpertConnect
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your wellness community
      </Animated.Text>

      {/* Dot loader */}
      <Animated.View style={[styles.dotRow, { opacity: loaderOpacity }]}>
        <DotPulse delay={0} />
        <DotPulse delay={200} />
        <DotPulse delay={400} />
      </Animated.View>

      {/* Bottom label */}
      <Animated.Text style={[styles.bottomLabel, { opacity: taglineOpacity }]}>
        Expert help at your fingertips
      </Animated.Text>
    </LinearGradient>
  );
}

/** Animated pulsing dot for the loading indicator */
const DotPulse = React.memo(({ delay }) => {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background decorations — identical to LoginScreen for visual continuity
  bgCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -80,
  },
  bgCircle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: '30%', left: -60,
  },
  bgCircle3: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(20,184,166,0.12)', bottom: 40, right: -40,
  },

  logoWrap: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: 40,
  },

  // Dot loader
  dotRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  bottomLabel: {
    position: 'absolute',
    bottom: 36,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    letterSpacing: 0.8,
  },
});