import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, Animated,
  Dimensions, Platform, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, query,
  where, onSnapshot, addDoc, getDocs,
  serverTimestamp, getDoc, doc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

// ── Constants ──────────────────────────────────────────────────────────────────
const FCM_SERVER_KEY = '6eb69b2f8a0677722e518e0b8bb1e7608839cb41'; // 🔴 Replace karo

// ── FCM Helper ─────────────────────────────────────────────────────────────────
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
};

// ── Avatar Palettes ────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', grad: ['#2563EB', '#1D4ED8'] },
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', grad: ['#7C3AED', '#6D28D9'] },
  { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', grad: ['#DB2777', '#BE185D'] },
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', grad: ['#059669', '#047857'] },
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', grad: ['#D97706', '#B45309'] },
  { bg: '#F0FDFA', text: '#0D7B7A', border: '#99F6E4', grad: ['#0D7B7A', '#0A4F4E'] },
];

const getPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

const ITEM_HEIGHT = 106;

// ── ChatFAB ────────────────────────────────────────────────────────────────────
const ChatFAB = React.memo(({ onPress, loading, visible }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 65, friction: 7, useNativeDriver: true,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress, bounceAnim]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });

  return (
    <Animated.View
      style={[
        styles.fabWrapper,
        { transform: [{ scale: Animated.multiply(scaleAnim, bounceAnim) }] },
      ]}
    >
      <Animated.View
        style={[styles.fabGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        pointerEvents="none"
      />
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading}
        activeOpacity={1}
        style={styles.fabBtn}
      >
        <LinearGradient
          colors={['#13A8A7', '#0D7B7A', '#095F5E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Icon name="message-circle" size={26} color="#FFFFFF" />
          }
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── ExpertCard ─────────────────────────────────────────────────────────────────
const ExpertCard = React.memo(({ item, onPress }) => {
  const palette = getPalette(item.name);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.80}>
      <View style={[styles.cardStripe, { backgroundColor: palette.text }]} />
      <View style={styles.avatarOuter}>
        <LinearGradient
          colors={palette.grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.avatarGrad}
        >
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </LinearGradient>
        <View style={styles.onlineRing}><View style={styles.onlineDot} /></View>
      </View>
      <View style={styles.infoWrap}>
        <View style={styles.nameRow}>
          <Text style={styles.expertName} numberOfLines={1}>{item.name}</Text>
          {item.isVerified && (
            <MatIcon name="check-decagram" size={15} color="#2563EB" style={{ marginLeft: 4 }} />
          )}
        </View>
        {item.subcategoryName ? (
          <View style={styles.specRow}>
            <Icon name="briefcase" size={11} color="#7C3AED" />
            <Text style={styles.expertSpec} numberOfLines={1}>{item.subcategoryName}</Text>
          </View>
        ) : null}
        {item.degree ? (
          <View style={styles.degreeRow}>
            <MatIcon name="school-outline" size={12} color="#64748B" />
            <Text style={styles.expertDegree} numberOfLines={1}>{item.degree}</Text>
          </View>
        ) : null}
        <View style={styles.tagRow}>
          {item.experience ? (
            <View style={styles.expTag}>
              <Icon name="award" size={10} color="#92400E" />
              <Text style={styles.expTagText}>{item.experience} yrs</Text>
            </View>
          ) : null}
          <View style={styles.availTag}>
            <View style={styles.availDot} />
            <Text style={styles.availTagText}>Available Now</Text>
          </View>
        </View>
      </View>
      <View style={styles.ctaWrap}>
        <View style={styles.ctaBtn}>
          <Icon name="message-circle" size={14} color="#0D7B7A" />
          <Text style={styles.ctaBtnText}>Chat</Text>
        </View>
        <Icon name="chevron-right" size={16} color="#CBD5E1" style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );
});

// ── SearchBar ──────────────────────────────────────────────────────────────────
const SearchBar = React.memo(({ value, onChange, onClear, focused, onFocus, onBlur }) => (
  <View style={styles.searchOuter}>
    <View style={[styles.searchWrap, focused && styles.searchFocused]}>
      <Icon
        name="search" size={16}
        color={focused ? '#0D7B7A' : '#94A3B8'}
        style={{ marginRight: 10 }}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, specialization, degree…"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={15} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  </View>
));

// ── ResultsBar ─────────────────────────────────────────────────────────────────
const ResultsBar = React.memo(({ count, search }) => {
  if (!search) return null;
  return (
    <View style={styles.resultsBar}>
      <Icon name="filter" size={12} color="#0D7B7A" />
      <Text style={styles.resultsText}>
        {count} result{count !== 1 ? 's' : ''} for "{search}"
      </Text>
    </View>
  );
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ExpertListScreen({ route, navigation }) {
  // subcategoryName is OPTIONAL — when SubCategoryListScreen navigates here it
  // is always passed; if some other flow still navigates here directly with
  // only categoryId/categoryName, this screen falls back to showing every
  // expert in the category (old behavior), so nothing breaks upstream.
  const { categoryId, categoryName, subcategoryName } = route.params;

  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  const userName = auth.currentUser?.displayName || 'User';

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [ChatEnabled, setChatEnabled] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const db = getFirestore();
    const docRef = doc(db, 'categories', categoryId);

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatEnabled(data.isChatIcon === true);
      }
    });
    return unsub;
  }, [categoryId]);

  // ── Experts list listener ──────────────────────────────────────────────────
  // Adds subcategoryName to the query when present, so this screen now shows
  // only experts belonging to the selected sub-category (coming from
  // SubCategoryListScreen). Falls back to category-wide listing if no
  // subcategoryName was passed, preserving old direct-navigation behavior.
  useEffect(() => {
    const db = getFirestore();
     const currentUid = getAuth().currentUser?.uid;
    const baseConstraints = [
      where('role', '==', 'expert'),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
    ];
    if (subcategoryName) {
      baseConstraints.push(where('subcategoryName', '==', subcategoryName));
    }
    const q = query(collection(db, 'users'), ...baseConstraints);

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => e.id !== currentUid); // ← apna aap remove karo
      // setExperts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setExperts(list);
      setLoading(false);
    }, (err) => {
      console.log('[ExpertList] experts query error:', err.code, err.message);
      setLoading(false);
    });
    return unsub;
  }, [categoryId, subcategoryName]);

  // ── FAB Press — Broadcast chat ─────────────────────────────────────────────
  const handleFABPress = useCallback(async () => {
    if (!uid) {
      Alert.alert('Error', 'Please login first.');
      return;
    }
    setChatLoading(true);

    try {
      const db = getFirestore();
      const expertIds = null;

      const existingSnap = await getDocs(
        query(
          collection(db, 'broadcastChats'),
          where('userId', '==', uid),
          where('categoryName', '==', categoryName),
        ),
      );

      let chatId;
      if (!existingSnap.empty) {
        chatId = existingSnap.docs[0].id;
      } else {
        const ref = await addDoc(collection(db, 'broadcastChats'), {
          userId: uid,
          userName,
          expertIds: null,
          categoryName: categoryName,
          subcategoryName: subcategoryName || null,
          lastMessage: '',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ChatEnabled: false,
        });
        chatId = ref.id;
      }

      navigation.navigate('MainChat', {
        chatId,
        expertName: categoryName,
        expertId: null,
        isBroadcast: true,
        subcategoryName: subcategoryName || null,
        categoryName: categoryName,
        expertIds,
      });

    } catch (e) {
      console.error('FAB broadcast error:', e);
      Alert.alert('Error', 'Could not start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  }, [uid, userName, navigation, categoryName, subcategoryName]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return experts;
    const s = search.toLowerCase();
    return experts.filter((e) =>
      e.name?.toLowerCase().includes(s) ||
      e.subcategoryName?.toLowerCase().includes(s) ||
      e.degree?.toLowerCase().includes(s),
    );
  }, [search, experts]);

  const handleSearch = useCallback((t) => setSearch(t), []);
  const handleClear = useCallback(() => setSearch(''), []);
  const handleFocus = useCallback(() => setSearchFocused(true), []);
  const handleBlur = useCallback(() => setSearchFocused(false), []);
  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item }) => (
    <ExpertCard
      item={item}
      onPress={() => navigation.navigate('ExpertDetail', { expert: item })}
    />
  ), [navigation]);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const listHeader = useMemo(() => (
    <>
      <SearchBar
        value={search} onChange={handleSearch} onClear={handleClear}
        focused={searchFocused} onFocus={handleFocus} onBlur={handleBlur}
      />
      <ResultsBar count={filtered.length} search={search} />
    </>
  ), [search, handleSearch, handleClear, searchFocused, handleFocus, handleBlur, filtered.length]);

  const listEmpty = useMemo(() => (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Icon name="user-x" size={34} color="#0D7B7A" />
      </View>
      <Text style={styles.emptyTitle}>No experts found</Text>
      <Text style={styles.emptySub}>
        {search ? 'Try a different search term' : 'No experts are available in this specialization yet'}
      </Text>
      {search ? (
        <TouchableOpacity style={styles.clearSearchBtn} onPress={handleClear}>
          <Icon name="x" size={13} color="#0D7B7A" />
          <Text style={styles.clearSearchText}>Clear search</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ), [search, handleClear]);

  // Header shows subcategory name (when present) as the primary title, with
  // the parent category as a smaller breadcrumb-style subtitle, so users
  // always know exactly which specialization they're looking at.
  const headerTitle = subcategoryName || categoryName;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <LinearGradient
        colors={['#0A4F4E', '#0D7B7A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.headerCenter,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          <View style={styles.headerSubRow}>
            <Icon name="users" size={11} color="rgba(255,255,255,0.72)" />
            <Text style={styles.headerSub} numberOfLines={1}>
              {loading
                ? '…'
                : subcategoryName
                  ? `${categoryName} • ${filtered.length} expert${filtered.length !== 1 ? 's' : ''}`
                  : `${filtered.length} expert${filtered.length !== 1 ? 's' : ''} available`}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.headerPlaceholder} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0D7B7A" />
          <Text style={styles.loadingText}>Finding experts…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={<View style={{ height: 120 }} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={40}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
      {
        <ChatFAB
          onPress={handleFABPress}
          loading={chatLoading}
          visible={true}
        />
      }

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  headerCenter: { flex: 1, alignItems: 'flex-start', marginTop: 4, marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  headerPlaceholder: { width: 38 },

  searchOuter: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E0F2F1',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  searchFocused: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFC' },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', padding: 0 },

  resultsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: '#F0FDFC',
    borderBottomWidth: 1, borderBottomColor: '#CCFBF1',
  },
  resultsText: { fontSize: 12, color: '#0D7B7A', fontWeight: '600' },

  listContent: { paddingTop: 12, paddingBottom: 0 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 20,
    marginHorizontal: 16, marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardStripe: { width: 4, alignSelf: 'stretch' },
  avatarOuter: { position: 'relative', marginLeft: 12, marginRight: 14, marginVertical: 14 },
  avatarGrad: { width: 52, height: 52, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 21, fontWeight: '900', color: '#FFFFFF' },
  onlineRing: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },

  infoWrap: { flex: 1, paddingVertical: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  expertName: { fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1 },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  expertSpec: { fontSize: 12, color: '#7C3AED', fontWeight: '600', flex: 1 },
  degreeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  expertDegree: { fontSize: 12, color: '#64748B', flex: 1 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  expTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  expTagText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  availTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  availTagText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  ctaWrap: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDFC', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#CCFBF1',
  },
  ctaBtnText: { fontSize: 11, fontWeight: '700', color: '#0D7B7A' },

  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  clearSearchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, backgroundColor: '#F0FDFC',
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1, borderColor: '#CCFBF1',
  },
  clearSearchText: { fontSize: 13, color: '#0D7B7A', fontWeight: '700' },

  fabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 87,
    right: 10,
    alignItems: 'center',
  },
  fabGlow: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#0D7B7A',
  },
  fabBtn: {
    width: 60, height: 60, borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#095F5E',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
  },
  fabGradient: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
});