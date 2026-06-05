
/**
 * ExpertChats.jsx
 * All hooks called unconditionally before any early return — Rules of Hooks compliant.
 */

import React, {
  useEffect, useState, useCallback, useMemo, memo, useRef,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, TextInput, Platform, Animated,
} from 'react-native';
import {
  getFirestore, collection, query,
  where, onSnapshot, orderBy,
} from '@react-native-firebase/firestore';
import auth                  from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon                  from 'react-native-vector-icons/Feather';
import MatIcon               from 'react-native-vector-icons/MaterialCommunityIcons';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary   : '#7C3AED',
  primaryBg : '#F5F3FF',
  primaryBdr: '#EDE9FE',
  surface   : '#FFFFFF',
  bg        : '#F8FAFC',
  border    : '#F1F5F9',
  textPrim  : '#0F172A',
  textSec   : '#64748B',
  textMuted : '#94A3B8',
  active    : '#10B981',
  inactive  : '#CBD5E1',
};

const CARD_HEIGHT = 82;
const CARD_MARGIN = 10;
const CARD_TOTAL  = CARD_HEIGHT + CARD_MARGIN;

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777',
  '#059669', '#D97706', '#DC2626', '#0891B2',
];

const TABS_CONFIG = [
  { key: 'all',     label: 'All'     },
  { key: 'pending', label: 'Pending' },
  { key: 'active',  label: 'Active'  },
  { key: 'closed',  label: 'Closed'  },
];

// ─── Pure helpers (module-level) ──────────────────────────────────────────────

const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getInitial = (name) =>
  name?.trim().charAt(0).toUpperCase() || '?';

const formatTime = (ts) => {
  if (!ts?.toDate) return '';
  const d    = ts.toDate();
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return 'Just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-IN');
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonBox = memo(({ width, height, borderRadius = 10, style }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: anim }, style]}
    />
  );
});

const ChatCardSkeleton = memo(() => (
  <View style={styles.card}>
    <SkeletonBox width={8}  height={8}  borderRadius={4} style={{ marginRight: 10 }} />
    <SkeletonBox width={46} height={46} borderRadius={23} style={{ marginRight: 12 }} />
    <View style={{ flex: 1, gap: 8 }}>
      <SkeletonBox width="55%" height={13} />
      <SkeletonBox width="80%" height={11} />
    </View>
    <SkeletonBox width={32} height={11} />
  </View>
));

// ─── Chat Card ────────────────────────────────────────────────────────────────

const ChatCard = memo(({ item, onPress }) => {
  const isPending = item.isActive && !item.expertAccepted;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <View style={[styles.statusDot, { backgroundColor: item.isActive ? COLORS.active : COLORS.inactive }]} />

      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.userName) }]}>
        <Text style={styles.avatarText}>{getInitial(item.userName)}</Text>
        {isPending && <View style={styles.pendingRing} />}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.userName} numberOfLines={1}>{item.userName || 'User'}</Text>
          <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
        </View>
        <View style={styles.cardBottomRow}>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardTagRow}>
          {item.category ? (
            <View style={styles.categoryTag}>
              <MatIcon name="tag-outline" size={9} color={COLORS.primary} />
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          ) : null}
          {isPending && (
            <View style={styles.pendingTag}>
              <Text style={styles.pendingTagText}>Pending</Text>
            </View>
          )}
        </View>
      </View>

      <Icon name="chevron-right" size={16} color={COLORS.inactive} />
    </TouchableOpacity>
  );
});

// ─── Tab Button ───────────────────────────────────────────────────────────────

