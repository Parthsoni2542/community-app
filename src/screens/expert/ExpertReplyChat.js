/**
 * ExpertReplyChat.jsx
 * Real-time chat screen for the Expert side.
 * Mirrors ChatScreen.jsx architecture exactly:
 *  - MessageItem extracted and memoised
 *  - All handlers wrapped in useCallback
 *  - FlatList with full performance props
 *  - Sticky-scroll (only auto-scrolls when near bottom)
 *  - isMounted guard on all async ops
 *  - Parallel Firestore writes via Promise.all
 *  - Animated upload progress bar
 *  - Image timestamp badge overlaid on image (consistent with ChatScreen)
 *  - Gradient header matching ChatScreen style
 *  - All Hindi text replaced with professional English
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, Alert, Image,
  Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import { uploadImage } from '../../utils/mediaUpload';

const { width } = Dimensions.get('window');

// ─── Palette (mirrors ChatScreen) ────────────────────────────────────────────
const AVATAR_PALETTES = [
  { grad: ['#2563EB', '#1D4ED8'] },
  { grad: ['#7C3AED', '#6D28D9'] },
  { grad: ['#DB2777', '#BE185D'] },
  { grad: ['#059669', '#047857'] },
  { grad: ['#D97706', '#B45309'] },
  { grad: ['#0D7B7A', '#0A4F4E'] },
];
const getPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// ─── Constants (mirrors ChatScreen) ──────────────────────────────────────────
const INPUT_MIN_HEIGHT = 2;
const INPUT_MAX_LINES = 5;
const INPUT_LINE_HEIGHT = 12;
const SCROLL_THRESHOLD = 120; // px from bottom → sticky scroll active

// ─── DateSeparator ────────────────────────────────────────────────────────────
const DateSeparator = React.memo(({ label }) => (
  <View style={styles.dateSeparator}>
    <View style={styles.dateLine} />
    <View style={styles.datePill}>
      <Text style={styles.datePillText}>{label}</Text>
    </View>
    <View style={styles.dateLine} />
  </View>
));

// ─── UserAvatar (shown next to user messages, mirrors ExpertAvatar) ───────────
const UserAvatar = React.memo(({ name, palette, invisible }) => (
  <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
    <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
      <Text style={styles.userAvatarText}>
        {name?.charAt(0)?.toUpperCase() || 'U'}
      </Text>
    </LinearGradient>
  </View>
));

// ─── TextBubble ───────────────────────────────────────────────────────────────
const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
  <View
    style={[
      styles.bubble,
      isMe ? styles.bubbleMe : styles.bubbleOther,
      isMe  && isConsecutive && { borderTopRightRadius: 6 },
      !isMe && isConsecutive && { borderTopLeftRadius: 6 },
    ]}
  >
    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
      {item.text}
    </Text>
    <View style={styles.msgMeta}>
      <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
        {time}
      </Text>
      {isMe && (
        <MatIcon
          name="check-all"
          size={13}
          color="rgba(221,214,254,0.9)"
          style={{ marginLeft: 3 }}
        />
      )}
    </View>
  </View>
));

// ─── ImageBubble ──────────────────────────────────────────────────────────────
const ImageBubble = React.memo(({ item, isMe, time }) => (
  <View style={[
    styles.imgBubble,
    isMe ? styles.imgBubbleMe : styles.imgBubbleOther,
  ]}>
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.msgImage}
      resizeMode="cover"
    />
    <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
      <Text style={styles.imgTimeText}>{time}</Text>
      {isMe && (
        <MatIcon
          name="check-all"
          size={11}
          color="rgba(255,255,255,0.9)"
          style={{ marginLeft: 2 }}
        />
      )}
    </View>
  </View>
));

// ─── MessageItem — memoised, mirrors ChatScreen's MessageItem ─────────────────
const MessageItem = React.memo(({
  item, index, messages, uid, userName, palette,
  formatTime, formatDate,
}) => {
  // Expert = "me" on this screen (senderRole === 'expert')
  const isMe = item.senderRole === 'expert';

  const showDate = index === 0 || (
    messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
    item.createdAt?.toDate?.()?.toDateString()
  );
  const isConsecutive =
    index > 0 &&
    messages[index - 1]?.senderRole === item.senderRole &&
    !showDate;

  const time = formatTime(item.createdAt);

  return (
    <>
      {showDate && item.createdAt && (
        <DateSeparator label={formatDate(item.createdAt)} />
      )}

      <View
        style={[
          styles.msgRow,
          isMe ? styles.msgRowMe : styles.msgRowOther,
          isConsecutive && { marginTop: 2 },
        ]}
      >
        {/* Show user avatar on the left for messages from user */}
        {!isMe && (
          <UserAvatar
            name={userName}
            palette={palette}
            invisible={isConsecutive}
          />
        )}

        {item.type === 'text' && (
          <TextBubble
            item={item}
            isMe={isMe}
            isConsecutive={isConsecutive}
            time={time}
          />
        )}

        {item.type === 'image' && (
          <ImageBubble item={item} isMe={isMe} time={time} />
        )}
      </View>
    </>
  );
});

