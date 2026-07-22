import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, where, getDocs,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const BROADCAST_CATEGORY_NAME = 'MEDICAL ADVISORY COMMITTEE';
const BROADCAST_SUBCATEGORY_NAME = 'GENERAL PRACTIONER ALLOPATHY';
const FCM_SERVER_KEY = '6eb69b2f8a0677722e518e0b8bb1e7608839cb41';


const AVATAR_PALETTES = [
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', grad: ['#2563EB', '#1D4ED8'] },
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', grad: ['#7C3AED', '#6D28D9'] },
  { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', grad: ['#DB2777', '#BE185D'] },
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', grad: ['#059669', '#047857'] },
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', grad: ['#D97706', '#B45309'] },
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', grad: ['#E11D48', '#BE123C'] },
];
const getPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

const INFO_ROWS = [
  { id: 'categoryName', icon: 'grid', matIcon: null, label: 'Category' },
  { id: 'subcategoryName', icon: 'briefcase', matIcon: null, label: 'Specialization' },
  { id: 'degree', icon: null, matIcon: 'school-outline', label: 'Degree' },
  { id: 'certDetails', icon: null, matIcon: 'certificate', label: 'Certifications' },
  { id: 'experience', icon: 'award', matIcon: null, label: 'Experience', suffix: ' years' },
  { id: 'address', icon: 'map-pin', matIcon: null, label: 'Address' },
  // { id: 'mobile', icon: 'phone', matIcon: null, label: 'Mobile' },
];

const sendFCMToToken = async (token, title, body, data = {}) => {
  try {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body, sound: 'default' },
        data,
        priority: 'high',
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      }),
    });
  } catch (e) {
    console.warn('FCM failed for token:', token, e.message);
  }
}