const TabButton = memo(({ label, count, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
      <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
    </View>
  </TouchableOpacity>
));

// ─── Empty State Component (pure component — no hooks) ────────────────────────

const ListEmptyComponent = memo(({ search, tab }) => (
  <View style={styles.empty}>
    <MatIcon name="chat-remove-outline" size={52} color={COLORS.inactive} />
    <Text style={styles.emptyTitle}>
      {search.trim()
        ? 'No results found'
        : tab === 'pending' ? 'No Pending Chats'
        : tab === 'active'  ? 'No Active Chats'
        : tab === 'closed'  ? 'No Closed Chats'
        : 'No Chats Yet'}
    </Text>
    <Text style={styles.emptySub}>
      {search.trim()
        ? `No chats match "${search}"`
        : 'New conversations will appear here'}
    </Text>
  </View>
));

// ─── Loading Screen (pure component — no hooks) ───────────────────────────────

const LoadingScreen = memo(({ headerPadding }) => (
  <View style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
    <View style={[styles.header, { paddingTop: headerPadding + 16 }]}>
      <SkeletonBox width={120} height={22} borderRadius={8} />
      <SkeletonBox width={90}  height={13} borderRadius={6} style={{ marginTop: 6 }} />
    </View>
    <View style={styles.searchWrap}>
      <SkeletonBox width="100%" height={46} borderRadius={14} />
    </View>
    <View style={styles.tabRow}>
      {[1,2,3,4].map((k) => (
        <SkeletonBox key={k} width={72} height={36} borderRadius={12} />
      ))}
    </View>
    <View style={{ padding: 16, gap: 10 }}>
      {[1,2,3,4,5].map((k) => <ChatCardSkeleton key={k} />)}
    </View>
  </View>
));

// ─── Error Screen (pure component — no hooks) ─────────────────────────────────

const ErrorScreen = memo(({ message }) => (
  <View style={[styles.container, styles.centered]}>
    <MatIcon name="alert-circle-outline" size={52} color="#DC2626" />
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorSub}>{message}</Text>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExpertChats({ navigation }) {
  const insets = useSafeAreaInsets();

  // ── All hooks unconditionally at the top ─────────────────────────
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState('all');

  const db  = useMemo(() => getFirestore(), []);
  const uid = useMemo(() => auth().currentUser?.uid, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'chats'),
      where('expertId', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('ExpertChats error:', err);
        setError('Failed to load chats. Please try again.');
        setLoading(false);
      },
    );
    return unsub;
  }, [db, uid]);

  const counts = useMemo(() => ({
    all    : chats.length,
    pending: chats.filter((c) =>  c.isActive && !c.expertAccepted).length,
    active : chats.filter((c) =>  c.isActive &&  c.expertAccepted).length,
    closed : chats.filter((c) => !c.isActive).length,
  }), [chats]);

  const filtered = useMemo(() => {
    let list = chats;
    if (tab === 'pending') list = list.filter((c) =>  c.isActive && !c.expertAccepted);
    if (tab === 'active')  list = list.filter((c) =>  c.isActive &&  c.expertAccepted);
    if (tab === 'closed')  list = list.filter((c) => !c.isActive);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.userName?.toLowerCase().includes(s));
    }
    return list;
  }, [chats, tab, search]);

  const handleChatPress = useCallback((item) => {
    navigation.navigate('ExpertReplyChat', {
      chatId  : item.id,
      userName: item.userName || 'User',
    });
  }, [navigation]);

  const handleTabPress = useCallback((key) => setTab(key),    []);
  const handleSearch   = useCallback((t)   => setSearch(t),   []);
  const clearSearch    = useCallback(()    => setSearch(''),   []);

  const keyExtractor  = useCallback((item) => item.id, []);
  const renderItem    = useCallback(({ item }) => (
    <ChatCard item={item} onPress={handleChatPress} />
  ), [handleChatPress]);
  const getItemLayout = useCallback((_, index) => ({
    length: CARD_TOTAL, offset: CARD_TOTAL * index, index,
  }), []);

  const headerPadding = insets.top > 0 ? insets.top : 20;

  // ── Early returns AFTER all hooks ────────────────────────────────
  if (loading) return <LoadingScreen headerPadding={headerPadding} />;
  if (error)   return <ErrorScreen   message={error} />;

  // ── Main render ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      <View style={[styles.header, { paddingTop: headerPadding + 16 }]}>
        <View style={styles.headerLeft}>
          <MatIcon name="chat-processing-outline" size={22} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>My Chats</Text>
            <Text style={styles.headerSub}>{counts.all} conversations</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="x" size={15} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        {TABS_CONFIG.map((t) => (
          <TabButton
            key={t.key}
            label={t.label}
            count={counts[t.key]}
            isActive={tab === t.key}
            onPress={() => handleTabPress(t.key)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListEmptyComponent={<ListEmptyComponent search={search} tab={tab} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: COLORS.bg },
  centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },

  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios    : { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerLeft : { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrim },
  headerSub  : { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrim, padding: 0 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    gap: 6,
  },
  tab          : {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: 'transparent',
  },
  tabActive        : { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBdr },
  tabText          : { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive    : { color: COLORS.primary },
  tabBadge         : { backgroundColor: '#E2E8F0', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
  tabBadgeActive   : { backgroundColor: COLORS.primaryBdr },
  tabBadgeText     : { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  tabBadgeTextActive: { color: COLORS.primary },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 14,
    marginBottom: CARD_MARGIN,
    borderWidth: 1, borderColor: COLORS.border,
    ...Platform.select({
      ios    : { shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  statusDot  : { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  avatar     : {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  avatarText : { fontSize: 17, fontWeight: '800', color: COLORS.surface },
  pendingRing: {
    position: 'absolute', top: -2, left: -2,
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: '#F59E0B',
  },
  cardContent   : { flex: 1, gap: 3 },
  cardTopRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottomRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTagRow    : { flexDirection: 'row', gap: 6, marginTop: 2 },
  userName      : { fontSize: 14, fontWeight: '700', color: COLORS.textPrim, flex: 1, marginRight: 8 },
  time          : { fontSize: 11, color: COLORS.textMuted },
  lastMsg       : { fontSize: 12, color: COLORS.textSec, flex: 1 },
  unreadBadge   : {
    backgroundColor: COLORS.primary,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  unreadText    : { fontSize: 10, fontWeight: '800', color: COLORS.surface },
  categoryTag   : {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  categoryTagText: { fontSize: 9, color: COLORS.primary, fontWeight: '600' },
  pendingTag     : { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pendingTagText : { fontSize: 9, color: '#D97706', fontWeight: '700' },

  empty    : { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrim, marginTop: 16, marginBottom: 6 },
  emptySub : { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  errorTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrim, marginTop: 16, marginBottom: 6 },
  errorSub  : { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
