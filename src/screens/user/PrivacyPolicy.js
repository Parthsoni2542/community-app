/**
 * PrivacyPolicy.jsx
 */

import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Animated, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const POLICY_SECTIONS = [
  {
    id      : '1',
    icon    : 'info',
    iconLib : 'feather',
    title   : 'Information We Collect',
    content : `We collect information you provide directly to us when you create an account, update your profile, or communicate with us. This includes:\n\n• Full name, email address, and phone number\n• Profile information such as your address and preferences\n• Communication history and consultation records\n• Device information and usage data`,
  },
  {
    id      : '2',
    icon    : 'eye',
    iconLib : 'feather',
    title   : 'How We Use Your Information',
    content : `We use the information we collect to provide, maintain, and improve our services:\n\n• To create and manage your account\n• To connect you with the right experts\n• To send promotional communications (with your consent)\n• To monitor and analyse trends and usage\n• To detect and prevent fraudulent activity`,
  },
  {
    id      : '3',
    icon    : 'share-2',
    iconLib : 'feather',
    title   : 'Information Sharing',
    content : `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n\n• With experts you choose to consult with\n• With service providers who assist in our operations\n• To comply with legal obligations or protect rights`,
  },
  {
    id      : '4',
    icon    : 'shield',
    iconLib : 'feather',
    title   : 'Data Security',
    content : `We implement industry-standard security measures to protect your personal information:\n\n• All data is encrypted in transit using TLS 1.3\n• Passwords are hashed using bcrypt\n• Regular security audits and penetration testing\n• Strict access controls for internal staff\n• Automatic session expiry after inactivity\n\nHowever, no method of transmission over the Internet is 100% secure.`,
  },
  {
    id      : '5',
    icon    : 'database',
    iconLib : 'feather',
    title   : 'Data Retention',
    content : `We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.\n\n• Account data: retained while account is active\n• Consultation history: retained for 3 years after last activity\n• Log data: retained for 90 days`,
  },
  {
    id      : '6',
    icon    : 'user-check',
    iconLib : 'feather',
    title   : 'Your Rights',
    content : `You have the following rights regarding your personal data:\n\n• Access: Request a copy of your personal data\n• Correction: Update inaccurate or incomplete data\n• Deletion: Request erasure of your personal data\n• Portability: Receive your data in a structured format\n• Objection: Object to processing based on legitimate interests\n\nTo exercise any of these rights, please contact us at communityadvisory7@gmail.com`,
  },
  {
    id      : '7',
    icon    : 'smartphone',
    iconLib : 'feather',
    title   : 'Cookies & Tracking',
    content : `Our app uses local storage and similar technologies to enhance your experience:\n\n• Authentication tokens to keep you logged in\n• Preferences storage for app settings\n• Analytics data to understand usage patterns\n\nYou can clear app data at any time through your device settings to remove all locally stored information.`,
  },
  {
    id      : '8',
    icon    : 'bell',
    iconLib : 'feather',
    title   : 'Changes to This Policy',
    content : `We may update this Privacy Policy from time to time. We will notify you of any significant changes by:\n\n• Sending a notification through the app\n• Emailing you at the address associated with your account\n• Displaying a prominent notice on our app\n\nYour continued use of the app after changes take effect constitutes acceptance of the revised policy.`,
  },
  {
    id      : '9',
    icon    : 'mail',
    iconLib : 'feather',
    title   : 'Contact Us',
    content : `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:\n\n• Email: communityadvisory7@gmail.com\n• Response time: Within 72 hours of receiving your request`,
  },
];

