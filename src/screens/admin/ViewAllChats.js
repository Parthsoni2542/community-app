import React, {
  useEffect, useState, useCallback, useMemo, memo, useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from '@react-native-firebase/firestore';

// ── Design tokens — unified with ManageCategories / ManageUsers ───────────────

const COLORS = {
  primary      : '#0D7B7A',
  primaryLight : '#F0FDFA',
  primaryBorder: '#E0F2F1',
  inactive     : '#94A3B8',
  surface      : '#FFFFFF',
  background   : '#F4FAFA',
  textPrimary  : '#0F172A',
  textSub      : '#64748B',
  danger       : '#DC2626',
  dangerBg     : '#FEE2E2',
  success      : '#065F46',
  successBg    : '#D1FAE5',
  shadow       : '#0D7B7A',
  amber        : '#92400E',
  amberBg      : '#FEF3C7',
};

// Fixed card height → enables getItemLayout
const CARD_HEIGHT = 94;
const CARD_MARGIN = 10;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

const TAB_KEYS = ['all', 'active', 'closed'];

// ── Module-level pure helpers ─────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#0D7B7A', '#7C3AED', '#DB2777',
  '#059669', '#D97706', '#DC2626', '#0891B2',
];

const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
};

const formatRelativeTime = (ts) => {
  try {
    if (!ts?.toDate) return '';
    const diff = Date.now() - ts.toDate().getTime();
    if (diff < 60_000)    return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return ts.toDate().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short',
    });
  } catch (_) { return ''; }
};

const formatMsgTime = (ts) => {
  try {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch (_) { return ''; }
};

const formatFullDate = (ts) => {
  try {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch (_) { return '—'; }
};

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonLines}>
      <View style={styles.skeletonLineA} />
      <View style={styles.skeletonLineB} />
      <View style={styles.skeletonLineC} />
    </View>
  </View>
));

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FilterTabs = memo(({ activeTab, counts, onSelect }) => (
  <View style={styles.tabRow}>
    {TAB_KEYS.map((key, index) => {
      const active = activeTab === key;
      const label  = key.charAt(0).toUpperCase() + key.slice(1);
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.tab,
            active && styles.tabActive,
            index < TAB_KEYS.length - 1 && { marginRight: 8 },
          ]}
          onPress={() => onSelect(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, active && styles.tabTextActive]}>
            {label}
          </Text>
          <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
              {counts[key]}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
));

// ── Stats bar ─────────────────────────────────────────────────────────────────

const StatsBar = memo(({ counts }) => (
  <View style={styles.statsBar}>
    <View style={styles.statItem}>
      <Text style={styles.statNum}>{counts.active}</Text>
      <Text style={styles.statLbl}>Active</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statNum}>{counts.closed}</Text>
      <Text style={styles.statLbl}>Closed</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statNum}>{counts.all}</Text>
      <Text style={styles.statLbl}>Total</Text>
    </View>
  </View>
));

// ── Chat list card ────────────────────────────────────────────────────────────