export default function ExpertDetailScreen({ route, navigation }) {
  const { expert } = route.params;
  const [loading, setLoading] = useState(false);
  console.log(expert);

  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  const userName = auth.currentUser?.displayName || 'User';
  const palette = getPalette(expert.name);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // const startChat = async () => {

  const startChat = useCallback(async () => {
    if (!uid) {
      Alert.alert('Error', 'Please login first.');
      return;
    }
    setLoading(true);

    try {
      const db = getFirestore();

      // Step 1: categoryName + subcategoryName se experts dhundo
      // const expertsSnap = await getDocs(
      //   query(
      //     collection(db, 'users'),
      //     where('role', '==', 'expert'),
      //     where('categoryName', '==', BROADCAST_CATEGORY_NAME),
      //     where('subcategoryName', '==', BROADCAST_SUBCATEGORY_NAME),
      //     where('isActive', '==', true),
      //   ),
      // );

      // if (expertsSnap.empty) {
      //   Alert.alert('Unavailable', 'No Dermatology experts found.');
      //   return;
      // }

      // const matchedExperts = expertsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const expertIds = null;

      // Step 2: Existing broadcast room dhundo ya naya banao
      const existingSnap = await getDocs(
        query(
          collection(db, 'broadcastChats'),
          where('userId', '==', uid),
          where('categoryName', '==', expert?.categoryName),
        ),
      );

      let chatId;
      if (!existingSnap.empty) {
        // Reuse existing room
        chatId = existingSnap.docs[0].id;
      } else {
        // Naya broadcast room banao
        const ref = await addDoc(collection(db, 'broadcastChats'), {
          userId: uid,
          userName,
          expertIds:null,
          categoryName: expert?.categoryName,
          subcategoryName: null,
          lastMessage: '',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ChatEnabled:false
        });
        chatId = ref.id;
      }

      // // Step 3: Saare experts ko Firestore notification + FCM bhejo
      // await Promise.allSettled(
      //   matchedExperts.map(async (expert) => {
      //     // 3a. Firestore notification
      //     await addDoc(collection(db, 'notifications'), {
      //       recipientId: expert.id,
      //       recipientRole: 'expert',
      //       senderId: uid,
      //       senderName: userName,
      //       type: 'broadcast_chat_request',
      //       chatId,
      //       categoryName: BROADCAST_CATEGORY_NAME,
      //       subcategoryName: BROADCAST_SUBCATEGORY_NAME,
      //       message: `${userName} needs help with ${BROADCAST_SUBCATEGORY_NAME}`,
      //       isRead: false,
      //       createdAt: serverTimestamp(),
      //     });

      //     // 3b. FCM push notification
      //     try {
      //       const tokenSnap = await getDoc(doc(db, 'expertTokens', expert.id));
      //       if (tokenSnap.exists()) {
      //         const { fcmToken } = tokenSnap.data();
      //         if (fcmToken) {
      //           await sendFCMToToken(
      //             fcmToken,
      //             `New Request — ${BROADCAST_SUBCATEGORY_NAME}`,
      //             `${userName} needs assistance. Tap to respond.`,
      //             {
      //               type: 'broadcast_chat_request',
      //               chatId,
      //               subcategoryName: BROADCAST_SUBCATEGORY_NAME,
      //               screen: 'BroadcastChat',
      //             },
      //           );
      //         }
      //       }
      //     } catch (fcmErr) {
      //       console.warn('FCM token fetch failed:', expert.id, fcmErr.message);
      //     }
      //   }),
      // );

      // Step 4: Chat screen navigate karo
      navigation.navigate('MainChat', {
        chatId,
        expertName: expert?.categoryName,
        expertId: null,
        isBroadcast: true,
        subcategoryName: null,
        categoryName: expert?.categoryName,
        expertIds,
      });

    } catch (e) {
      console.error('FAB broadcast error:', e);
      Alert.alert('Error', 'Could not start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [uid, userName, navigation]);
  // setLoading(true);
  // try {
  //   const db = getFirestore();
  //   const existing = await getDocs(
  //     query(
  //       collection(db, 'chats'),
  //       where('userId',   '==', uid),
  //       where('expertId', '==', expert.id),
  //     ),
  //   );
  //   let chatId;
  //   if (!existing.empty) {
  //     chatId = existing.docs[0].id;
  //   } else {
  //     const ref = await addDoc(collection(db, 'chats'), {
  //       userId      : uid,
  //       userName    : userName,
  //       expertId    : expert.id,
  //       expertName  : expert.name,
  //       categoryId  : expert.categoryId,
  //       categoryName: expert.categoryName,
  //       lastMessage : '',
  //       isActive    : true,
  //       createdAt   : serverTimestamp(),
  //       updatedAt   : serverTimestamp(),
  //     });
  //     chatId = ref.id;
  //   }
  //   navigation.navigate('Chat', {
  //     chatId    : chatId,
  //     expertName: expert.name,
  //     expertId  : expert.id,
  //   });
  // } catch (e) {
  //   Alert.alert('Error', e.message);
  // } finally {
  //   setLoading(false);
  // }
  // };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#0A4F4E', '#0D7B7A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{expert.name}</Text>
        <TouchableOpacity style={styles.shareBtn}>
          {/* <Icon name="share-2" size={18} color="#FFFFFF" /> */}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

        {/* ── Profile Card ── */}
        <Animated.View style={[styles.profileCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

          {/* Avatar */}
          <View style={styles.avatarShadowWrap}>
            <LinearGradient
              colors={palette.grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.avatarGrad}
            >
              <Text style={styles.avatarText}>
                {expert.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
            {/* Online ring */}
            <View style={styles.onlineRing}>
              <View style={styles.onlineDot} />
            </View>
          </View>

          {/* Name + badges */}
          <View style={styles.nameWrap}>
            <Text style={styles.expertName}>{expert.name}</Text>
            {expert.isVerified && (
              <MatIcon name="check-decagram" size={18} color="#2563EB" style={{ marginLeft: 6 }} />
            )}
          </View>

          <Text style={styles.expertSpec}>
            {expert.subcategoryName || expert.categoryName || 'Expert'}
          </Text>

          {expert.degree ? (
            <View style={styles.degreeRow}>
              <MatIcon name="school-outline" size={13} color="#7C3AED" />
              <Text style={styles.expertDegree}>{expert.degree}</Text>
            </View>
          ) : null}

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Available Now</Text>
            </View>
            {expert.isVerified && (
              <View style={[styles.badge, styles.badgeBlue]}>
                <Icon name="shield" size={10} color="#2563EB" />
                <Text style={[styles.badgeText, { color: '#2563EB' }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {/* <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="award" size={18} color="#0D7B7A" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{expert.experience || '—'}</Text>
              <Text style={styles.statLabel}>Yrs Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="star" size={18} color="#D97706" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="message-circle" size={18} color="#7C3AED" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>200+</Text>
              <Text style={styles.statLabel}>Consults</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="clock" size={18} color="#059669" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>~5m</Text>
              <Text style={styles.statLabel}>Reply</Text>
            </View>
          </View> */}
        </Animated.View>

        {/* ── About ── */}
        {expert.about ? (
          <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Icon name="user" size={14} color="#0D7B7A" />
              </View>
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.aboutText}>{expert.about}</Text>
          </Animated.View>
        ) : null}

        {/* ── Details ── */}
        <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Icon name="info" size={14} color="#0D7B7A" />
            </View>
            <Text style={styles.sectionTitle}>Expert Details</Text>
          </View>

          {INFO_ROWS.map((row, idx) => {
            const val = expert[row.id];
            if (!val) return null;
            const displayVal = row.suffix ? `${val}${row.suffix}` : val;
            const isLast = INFO_ROWS.filter((r) => expert[r.id]).pop()?.id === row.id;
            return (
              <View key={row.id}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    {row.matIcon
                      ? <MatIcon name={row.matIcon} size={16} color="#0D7B7A" />
                      : <Icon name={row.icon} size={16} color="#0D7B7A" />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{displayVal}</Text>
                  </View>
                </View>
                {!isLast && <View style={styles.divider} />}
              </View>
            );
          })}
        </Animated.View>

        {/* ── Why Consult ── */}
        <Animated.View style={[styles.sectionCard, styles.whyCard, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Icon name="zap" size={14} color="#0D7B7A" />
            </View>
            <Text style={styles.sectionTitle}>Why Consult</Text>
          </View>
          {[
            { icon: 'shield', text: 'Verified & trusted professional' },
            { icon: 'clock', text: 'Responds within minutes' },
            { icon: 'lock', text: 'Private & confidential sessions' },
            { icon: 'thumbs-up', text: '100% satisfaction guarantee' },
          ].map((p) => (
            <View key={p.text} style={styles.whyRow}>
              <View style={styles.whyIconWrap}>
                <Icon name={p.icon} size={14} color="#0D7B7A" />
              </View>
              <Text style={styles.whyText}>{p.text}</Text>
            </View>
          ))}
        </Animated.View>

      </ScrollView>

      {/* ── Chat CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.chatBtn, loading && { opacity: 0.75 }]}
          onPress={startChat}
          disabled={loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#0D7B7A', '#0A5F5E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.chatBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                {/* <Icon name="message-circle" size={20} color="#FFFFFF" /> */}
                <Text style={styles.chatBtnText}>Start Consultation</Text>
                <View style={styles.chatBtnArrow}>
                  <Icon name="arrow-right" size={16} color="#0D7B7A" />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginTop: 10, },
  shareBtn: {
    width: 38, height: 38, borderRadius: 12,
    // backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 24, paddingVertical: 28, paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  avatarShadowWrap: { position: 'relative', marginBottom: 16 },
  avatarGrad: {
    width: 88, height: 88, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  onlineRing: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981' },

  nameWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  expertName: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  expertSpec: { fontSize: 14, color: '#0D7B7A', fontWeight: '700', marginBottom: 6 },
  degreeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  expertDegree: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeBlue: { backgroundColor: '#EFF6FF' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },

  // Section
  sectionCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  aboutText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Detail rows
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  detailIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginTop: 3 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 46 },

  // Why card
  whyCard: { marginBottom: 8 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  whyIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center',
  },
  whyText: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },

  // CTA bar
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  chatBtn: { borderRadius: 16, overflow: 'hidden' },
  chatBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10, gap: 10,
  },
  chatBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  chatBtnArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
});