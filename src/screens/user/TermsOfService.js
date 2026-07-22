/**
 * TermsOfService.jsx
 *
 * Design: Matches PrivacyPolicy.jsx design system exactly
 *  - Same teal LinearGradient hero with back button
 *  - Accordion: only one section open at a time
 *  - Staggered entrance animations
 *  - Last Updated badge in hero
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

// ─── Terms Data ───────────────────────────────────────────────────────────────
const TERMS_SECTIONS = [
  {
    id      : '1',
    icon    : 'check-circle',
    iconLib : 'feather',
    title   : 'Acceptance of Terms',
    content : `By accessing or using our app, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.\n\n• You must be at least 18 years of age to use this app\n• By registering, you confirm that all information provided is accurate\n• These terms apply to all users, including registered and guest users\n• Continued use of the app constitutes acceptance of any updated terms`,
  },
  {
    id      : '2',
    icon    : 'user',
    iconLib : 'feather',
    title   : 'User Accounts',
    content : `To access certain features of our app, you must create an account. You are responsible for:\n\n• Maintaining the confidentiality of your login credentials\n• All activities that occur under your account\n• Notifying us immediately of any unauthorised access\n• Ensuring your account information is accurate and up-to-date\n\nWe reserve the right to suspend or terminate accounts that violate these terms or our community guidelines.`,
  },
  {
    id      : '3',
    icon    : 'briefcase',
    iconLib : 'feather',
    title   : 'Use of Services',
    content : `Our app provides a platform to connect users with professionals and experts. You agree to use our services only for lawful purposes and in accordance with these terms:\n\n• Do not use the app for any illegal or unauthorised purpose\n• Do not transmit any harmful, offensive, or misleading content\n• Do not attempt to interfere with the app's functionality or security\n• Do not impersonate any person or entity\n• Respect the intellectual property rights of others`,
  },
  {
    id      : '4',
    icon    : 'alert-triangle',
    iconLib : 'feather',
    title   : 'Prohibited Activities',
    content : `The following activities are strictly prohibited on our platform:\n\n• Harassment, abuse, or threatening behaviour toward other users or experts\n• Sharing false, misleading, or fraudulent information\n• Scraping, crawling, or automated access to our services\n• Attempting to reverse-engineer or decompile any part of the app\n• Using the platform for spam, phishing, or unsolicited communication\n• Uploading malware, viruses, or any malicious code`,
  },
  {
    id      : '5',
    icon    : 'award',
    iconLib : 'feather',
    title   : 'Intellectual Property',
    content : `All content, features, and functionality of this app — including text, graphics, logos, and software — are the exclusive property of our platform and are protected by applicable intellectual property laws.\n\n• You may not reproduce or distribute our content without written permission\n• User-submitted content remains your property, but you grant us a licence to use it\n• Feedback or suggestions you provide may be used by us without compensation\n• Our trademarks and trade dress may not be used without prior written consent`,
  },
  {
    id      : '6',
    icon    : 'x-circle',
    iconLib : 'feather',
    title   : 'Disclaimers & Limitations',
    content : `Our app is provided on an "as is" and "as available" basis without any warranties of any kind:\n\n• We do not guarantee uninterrupted or error-free operation\n• We are not liable for the accuracy of expert advice or consultations\n• We are not responsible for third-party content, links, or services\n• Experts on our platform are independent professionals, not our employees`,
  },
  {
    id      : '7',
    icon    : 'slash',
    iconLib : 'feather',
    title   : 'Termination',
    content : `We reserve the right to suspend or terminate your access to the app at our sole discretion, without notice, for conduct that we believe:\n\n• Violates these Terms of Service\n• Is harmful to other users, experts, or the platform\n• Creates legal liability for us\n\nUpon termination, your right to use the app ceases immediately. Provisions that by their nature should survive termination shall remain in effect.`,
  },
  {
    id      : '8',
    icon    : 'globe',
    iconLib : 'feather',
    title   : 'Governing Law',
    content : `These Terms of Service shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.\n\n• Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra\n• You waive any objection to venue or jurisdiction in such courts\n• If any provision of these terms is found invalid, the remaining provisions remain in full force\n• These terms constitute the entire agreement between you and our platform`,
  },
  {
    id      : '9',
    icon    : 'mail',
    iconLib : 'feather',
    title   : 'Contact Us',
    content : `If you have any questions or concerns regarding these Terms of Service, please reach out to us:\n\n• Email: communityadvisory7@gmail.com\n• Response time: Within 72 hours of receiving your request`,
  },
];

// ─── Expandable Section Card ──────────────────────────────────────────────────
const TermsCard = React.memo(({ section, animStyle, isExpanded, onToggle }) => {
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
export default function TermsOfService({ navigation }) {
  // Accordion — one open at a time
  const [openId, setOpenId] = useState(TERMS_SECTIONS[0].id);

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
    TERMS_SECTIONS.map(() => new Animated.Value(20)),
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
            <Text style={styles.heroScreenTitle}>Terms of Service</Text>
            <View style={styles.heroTopBarSpacer} />
          </View>

          <Animated.View
            style={[
              styles.heroContent,
              { opacity: fadeAnim, transform: [{ translateY: heroSlide }] },
            ]}
          >
            <View style={styles.shieldIconWrap}>
              <Icon name="file-text" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.heroSubtitle}>
              Please read these terms carefully before using our app. They govern your use of our services.
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
          <Icon name="alert-circle" size={15} color="#0D7B7A" style={{ marginTop: 1 }} />
          <Text style={styles.noticeText}>
            By using our app, you agree to these Terms of Service. If you disagree with any part, please discontinue use immediately.
          </Text>
        </Animated.View>

        {/* ── Terms Sections ── */}
        {TERMS_SECTIONS.map((section, idx) => (
          <TermsCard
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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