const ChatCard = memo(({ item, onPress }) => {
  const isActive = !!item.isActive;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Active/closed indicator stripe */}
      <View style={[
        styles.statusStripe,
        { backgroundColor: isActive ? COLORS.primary : COLORS.inactive },
      ]} />

      {/* Chat icon */}
      <View style={[
        styles.chatIconWrap,
        { backgroundColor: isActive ? COLORS.primaryLight : COLORS.background },
      ]}>
        <Icon
          name="message-circle"
          size={22}
          color={isActive ? COLORS.primary : COLORS.inactive}
        />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Top row: names + time */}
        <View style={styles.cardTopRow}>
          <View style={styles.participantRow}>
            <Icon name="user" size={11} color={COLORS.textSub} />
            <Text style={styles.participantName} numberOfLines={1}>
              {item.userName || 'User'}
            </Text>
            <Icon
              name="arrow-right"
              size={11}
              color={COLORS.inactive}
              style={{ marginHorizontal: 4 }}
            />
            <Icon name="briefcase" size={11} color={COLORS.textSub} />
            <Text style={styles.participantName} numberOfLines={1}>
              {item.expertName || 'Expert'}
            </Text>
          </View>
          <Text style={styles.chatTime}>
            {formatRelativeTime(item.updatedAt)}
          </Text>
        </View>

        {/* Last message */}
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          {!!item.categoryName && (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{item.categoryName}</Text>
            </View>
          )}
          <View style={[
            styles.statusTag,
            { backgroundColor: isActive ? COLORS.successBg : COLORS.background },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isActive ? COLORS.success : COLORS.inactive },
            ]} />
            <Text style={[
              styles.statusTagText,
              { color: isActive ? COLORS.success : COLORS.textSub },
            ]}>
              {isActive ? 'Active' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      <Icon name="chevron-right" size={16} color={COLORS.primaryBorder} />
    </TouchableOpacity>
  );
});

// ── Message bubble ────────────────────────────────────────────────────────────

const MessageBubble = memo(({ msg, expertName }) => {
  const isUser = msg.senderRole === 'user';

  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowExpert]}>
      {/* Expert label */}
      {!isUser && (
        <View style={styles.senderRow}>
          <Icon name="briefcase" size={10} color={COLORS.inactive} />
          <Text style={styles.senderLabel}>{expertName ?? 'Expert'}</Text>
        </View>
      )}

      {/* Text message */}
      {(msg.type === 'text' || !msg.type) && (
        <View style={[
          styles.msgBubble,
          isUser ? styles.msgBubbleUser : styles.msgBubbleExpert,
        ]}>
          <Text style={[
            styles.msgText,
            isUser ? styles.msgTextUser : styles.msgTextExpert,
          ]}>
            {msg.text}
          </Text>
          <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>
            {formatMsgTime(msg.createdAt)}
          </Text>
        </View>
      )}

      {/* Image message */}
      {msg.type === 'image' && (
        <View style={[
          styles.imgBubble,
          isUser ? styles.msgBubbleUser : styles.msgBubbleExpert,
        ]}>
          <Image
            source={{ uri: msg.imageUrl }}
            style={styles.msgImage}
            resizeMode="cover"
          />
          <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>
            {formatMsgTime(msg.createdAt)}
          </Text>
        </View>
      )}
    </View>
  );
});

// ── Chat detail modal ─────────────────────────────────────────────────────────

