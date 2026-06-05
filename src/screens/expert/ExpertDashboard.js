/**
 * ExpertDashboard.jsx
 * Production-ready Expert Dashboard screen.
 *
 * Architecture:
 *  - All Firestore listeners are stable (no re-creation on render)
 *  - Memoized helpers, callbacks, and sub-components
 *  - FlatList with full performance config for all lists
 *  - Proper error, loading, and empty states
 *  - react-native-vector-icons throughout
 *  - English-only text
 */

import React, {
  useEffect, useState, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Modal,
  Animated, Platform, Dimensions,
} from 'react-native';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'pending', label: 'Pending',  icon: 'time-outline',          iconLib: 'Ionicons' },
  { key: 'active',  label: 'Active',   icon: 'chatbubbles-outline',    iconLib: 'Ionicons' },
  { key: 'closed',  label: 'Closed',   icon: 'lock-closed-outline',    iconLib: 'Ionicons' },
];

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777',
  '#059669', '#D97706', '#DC2626', '#0891B2',
];

// ─── Pure helpers (defined outside component — stable references) ────────────

const getColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
};

const formatTime = (ts) => {
  if (!ts?.toDate) return '';
  const d    = ts.toDate();
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return 'Just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-IN');
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Skeleton shimmer placeholder for loading state */
const SkeletonBox = memo(({ width, height, style, borderRadius = 10 }) => {
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
      style={[
        { width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: anim },
        style,
      ]}
    />
  );
});

/** Expert profile info card at top — name intentionally omitted (already in header) */
const ProfileCard = memo(({ profile, onPress }) => (
  <View style={styles.profileCard}  activeOpacity={0.85}>
    {/* Left accent bar */}
    {/* <View style={styles.profileAccentBar} /> */}

    <View style={styles.profileInfo}>
      {/* Category as primary title */}
      <Text style={styles.profileCategory}>
        {profile?.categoryName || 'No Category'}
        {profile?.subcategoryName ? `  ${profile.subcategoryName}` : ''}
      </Text>

      <View style={styles.profileMetaRow}>
        <MaterialIcon name="school-outline" size={13} color="#7C3AED" />
        <Text style={styles.profileMeta}>{profile?.degree || 'No Degree Added'}</Text>
      </View>

      {profile?.experience ? (
        <View style={styles.profileMetaRow}>
          <MaterialIcon name="briefcase-outline" size={13} color="#7C3AED" />
          <Text style={styles.profileMeta}>{profile.experience} yrs experience</Text>
        </View>
      ) : null}
    </View>

    <View style={[
      styles.statusPill,
      { backgroundColor: profile?.isActive === false ? '#FEE2E2' : '#D1FAE5' },
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: profile?.isActive === false ? '#DC2626' : '#10B981' },
      ]} />
      <Text style={[
        styles.statusPillText,
        { color: profile?.isActive === false ? '#DC2626' : '#065F46' },
      ]}>
        {profile?.isActive === false ? 'Inactive' : 'Active'}
      </Text>
    </View>
  </View>
));

/** Single stat card */
const StatCard = memo(({ icon, iconColor, label, value, bg, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIconWrap, { backgroundColor: iconColor + '22' }]}>
      <MaterialIcon name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
));

