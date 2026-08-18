import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Keyboard, Platform,
  ActivityIndicator, StatusBar, Alert, Image,
  Animated, Dimensions, PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import AudioRecord from 'react-native-audio-record';
import { uploadImage, uploadVoice } from '../../utils/mediaUpload';
import Sound from 'react-native-sound';
Sound.setCategory('Playback');

const { width, height } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────
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

// Message status values
const MSG_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REROUTED: 'rerouted',
};

const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_LINES = 5;
const INPUT_LINE_HEIGHT = 22;
const SCROLL_THRESHOLD = 120;
const MAX_RECORD_SECS = 60;

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = React.memo(({ status }) => {
  if (!status || status === MSG_STATUS.APPROVED) return null;

  const configs = {
    [MSG_STATUS.REROUTED]: { icon: 'refresh-cw', color: 'rgba(167,243,208,0.95)', label: 'Rerouted' },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <View style={styles.statusBadge}>
      <Icon name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
});

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

// ─── ExpertAvatar ─────────────────────────────────────────────────────────────
const ExpertAvatar = React.memo(({ name, palette, invisible }) => (
  <View style={[styles.expertAvatar, invisible && { opacity: 0 }]}>
    <LinearGradient colors={palette.grad} style={styles.expertAvatarGrad}>
      <Text style={styles.expertAvatarText}>
        {name?.charAt(0)?.toUpperCase() || 'E'}
      </Text>
    </LinearGradient>
  </View>
));

// ─── PendingOverlay ───────────────────────────────────────────────────────────
const PendingOverlay = React.memo(({ status }) => {
  if (status !== MSG_STATUS.PENDING) return null;
  return <View style={styles.pendingOverlay} pointerEvents="none" />;
});

// ─── TextBubble ───────────────────────────────────────────────────────────────
const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => {
  const isPending = item.status === MSG_STATUS.PENDING;
  const isRejected = item.status === MSG_STATUS.REJECTED;

  return (
    <View style={styles.bubbleWrapper}>
      <View style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleOther,
        isMe && isConsecutive && { borderTopRightRadius: 6 },
        !isMe && isConsecutive && { borderTopLeftRadius: 6 },
        isPending && isMe && styles.bubblePending,
        isRejected && isMe && styles.bubbleRejected,
      ]}>
        {!isConsecutive && item.senderName && item.senderRole !== 'system' ? (
          <Text style={[styles.senderName, isMe && styles.senderNameMe]}>
            {item.senderRole === 'expert'
              ? `Replied by ${item.senderName}`
              : item.senderName}
          </Text>
        ) : null}

        <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
          {item.text}
        </Text>

        <View style={styles.msgMeta}>
          <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {time}
          </Text>
          {isMe && (
            <MatIcon name="check-all" size={13} color="rgba(191,219,254,0.9)" style={{ marginLeft: 3 }} />
          )}
        </View>
      </View>
    </View>
  );
});