const ChatDetailModal = memo(({
  chat,
  messages,
  msgLoading,
  onClose,
  onToggleStatus,
}) => {
  if (!chat) return null;
  const isActive = !!chat.isActive;

  const keyExtractor = useCallback((item) => item.id, []);

  const renderBubble = useCallback(({ item }) => (
    <MessageBubble msg={item} expertName={chat.expertName} />
  ), [chat.expertName]);

  return (
    <View style={styles.modalBox}>
      {/* Handle */}
      <View style={styles.modalHandle} />

      {/* Header */}
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderLeft}>
          {/* User avatar */}
          <View style={[
            styles.modalAvatar,
            { backgroundColor: getAvatarColor(chat.userName) },
          ]}>
            <Text style={styles.modalAvatarText}>
              {getInitials(chat.userName)}
            </Text>
          </View>

          <View style={styles.modalHeaderInfo}>
            <View style={styles.modalParticipantRow}>
              <Text style={styles.modalParticipantName} numberOfLines={1}>
                {chat.userName ?? 'User'}
              </Text>
              <Icon
                name="arrow-right"
                size={12}
                color={COLORS.inactive}
                style={{ marginHorizontal: 6 }}
              />
              <Text style={styles.modalParticipantName} numberOfLines={1}>
                {chat.expertName ?? 'Expert'}
              </Text>
            </View>

            <View style={styles.modalMetaRow}>
              {!!chat.categoryName && (
                <View style={styles.catTag}>
                  <Text style={styles.catTagText}>{chat.categoryName}</Text>
                </View>
              )}
              <View style={[
                styles.statusTag,
                { backgroundColor: isActive ? COLORS.successBg : COLORS.background },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? COLORS.success : COLORS.inactive },
                ]} />
                <Text style={[
                  styles.statusTagText,
                  { color: isActive ? COLORS.success : COLORS.textSub },
                ]}>
                  {isActive ? 'Active' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="x" size={20} color={COLORS.inactive} />
        </TouchableOpacity>
      </View>

      {/* Chat meta info strip */}
      <View style={styles.metaStrip}>
        <View style={styles.metaStripItem}>
          <Icon name="calendar" size={12} color={COLORS.primary} />
          <Text style={styles.metaStripText}>
            Started {formatFullDate(chat.createdAt)}
          </Text>
        </View>
        <View style={styles.metaStripDivider} />
        <View style={styles.metaStripItem}>
          <Icon name="clock" size={12} color={COLORS.primary} />
          <Text style={styles.metaStripText}>
            Updated {formatRelativeTime(chat.updatedAt)}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.msgContainer}>
        {msgLoading ? (
          <View style={styles.msgLoading}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.msgLoadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.noMsg}>
            <Icon name="message-circle" size={36} color={COLORS.primaryBorder} />
            <Text style={styles.noMsgText}>No messages in this conversation</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderBubble}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={8}
            removeClippedSubviews={true}
          />
        )}
      </View>

      {/* Toggle status button */}
      <TouchableOpacity
        style={[
          styles.toggleBtn,
          { backgroundColor: isActive ? COLORS.amberBg : COLORS.successBg },
        ]}
        onPress={() => onToggleStatus(chat.id, isActive)}
        activeOpacity={0.8}
      >
        <Icon
          name={isActive ? 'lock' : 'unlock'}
          size={16}
          color={isActive ? COLORS.amber : COLORS.success}
          style={{ marginRight: 8 }}
        />
        <Text style={[
          styles.toggleBtnText,
          { color: isActive ? COLORS.amber : COLORS.success },
        ]}>
          {isActive ? 'Close Conversation' : 'Reopen Conversation'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ViewAllChats() {
  const insets = useSafeAreaInsets();

  const [chats,      setChats]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterTab,  setFilterTab]  = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  // Track active message listener so we can unsubscribe cleanly
  const msgUnsubRef = useRef(null);

  // ── Chats listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const db  = getFirestore();
    const q   = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('Chats snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );
    return unsub;
  }, []);

  // ── Messages listener — subscribes when a chat is selected ───────────────
  useEffect(() => {
    // Unsubscribe previous listener first
    if (msgUnsubRef.current) {
      msgUnsubRef.current();
      msgUnsubRef.current = null;
    }

    if (!selected) {
      setMessages([]);
      return;
    }

    setMsgLoading(true);
    const db  = getFirestore();
    const q   = query(
      collection(db, 'chats', selected.id, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    msgUnsubRef.current = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMsgLoading(false);
      },
      (err) => {
        console.error('Messages snapshot error:', err);
        setMsgLoading(false);
      },
    );

    return () => {
      if (msgUnsubRef.current) {
        msgUnsubRef.current();
        msgUnsubRef.current = null;
      }
    };
  }, [selected?.id]); // only re-subscribe when the chat ID changes

  // ── Tab counts — single useMemo, consumed by both tabs and stats bar ──────
  const tabCounts = useMemo(() => ({
    all   : chats.length,
    active: chats.filter((c) =>  c.isActive).length,
    closed: chats.filter((c) => !c.isActive).length,
  }), [chats]);

  // ── Filtered list — replaces derived-state anti-pattern ──────────────────
  const filtered = useMemo(() => {
    let list = chats;

    if (filterTab === 'active') list = list.filter((c) =>  c.isActive);
    if (filterTab === 'closed') list = list.filter((c) => !c.isActive);

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.userName?.toLowerCase().includes(s)    ||
          c.expertName?.toLowerCase().includes(s)  ||
          c.lastMessage?.toLowerCase().includes(s) ||
          c.categoryName?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [chats, filterTab, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectChat    = useCallback((item) => setSelected(item), []);
  const handleCloseModal    = useCallback(() => setSelected(null), []);
  const handleTabSelect     = useCallback((key) => setFilterTab(key), []);
  const handleClearSearch   = useCallback(() => setSearch(''), []);

  const handleToggleStatus = useCallback(async (id, currentlyActive) => {
    try {
      await updateDoc(doc(getFirestore(), 'chats', id), {
        isActive: !currentlyActive,
      });
      // Keep modal state in sync
      setSelected((prev) =>
        prev?.id === id ? { ...prev, isActive: !currentlyActive } : prev,
      );
    } catch (err) {
      console.error('Toggle chat status error:', err);
    }
  }, []);

  // ── FlatList helpers ──────────────────────────────────────────────────────

  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <ChatCard item={item} onPress={() => handleSelectChat(item)} />
  ), [handleSelectChat]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyBox}>
      <Icon name="message-circle" size={52} color={COLORS.primaryBorder} />
      <Text style={styles.emptyTitle}>
        {search ? 'No Results Found' : 'No Conversations Yet'}
      </Text>
      <Text style={styles.emptySub}>
        {search
          ? 'Try adjusting your search or filter.'
          : 'Conversations between users and experts will appear here.'}
      </Text>
    </View>
  ), [search]);

  // ── Header padding ────────────────────────────────────────────────────────
  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <Text style={styles.headerTitle}>All Chats</Text>
          <Text style={styles.headerSub}>Loading...</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((k) => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color={COLORS.inactive} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorSub}>Check your connection and try again.</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <Text style={styles.headerTitle}>All Chats</Text>
        <Text style={styles.headerSub}>
          {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'} total
        </Text>
      </View>
      <View style={styles.headerDivider} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={COLORS.inactive} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by user, expert or message..."
          placeholderTextColor={COLORS.inactive}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={16} color={COLORS.inactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <FilterTabs
        activeTab={filterTab}
        counts={tabCounts}
        onSelect={handleTabSelect}
      />

      {/* Stats bar */}
      <StatsBar counts={tabCounts} />

      {/* Chat list */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Chat detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <ChatDetailModal
            chat={selected}
            messages={messages}
            msgLoading={msgLoading}
            onClose={handleCloseModal}
            onToggleStatus={handleToggleStatus}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems    : 'center',
    padding       : 32,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor  : COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom    : 16,
  },
  headerTitle: {
    fontSize  : 22,
    fontWeight: '800',
    color     : COLORS.textPrimary,
  },
  headerSub: {
    fontSize  : 12,
    color     : COLORS.inactive,
    marginTop : 2,
    fontWeight: '500',
  },
  headerDivider: {
    height         : 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    marginHorizontal : 16,
    marginTop        : 14,
    borderRadius     : 14,
    paddingHorizontal: 14,
    paddingVertical  : 11,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
  },
  searchInput: {
    flex    : 1,
    fontSize: 14,
    color   : COLORS.textPrimary,
  },

  // ── Filter tabs ───────────────────────────────────────────────────────────
  tabRow: {
    flexDirection  : 'row',
    marginHorizontal: 16,
    marginTop      : 12,
    marginBottom   : 4,
  },
  tab: {
    flex           : 1,
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: COLORS.surface,
    borderRadius   : 12,
    paddingVertical: 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor    : COLORS.primary,
  },
  tabText: {
    fontSize   : 13,
    fontWeight : '600',
    color      : COLORS.textSub,
    marginRight: 5,
  },
  tabTextActive: { color: COLORS.primary },
  tabBadge: {
    backgroundColor  : COLORS.background,
    paddingHorizontal: 7,
    paddingVertical  : 2,
    borderRadius     : 10,
  },
  tabBadgeActive   : { backgroundColor: COLORS.primary },
  tabBadgeText     : { fontSize: 11, fontWeight: '700', color: COLORS.textSub },
  tabBadgeTextActive: { color: COLORS.surface },

  // ── Stats bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection    : 'row',
    backgroundColor  : COLORS.surface,
    marginHorizontal : 16,
    marginTop        : 10,
    borderRadius     : 14,
    paddingVertical  : 14,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
  },
  statItem: {
    flex      : 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize  : 20,
    fontWeight: '800',
    color     : COLORS.textPrimary,
  },
  statLbl: {
    fontSize : 11,
    color    : COLORS.inactive,
    marginTop: 2,
  },
  statDivider: {
    width          : 1,
    backgroundColor: COLORS.primaryBorder,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop       : 14,
  },

  // ── Chat card ─────────────────────────────────────────────────────────────
  card: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    borderRadius     : 16,
    paddingVertical  : 13,
    paddingRight     : 14,
    marginBottom     : CARD_MARGIN,
    height           : CARD_HEIGHT,
    shadowColor      : COLORS.shadow,
    shadowOpacity    : 0.06,
    shadowRadius     : 8,
    shadowOffset     : { width: 0, height: 2 },
    elevation        : 2,
    overflow         : 'hidden',
  },
  statusStripe: {
    width : 4,
    height: '100%',
    marginRight: 12,
  },
  chatIconWrap: {
    width          : 44,
    height         : 44,
    borderRadius   : 13,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 12,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  cardContent: {
    flex          : 1,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    marginBottom  : 4,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    flex         : 1,
    marginRight  : 8,
  },
  participantName: {
    fontSize  : 12,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    marginLeft: 3,
    flexShrink: 1,
  },
  chatTime: {
    fontSize  : 11,
    color     : COLORS.inactive,
    flexShrink: 0,
  },
  lastMsg: {
    fontSize    : 12,
    color       : COLORS.textSub,
    marginBottom: 5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  catTag: {
    backgroundColor  : COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 8,
    marginRight      : 6,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
  },
  catTagText: {
    fontSize  : 10,
    fontWeight: '700',
    color     : COLORS.primary,
  },
  statusTag: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 8,
  },
  statusDot: {
    width       : 6,
    height      : 6,
    borderRadius: 3,
    marginRight : 4,
  },
  statusTagText: {
    fontSize  : 10,
    fontWeight: '700',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop       : 16,
  },
  skeletonCard: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    borderRadius     : 16,
    paddingVertical  : 13,
    paddingHorizontal: 16,
    marginBottom     : CARD_MARGIN,
    height           : CARD_HEIGHT,
  },
  skeletonIcon: {
    width          : 44,
    height         : 44,
    borderRadius   : 13,
    backgroundColor: '#D1F4F2',
    marginRight    : 12,
  },
  skeletonLines: { flex: 1 },
  skeletonLineA: {
    height         : 13,
    width          : '70%',
    backgroundColor: '#D1F4F2',
    borderRadius   : 6,
    marginBottom   : 8,
  },
  skeletonLineB: {
    height         : 11,
    width          : '50%',
    backgroundColor: '#E8F9F8',
    borderRadius   : 6,
    marginBottom   : 8,
  },
  skeletonLineC: {
    height         : 10,
    width          : '30%',
    backgroundColor: '#E8F9F8',
    borderRadius   : 6,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems       : 'center',
    paddingTop       : 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize  : 17,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    marginTop : 16,
  },
  emptySub: {
    fontSize : 13,
    color    : COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorTitle: {
    fontSize  : 17,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    marginTop : 14,
  },
  errorSub: {
    fontSize : 13,
    color    : COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent : 'flex-end',
  },
  modalBox: {
    backgroundColor     : COLORS.surface,
    borderTopLeftRadius : 28,
    borderTopRightRadius: 28,
    paddingHorizontal   : 20,
    paddingTop          : 12,
    height              : '88%',
  },
  modalHandle: {
    width          : 40,
    height         : 4,
    backgroundColor: COLORS.primaryBorder,
    borderRadius   : 2,
    alignSelf      : 'center',
    marginBottom   : 16,
  },

  // Modal header
  modalHeader: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    marginBottom  : 10,
  },
  modalHeaderLeft: {
    flex         : 1,
    flexDirection: 'row',
    alignItems   : 'center',
  },
  modalAvatar: {
    width          : 42,
    height         : 42,
    borderRadius   : 21,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 10,
  },
  modalAvatarText: {
    fontSize  : 16,
    fontWeight: '800',
    color     : COLORS.surface,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalParticipantRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    marginBottom : 5,
    flexWrap     : 'wrap',
  },
  modalParticipantName: {
    fontSize  : 14,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    flexShrink: 1,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  closeBtn: {
    width          : 34,
    height         : 34,
    borderRadius   : 10,
    backgroundColor: COLORS.background,
    alignItems     : 'center',
    justifyContent : 'center',
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
    marginLeft     : 10,
  },

  // Meta strip
  metaStrip: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.background,
    borderRadius     : 10,
    paddingVertical  : 8,
    paddingHorizontal: 12,
    marginBottom     : 10,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
  },
  metaStripItem: {
    flex         : 1,
    flexDirection: 'row',
    alignItems   : 'center',
    justifyContent: 'center',
  },
  metaStripText: {
    fontSize  : 11,
    color     : COLORS.textSub,
    marginLeft: 5,
  },
  metaStripDivider: {
    width          : 1,
    height         : 16,
    backgroundColor: COLORS.primaryBorder,
    marginHorizontal: 8,
  },

  // Message area
  msgContainer: {
    flex           : 1,
    backgroundColor: COLORS.background,
    borderRadius   : 16,
    marginBottom   : 10,
    overflow       : 'hidden',
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  msgLoading: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  msgLoadingText: {
    fontSize  : 13,
    color     : COLORS.inactive,
    marginTop : 8,
  },
  noMsg: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  noMsgText: {
    fontSize  : 13,
    color     : COLORS.inactive,
    marginTop : 10,
  },
  msgList: {
    padding: 12,
  },

  // Message bubbles
  msgRow: {
    marginBottom: 10,
  },
  msgRowUser  : { alignItems: 'flex-end' },
  msgRowExpert: { alignItems: 'flex-start' },
  senderRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    marginBottom : 4,
    marginLeft   : 2,
  },
  senderLabel: {
    fontSize  : 11,
    color     : COLORS.inactive,
    marginLeft: 4,
  },
  msgBubble: {
    maxWidth         : '78%',
    borderRadius     : 16,
    paddingHorizontal: 14,
    paddingVertical  : 10,
  },
  msgBubbleUser: {
    backgroundColor  : COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleExpert: {
    backgroundColor    : COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth        : 1,
    borderColor        : COLORS.primaryBorder,
  },
  msgText     : { fontSize: 14, lineHeight: 20 },
  msgTextUser : { color: COLORS.surface },
  msgTextExpert: { color: COLORS.textPrimary },
  msgTime     : {
    fontSize  : 10,
    color     : COLORS.inactive,
    marginTop : 4,
    textAlign : 'right',
  },
  msgTimeUser : { color: 'rgba(255,255,255,0.65)' },

  // Image bubble
  imgBubble: {
    maxWidth    : '78%',
    borderRadius: 16,
    padding     : 4,
    overflow    : 'hidden',
  },
  msgImage: {
    width       : 200,
    height      : 200,
    borderRadius: 12,
  },

  // Toggle button
  toggleBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'center',
    borderRadius     : 14,
    paddingVertical  : 15,
    marginBottom     : 8,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
  },
  toggleBtnText: {
    fontWeight: '700',
    fontSize  : 15,
  },
});