/** Tab button */
const TabButton = memo(({ tab, isActive, count, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={() => onPress(tab.key)}
    activeOpacity={0.75}
  >
    <Icon
      name={tab.icon}
      size={15}
      color={isActive ? '#7C3AED' : '#94A3B8'}
    />
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
      {tab.label}
    </Text>
    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
      <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
));

/** Single chat row in FlatList */
const ChatCard = memo(({ item, onPress }) => {
  const isNew = !item.expertAccepted && item.isActive;

  return (
    <TouchableOpacity style={styles.chatCard} onPress={() => onPress(item)} activeOpacity={0.85}>
      {/* Avatar */}
      <View style={[styles.chatAvatar, { backgroundColor: getColor(item.userName) }]}>
        <Text style={styles.chatAvatarText}>{getInitials(item.userName)}</Text>
        <View style={[
          styles.chatStatusDot,
          { backgroundColor: item.isActive ? '#10B981' : '#CBD5E1' },
        ]} />
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatUser} numberOfLines={1}>{item.userName || 'User'}</Text>
          <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={styles.chatLast} numberOfLines={1}>
            {item.lastMessage || 'No message yet'}
          </Text>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        {item.category ? (
          <View style={styles.categoryPill}>
            <MaterialIcon name="tag-outline" size={10} color="#7C3AED" />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        ) : null}
      </View>

      <Icon name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
});

/** Chat detail bottom sheet modal */
const ChatDetailModal = memo(({ chat, onClose, onAccept, onOpen }) => {
  if (!chat) return null;

  const rows = [
    // { label: 'Category',     value: chat.category     || '—', icon: 'tag-outline' },
    { label: 'Last Message', value: chat.lastMessage  || '—', icon: 'chat-outline' },
    {
      label: 'Started',
      value: chat.createdAt?.toDate ? chat.createdAt.toDate().toLocaleDateString('en-IN') : '—',
      icon: 'calendar-outline',
    },
    { label: 'Last Active',  value: formatTime(chat.updatedAt), icon: 'clock-outline' },
  ];

  const statusLabel   = chat.expertAccepted ? 'Active' : chat.isActive ? 'Pending' : 'Closed';
  const statusColor   = chat.expertAccepted ? '#10B981' : chat.isActive ? '#F59E0B' : '#94A3B8';
  const statusBg      = chat.expertAccepted ? '#D1FAE5' : chat.isActive ? '#FEF3C7' : '#F1F5F9';

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.modalBox}>
        <View style={styles.modalHandle} />

        {/* User info */}
        <View style={styles.modalHeader}>
          <View style={[styles.modalAvatar, { backgroundColor: getColor(chat.userName) }]}>
            <Text style={styles.modalAvatarText}>{getInitials(chat.userName)}</Text>
          </View>
          <Text style={styles.modalUserName}>{chat.userName || 'User'}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusBg, marginTop: 6 }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.modalSection}>
          {rows.map(({ label, value, icon }, idx) => (
            <View key={label}>
              <View style={styles.modalRow}>
                <View style={styles.modalRowLeft}>
                  <MaterialIcon name={icon} size={15} color="#94A3B8" />
                  <Text style={styles.modalLabel}>{label}</Text>
                </View>
                <Text style={styles.modalValue} numberOfLines={2}>{value}</Text>
              </View>
              {idx < rows.length - 1 && <View style={styles.modalDivider} />}
            </View>
          ))}
        </View>

        {/* Actions */}
        {!chat.expertAccepted && chat.isActive && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionAccept]} onPress={() => onAccept(chat.id)}>
            <Icon name="checkmark-circle-outline" size={18} color="#065F46" />
            <Text style={[styles.actionBtnText, { color: '#065F46' }]}>Accept & Reply</Text>
          </TouchableOpacity>
        )}

        {chat.expertAccepted && chat.isActive && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionOpen]} onPress={() => onOpen(chat)}>
            <Icon name="chatbubble-outline" size={18} color="#2563EB" />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Open Chat</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, styles.actionClose]} onPress={onClose}>
          <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Dismiss</Text>
        </TouchableOpacity>

        <View style={{ height: Platform.OS === 'ios' ? 20 : 8 }} />
      </View>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ExpertDashboard({ navigation }) {
  const dispatch = useDispatch();

  const [profile,      setProfile]      = useState(null);
  const [chats,        setChats]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('pending');
  const [selectedChat, setSelectedChat] = useState(null);
  const [error,        setError]        = useState(null);

  // Stable db reference
  const db  = useMemo(() => getFirestore(), []);
  const uid = useMemo(() => auth().currentUser?.uid, []);

  // ── Load expert profile (real-time) ──────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => { if (snap.exists()) setProfile(snap.data()); },
      (err)  => { console.error('Profile error:', err); setError('Failed to load profile.'); },
    );
    return unsub;
  }, [db, uid]);

  // ── Load chats (real-time) ────────────────────────────────────────
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
        console.error('Chats error:', err);
        setError('Failed to load chats.');
        setLoading(false);
      },
    );
    return unsub;
  }, [db, uid]);

  // ── Derived data ──────────────────────────────────────────────────
  const pendingChats = useMemo(() => chats.filter((c) =>  c.isActive && !c.expertAccepted), [chats]);
  const activeChats  = useMemo(() => chats.filter((c) =>  c.isActive &&  c.expertAccepted), [chats]);
  const closedChats  = useMemo(() => chats.filter((c) => !c.isActive),                       [chats]);

  const tabData = useMemo(() => ({
    pending: pendingChats,
    active:  activeChats,
    closed:  closedChats,
  }), [pendingChats, activeChats, closedChats]);

  const tabCounts = useMemo(() => ({
    pending: pendingChats.length,
    active:  activeChats.length,
    closed:  closedChats.length,
  }), [pendingChats.length, activeChats.length, closedChats.length]);

  const STAT_CARDS = useMemo(() => [
    { icon: 'forum',             iconColor: '#2563EB', label: 'Total',   value: chats.length,        bg: '#EFF6FF' },
    { icon: 'clock-time-four',   iconColor: '#F59E0B', label: 'Pending', value: pendingChats.length, bg: '#FFFBEB' },
    { icon: 'message-flash',     iconColor: '#10B981', label: 'Active',  value: activeChats.length,  bg: '#F0FDF4' },
    { icon: 'lock',              iconColor: '#94A3B8', label: 'Closed',  value: closedChats.length,  bg: '#F8FAFC' },
  ], [chats.length, pendingChats.length, activeChats.length, closedChats.length]);

  // ── Callbacks ─────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await auth().signOut();
      dispatch(logout());
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [dispatch]);

  const handleTabPress    = useCallback((key) => setActiveTab(key), []);
  const handleChatPress   = useCallback((chat) => setSelectedChat(chat), []);
  const handleModalClose  = useCallback(() => setSelectedChat(null), []);

  const handleAcceptChat  = useCallback(async (chatId) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), { expertAccepted: true });
      setSelectedChat(null);
    } catch (e) {
      console.error('Accept error:', e);
    }
  }, [db]);

  const handleOpenChat = useCallback((chat) => {
    setSelectedChat(null);
    navigation?.navigate('Chats', {
      screen: 'ExpertReplyChat',
      params: { chatId: chat.id, userName: chat.userName },
    });
  }, [navigation]);

  const handleStatPress = useCallback((tabKey) => {
    setActiveTab(tabKey);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ── FlatList extractors & optimisation ───────────────────────────
  const keyExtractor        = useCallback((item) => item.id, []);
  const renderChatCard      = useCallback(({ item }) => (
    <ChatCard item={item} onPress={handleChatPress} />
  ), [handleChatPress]);
  const renderTabsHeader    = useCallback(() => (
    <View style={styles.tabRow}>
      {TABS.map((tab) => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          count={tabCounts[tab.key]}
          onPress={handleTabPress}
        />
      ))}
    </View>
  ), [activeTab, tabCounts, handleTabPress]);

  const ListHeaderComponent = useCallback(() => (
    <View>
      {/* Profile Card */}
      <ProfileCard
        profile={profile}
        onPress={() => navigation?.navigate('ExpertProfile')}
      />

      {/* Stats */}
      <Text style={styles.sectionLabel}>Overview</Text>
      {/* <View style={styles.statsRow}>
        {STAT_CARDS.map((s, i) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            iconColor={s.iconColor}
            label={s.label}
            value={s.value}
            bg={s.bg}
            onPress={() => handleStatPress(['pending', 'pending', 'active', 'closed'][i])}
          />
        ))}
      </View> */}

      {/* Section header + tabs */}
      <Text style={styles.sectionLabel}>My Chats</Text>
      {renderTabsHeader()}
    </View>
  ), [profile, STAT_CARDS, navigation, renderTabsHeader, handleStatPress]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.empty}>
      <MaterialIcon
        name={activeTab === 'pending' ? 'clock-outline' : activeTab === 'active' ? 'chat-outline' : 'lock-outline'}
        size={48}
        color="#CBD5E1"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'pending' ? 'No Pending Chats'
          : activeTab === 'active' ? 'No Active Chats'
          : 'No Closed Chats'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'pending'
          ? 'New chat requests will appear here'
          : activeTab === 'active'
          ? 'Accepted chats will appear here'
          : 'Completed chats will appear here'}
      </Text>
    </View>
  ), [activeTab]);

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
            <View style={{ gap: 6 }}>
              <SkeletonBox width={80} height={12} />
              <SkeletonBox width={120} height={16} />
            </View>
          </View>
          <SkeletonBox width={72} height={34} borderRadius={20} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBox width="100%" height={120} borderRadius={16} />
          <View style={styles.statsRow}>
            {[1,2,3,4].map((k) => <SkeletonBox key={k} width={(SCREEN_WIDTH - 56) / 4} height={90} borderRadius={14} />)}
          </View>
          {[1,2,3].map((k) => <SkeletonBox key={k} width="100%" height={80} borderRadius={14} />)}
        </View>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcon name="alert-circle-outline" size={52} color="#DC2626" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
      </View>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.headerAvatar, { backgroundColor: getColor(profile?.name) }]}
            onPress={() => navigation?.navigate('ExpertProfile')}
            activeOpacity={0.85}
          >
            <Text style={styles.headerAvatarText}>{getInitials(profile?.name)}</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerGreeting}>Welcome back 👋</Text>
            <Text style={styles.headerName}>{profile?.name || 'Expert'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main FlatList with header */}
      <FlatList
        data={tabData[activeTab]}
        keyExtractor={keyExtractor}
        renderItem={renderChatCard}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<View style={{ height: 40 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        // Performance props
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={styles.listContent}
      />

      {/* Chat Detail Modal */}
      <Modal
        visible={!!selectedChat}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleModalClose}
      >
        <ChatDetailModal
          chat={selectedChat}
          onClose={handleModalClose}
          onAccept={handleAcceptChat}
          onOpen={handleOpenChat}
        />
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: '#F8FAFC' },
  centered   : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listContent: { paddingBottom: 20 },

  // ── Header ──────────────────────────────────────────────────────
  header : {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar    : {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerGreeting  : { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  headerName      : { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 1 },
  logoutBtn       : {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText : { color: '#DC2626', fontWeight: '600', fontSize: 13 },

  // ── Profile Card ─────────────────────────────────────────────────
  profileCard : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8, marginTop: 12,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
    overflow: 'hidden',
  },
  profileAccentBar : {
    width: 4, height: '100%',
    // backgroundColor: '#7C3AED',
    borderRadius: 4,
    alignSelf: 'stretch',
  },
  profileInfo       : { flex: 1, gap: 8 },
  profileCategory   : { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  profileMetaRow    : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileMeta       : { fontSize: 12, color: '#64748B', fontWeight: '500', flex: 1 },
  statusPill        : {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot         : { width: 6, height: 6, borderRadius: 3 },
  statusPillText    : { fontSize: 11, fontWeight: '700' },

  // ── Section Label ─────────────────────────────────────────────────
  sectionLabel : {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginLeft: 20, marginTop: 24, marginBottom: 12,
  },

  // ── Stats ─────────────────────────────────────────────────────────
  statsRow    : {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard    : {
    flex: 1, borderRadius: 14, padding: 10,
    alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'transparent',
  },
  statIconWrap : {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  statValue   : { fontSize: 22, fontWeight: '800' },
  statLabel   : { fontSize: 10, color: '#64748B', fontWeight: '600', textAlign: 'center' },

  // ── Tabs ──────────────────────────────────────────────────────────
  tabRow : {
    flexDirection: 'row',
    marginHorizontal: 16, marginBottom: 10,
    gap: 8,
  },
  tab    : {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12, paddingVertical: 10, gap: 5,
    borderWidth: 1, borderColor: 'transparent',
  },
  tabActive       : { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' },
  tabText         : { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  tabTextActive   : { color: '#7C3AED' },
  tabBadge        : {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeActive  : { backgroundColor: '#DDD6FE' },
  tabBadgeText    : { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  tabBadgeTextActive: { color: '#7C3AED' },

  // ── Chat Card ─────────────────────────────────────────────────────
  chatCard     : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginBottom: 10,
    marginTop:10,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    gap: 12,
  },
  chatAvatar    : {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  chatAvatarText : { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  chatStatusDot  : {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  chatContent   : { flex: 1, gap: 3 },
  chatTopRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatBottomRow : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatUser      : { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  chatLast      : { fontSize: 12, color: '#64748B', flex: 1 },
  chatTime      : { fontSize: 11, color: '#94A3B8' },
  newBadge      : {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText  : { fontSize: 9, fontWeight: '800', color: '#D97706', letterSpacing: 0.5 },
  categoryPill  : {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  categoryText  : { fontSize: 10, color: '#7C3AED', fontWeight: '600' },

  // ── Empty ─────────────────────────────────────────────────────────
  empty        : {
    alignItems: 'center',
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 32,
  },
  emptyTitle   : {
    fontSize: 16, fontWeight: '700', color: '#64748B',
    marginTop: 16, marginBottom: 6,
  },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

  // ── Error ─────────────────────────────────────────────────────────
  errorTitle   : {
    fontSize: 18, fontWeight: '700', color: '#0F172A',
    marginTop: 16, marginBottom: 6,
  },
  errorSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  // ── Modal ─────────────────────────────────────────────────────────
  modalOverlay  : { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop : {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBox      : {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
    maxHeight: '88%',
  },
  modalHandle   : {
    width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader    : { alignItems: 'center', paddingBottom: 16 },
  modalAvatar    : {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  modalAvatarText : { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  modalUserName   : { fontSize: 20, fontWeight: '800', color: '#0F172A' },

  modalSection   : {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    padding: 16, marginVertical: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  modalRow       : {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  modalRowLeft   : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalLabel     : { fontSize: 13, color: '#64748B', fontWeight: '500' },
  modalValue     : {
    fontSize: 13, color: '#1E293B', fontWeight: '600',
    textAlign: 'right', maxWidth: '55%',
  },
  modalDivider   : { height: 1, backgroundColor: '#F1F5F9' },

  actionBtn     : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, padding: 15, marginBottom: 10,
  },
  actionAccept  : { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
  actionOpen    : { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  actionClose   : { backgroundColor: '#F1F5F9' },
  actionBtnText : { fontSize: 15, fontWeight: '700' },
});