// ─── Expandable Section Card ──────────────────────────────────────────────────
const PolicyCard = React.memo(({ section, animStyle, isExpanded, onToggle }) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue        : isExpanded ? 1 : 0,
      duration       : 260,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const chevronRotate = rotateAnim.interpolate({
    inputRange : [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.policyCard, animStyle]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardHeaderIcon}>
            {section.iconLib === 'mat'
              ? <MatIcon name={section.icon} size={14} color="#0D7B7A" />
              : <Icon    name={section.icon} size={14} color="#0D7B7A" />
            }
          </View>
          <Text style={styles.cardHeaderTitle}>{section.title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Icon name="chevron-down" size={16} color="#94A3B8" />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.cardBody}>
          <View style={styles.cardDivider} />
          <Text style={styles.policyText}>{section.content}</Text>
        </View>
      )}
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PrivacyPolicy({ navigation }) {
  const [openId, setOpenId] = useState(POLICY_SECTIONS[0].id);

  const handleToggle = useCallback((id) => {
    LayoutAnimation.configureNext({
      duration: 280,
      update  : { type: 'easeInEaseOut' },
      create  : { type: 'easeInEaseOut', property: 'opacity' },
      delete  : { type: 'easeInEaseOut', property: 'opacity' },
    });
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const heroSlide  = useRef(new Animated.Value(-16)).current;
  const slideAnims = useRef(
    POLICY_SECTIONS.map(() => new Animated.Value(20)),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
    ]).start();

    const cardAnims = slideAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue        : 0,
        tension        : 68,
        friction       : 14,
        delay          : 80 + i * 45,
        useNativeDriver: true,
      }),
    );
    Animated.parallel(cardAnims).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={['#0A4F4E', '#0D7B7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroScreenTitle}>Privacy Policy</Text>
            <View style={styles.heroTopBarSpacer} />
          </View>

          <Animated.View
            style={[
              styles.heroContent,
              { opacity: fadeAnim, transform: [{ translateY: heroSlide }] },
            ]}
          >
            <View style={styles.shieldIconWrap}>
              <Icon name="shield" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.heroSubtitle}>
              We are committed to protecting your privacy and handling your data responsibly.
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <MatIcon name="calendar-outline" size={12} color="#0D7B7A" />
                <Text style={styles.metaBadgeText}>Last updated: Jan 1, 2025</Text>
              </View>
              <View style={styles.metaBadge}>
                <Icon name="file-text" size={11} color="#0D7B7A" />
                <Text style={styles.metaBadgeText}>v2.0</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Intro notice ── */}
        <Animated.View
          style={[
            styles.noticeCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnims[0] }] },
          ]}
        >
          <Icon name="info" size={15} color="#0D7B7A" style={{ marginTop: 1 }} />
          <Text style={styles.noticeText}>
            Please read this policy carefully. By using our app, you agree to the collection and use of information as described below.
          </Text>
        </Animated.View>

        {/* ── Policy Sections ── */}
        {POLICY_SECTIONS.map((section, idx) => (
          <PolicyCard
            key={section.id}
            section={section}
            index={idx}
            isExpanded={openId === section.id}
            onToggle={() => handleToggle(section.id)}
            animStyle={{
              opacity  : fadeAnim,
              transform: [{ translateY: slideAnims[Math.min(idx + 1, slideAnims.length - 1)] }],
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#EFF4F4' },
  scrollContent: { paddingBottom: 70 },

  hero: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  heroTopBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroScreenTitle: {
    flex: 1, textAlign: 'center', fontSize: 20,
    fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2,
  },
  heroTopBarSpacer: { width: 36 },
  heroContent     : { alignItems: 'center' },
  shieldIconWrap  : {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.78)',
    textAlign: 'center', lineHeight: 20,
    fontWeight: '500', paddingHorizontal: 8,
  },
  metaRow : { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', paddingHorizontal: 11,
    paddingVertical: 5, borderRadius: 20,
  },
  metaBadgeText: { fontSize: 12, fontWeight: '700', color: '#0D7B7A' },

  noticeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F0FDFA', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#CCEFED',
  },
  noticeText: { flex: 1, fontSize: 13, color: '#0F4F4E', lineHeight: 19, fontWeight: '500' },

  policyCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  cardHeaderLeft  : { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  cardHeaderIcon  : {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  cardHeaderTitle : { fontSize: 14, fontWeight: '800', color: '#0F172A', flex: 1 },
  cardDivider     : { height: 1, backgroundColor: '#F0FDFA', marginHorizontal: 16, marginBottom: 14 },
  cardBody        : { paddingBottom: 16 },
  policyText      : {
    fontSize: 13, color: '#475569', lineHeight: 21,
    fontWeight: '400', paddingHorizontal: 16,
  },
});