// ─── UploadBar — animated, mirrors ChatScreen ─────────────────────────────────
const UploadBar = React.memo(({ anim }) => (
  <Animated.View
    style={[
      styles.uploadBar,
      {
        maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
        opacity: anim,
      },
    ]}
  >
    <ActivityIndicator size="small" color="#FFFFFF" />
    <Text style={styles.uploadText}>Uploading image…</Text>
  </Animated.View>
));

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = React.memo(({ userName }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.emptyIconGrad}>
        <Icon name="message-circle" size={36} color="#7C3AED" />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>No Messages Yet</Text>
    <Text style={styles.emptySubtitle}>
      When {userName} sends a message,{'\n'}it will appear here.
    </Text>
    <View style={styles.emptyTipRow}>
      <Icon name="shield" size={13} color="#7C3AED" />
      <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
    </View>
  </View>
));

// ─── ChatHeader ───────────────────────────────────────────────────────────────
const ChatHeader = React.memo(({ userName, palette, onBack }) => (
  <LinearGradient
    colors={['#0A4F4E', '#0D7B7A']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
      <Icon name="arrow-left" size={20} color="#FFFFFF" />
    </TouchableOpacity>

    <View style={styles.headerInfo}>
      {/* <LinearGradient colors={palette.grad} style={styles.headerAvatar}>
        <Text style={styles.headerAvatarText}>
          {userName?.charAt(0)?.toUpperCase() || 'U'}
        </Text>
      </LinearGradient> */}
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerName} numberOfLines={1}>{userName || 'User'}</Text>
        {/* <Text style={styles.headerRole}>Customer</Text> */}
      </View>
    </View>

    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
        <Icon name="phone" size={17} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
        <Icon name="more-vertical" size={17} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
    </View>
  </LinearGradient>
));

