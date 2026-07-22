import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Animated,
  Dimensions, Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, onSnapshot, query, orderBy,
  getDoc, doc, getDocs, limit,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const CARD_COLORS = [
  { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A' },
  { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB' },
  { bg: '#FFF7ED', border: '#FDC08A', icon: '#EA580C' },
  { bg: '#FDF4FF', border: '#E09FFF', icon: '#9333EA' },
  { bg: '#FFF1F2', border: '#FDA4AF', icon: '#E11D48' },
  { bg: '#F0FDFA', border: '#5EEAD4', icon: '#0D9488' },
  { bg: '#FEFCE8', border: '#FDE047', icon: '#CA8A04' },
  { bg: '#F0F9FF', border: '#7DD3FC', icon: '#0284C7' },
];

// ── Header component (memoized — never re-renders unless props change) ────────
const ListHeader = React.memo(({ greeting, firstName, search, onSearch, onClear, searchFocused, onFocus, onBlur, count, fadeAnim, slideAnim,navigation }) => (
  <>
    {/* Gradient header */}
    <LinearGradient
      colors={['#0A4F4E', '#0D7B7A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Animated.View style={[styles.headerTop, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.greetingName}>{firstName} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={()=>{navigation.navigate('NotificationScreen')}}>
            <Icon name="bell" size={20} color="rgba(255,255,255,0.85)" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View
        style={[
          styles.searchWrap,
          { opacity: fadeAnim },
          searchFocused && styles.searchFocused,
        ]}
      >
        <Icon
          name="search"
          size={17}
          color={searchFocused ? '#0D7B7A' : '#94A3B8'}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, lawyers, CAs…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={onSearch}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </LinearGradient>

    {/* Hero Banner */}
    <Animated.View style={[styles.bannerWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={['#0D7B7A', '#14B8A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerBadge}>
            <Icon name="zap" size={11} color="#FFFFFF" />
            <Text style={styles.bannerBadgeText}>Quick Connect</Text>
          </View>
          <Text style={styles.bannerTitle}>Expert Help,{'\n'}Anytime.</Text>
          <Text style={styles.bannerSub}>
            Connect with verified professionals{'\n'}in minutes — not days.
          </Text>
          <View style={styles.bannerMetaRow}>
            <View style={styles.bannerMetaPill}>
              <Icon name="shield" size={10} color="#0D7B7A" />
              <Text style={styles.bannerMetaText}>Verified</Text>
            </View>
            <View style={styles.bannerMetaPill}>
              <Icon name="star" size={10} color="#0D7B7A" />
              <Text style={styles.bannerMetaText}>4.9 Rated</Text>
            </View>
            <View style={styles.bannerMetaPill}>
              <Icon name="clock" size={10} color="#0D7B7A" />
              <Text style={styles.bannerMetaText}>~5 min reply</Text>
            </View>
          </View>
        </View>
        <View style={styles.bannerRight}>
          <View style={styles.bannerIconCircle}>
            <MatIcon name="medical-bag" size={46} color="rgba(255,255,255,0.95)" />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>

    {/* Section label */}
    <View style={styles.sectionRow}>
      <View>
        <Text style={styles.sectionTitle}>Browse Services</Text>
        <Text style={styles.sectionSub}>{count} services available</Text>
      </View>
      {search.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Icon name="x" size={13} color="#0D7B7A" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  </>
));

// ── Category row (memoized — key optimization for FlatList) ──────────────────
const CategoryRow = React.memo(({ item, index, onPress }) => {
  const palette = CARD_COLORS[index % CARD_COLORS.length];
  return (
    <TouchableOpacity
      style={[styles.catRow, { backgroundColor: palette.bg, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View
        style={[
          styles.catIconWrap,
          { backgroundColor: palette.border + '55' },
        ]}
      >

        {item.icon ? (
          <Image
            source={{ uri: item.icon }}
            style={styles.catImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.catEmoji}>
            {'📁'}
          </Text>
        )}
      </View>
      <View style={styles.catTextWrap}>
        <Text style={styles.catName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.catDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <View style={[styles.catArrow, { backgroundColor: palette.border }]}>
        <Icon name="chevron-right" size={15} color={palette.icon} />
      </View>
    </TouchableOpacity>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Smart-routing flag map ───────────────────────────────────────────────
  // Key: categoryId, Value: true (has subcategories) | false (no subcategories)
  // | undefined (not checked yet, e.g. still loading). Populated right after
  // categories load, so by the time a user actually taps a row the answer is
  // already known and there's no navigation delay.
  const [hasSubcatMap, setHasSubcatMap] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 62, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'categories'), orderBy('subcategoryCount', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(getFirestore(), 'users', uid)).then((d) => {
      if (d.exists()) setUserName(d.data().name || '');
    });
  }, [uid]);

  // ── Pre-check subcategory existence for every loaded category ──────────────
  // Runs once per new category id (skips ones already checked). Uses
  // limit(1) on the subcollection so each check is a single cheap read,
  // not a full subcollection fetch. Non-blocking: list renders immediately
  // with loading=false above, this just fills in routing info as it resolves.
  useEffect(() => {
    if (!categories.length) return;
    const db = getFirestore();

    categories.forEach((cat) => {
      // Skip if we've already determined this category's flag.
      if (hasSubcatMap[cat.id] !== undefined) return;

      const subColRef = collection(db, 'categories', cat.id, 'subcategories');
      getDocs(query(subColRef, limit(1)))
        .then((snap) => {
          setHasSubcatMap((prev) => ({ ...prev, [cat.id]: !snap.empty }));
        })
        .catch((err) => {
          console.log('[HomeScreen] subcategory check failed for', cat.id, err.code, err.message);
          // On error, default to false so we fail safe to the older
          // direct-to-ExpertList behavior rather than getting stuck.
          setHasSubcatMap((prev) => ({ ...prev, [cat.id]: false }));
        });
    });
  }, [categories, hasSubcatMap]);

  // ── Derived values (memoized) ──────────────────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const firstName = useMemo(
    () => (userName ? userName.split(' ')[0] : 'there'),
    [userName],
  );

  const filtered = useMemo(
    () => search.trim()
      ? categories.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()),
      )
      : categories,
    [categories, search],
  );

  // ── Callbacks (stable references — no re-render churn) ────────────────────
  const handleSearch = useCallback((t) => setSearch(t), []);
  const handleClear = useCallback(() => setSearch(''), []);
  const handleFocus = useCallback(() => setSearchFocused(true), []);
  const handleBlur = useCallback(() => setSearchFocused(false), []);

  const keyExtractor = useCallback((item) => item.id, []);

  // ── Smart navigation ────────────────────────────────────────────────────────
  // If hasSubcatMap[item.id] is true -> SubCategoryList (existing flow).
  // If it's explicitly false -> go straight to ExpertList (old flow, all
  // experts in the category, no subcategory filter).
  // If it's still undefined (check hasn't resolved yet, e.g. a very fast
  // tap right after load) -> fall back to ExpertList too, since that's the
  // safe default that always shows *something* rather than blocking the tap.
  const handleCategoryPress = useCallback((item) => {
    const hasSub = hasSubcatMap[item.id];
    if (hasSub) {
      navigation.navigate('SubCategoryList', {
        categoryId: item.id,
        categoryName: item.name,
        categoryIcon: item.icon,
      });
    } else {
      navigation.navigate('ExpertList', {
        categoryId: item.id,
        categoryName: item.name,
      });
    }
  }, [navigation, hasSubcatMap]);

  const renderItem = useCallback(({ item, index }) => (
    <CategoryRow
      item={item}
      index={index}
      onPress={() => handleCategoryPress(item)}
    />
  ), [handleCategoryPress]);

  const getItemLayout = useCallback((_, index) => ({
    length: 88,     // estimated row height (icon 52 + padding 14*2 + gap ~8)
    offset: 88 * index,
    index,
  }), []);

  const listHeader = useMemo(() => (
    <ListHeader
      greeting={greeting}
      firstName={firstName}
      search={search}
      onSearch={handleSearch}
      onClear={handleClear}
      searchFocused={searchFocused}
      onFocus={handleFocus}
      onBlur={handleBlur}
      count={filtered.length}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      navigation={navigation}
      
    />
  ), [greeting, firstName, search, handleSearch, handleClear, searchFocused,
    handleFocus, handleBlur, filtered.length, fadeAnim, slideAnim]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0D7B7A" />
          <Text style={styles.loadingText}>Loading categories…</Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="search" size={32} color="#0D7B7A" />
        </View>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySub}>Try a different search term</Text>
      </View>
    );
  }, [loading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={<View style={{ height: 100 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // ── Performance knobs ──────────────────────────────────────────────
        getItemLayout={getItemLayout}         // skips layout measurement on scroll
        removeClippedSubviews={Platform.OS === 'android'} // unmount off-screen views on Android
        initialNumToRender={10}               // render 10 rows on first paint
        maxToRenderPerBatch={8}               // render 8 rows per JS batch
        windowSize={7}                        // keep 7 screen-heights in memory
        updateCellsBatchingPeriod={40}        // batch updates every 40ms
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  listContent: { paddingBottom: 0 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  catImage: {
    width: '100%',
    height: '100%',
    borderRadius:10,
    // borderWidth:1
  },

  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginBottom: 2 },
  greetingName: { fontSize: 22, color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F87171', borderWidth: 1.5, borderColor: '#0D7B7A',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchFocused: { borderColor: '#14B8A6' },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', padding: 0 },

  // ── Banner ────────────────────────────────────────────────────────────────
  bannerWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  banner: {
    borderRadius: 22, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#0D7B7A', shadowOpacity: 0.28,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bannerLeft: { flex: 1, paddingRight: 10 },
  bannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
  },
  bannerBadgeText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  bannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', lineHeight: 28, marginBottom: 7 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 18, marginBottom: 12 },
  bannerMetaRow: { flexDirection: 'row', gap: 6 },
  bannerMetaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  bannerMetaText: { fontSize: 10, fontWeight: '700', color: '#0D7B7A' },
  bannerRight: { alignItems: 'center', justifyContent: 'center' },
  bannerIconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  clearBtnText: { fontSize: 12, color: '#0D7B7A', fontWeight: '700' },

  // ── Category rows ─────────────────────────────────────────────────────────
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1.5,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  catEmoji: { fontSize: 26 },
  catTextWrap: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
  catDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  catArrow: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  // ── Loading / Empty ───────────────────────────────────────────────────────
  loadingWrap: { alignItems: 'center', paddingTop: 56, gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 56 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});