// ─── ImageBubble ──────────────────────────────────────────────────────────────
// Tapping the image opens it full screen (works for both the user's own sent
// images and images received from an expert / admin).
const ImageBubble = React.memo(({ item, isMe, time, onPress }) => {
  const isPending = item.status === MSG_STATUS.PENDING;
  const isRejected = item.status === MSG_STATUS.REJECTED;

  const handlePress = useCallback(() => {
    if (item.imageUrl) onPress(item.imageUrl);
  }, [item.imageUrl, onPress]);

  return (
    <View style={styles.bubbleWrapper}>
      <View style={[
        styles.imgBubble,
        isMe ? styles.imgBubbleMe : styles.imgBubbleOther,
        isPending && isMe && { opacity: 0.65 },
        isRejected && isMe && { opacity: 0.45 },
      ]}>
        {item.senderName && item.senderRole !== 'system' ? (
          <View style={[styles.imgSenderBadge, isMe ? { right: 6 } : { left: 6 }]}>
            <Text style={styles.imgSenderText}>
              {item.senderRole === 'expert' ? `Replied by ${item.senderName}` : item.senderName}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
        </TouchableOpacity>

        <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
          {isMe && <StatusBadge status={item.status} />}
          <Text style={styles.imgTimeText}>{time}</Text>
          {isMe && (
            <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
          )}
        </View>
      </View>

      {isMe && isRejected && item.rejectReason ? (
        <Text style={[styles.rejectReason, { textAlign: 'right' }]}>⚠ {item.rejectReason}</Text>
      ) : null}
    </View>
  );
});

// ─── VoiceBubble ──────────────────────────────────────────────────────────────
const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
  const [playing, setPlaying] = useState(false);
  const isPending = item.status === MSG_STATUS.PENDING;
  const isRejected = item.status === MSG_STATUS.REJECTED;

  const handlePress = useCallback(() => {
    onPlay(item.voiceUrl, playing, setPlaying);
  }, [item.voiceUrl, playing, onPlay]);

  const durSecs = item.duration ?? 0;
  const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
  const bars = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

  return (
    <View style={styles.bubbleWrapper}>
      <View style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleOther,
        styles.voiceBubble,
        isPending && isMe && styles.bubblePending,
        isRejected && isMe && styles.bubbleRejected,
      ]}>
        {item.senderName && item.senderRole !== 'system' ? (
          <Text style={[styles.senderName, isMe && styles.senderNameMe, styles.voiceSenderName]}>
            {item.senderRole === 'expert'
              ? `Replied by ${item.senderName}`
              : item.senderName}
          </Text>
        ) : null}

        <View style={styles.voiceRow}>
          <TouchableOpacity
            onPress={handlePress}
            style={[styles.voicePlayBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#E0F2F1' }]}
            activeOpacity={0.75}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#0D7B7A'} />
          </TouchableOpacity>

          <View style={styles.waveform}>
            {bars.map((h, i) => (
              <View
                key={i}
                style={[styles.waveBar, { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#0D7B7A' }]}
              />
            ))}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.voiceDuration, isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#0D7B7A' }]}>
              {durLabel}
            </Text>
            <View style={styles.msgMeta}>
              <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                {time}
              </Text>
              {isMe && (
                <MatIcon name="check-all" size={11} color="rgba(191,219,254,0.9)" style={{ marginLeft: 2 }} />
              )}
            </View>
          </View>
        </View>
      </View>

      {isMe && isRejected && item.rejectReason ? (
        <Text style={[styles.rejectReason, { textAlign: 'right' }]}>⚠ {item.rejectReason}</Text>
      ) : null}
    </View>
  );
});

// ─── ReroutedBanner ───────────────────────────────────────────────────────────
const ReroutedBanner = React.memo(({ item }) => {
  if (item.status !== MSG_STATUS.REROUTED || !item.routedToName) return null;
  return (
    <View style={styles.reroutedBanner}>
      <Icon name="refresh-cw" size={11} color="#059669" />
      <Text style={styles.reroutedBannerText}>
        Forwarded to {item.routedToName}
      </Text>
    </View>
  );
});

// ─── MessageItem ──────────────────────────────────────────────────────────────
const MessageItem = React.memo(({
  item, index, messages, uid, expertName, palette,
  formatTime, formatDate, onPlayVoice, onImagePress,
}) => {
  const isMe = item.senderId === uid;
  const showDate = index === 0 || (
    messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
    item.createdAt?.toDate?.()?.toDateString()
  );
  const isConsecutive =
    index > 0 &&
    messages[index - 1]?.senderId === item.senderId &&
    !showDate;
  const time = formatTime(item.createdAt);

  return (
    <>
      {showDate && item.createdAt && (
        <DateSeparator label={formatDate(item.createdAt)} />
      )}
      <View style={[
        styles.msgRow,
        isMe ? styles.msgRowMe : styles.msgRowOther,
        isConsecutive && { marginTop: 2 },
      ]}>
        {!isMe && (
          <ExpertAvatar name={item.senderName} palette={palette} invisible={isConsecutive} />
        )}

        <View style={{ flexShrink: 1 }}>
          {item.type === 'text' && (
            <TextBubble item={item} isMe={isMe} isConsecutive={isConsecutive} time={time} />
          )}
          {item.type === 'image' && (
            <ImageBubble item={item} isMe={isMe} time={time} onPress={onImagePress} />
          )}
          {item.type === 'voice' && (
            <VoiceBubble item={item} isMe={isMe} time={time} onPlay={onPlayVoice} />
          )}
        </View>
      </View>
    </>
  );
});

// ─── UploadBar ────────────────────────────────────────────────────────────────
const UploadBar = React.memo(({ anim, label }) => (
  <Animated.View style={[
    styles.uploadBar,
    {
      maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
      opacity: anim,
    },
  ]}>
    <ActivityIndicator size="small" color="#FFFFFF" />
    <Text style={styles.uploadText}>{label}</Text>
  </Animated.View>
));

// ─── PendingInfoBar ───────────────────────────────────────────────────────────
const PendingInfoBar = React.memo(({ count }) => {
  if (!count) return null;
  return (
    <View style={styles.pendingInfoBar}>
      <Icon name="clock" size={13} color="#92400E" />
      <Text style={styles.pendingInfoText}>
        {count === 1
          ? '1 message pending admin approval'
          : `${count} messages pending admin approval`}
      </Text>
    </View>
  );
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = React.memo(({ expertName, isBroadcast }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
        <Icon name={isBroadcast ? 'users' : 'message-circle'} size={36} color="#0D7B7A" />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>
      {isBroadcast ? 'Start the Conversation' : 'Start the Conversation'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {isBroadcast
        ? 'Your query will first be reviewed by our team and then assigned to the appropriate expert for assistance.'
        : `Your query will be reviewed by our team before ${expertName || 'an expert'} responds.`
      }
    </Text>
    <View style={styles.emptyTipRow}>
      <Icon name="shield" size={13} color="#059669" />
      <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
    </View>
  </View>
));

// ─── ChatHeader ───────────────────────────────────────────────────────────────
const ChatHeader = React.memo(({ expertName, palette, onBack, isBroadcast }) => (
  <LinearGradient
    colors={['#0A4F4E', '#0D7B7A']}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
      <Icon name="arrow-left" size={20} color="#FFFFFF" />
    </TouchableOpacity>
    <View style={styles.headerInfo}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerName} numberOfLines={1}>Connect with Experts</Text>
      </View>
    </View>
    <View style={styles.headerActions} />
  </LinearGradient>
));

// ─── InputBar ─────────────────────────────────────────────────────────────────
// FIX: Removed the nested <KeyboardAvoidingView> that used to wrap this bar.
// Keyboard-avoidance is now handled ONCE, at the screen root (see main
// component below). Wrapping it twice was the root cause of the input bar
// disappearing behind the keyboard on Android.
const InputBar = React.memo(({
  text, setText, inputHeight, onContentSizeChange,
  onSend, onImagePick, sending,
  isRecording, recordingSecs,
  onStartRecord, onStopRecord,
  uploadingVoice,
}) => {
  const sendScale = useRef(new Animated.Value(1)).current;

  const handleSend = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onSend();
  }, [onSend, sendScale]);

  const canSend = !!text.trim() && !sending;

  if (isRecording) {
    return (
      <View style={styles.inputBar}>
        <View style={styles.recordingBar}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTimer}>
            0:{String(recordingSecs).padStart(2, '0')}
          </Text>
          <Text style={styles.recordingHint}>Recording… tap ■ to send</Text>
          <TouchableOpacity style={styles.stopRecordBtn} onPress={onStopRecord} activeOpacity={0.8}>
            <Icon name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inputBar}>
      <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
        <Icon name="image" size={20} color="#0D7B7A" />
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          {
            height: Math.max(
              INPUT_MIN_HEIGHT,
              Math.min(inputHeight, INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1)),
            ),
          },
        ]}
        placeholder="Type a message…"
        placeholderTextColor="#9CA3AF"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        onContentSizeChange={onContentSizeChange}
        textAlignVertical="top"
      />

      {!text.trim() ? (
        <TouchableOpacity
          style={[styles.sendBtn, styles.sendBtnActive]}
          onPress={onStartRecord}
          disabled={uploadingVoice}
          activeOpacity={0.85}
        >
          {uploadingVoice
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Icon name="mic" size={18} color="#FFFFFF" />
          }
        </TouchableOpacity>
      ) : (
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
            }
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

// ─── FullScreenImageViewer ────────────────────────────────────────────────────
const FullScreenImageViewer = React.memo(({ uri, onClose }) => {
  if (!uri) return null;
  return (
    <View style={styles.fsOverlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      <TouchableOpacity
        style={styles.fsCloseBtn}
        onPress={onClose}
        activeOpacity={0.75}
      >
        <Icon name="x" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fsImageWrap}
        activeOpacity={1}
        onPress={onClose}
      >
        <Image
          source={{ uri }}
          style={styles.fsImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BrodcastChatScreen({ route, navigation }) {
  const {
    chatId,
    expertName,
    expertId,
    isBroadcast = false,
    subcategoryName = '',
    categoryName = '',
    expertIds = [],
  } = route.params;

  const chatCollection = isBroadcast ? 'broadcastChats' : 'chats';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const [profileLoading, setProfileLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const recordingTimer = useRef(null);

  const [fullScreenImage, setFullScreenImage] = useState(null);

  // ── Manual keyboard height tracking ──────────────────────────────────────
  // We track the keyboard's height ourselves and push the chat content up by
  // exactly that amount. This sidesteps all KeyboardAvoidingView / native
  // windowSoftInputMode quirks (edge-to-edge, adjustResize inconsistencies
  // across Android versions, double-space-reservation bugs, etc).
  // Requires android:windowSoftInputMode="adjustNothing" in AndroidManifest.xml
  // so the OS doesn't ALSO try to resize/pan the window on top of this.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const flatRef = useRef(null);
  const uploadAnim = useRef(new Animated.Value(0)).current;
  const isNearBottom = useRef(true);
  const isMounted = useRef(true);
  const currentSound = useRef(null);
  const isFirstLoad = useRef(true);

  const uid = auth().currentUser?.uid;
  const palette = useMemo(() => getPalette(expertName), [expertName]);
  const loading = profileLoading || messagesLoading;

  const pendingCount = useMemo(
    () => messages.filter((m) => m.senderId === uid && m.status === MSG_STATUS.PENDING).length,
    [messages, uid],
  );

  // ── Unmount guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearInterval(recordingTimer.current);
      if (currentSound.current) {
        currentSound.current.stop();
        currentSound.current.release();
      }
    };
  }, []);

  // ── AudioRecord init ─────────────────────────────────────────────────────────
  useEffect(() => {
    AudioRecord.init({
      sampleRate: 44100,
      channels: 1,
      bitsPerSample: 16,
      wavFile: `voice_${Date.now()}.wav`,
    });
  }, []);

  // ── Upload bar animation ─────────────────────────────────────────────────────
  const uploadVisible = uploadingMedia || uploadingVoice;
  useEffect(() => {
    Animated.timing(uploadAnim, {
      toValue: uploadVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [uploadVisible, uploadAnim]);

  // ── Fetch user profile ───────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!uid) { setProfileLoading(false); return; }
    try {
      const db = getFirestore();
      const d = await getDoc(doc(db, 'users', uid));
      if (!isMounted.current) return;
      if (d.exists()) setProfile(d.data());
    } catch {
      // silent
    } finally {
      if (isMounted.current) setProfileLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Scroll helper ─────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      flatRef.current?.scrollToEnd({ animated });
    }, animated ? 80 : 200);
  }, []);

  // ── Firestore messages listener ──────────────────────────────────────────────
  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, chatCollection, chatId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted.current) return;

        const allMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const visibleMsgs = allMsgs.filter((m) => {
          if (m.senderId === uid) return true;
          const s = m.status;
          return !s || s === MSG_STATUS.APPROVED || s === MSG_STATUS.REROUTED;
        });

        setMessages(visibleMsgs);

        if (isFirstLoad.current) {
          setMessagesLoading(false);
          isFirstLoad.current = false;
          if (visibleMsgs.length > 0) scrollToBottom(false);
        } else {
          if (isNearBottom.current) scrollToBottom(true);
        }
      },
      () => {
        if (!isMounted.current) return;
        setMessagesLoading(false);
        setLoadError(true);
      },
    );

    return unsub;
  }, [chatId, chatCollection, uid, scrollToBottom]);

  // ── Save message ─────────────────────────────────────────────────────────────
  const saveMessage = useCallback(async (msgData) => {
    const db = getFirestore();

    const msgPayload = {
      ...msgData,
      senderId: uid,
      senderRole: 'user',
      senderName: profile?.name,
      userName: profile?.name,
      status: MSG_STATUS.PENDING,
      routedTo: expertId || null,
      routedToName: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
      createdAt: serverTimestamp(),
    };

    const lastMsg =
      msgData.type === 'text' ? msgData.text :
        msgData.type === 'image' ? '📷 Image' :
          msgData.type === 'voice' ? '🎤 Voice message' : '';

    await Promise.all([
      addDoc(collection(db, chatCollection, chatId, 'messages'), msgPayload),
      updateDoc(doc(db, chatCollection, chatId), {
        lastMessage: lastMsg,
        lastMessageStatus: MSG_STATUS.PENDING,
        updatedAt: serverTimestamp(),
        userName: profile?.name,
        senderName: profile?.name,
        userId: uid,
        pendingReview: false,
        ChatEnabled: true,
      }),
    ]);
  }, [chatId, uid, profile, chatCollection, expertId]);

  // ── Send text ────────────────────────────────────────────────────────────────
  const sendTextMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setInputHeight(INPUT_MIN_HEIGHT);
    setSending(true);
    try {
      await saveMessage({ type: 'text', text: trimmed });
    } catch {
      Alert.alert('Send Failed', 'Could not send message. Please try again.');
    } finally {
      if (isMounted.current) setSending(false);
    }
  }, [text, sending, saveMessage]);

  // ── Image pick & upload ──────────────────────────────────────────────────────
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
        text: 'Camera',
        onPress: () =>
          ImagePicker.openCamera({
            mediaType: 'photo',
            compressImageQuality: 0.8,
            cropping: true,
            cropperCircleOverlay: false,
            freeStyleCropEnabled: true,
            cropperToolbarTitle: 'Crop Image',
            cropperActiveWidgetColor: '#0D7B7A',
            cropperStatusBarColor: '#0A4F4E',
            cropperToolbarColor: '#0A4F4E',
            cropperToolbarWidgetColor: '#FFFFFF',
          })
            .then(handlePickerResponse)
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      {
        text: 'Gallery',
        onPress: () =>
          ImagePicker.openPicker({
            mediaType: 'photo',
            compressImageQuality: 0.8,
            cropping: true,
            cropperCircleOverlay: false,
            freeStyleCropEnabled: true,
            cropperToolbarTitle: 'Crop Image',
            cropperActiveWidgetColor: '#0D7B7A',
            cropperStatusBarColor: '#0A4F4E',
            cropperToolbarColor: '#0A4F4E',
            cropperToolbarWidgetColor: '#FFFFFF',
          })
            .then(handlePickerResponse)
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handlePickerResponse]);

  // ── Mic permission ───────────────────────────────────────────────────────────
  const requestMicPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'App needs microphone to record voice messages.',
        buttonPositive: 'Allow',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  // ── Stop recording ───────────────────────────────────────────────────────────
  const handleStopRecording = useCallback(async () => {
    if (!isRecording) return;
    clearInterval(recordingTimer.current);
    setIsRecording(false);

    let capturedSecs = 0;
    setRecordingSecs((s) => { capturedSecs = s; return 0; });

    try {
      const path = await AudioRecord.stop();
      if (!path) return;
      setUploadingVoice(true);
      const fileUri = Platform.OS === 'android' ? `file://${path}` : path;
      const voiceUrl = await uploadVoice(fileUri, chatId);
      if (!isMounted.current) return;
      await saveMessage({ type: 'voice', voiceUrl, duration: capturedSecs });
    } catch (e) {
      console.error('Stop recording error:', e);
      if (isMounted.current) Alert.alert('Voice Error', 'Could not send voice message. Please try again.');
    } finally {
      if (isMounted.current) setUploadingVoice(false);
    }
  }, [isRecording, chatId, saveMessage]);

  const handleStartRecording = useCallback(async () => {
    const ok = await requestMicPermission();
    if (!ok) {
      Alert.alert('Permission Denied', 'Microphone permission is required to send voice messages.');
      return;
    }
    try {
      AudioRecord.init({
        sampleRate: 44100,
        channels: 1,
        bitsPerSample: 16,
        wavFile: `voice_${Date.now()}.wav`,
      });
      AudioRecord.start();
      setIsRecording(true);
      setRecordingSecs(0);

      recordingTimer.current = setInterval(() => {
        setRecordingSecs((s) => {
          if (s >= MAX_RECORD_SECS - 1) { handleStopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Start recording error:', e);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, [requestMicPermission, handleStopRecording]);

  // ── Play voice ───────────────────────────────────────────────────────────────
  const handlePlayVoice = useCallback((url, isPlaying, setPlaying) => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    if (isPlaying) { setPlaying(false); return; }

    setPlaying(true);
    const sound = new Sound(url, '', (error) => {
      if (error) {
        Alert.alert('Error', 'Could not play voice message.');
        setPlaying(false);
        return;
      }
      currentSound.current = sound;
      sound.play(() => {
        setPlaying(false);
        sound.release();
        currentSound.current = null;
      });
    });
  }, []);

  // ── Open / close full-screen image viewer ────────────────────────────────────
  const handleImagePress = useCallback((uri) => {
    if (uri) setFullScreenImage(uri);
  }, []);

  const handleCloseFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatTime = useCallback((ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatDate = useCallback((ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  const handleScroll = useCallback(({ nativeEvent }) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
  }, []);

  const handleContentSizeChange = (e) => {
    setInputHeight(e.nativeEvent.contentSize.height + (Platform.OS === 'android' ? 12 : 0));
  };

  // ── FlatList render ──────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item, index }) => (
    <MessageItem
      item={item}
      index={index}
      messages={messages}
      uid={uid}
      expertName={expertName}
      palette={palette}
      formatTime={formatTime}
      formatDate={formatDate}
      onPlayVoice={handlePlayVoice}
      onImagePress={handleImagePress}
    />
  ), [messages, uid, expertName, palette, formatTime, formatDate, handlePlayVoice, handleImagePress]);

  const keyExtractor = useCallback((item) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <EmptyState expertName={expertName} isBroadcast={isBroadcast} />
  ), [expertName, isBroadcast]);

  const uploadLabel = uploadingVoice ? 'Sending voice message…' : 'Uploading image…';

  // ── Error state ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color="#94A3B8" />
        <Text style={styles.errorTitle}>Unable to Load Chat</Text>
        <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoadError(false);
            setMessagesLoading(true);
            isFirstLoad.current = true;
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  // FIX: The entire screen (header + list + input) is now wrapped in ONE
  // KeyboardAvoidingView. Previously only <InputBar> had its own separate
  // KeyboardAvoidingView — that double-wrapping (nested + outer) was the
  // root cause of the input bar getting hidden behind the keyboard.
  //
  // behavior is 'padding' on iOS (iOS has no native resize-on-keyboard).
  // On Android it's left `undefined` on purpose — android:windowSoftInputMode
  // ="adjustResize" (already set in AndroidManifest.xml) already resizes the
  // window correctly. Setting behavior="height" here would double-reserve
  // space (OS resize + RN's own height adjustment), which shows up as extra
  // empty space below the input bar even when the keyboard is closed.
  // Android already resizes correctly via android:windowSoftInputMode=
  // "adjustNothing" + our own keyboardHeight tracking above — no
  // KeyboardAvoidingView needed on either platform anymore. The chat content
  // (list + input) gets pushed up by exactly keyboardHeight; the header and
  // full-screen image viewer stay untouched by that padding.
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <ChatHeader
        expertName={expertName}
        palette={palette}
        onBack={() => navigation.goBack()}
        isBroadcast={isBroadcast}
      />

      <UploadBar anim={uploadAnim} label={uploadLabel} />

      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
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
            scrollEventThrottle={16}
            onLayout={() => {
              if (isFirstLoad.current === false && messages.length > 0) {
                scrollToBottom(false);
              }
            }}
            onContentSizeChange={() => {
              if (isNearBottom.current) scrollToBottom(true);
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
          isRecording={isRecording}
          recordingSecs={recordingSecs}
          onStartRecord={handleStartRecording}
          onStopRecord={handleStopRecording}
          uploadingVoice={uploadingVoice}
        />
      </View>

      {/* Full-screen viewer — opens for any image bubble, mine or theirs */}
      <FullScreenImageViewer
        uri={fullScreenImage}
        onClose={handleCloseFullScreenImage}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
  retryBtn: { marginTop: 20, backgroundColor: '#0D7B7A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 12, gap: 10 },
  headerBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  headerTextWrap: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
  headerActions: { flexDirection: 'row', gap: 4, marginTop: 4 },

  pendingInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pendingInfoText: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },

  uploadBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden' },
  uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 8 },

  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#D1E8E7' },
  datePill: { backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#B2DFDB' },
  datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

  msgRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },

  expertAvatar: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
  expertAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  expertAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  bubbleWrapper: { flexShrink: 1 },

  bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#0D7B7A', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2F4F4', shadowColor: '#0D7B7A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  bubblePending: { backgroundColor: '#0F6B6A', opacity: 0.80 },
  bubbleRejected: { backgroundColor: '#7F1D1D', opacity: 0.75 },

  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextOther: { color: '#1E293B' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  msgTime: { fontSize: 10, fontWeight: '500' },
  msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
  msgTimeOther: { color: '#94A3B8' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 5 },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },

  rejectReason: { fontSize: 11, color: '#EF4444', marginTop: 3, marginHorizontal: 4, fontStyle: 'italic' },

  reroutedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reroutedBannerText: { fontSize: 10, color: '#059669', fontWeight: '700' },

  imgBubble: { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imgBubbleMe: { borderBottomRightRadius: 4 },
  imgBubbleOther: { borderBottomLeftRadius: 4 },
  msgImage: { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
  imgTimeBadge: { position: 'absolute', bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },
  imgSenderBadge: { position: 'absolute', top: 6, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, zIndex: 1 },
  imgSenderText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },

  voiceBubble: { gap: 6, minWidth: 180, maxWidth: width * 0.75 },
  voicePlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  waveBar: { width: 3, borderRadius: 2 },
  voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  senderName: { fontSize: 11, fontWeight: '700', color: '#0D7B7A', marginBottom: 4 },
  senderNameMe: { color: 'rgba(255,255,255,0.85)' },
  voiceSenderName: { marginBottom: 2 },

  pendingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 18 },

  emptyState: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  emptyTipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  emptyTipText: { fontSize: 12, color: '#059669', fontWeight: '700' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 33,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0F2F1',
    shadowColor: '#0D7B7A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  attachBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CCEFED' },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    lineHeight: INPUT_LINE_HEIGHT,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendBtn: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sendBtnActive: { backgroundColor: '#0D7B7A', shadowColor: '#0D7B7A', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  sendBtnInactive: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },

  recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  recordingTimer: { fontSize: 14, fontWeight: '800', color: '#DC2626', minWidth: 36 },
  recordingHint: { flex: 1, fontSize: 12, color: '#64748B' },
  stopRecordBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0D7B7A', justifyContent: 'center', alignItems: 'center' },

  fsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000000',
    zIndex: 100,
    justifyContent: 'center',
  },
  fsCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 50,
    right: 16,
    zIndex: 101,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fsImageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fsImage: { width: width, height: height * 0.85 },
});