// ─── InputBar — mirrors ChatScreen's InputBar ─────────────────────────────────
const InputBar = React.memo(({
  text, setText, inputHeight, onContentSizeChange,
  onSend, onImagePick, sending,
}) => {
  const sendScale = useRef(new Animated.Value(1)).current;

  const handleSend = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onSend();
  }, [onSend, sendScale]);

  const canSend = !!text.trim() && !sending;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
          <Icon name="image" size={20} color="#7C3AED" />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              height: Math.max(
                INPUT_MIN_HEIGHT,
                Math.min(
                  inputHeight,
                  INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1),
                ),
              ),
            },
          ]}
          placeholder="Type your reply…"
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onContentSizeChange={onContentSizeChange}
        />

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExpertReplyChat({ route, navigation }) {
  const { chatId, userName } = route.params;

  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [loading, setLoading]               = useState(true);
  const [loadError, setLoadError]           = useState(false);
  const [sending, setSending]               = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [inputHeight, setInputHeight]       = useState(INPUT_MIN_HEIGHT);

  const flatRef      = useRef(null);
  const uploadAnim   = useRef(new Animated.Value(0)).current;
  const isNearBottom = useRef(true);
  const isMounted    = useRef(true);

  const uid     = getAuth().currentUser?.uid;
  const palette = useMemo(() => getPalette(userName), [userName]);

  // ── Unmount guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Upload bar animation ──────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(uploadAnim, {
      toValue: uploadingMedia ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [uploadingMedia, uploadAnim]);

  // ── Mark chat as read when expert opens it ────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    const db = getFirestore();
    updateDoc(doc(db, 'chats', chatId), { unreadCount: 0 }).catch(() => {});
  }, [chatId]);

  // ── Firestore real-time listener ──────────────────────────────────────────
  useEffect(() => {
    const db = getFirestore();
    const q  = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted.current) return;
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        if (isNearBottom.current) {
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      },
      () => {
        if (!isMounted.current) return;
        setLoading(false);
        setLoadError(true);
      },
    );
    return unsub;
  }, [chatId]);

  // ── Save message — parallel Firestore writes ──────────────────────────────
  const saveMessage = useCallback(async (msgData) => {
    const db = getFirestore();
    const msgPayload = {
      ...msgData,
      senderId  : uid,
      senderRole: 'expert',
      createdAt : serverTimestamp(),
    };
    const lastMsg =
      msgData.type === 'text'  ? msgData.text  :
      msgData.type === 'image' ? '📷 Image'    : '';

    await Promise.all([
      addDoc(collection(db, 'chats', chatId, 'messages'), msgPayload),
      updateDoc(doc(db, 'chats', chatId), {
        lastMessage: lastMsg,
        updatedAt  : serverTimestamp(),
        unreadCount: 1,
      }),
    ]);
  }, [chatId, uid]);

  // ── Text message ──────────────────────────────────────────────────────────
  const sendTextMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setInputHeight(INPUT_MIN_HEIGHT);
    setSending(true);
    try {
      await saveMessage({ type: 'text', text: trimmed });
    } catch (e) {
      console.error('sendTextMessage:', e);
      Alert.alert('Send Failed', 'Your message could not be sent. Please try again.');
    } finally {
      if (isMounted.current) setSending(false);
    }
  }, [text, sending, saveMessage]);

  // ── Image pick ────────────────────────────────────────────────────────────
  const handlePickerResponse = useCallback(async (image) => {
    if (!image?.path) return;
    setUploadingMedia(true);
    try {
      const imageUrl = await uploadImage(image.path, chatId);
      if (!isMounted.current) return;
      await saveMessage({ type: 'image', imageUrl });
    } catch {
      if (!isMounted.current) return;
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
    } finally {
      if (isMounted.current) setUploadingMedia(false);
    }
  }, [chatId, saveMessage]);

  const handleImagePick = useCallback(() => {
    Alert.alert('Select Image', 'Choose a source', [
      {
        text   : 'Camera',
        onPress: () =>
          ImagePicker.openCamera({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
            .then(handlePickerResponse)
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      {
        text   : 'Gallery',
        onPress: () =>
          ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
            .then(handlePickerResponse)
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handlePickerResponse]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = useCallback((ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((ts) => {
    if (!ts?.toDate) return '';
    const d         = ts.toDate();
    const now       = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString())       return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  // ── Sticky-scroll tracking ────────────────────────────────────────────────
  const handleScroll = useCallback(({ nativeEvent }) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    const distFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
  }, []);

  // ── Input height ──────────────────────────────────────────────────────────
  const handleContentSizeChange = useCallback((e) => {
    setInputHeight(e.nativeEvent.contentSize.height + 20);
  }, []);

  // ── FlatList render item (stable reference) ───────────────────────────────
  const renderItem = useCallback(({ item, index }) => (
    <MessageItem
      item={item}
      index={index}
      messages={messages}
      uid={uid}
      userName={userName}
      palette={palette}
      formatTime={formatTime}
      formatDate={formatDate}
    />
  ), [messages, uid, userName, palette, formatTime, formatDate]);

  const keyExtractor = useCallback((item) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <EmptyState userName={userName} />
  ), [userName]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color="#94A3B8" />
        <Text style={styles.errorTitle}>Unable to Load Chat</Text>
        <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoadError(false); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4C1D95" translucent />

      <ChatHeader
        userName={userName}
        palette={palette}
        onBack={() => navigation.goBack()}
      />

      <UploadBar anim={uploadAnim} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0D7B7A" />
          <Text style={styles.loadingText}>Loading conversation…</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (isNearBottom.current) {
              flatRef.current?.scrollToEnd({ animated: true });
            }
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        />
      )}

      <InputBar
        text={text}
        setText={setText}
        inputHeight={inputHeight}
        onContentSizeChange={handleContentSizeChange}
        onSend={sendTextMessage}
        onImagePick={handleImagePick}
        sending={sending}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#F5F3FF' },
  centered     : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText  : { fontSize: 14, color: '#64748B', fontWeight: '500' },

  // Error state
  errorTitle   : { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
  retryBtn     : {
    marginTop: 20, backgroundColor: '#7C3AED',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryBtnText : { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // ── Header ──
  header: {
    flexDirection   : 'row',
    alignItems      : 'center',
    paddingTop      : 52,
    paddingBottom   : 14,
    paddingHorizontal: 12,
    gap             : 10,
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
  },
  headerInfo: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 10, marginTop: 4,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText : { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  headerTextWrap   : { flex: 1 },
  headerName       : { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
  headerRole       : { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  headerActions    : { flexDirection: 'row', gap: 4, marginTop: 4 },
  headerActionBtn  : {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Upload bar ──
  uploadBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden',
  },
  uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // ── Messages ──
  listContent: { padding: 16, paddingBottom: 8 },

  dateSeparator: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16, gap: 10,
  },
  dateLine   : { flex: 1, height: 1, backgroundColor: '#DDD6FE' },
  datePill   : {
    backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#C4B5FD',
  },
  datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

  msgRow      : { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe    : { justifyContent: 'flex-end' },
  msgRowOther : { justifyContent: 'flex-start' },

  userAvatar    : { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
  userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  bubble: {
    maxWidth: width * 0.72, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#0D7B7A',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#EDE9FE',
    shadowColor: '#0D7B7A',
    shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  msgText     : { fontSize: 15, lineHeight: 22 },
  msgTextMe   : { color: '#FFFFFF' },
  msgTextOther: { color: '#1E293B' },
  msgMeta     : {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', marginTop: 4,
  },
  msgTime     : { fontSize: 10, fontWeight: '500' },
  msgTimeMe   : { color: 'rgba(255,255,255,0.65)' },
  msgTimeOther: { color: '#94A3B8' },

  imgBubble     : { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imgBubbleMe   : { borderBottomRightRadius: 4 },
  imgBubbleOther: { borderBottomLeftRadius: 4 },
  msgImage      : { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
  imgTimeBadge  : {
    position: 'absolute', bottom: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

  // ── Empty state ──
  emptyState  : { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconGrad: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle   : { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14, color: '#64748B', textAlign: 'center',
    lineHeight: 21, marginBottom: 16,
  },
  emptyTipRow  : {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE9FE', paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 20,
  },
  emptyTipText : { fontSize: 12, color: '#7C3AED', fontWeight: '700' },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    gap: 8, borderTopWidth: 1, borderTopColor: '#EDE9FE',
    shadowColor: '#7C3AED', shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  attachBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  input: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15, color: '#1E293B',
    borderWidth: 1, borderColor: '#E2E8F0',
    lineHeight: INPUT_LINE_HEIGHT,
  },
  sendBtn: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED', shadowOpacity: 0.35,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sendBtnInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
});