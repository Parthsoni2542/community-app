import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {
  getFirestore, onSnapshot,
  collection, query, where,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const ITEM_HEIGHT = 92;

// ── Avatar Palettes (same family used in ExpertListScreen) ────────────────────
const PALETTES = [
  { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', grad: ['#2563EB', '#1D4ED8'] },
  { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', grad: ['#7C3AED', '#6D28D9'] },
  { text: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', grad: ['#DB2777', '#BE185D'] },
  { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0', grad: ['#059669', '#047857'] },
  { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', grad: ['#D97706', '#B45309'] },
  { text: '#0D7B7A', bg: '#F0FDFA', border: '#99F6E4', grad: ['#0D7B7A', '#0A4F4E'] },
];
const getPalette = (name) =>
  PALETTES[(name?.charCodeAt(0) || 0) % PALETTES.length];

// ── SubCategory Row ─────────────────────────────────────────────────────────────
const SubCategoryRow = React.memo(({ item, onPress }) => {
  const palette = getPalette(item.name);
  const hasExperts = item.expertCount > 0;

  return (
    <TouchableOpacity
      style={[styles.card, !hasExperts && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!hasExperts}
    >
      <View style={[styles.cardStripe, { backgroundColor: palette.text }]} />

      <View style={styles.avatarOuter}>
        <LinearGradient
          colors={palette.grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.avatarGrad, !hasExperts && styles.avatarGradDisabled]}
        >
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.infoWrap}>
        <Text style={styles.subName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.countRow}>
          <Icon name="users" size={11} color={hasExperts ? '#0D7B7A' : '#94A3B8'} />
          <Text style={[styles.countText, !hasExperts && styles.countTextDisabled]}>
            {hasExperts
              ? `${item.expertCount} expert${item.expertCount !== 1 ? 's' : ''} available`
              : 'No experts available yet'}
          </Text>
        </View>
      </View>

      <Icon name="chevron-right" size={18} color={hasExperts ? '#CBD5E1' : '#E2E8F0'} />
    </TouchableOpacity>
  );
});

// ── Main Screen ─────────────────────────────────────────────────────────────────
export default function SubCategoryListScreen({ route, navigation }) {
  const { categoryId, categoryName, categoryIcon } = route.params;

  const [subcategories, setSubcategories] = useState([]); // raw from categories doc
  const [expertCounts, setExpertCounts] = useState({});   // { subcategoryName: count }
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingExperts, setLoadingExperts] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Load subcategories from the SUB-COLLECTION categories/{categoryId}/subcategories ──
  // (Confirmed from the Firestore console: subcategories live as separate
  // documents under the category doc, each with a 'name' field — NOT as an
  // array field on the category doc itself, which is what the previous
  // version incorrectly assumed.)
  useEffect(() => {
    const db = getFirestore();
    const subColRef = collection(db, 'categories', categoryId, 'subcategories');
    const unsub = onSnapshot(subColRef, (snap) => {
      const normalized = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          icon: data.icon || null,
        };
      });
      console.log('[SubCategoryList] subcategories loaded:', normalized.length, normalized.map(s => s.name));
      setSubcategories(normalized);
      setLoadingCategory(false);
    }, (err) => {
      console.log('[SubCategoryList] subcategories subcollection error:', err.code, err.message);
      setLoadingCategory(false);
    });
    return unsub;
  }, [categoryId]);

  // ── Live count of experts per subcategory ────────────────────────────────────
  // Single listener on all active experts in this category, grouped client-side.
  // Safer than per-subcategory queries since it avoids N listeners and works
  // regardless of Firestore SDK version (no getCountFromServer needed).
  // useEffect(() => {
  //   const db = getFirestore();
  //   const q = query(
  //     collection(db, 'users'),
  //     where('role', '==', 'expert'),
  //     where('categoryId', '==', categoryId),
  //     where('isActive', '==', true),
  //   );
  //   const unsub = onSnapshot(q, (snap) => {
  //     const counts = {};
  //     snap.docs.forEach((d) => {
  //       const sub = d.data().subcategoryName;
  //       if (!sub) return;
  //       counts[sub] = (counts[sub] || 0) + 1;
  //     });
  //     setExpertCounts(counts);
  //     setLoadingExperts(false);
  //   }, (err) => {
  //     console.log('[SubCategoryList] experts query error:', err.code, err.message);
  //     setLoadingExperts(false);
  //   });
  //   return unsub;
  // }, [categoryId]);

  // import add karo top mein
  // import { getAuth } from '@react-native-firebase/auth';

  // expertCounts useEffect replace karo
  useEffect(() => {
    const db = getFirestore();
    const currentUid = getAuth().currentUser?.uid;

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'expert'),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
    );

    const unsub = onSnapshot(q, (snap) => {
      const counts = {};
      snap.docs.forEach((d) => {
        if (d.id === currentUid) return; // ← apna aap skip karo

        const sub = d.data().subcategoryName;
        if (!sub) return;
        counts[sub] = (counts[sub] || 0) + 1;
      });
      setExpertCounts(counts);
      setLoadingExperts(false);
    }, (err) => {
      console.log('[SubCategoryList] experts query error:', err.code, err.message);
      setLoadingExperts(false);
    });

    return unsub;
  }, [categoryId]);

  const loading = loadingCategory || loadingExperts;

  // ── Merge subcategories with counts ──────────────────────────────────────────
  const listData = useMemo(() => {
    return subcategories.map((s) => ({
      ...s,
      expertCount: expertCounts[s.name] || 0,
    }));
  }, [subcategories, expertCounts]);

  const totalExperts = useMemo(
    () => listData.reduce((sum, s) => sum + s.expertCount, 0),
    [listData],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const handleSubcategoryPress = useCallback((item) => {
    navigation.navigate('ExpertList', {
      categoryId,
      categoryName,
      subcategoryName: item.name,
    });
  }, [navigation, categoryId, categoryName]);

  const renderItem = useCallback(({ item }) => (
    <SubCategoryRow item={item} onPress={() => handleSubcategoryPress(item)} />
  ), [handleSubcategoryPress]);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const listEmpty = useMemo(() => (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Icon name="grid" size={34} color="#0D7B7A" />
      </View>
      <Text style={styles.emptyTitle}>No sub-categories yet</Text>
      <Text style={styles.emptySub}>This service hasn't been configured with sub-categories.</Text>
    </View>
  ), []);

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
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
          <View style={styles.headerSubRow}>
            <Icon name="users" size={11} color="rgba(255,255,255,0.72)" />
            <Text style={styles.headerSub}>
              {loading ? '…' : `${totalExperts} expert${totalExperts !== 1 ? 's' : ''} across all specializations`}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.headerPlaceholder} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0D7B7A" />
          <Text style={styles.loadingText}>Loading specializations…</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          ListHeaderComponent={<View style={{ height: 12 }} />}
          ListFooterComponent={<View style={{ height: 80 }} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────────
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

  listContent: { paddingHorizontal: 16, paddingTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0F2F1',
    shadowColor: '#0D7B7A', shadowOpacity: 0.06,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    paddingVertical: 14, paddingRight: 14,
  },
  cardDisabled: { opacity: 0.55 },
  cardStripe: { width: 4, alignSelf: 'stretch', marginRight: 12 },

  avatarOuter: { marginRight: 14 },
  avatarGrad: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarGradDisabled: { opacity: 0.5 },
  avatarText: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },

  infoWrap: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 12, color: '#0D7B7A', fontWeight: '600' },
  countTextDisabled: { color: '#94A3B8' },

  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});