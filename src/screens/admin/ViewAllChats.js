import React, {
  useEffect, useState, useCallback, useMemo, memo, useRef,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput, Modal, Image, Platform,
  Alert, KeyboardAvoidingView, ScrollView, PermissionsAndroid, Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, onSnapshot, query,
  orderBy, updateDoc, doc, addDoc, serverTimestamp,
  getDocs, where, arrayUnion, runTransaction, Timestamp,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import AudioRecord from 'react-native-audio-record';
import { uploadImage, uploadVoice } from '../../utils/mediaUpload';
import Sound from 'react-native-sound';
Sound.setCategory('Playback');

const MAX_RECORD_SECS = 60;


const { width, height } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F4FAFA',
  surface: '#FFFFFF',
  border: '#E0F2F1',
  primary: '#0D7B7A',
  primaryLight: '#F0FDFA',
  inactive: '#94A3B8',
  textMain: '#0F172A',
  textSub: '#64748B',
  success: '#065F46',
  successBg: '#D1FAE5',
  amber: '#92400E',
  amberBg: '#FEF3C7',
  danger: '#991B1B',
  dangerBg: '#FEE2E2',
  stripe: '#0D7B7A',
  stripeOff: '#CBD5E1',
  shadow: '#0D7B7A',
  pending: '#1D4ED8',
  pendingBg: '#EFF6FF',
  reroute: '#6D28D9',
  rerouteBg: '#EDE9FE',
};

const MSG_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REROUTED: 'rerouted',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#7C3AED', '#0D7B7A', '#DB2777', '#059669', '#D97706', '#DC2626', '#0891B2',
];
const getAvatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2
    ? p[0][0].toUpperCase() + p[1][0].toUpperCase()
    : p[0][0].toUpperCase();
};

const relativeTime = (ts) => {
  try {
    if (!ts?.toDate) return '';
    const d = Date.now() - ts.toDate().getTime();
    if (d < 60_000) return 'Just now';
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
    if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
    return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch (_) { return ''; }
};

const msgTime = (ts) => {
  try {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch (_) { return ''; }
};

const fullDate = (ts) => {
  try {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch (_) { return '—'; }
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={{ flex: 1 }}>
      <View style={styles.skA} />
      <View style={styles.skB} />
      <View style={styles.skC} />
    </View>
  </View>
));

// ── Filter pill bar ───────────────────────────────────────────────────────────
const FilterBar = memo(({ active, counts, onSelect }) => {
  const pills = [
    { key: 'all', label: 'All' },
    // { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'closed', label: 'Closed' },
  ];
  return (
    <View style={styles.filterRow}>
      {pills.map((p) => {
        const on = active === p.key;
        return (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.pill,
              on && styles.pillOn,
              p.key === 'pending' && on && styles.pillPending,
            ]}
            onPress={() => onSelect(p.key)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.pillText,
              on && styles.pillTextOn,
              p.key === 'pending' && on && { color: C.pending },
            ]}>
              {p.label}
            </Text>
            <View style={[
              styles.pillBadge,
              on && styles.pillBadgeOn,
              p.key === 'pending' && on && { backgroundColor: C.pendingBg },
            ]}>
              <Text style={[
                styles.pillBadgeText,
                on && styles.pillBadgeTextOn,
                p.key === 'pending' && on && { color: C.pending },
              ]}>
                {counts[p.key] ?? 0}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// ── Broadcast Card ────────────────────────────────────────────────────────────
const BroadcastCard = memo(({ item, onPress }) => {
  const isActive = !!item.isActive;
  const expertCount = item.expertIds?.length ?? 0;
  const topic = item.subcategoryName || item.categoryName || 'Broadcast';
  const hasPending = !!item.pendingReview;


  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.stripe, {
        backgroundColor: hasPending ? C.pending : (isActive ? C.stripe : C.stripeOff),
      }]} />

      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.userName) }]}>
        <Text style={styles.avatarText}>{getInitials(item.userName)}</Text>
        {hasPending && <View style={styles.pendingDotBadge} />}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.senderName} numberOfLines={1}>
            {item.userName || 'User'}
          </Text>
          <Text style={styles.cardTime}>{relativeTime(item.updatedAt)}</Text>
        </View>

        <View style={styles.topicRow}>
          <IonIcon name="megaphone-outline" size={11} color={C.primary} />
          <Text style={styles.topicText} numberOfLines={1}>{topic}</Text>
        </View>

        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>

        <View style={styles.tagRow}>
          {expertCount > 0 && (
            <View style={styles.expertPill}>
              <Icon name="users" size={9} color={C.textSub} />
              <Text style={styles.expertPillText}>{expertCount} experts</Text>
            </View>
          )}

          {/* {hasPending && (
            <View style={[styles.statusPill, { backgroundColor: C.pendingBg }]}>
              <View style={[styles.dot, { backgroundColor: C.pending }]} />
              <Text style={[styles.statusPillText, { color: C.pending }]}>Needs Review</Text>
            </View>
          )} */}

          {!hasPending && (
            <View style={[styles.statusPill, {
              backgroundColor: isActive ? C.successBg : '#F1F5F9',
            }]}>
              <View style={[styles.dot, {
                backgroundColor: isActive ? C.success : C.inactive,
              }]} />
              <Text style={[styles.statusPillText, {
                color: isActive ? C.success : C.textSub,
              }]}>
                {isActive ? 'Active' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Icon name="chevron-right" size={15} color={C.border} />
    </TouchableOpacity>
  );
});

// ── Message Status Pill ───────────────────────────────────────────────────────
const MsgStatusPill = memo(({ status }) => {
  if (!status || status === MSG_STATUS.APPROVED) return null;
  const map = {
    // [MSG_STATUS.PENDING] : { label: 'Pending',  bg: C.pendingBg,  color: C.pending  },
    [MSG_STATUS.REJECTED]: { label: 'Rejected', bg: C.dangerBg, color: C.danger },
    // [MSG_STATUS.REROUTED]: { label: 'Rerouted',  bg: C.rerouteBg,  color: C.reroute  },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <View style={[styles.msgStatusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.msgStatusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
});

// ── Bubble ────────────────────────────────────────────────────────────────────
const Bubble = memo(({ msg, isAdminMode, onApprove, onReject, onReroute, handleImagePress }) => {
  const isUser = msg.senderRole === 'user';
  const isPending = isAdminMode && msg.status === MSG_STATUS.PENDING && isUser;
  const isRerouted = isAdminMode && msg.status === MSG_STATUS.REROUTED && isUser;
  const canShowActions = isPending || isRerouted;
  const [playing, setPlaying] = useState(false);
  const sndRef = useRef(null);

  const playVoice = useCallback(() => {
    if (sndRef.current) {
      sndRef.current.stop();
      sndRef.current.release();
      sndRef.current = null;
    }
    if (playing) { setPlaying(false); return; }
    setPlaying(true);
    const s = new Sound(msg.voiceUrl, '', (err) => {
      if (err) { setPlaying(false); return; }
      sndRef.current = s;
      s.play(() => { setPlaying(false); s.release(); sndRef.current = null; });
    });
  }, [msg.voiceUrl, playing]);

  useEffect(() => () => {
    if (sndRef.current) { sndRef.current.stop(); sndRef.current.release(); }
  }, []);

  return (
    <View style={[
      styles.msgRow,
      isUser ? styles.rowRight : styles.rowLeft,
      isPending && styles.msgRowPending,
    ]}>
      {!isUser && (
        <View style={styles.senderRow}>
          <IonIcon name="megaphone-outline" size={10} color={C.inactive} />
          <Text style={styles.senderLabel}>{msg?.senderName}</Text>
        </View>
      )}

      {isUser && msg.status && msg.status !== MSG_STATUS.APPROVED && (
        <MsgStatusPill status={msg.status} />
      )}

      {/* Text bubble */}
      {(msg.type === 'text' || !msg.type) && (
        <View style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleExpert,
          isPending && styles.bubblePendingHighlight,
        ]}>
          <Text style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextExpert,
          ]}>
            {msg.text}
          </Text>
          <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
            {msgTime(msg.createdAt)}
          </Text>
        </View>
      )}

      {/* Image bubble */}
      {msg.type === 'image' && (
        <TouchableOpacity style={[
          styles.imgWrap,
          isUser ? styles.bubbleUser : styles.bubbleExpert,
          isPending && styles.bubblePendingHighlight,
        ]} onPress={() => { handleImagePress(msg.imageUrl) }}>
          <Image source={{ uri: msg.imageUrl }} style={styles.msgImg} resizeMode="cover" />
          <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
            {msgTime(msg.createdAt)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Voice bubble */}
      {msg.type === 'voice' && (
        <View style={[
          styles.voiceWrap,
          isUser ? styles.bubbleUser : styles.bubbleExpert,
          isPending && styles.bubblePendingHighlight,
        ]}>
          <TouchableOpacity
            onPress={playVoice}
            style={[styles.playBtn, {
              backgroundColor: isUser ? 'rgba(255,255,255,0.25)' : C.primaryLight,
            }]}
            activeOpacity={0.75}
          >
            <Icon
              name={playing ? 'pause' : 'play'}
              size={13}
              color={isUser ? '#FFF' : C.primary}
            />
          </TouchableOpacity>
          <View style={styles.waveform}>
            {[4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12].map((h, i) => (
              <View key={i} style={[styles.waveBar, {
                height: h,
                backgroundColor: isUser ? 'rgba(255,255,255,0.7)' : C.primary,
              }]} />
            ))}
          </View>
          <Text style={[styles.voiceDur, {
            color: isUser ? 'rgba(255,255,255,0.85)' : C.textSub,
          }]}>
            {msg.duration != null ? `0:${String(msg.duration).padStart(2, '0')}` : '0:00'}
          </Text>
          <Text style={[
            styles.bubbleTime,
            isUser && styles.bubbleTimeUser,
            { marginTop: 0, marginLeft: 6 },
          ]}>
            {msgTime(msg.createdAt)}
          </Text>
        </View>
      )}
      {canShowActions && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.successBg }]}
            onPress={() => onApprove(msg)}
            activeOpacity={0.8}
          >
            <Icon name="check" size={13} color={C.success} />
            <Text style={[styles.adminBtnText, { color: C.success }]}>
              {isRerouted ? 'Reply' : 'Reply'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.rerouteBg }]}
            onPress={() => onReroute(msg)}
            activeOpacity={0.8}
          >
            <Icon name="share-2" size={13} color={C.reroute} />
            <Text style={[styles.adminBtnText, { color: C.reroute }]}>
              {isRerouted ? 'Re-route' : 'Re-route'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* {canShowActions && (
        <View style={styles.adminActions}>
          {isPending && (
            <TouchableOpacity
              style={[styles.adminBtn, { backgroundColor: C.successBg }]}
              onPress={() => onApprove(msg)}
              activeOpacity={0.8}
            >
              <Icon name="check" size={13} color={C.success} />
              <Text style={[styles.adminBtnText, { color: C.success }]}>Reply</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.rerouteBg }]}
            onPress={() => onReroute(msg)}
            activeOpacity={0.8}
          >
            <Icon name="share-2" size={13} color={C.reroute} />
            <Text style={[styles.adminBtnText, { color: C.reroute }]}>
              {isRerouted ? 'Re-route again' : 'Re-route'}
            </Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* Admin action buttons */}
      {/* {isPending && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.successBg }]}
            onPress={() => onApprove(msg)}
            activeOpacity={0.8}
          >
            <Icon name="check" size={13} color={C.success} />
            <Text style={[styles.adminBtnText, { color: C.success }]}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.rerouteBg }]}
            onPress={() => onReroute(msg)}
            activeOpacity={0.8}
          >
            <Icon name="share-2" size={13} color={C.reroute} />
            <Text style={[styles.adminBtnText, { color: C.reroute }]}>Re-route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: C.dangerBg }]}
            onPress={() => onReject(msg)}
            activeOpacity={0.8}
          >
            <Icon name="x" size={13} color={C.danger} />
            <Text style={[styles.adminBtnText, { color: C.danger }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
});

// ── Reply type tab bar ────────────────────────────────────────────────────────
const ReplyTypeTabs = memo(({ active, onChange }) => {
  const tabs = [
    { key: 'text', icon: 'type', label: 'Text' },
    { key: 'image', icon: 'image', label: 'Image' },
    { key: 'voice', icon: 'mic', label: 'Voice' },
  ];
  return (
    <View style={styles.replyTabRow}>
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.replyTab, on && styles.replyTabOn]}
            onPress={() => onChange(t.key)}
            activeOpacity={0.75}
          >
            <Icon name={t.icon} size={14} color={on ? C.primary : C.inactive} />
            <Text style={[styles.replyTabText, on && styles.replyTabTextOn]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// ── Reply Sheet ───────────────────────────────────────────────────────────────
const ReplySheet = memo(({ visible, msg, chatId, adminName, onClose }) => {
  const [replyType, setReplyType] = useState('text');
  const [replyText, setReplyText] = useState('');
  const [pickedImage, setPickedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voicePath, setVoicePath] = useState(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const recordTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setReplyType('text');
      setReplyText('');
      setPickedImage(null);
      setIsRecording(false);
      setRecordSecs(0);
      setVoiceReady(false);
      setVoicePath(null);
      setVoiceDuration(0);
      clearInterval(recordTimerRef.current);
    }
  }, [visible]);

  useEffect(() => {
    AudioRecord.init({
      sampleRate: 44100, channels: 1, bitsPerSample: 16,
      wavFile: `admin_voice_${Date.now()}.wav`,
    });
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const requestMic = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const r = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      { title: 'Microphone', message: 'Needed to record voice replies.', buttonPositive: 'Allow' },
    );
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const handleImagePick = useCallback(() => {
    Alert.alert('Select Image', 'Choose source', [
      {
        text: 'Camera',
        onPress: () =>
          ImagePicker.openCamera({ mediaType: 'photo', compressImageQuality: 0.8, cropping: true })
            .then((img) => setPickedImage({ path: img.path, uri: img.path }))
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      {
        text: 'Gallery',
        onPress: () =>
          ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.8, cropping: true })
            .then((img) => setPickedImage({ path: img.path, uri: img.path }))
            .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const stopRecording = useCallback(async () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    try {
      const path = await AudioRecord.stop();
      if (!path) return;
      let captured = 0;
      setRecordSecs((s) => { captured = s; return s; });
      setVoicePath(Platform.OS === 'android' ? `file://${path}` : path);
      setVoiceDuration(captured);
      setVoiceReady(true);
    } catch (e) { console.error('Stop recording error:', e); }
  }, []);

  const startRecording = useCallback(async () => {
    const ok = await requestMic();
    if (!ok) { Alert.alert('Permission Denied', 'Microphone permission is required.'); return; }
    try {
      AudioRecord.init({
        sampleRate: 44100, channels: 1, bitsPerSample: 16,
        wavFile: `admin_voice_${Date.now()}.wav`,
      });
      AudioRecord.start();
      setIsRecording(true);
      setVoiceReady(false);
      setVoicePath(null);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          if (s >= MAX_RECORD_SECS - 1) { stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Start recording error:', e);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, [requestMic, stopRecording]);

  const discardVoice = useCallback(() => {
    setVoiceReady(false);
    setVoicePath(null);
    setRecordSecs(0);
    setVoiceDuration(0);
  }, []);

  const canSend = useMemo(() => {
    if (sending || uploading || isRecording) return false;
    if (replyType === 'text') return replyText.trim().length > 0;
    if (replyType === 'image') return !!pickedImage;
    if (replyType === 'voice') return voiceReady && !!voicePath;
    return false;
  }, [replyType, replyText, pickedImage, voiceReady, voicePath, sending, uploading, isRecording]);

  // const approveOriginal = useCallback(async (db, uid, lastMsg) => {
  //   await updateDoc(doc(db, 'broadcastChats', chatId, 'messages', msg.id), {
  //     status: MSG_STATUS.APPROVED, approvedBy: uid, approvedAt: serverTimestamp(),
  //   });
  //   await updateDoc(doc(db, 'broadcastChats', chatId), {
  //     lastMessage: lastMsg, lastMessageStatus: MSG_STATUS.APPROVED,
  //     pendingReview: false, updatedAt: serverTimestamp(),
  //   });
  // }, [chatId, msg]);

  // const approveOriginal = useCallback(async (db, uid, lastMsg) => {
  //   const msgRef = doc(db, 'broadcastChats', chatId, 'messages', msg.id);
  //   await runTransaction(db, async (tx) => {
  //     const freshMsg = await tx.get(msgRef);
  //     if (!freshMsg.exists() || freshMsg.data().status !== MSG_STATUS.PENDING) {
  //       throw new Error('ALREADY_HANDLED');
  //     }
  //     tx.update(msgRef, {
  //       status: MSG_STATUS.APPROVED, approvedBy: uid, approvedAt: serverTimestamp(),
  //     });
  //   });
  //   await updateDoc(doc(db, 'broadcastChats', chatId), {
  //     lastMessage: lastMsg, lastMessageStatus: MSG_STATUS.APPROVED,
  //     pendingReview: false, updatedAt: serverTimestamp(),
  //   });
  // }, [chatId, msg]);

  const approveOriginal = useCallback(async (db, uid, lastMsg) => {
    const msgRef = doc(db, 'broadcastChats', chatId, 'messages', msg.id);
    await runTransaction(db, async (tx) => {
      const freshMsg = await tx.get(msgRef);
      if (!freshMsg.exists()) {
        throw new Error('ALREADY_HANDLED');
      }
      const currentStatus = freshMsg.data().status;
      // pending ya rerouted dono se direct reply allowed hai,
      // approved/rejected (final states) ke baad block
      if (currentStatus !== MSG_STATUS.PENDING && currentStatus !== MSG_STATUS.REROUTED) {
        throw new Error('ALREADY_HANDLED');
      }
      tx.update(msgRef, {
        status: MSG_STATUS.PENDING, approvedBy: uid, approvedAt: serverTimestamp(),
      });
    });
    await updateDoc(doc(db, 'broadcastChats', chatId), {
      lastMessage: lastMsg, lastMessageStatus: MSG_STATUS.PENDING,
      pendingReview: false, updatedAt: serverTimestamp(),
    });
  }, [chatId, msg]);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setSending(true);
    const db = getFirestore();
    const uid = auth().currentUser?.uid;

    try {
      if (replyType === 'text') {
        await approveOriginal(db, uid, replyText.trim());
        await addDoc(collection(db, 'broadcastChats', chatId, 'messages'), {
          type: 'text', text: replyText.trim(),
          senderId: uid, senderRole: 'expert', senderName: adminName || 'Admin',
          status: MSG_STATUS.APPROVED, createdAt: serverTimestamp(),
        });
      } else if (replyType === 'image') {
        setUploading(true);
        const imageUrl = await uploadImage(pickedImage.path, chatId);
        setUploading(false);
        await approveOriginal(db, uid, '📷 Image');
        await addDoc(collection(db, 'broadcastChats', chatId, 'messages'), {
          type: 'image', imageUrl,
          senderId: uid, senderRole: 'expert', senderName: adminName || 'Admin',
          status: MSG_STATUS.APPROVED, createdAt: serverTimestamp(),
        });
      } else if (replyType === 'voice') {
        setUploading(true);
        const voiceUrl = await uploadVoice(voicePath, chatId);
        setUploading(false);
        await approveOriginal(db, uid, '🎤 Voice message');
        await addDoc(collection(db, 'broadcastChats', chatId, 'messages'), {
          type: 'voice', voiceUrl, duration: voiceDuration,
          senderId: uid, senderRole: 'expert', senderName: adminName || 'Admin',
          status: MSG_STATUS.APPROVED, createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e) {
      console.error('Reply error:', e);
      setUploading(false);
      if (e.message === 'ALREADY_HANDLED') {
        Alert.alert('Already Handled', 'This message was already replied to or rerouted.');
        onClose();
      } else {
        Alert.alert('Error', 'Could not send reply. Please try again.');
      }
    } finally {
      setSending(false);
    }
  }, [
    canSend, replyType, replyText, pickedImage, voicePath, voiceDuration,
    chatId, adminName, approveOriginal, onClose,
  ]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Reply</Text>
          <Text style={styles.sheetSub}>
            Replying to{' '}
            <Text style={{ fontWeight: '700', color: C.textMain }}>{msg?.senderName}</Text>
          </Text>

          {msg && (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>User message</Text>
              <Text style={styles.previewText} numberOfLines={3}>
                {msg.type === 'text' ? msg.text :
                  msg.type === 'image' ? '📷 Image' : '🎤 Voice message'}
              </Text>
            </View>
          )}

          <ReplyTypeTabs active={replyType} onChange={(t) => {
            setReplyType(t);
            if (t !== 'image') setPickedImage(null);
            if (t !== 'voice') discardVoice();
            if (t !== 'text') setReplyText('');
          }} />

          {replyType === 'text' && (
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply…"
              placeholderTextColor={C.inactive}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={1000}
              autoFocus
            />
          )}

          {replyType === 'image' && (
            <View style={styles.imagePickArea}>
              {pickedImage ? (
                <View style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => setPickedImage(null)}
                    activeOpacity={0.8}
                  >
                    <Icon name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickBtn}
                  onPress={handleImagePick}
                  activeOpacity={0.8}
                >
                  <View style={styles.imagePickIconWrap}>
                    <Icon name="image" size={28} color={C.primary} />
                  </View>
                  <Text style={styles.imagePickBtnText}>Tap to pick image</Text>
                  <Text style={styles.imagePickBtnSub}>Camera or Gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {replyType === 'voice' && (
            <View style={styles.voiceArea}>
              {!voiceReady ? (
                <View style={styles.voiceRecordBox}>
                  {isRecording && (
                    <Text style={styles.voiceTimer}>
                      0:{String(recordSecs).padStart(2, '0')}
                    </Text>
                  )}
                  <Animated.View style={[
                    styles.voiceMicWrap,
                    isRecording && { transform: [{ scale: pulseAnim }] },
                  ]}>
                    <TouchableOpacity
                      style={[styles.voiceMicBtn, {
                        backgroundColor: isRecording ? '#DC2626' : C.primary,
                      }]}
                      onPress={isRecording ? stopRecording : startRecording}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name={isRecording ? 'square' : 'mic'}
                        size={26}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.voiceHint}>
                    {isRecording ? 'Tap ■ to stop recording' : 'Tap mic to start recording'}
                  </Text>
                </View>
              ) : (
                <View style={styles.voiceReadyBox}>
                  <View style={styles.voiceReadyRow}>
                    <View style={styles.voiceReadyIcon}>
                      <Icon name="mic" size={18} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voiceReadyLabel}>Voice recorded</Text>
                      <Text style={styles.voiceReadyDur}>
                        Duration: 0:{String(voiceDuration).padStart(2, '0')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.voiceDiscardBtn}
                      onPress={discardVoice}
                      activeOpacity={0.8}
                    >
                      <Icon name="trash-2" size={15} color={C.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.miniWaveform}>
                    {[5, 10, 16, 8, 14, 6, 12, 9, 15, 7, 11, 8].map((h, i) => (
                      <View key={i} style={[styles.miniWaveBar, { height: h }]} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {uploading && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={styles.uploadingText}>
                {replyType === 'image' ? 'Uploading image…' : 'Uploading voice…'}
              </Text>
            </View>
          )}

          <View style={styles.sheetBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendReplyBtn, !canSend && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              {(sending || uploading)
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Icon name="send" size={15} color="#FFF" />
              }
              <Text style={styles.sendReplyBtnText}>Send Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ── Reject Sheet ──────────────────────────────────────────────────────────────
const RejectSheet = memo(({ visible, msg, chatId, onClose }) => {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const handleReject = useCallback(async () => {
    setSending(true);
    try {
      const db = getFirestore();
      const uid = auth().currentUser?.uid;

      await updateDoc(doc(db, 'broadcastChats', chatId, 'messages', msg.id), {
        status: MSG_STATUS.REJECTED,
        rejectReason: reason.trim() || null,
        rejectedBy: uid,
        rejectedAt: serverTimestamp(),
      });

      const snap = await getDocs(
        collection(db, 'broadcastChats', chatId, 'messages'),
      );
      const stillPending = snap.docs.some(
        (d) => d.id !== msg.id && d.data().status === MSG_STATUS.PENDING,
      );
      if (!stillPending) {
        await updateDoc(doc(db, 'broadcastChats', chatId), { pendingReview: false });
      }

      setReason('');
      onClose();
    } catch (e) {
      console.error('Reject error:', e);
      Alert.alert('Error', 'Could not reject message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [reason, msg, chatId, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={[styles.sheetTitle, { color: C.danger }]}>Reject Message</Text>
          <Text style={styles.sheetSub}>Optionally provide a reason (shown to user)</Text>

          {msg && (
            <View style={[styles.previewBox, { borderLeftColor: C.danger }]}>
              <Text style={styles.previewLabel}>User message</Text>
              <Text style={styles.previewText} numberOfLines={3}>
                {msg.type === 'text' ? msg.text :
                  msg.type === 'image' ? '📷 Image' : '🎤 Voice'}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.replyInput}
            placeholder="Reason (optional)…"
            placeholderTextColor={C.inactive}
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={300}
          />

          <View style={styles.sheetBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendReplyBtn, { backgroundColor: C.danger }]}
              onPress={handleReject}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Icon name="x-circle" size={15} color="#FFF" />
              }
              <Text style={styles.sendReplyBtnText}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

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


// ── Reroute Sheet (single + multiple subcategory) ─────────────────────────────
// ── Reroute Sheet ─────────────────────────────────────────────────────────────
// Subcategory select → all experts forward
// Arrow expand → individual experts multi-select (checkbox)
const RerouteSheet = memo(({
  visible, msg, chatId, categoryName, subcategoryName, onClose, existingReplierIds = []
}) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubs, setSelectedSubs] = useState([]);   // [{id,name,expertCount,expertIds}]
  const [expandedSub, setExpandedSub] = useState(null); // subId string
  const [selectedExperts, setSelectedExperts] = useState([]);   // [{subId,expertId,expertName}]
  const [sending, setSending] = useState(false);

  // ── Reset on close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setSelectedSubs([]);
      setExpandedSub(null);
      setSelectedExperts([]);
    }
  }, [visible]);

  // ── Fetch subcategories + experts ───────────────────────────────────────
  // useEffect(() => {
  //   if (!visible || !categoryName) { setSubcategories([]); return; }
  //   setLoading(true);
  //   const db = getFirestore();

  //   (async () => {
  //     try {
  //       const catSnap = await getDocs(
  //         query(collection(db, 'categories'), where('name', '==', categoryName)),
  //       );
  //       if (catSnap.empty) { setSubcategories([]); return; }
  //       const catId = catSnap.docs[0].id;

  //       const subSnap = await getDocs(
  //         collection(db, 'categories', catId, 'subcategories'),
  //       );

  //       const results = await Promise.all(
  //         subSnap.docs.map(async (d) => {
  //           const expertSnap = await getDocs(
  //             query(
  //               collection(db, 'users'),
  //               where('role',          '==', 'expert'),
  //               where('subcategoryId', '==', d.id),
  //               where('isActive',      '==', true),
  //             ),
  //           );
  //           return {
  //             id         : d.id,
  //             name       : d.data().name || 'Unknown',
  //             expertCount: expertSnap.size,
  //             expertIds  : expertSnap.docs.map((e) => e.id),
  //             expertNames: expertSnap.docs.map((e) => ({
  //               id  : e.id,
  //               name: e.data().displayName || e.data().name || 'Expert',
  //             })),
  //           };
  //         }),
  //       );

  //       const filtered = results.filter(
  //         (s) => s.name.toLowerCase() !== (subcategoryName || '').toLowerCase(),
  //       );
  //       setSubcategories(filtered);
  //     } catch (e) {
  //       console.error('RerouteSheet fetch error:', e);
  //       setSubcategories([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [visible, categoryName, subcategoryName]);

  // useEffect(() => {
  //   if (!visible || !categoryName) return;

  //   const loadData = async () => {
  //     setLoading(true);

  //     try {
  //       const db = getFirestore();

  //       const catSnap = await getDocs(
  //         query(
  //           collection(db, 'categories'),
  //           where('name', '==', categoryName),
  //         ),
  //       );

  //       console.log(catSnap)

  //       if (catSnap.empty) {
  //         setSubcategories([]);
  //         return;
  //       }

  //       const catId = catSnap.docs[0].id;

  //       const [subSnap, expertSnap] = await Promise.all([
  //         getDocs(
  //           collection(
  //             db,
  //             'categories',
  //             catId,
  //             'subcategories',
  //           ),
  //         ),
  //         getDocs(
  //           query(
  //             collection(db, 'users'),
  //             where('role', '==', 'expert'),
  //             where('isActive', '==', true),
  //           ),
  //         ),
  //       ]);

  //       const expertMap = {};

  //       expertSnap.docs.forEach((doc) => {
  //         const data = doc.data();

  //         if (!expertMap[data.subcategoryId]) {
  //           expertMap[data.subcategoryId] = [];
  //         }

  //         expertMap[data.subcategoryId].push({
  //           id: doc.id,
  //           name: data.displayName || data.name || 'Expert',
  //         });
  //       });

  //       // const results = subSnap.docs.map((d) => {
  //       //   const experts = expertMap[d.id] || [];

  //       //   return {
  //       //     id: d.id,
  //       //     name: d.data().name || 'Unknown',
  //       //     expertCount: experts.length,
  //       //     expertIds: experts.map((e) => e.id),
  //       //     expertNames: experts,

  //       //   };

  //       // });

  //       const results = subSnap.docs.map((d) => {
  //         const experts = expertMap[d.id] || [];

  //         return {
  //           id: d.id,
  //           name: d.data().name || 'Unknown',
  //           expertCount: experts.length,
  //           expertIds: experts.map((e) => e.id),
  //           expertNames: experts,
  //           isCurrent:
  //             d.data().name?.toLowerCase() ===
  //             (categoryName || '').toLowerCase(),
  //         };
  //       });

  //       setSubcategories(results);
  //     } catch (e) {
  //       console.log(e);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadData();
  // }, [visible, categoryName, subcategoryName]);

  useEffect(() => {
    if (!visible || !categoryName) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const db = getFirestore();

        // Step 1: Category ID fetch karo
        const catSnap = await getDocs(
          query(collection(db, 'categories'), where('name', '==', categoryName)),
        );

        if (catSnap.empty) {
          setSubcategories([]);
          return;
        }

        const catId = catSnap.docs[0].id;

        // Step 2: Subcategories aur experts parallel fetch karo
        const [subSnap, expertSnap] = await Promise.all([
          getDocs(collection(db, 'categories', catId, 'subcategories')),
          getDocs(
            query(
              collection(db, 'users'),
              where('role', '==', 'expert'),
              where('isActive', '==', true),
            ),
          ),
        ]);

        // Expert map banao (subcategoryId ke basis pe)
        const expertMap = {};
        expertSnap.docs.forEach((doc) => {
          const data = doc.data();
          const key = data.subcategoryId;
          if (!expertMap[key]) expertMap[key] = [];
          expertMap[key].push({
            id: doc.id,
            name: data.displayName || data.name || 'Expert',
          });
        });

        // Step 3: Subcategories hain toh unhe show karo
        if (!subSnap.empty) {
          const results = subSnap.docs.map((d) => {
            const experts = expertMap[d.id] || [];

            const filteredExperts = experts.filter(
              (e) => !existingReplierIds.includes(e.id)
            );
            return {
              id: d.id,
              name: d.data().name || 'Unknown',
              expertCount: filteredExperts.length,      // ← filtered
              expertIds: filteredExperts.map((e) => e.id),  // ← filtered
              expertNames: filteredExperts,             // ← filtered
            };
          });
          setSubcategories(results);
          return; // ← yahan se exit, niche mat jao
        }

        // Step 4: Subcategories nahi hain → category ke experts directly dikhao
        // "Virtual" ek subcategory banao jisme category ke saare experts hon
        // const categoryExperts = expertSnap.docs
        //   .filter((doc) => {
        //     const data = doc.data();
        //     // categoryId match karo (agar field hai) ya sab experts dikhao
        //     return data.categoryId === catId || !data.subcategoryId;
        //   })
        //   .map((doc) => ({
        //     id: doc.id,
        //     name: doc.data().displayName || doc.data().name || 'Expert',
        //   }));

        // Step 4: Subcategories nahi hain → category ke experts directly
        // catId ke against categoryId field match karo
        const categoryExperts = expertSnap.docs
          .filter((doc) => {
            const data = doc.data();
            return (
              data.categoryId === catId ||   // agar categoryId field hai
              data.category === catId ||     // ya category field hai
              data.category === categoryName && !existingReplierIds.includes(doc.expertId)  // ← SIRF YEH ADD KARO
            );
          })
          .map((doc) => ({
            id: doc.id,
            name: doc.data().displayName || doc.data().name || 'Expert',
          }));

        if (categoryExperts.length > 0) {
          setSubcategories([
            {
              id: catId,
              name: categoryName, // Category ka naam use karo
              expertCount: categoryExperts.length,
              expertIds: categoryExperts.map((e) => e.id),
              expertNames: categoryExperts,
            },
          ]);
        } else {
          setSubcategories([]);
        }

      } catch (e) {
        console.log('RerouteSheet error:', e);
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [visible, categoryName, subcategoryName, existingReplierIds]);

  // ── Toggle subcategory (whole sub = all experts) ────────────────────────
  const toggleSub = useCallback((sub) => {
    // If any expert from this sub is individually selected, clear them
    setSelectedExperts((prev) => prev.filter((e) => e.subId !== sub.id));
    setSelectedSubs((prev) => {
      const exists = prev.some((s) => s.id === sub.id);
      return exists ? prev.filter((s) => s.id !== sub.id) : [...prev, sub];
    });
  }, []);

  // ── Toggle expand arrow ─────────────────────────────────────────────────
  const toggleExpand = useCallback((sub) => {
    setExpandedSub((prev) => (prev === sub.id ? null : sub.id));
  }, []);

  // ── Toggle individual expert checkbox ───────────────────────────────────
  const toggleExpert = useCallback((sub, expert) => {
    // Selecting individual expert → deselect whole-sub if it was selected
    setSelectedSubs((prev) => prev.filter((s) => s.id !== sub.id));
    setSelectedExperts((prev) => {
      const exists = prev.some((e) => e.expertId === expert.id && e.subId === sub.id);
      if (exists) return prev.filter((e) => !(e.expertId === expert.id && e.subId === sub.id));
      return [...prev, { subId: sub.id, expertId: expert.id, expertName: expert.name, subName: sub.name }];
    });
  }, []);

  // ── Summary for selected ────────────────────────────────────────────────
  const summaryText = useMemo(() => {
    const parts = [];
    selectedSubs.forEach((s) =>
      parts.push(`All ${s.expertCount} in ${s.name}`),
    );
    if (selectedExperts.length > 0) {
      const names = selectedExperts.map((e) => e.expertName).join(', ');
      parts.push(names);
    }
    return parts.join(' · ');
  }, [selectedSubs, selectedExperts]);

  const totalSelected = selectedSubs.reduce((a, s) => a + s.expertCount, 0) + selectedExperts.length;
  const canForward = totalSelected > 0 && !sending;

  // ── Handle forward ──────────────────────────────────────────────────────
  // const handleForward = useCallback(async () => {
  //   if (!canForward) return;

  //   // Collect all expert IDs (unique)
  //   const allExpertIds = [
  //     ...new Set([
  //       ...selectedSubs.flatMap((s) => s.expertIds),
  //       ...selectedExperts.map((e) => e.expertId),
  //     ]),
  //   ];

  //   const targetLabel = summaryText;

  //   Alert.alert(
  //     'Confirm Reroute',
  //     `Forward this message to: ${targetLabel}?`,
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Forward',
  //         onPress: async () => {
  //           setSending(true);
  //           try {
  //             const db = getFirestore();
  //             const uid = auth().currentUser?.uid;

  //             // Build routed names
  //             const subNames = selectedSubs.map((s) => s.name);
  //             const expertNames = selectedExperts.map((e) => e.expertName);
  //             const allNames = [...subNames, ...expertNames].join(', ');

  //             await updateDoc(
  //               doc(db, 'broadcastChats', chatId, 'messages', msg.id),
  //               {
  //                 status: MSG_STATUS.REROUTED,
  //                 routedTo: allExpertIds,
  //                 routedToName: allNames,
  //                 approvedBy: uid,
  //                 approvedAt: serverTimestamp(),
  //               },
  //             );

  //             await addDoc(
  //               collection(db, 'broadcastChats', chatId, 'messages'),
  //               {
  //                 type: 'text',
  //                 text: `Your message has been forwarded to ${allNames}. They will respond shortly.`,
  //                 senderId: uid,
  //                 senderRole: 'system',
  //                 senderName: 'Admin',
  //                 status: MSG_STATUS.APPROVED,
  //                 createdAt: serverTimestamp(),
  //               },
  //             );

  //             // Use first selected sub name (or expert's sub name) for subcategoryName
  //             const newSubName = selectedSubs[0]?.name
  //               || selectedExperts[0]?.subName
  //               || subcategoryName;

  //             await updateDoc(doc(db, 'broadcastChats', chatId), {
  //               subcategoryName: newSubName,
  //               expertIds: allExpertIds,
  //               lastMessage: `Forwarded to ${allNames}`,
  //               lastMessageStatus: MSG_STATUS.REROUTED,
  //               pendingReview: false,
  //               updatedAt: serverTimestamp(),
  //             });

  //             setSelectedSubs([]);
  //             setSelectedExperts([]);
  //             setExpandedSub(null);
  //             onClose();
  //           } catch (e) {
  //             console.error('Reroute forward error:', e);
  //             Alert.alert('Error', 'Could not reroute message. Please try again.');
  //           } finally {
  //             setSending(false);
  //           }
  //         },
  //       },
  //     ],
  //   );
  // }, [canForward, selectedSubs, selectedExperts, summaryText, msg, chatId, subcategoryName, onClose]);


  // ── Handle forward ──────────────────────────────────────────────────────
  const handleForward = useCallback(async () => {
    if (!canForward) return;

    // Collect all expert IDs (unique)
    const allExpertIds = [
      ...new Set([
        ...selectedSubs.flatMap((s) => s.expertIds),
        ...selectedExperts.map((e) => e.expertId),
      ]),
    ];

    const targetLabel = summaryText;

    Alert.alert(
      'Confirm Reroute',
      `Forward this message to: ${targetLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forward',
          onPress: async () => {
            setSending(true);
            try {
              const db = getFirestore();
              const uid = auth().currentUser?.uid;

              const subNames = selectedSubs.map((s) => s.name);
              const expertNames = selectedExperts.map((e) => e.expertName);
              const allNames = [...subNames, ...expertNames].join(', ');

              // ── Guard: re-check message is still pending right before writing ──
              // Prevents two admins rerouting the same message at the same time,
              // and prevents a stale UI from double-submitting an already-rerouted msg.
              // const msgRef = doc(db, 'broadcastChats', chatId, 'messages', msg.id);
              // await runTransaction(db, async (tx) => {
              //   const freshMsg = await tx.get(msgRef);
              //   if (!freshMsg.exists() || freshMsg.data().status !== MSG_STATUS.PENDING) {
              //     throw new Error('ALREADY_HANDLED');
              //   }
              //   tx.update(msgRef, {
              //     status: MSG_STATUS.REROUTED,
              //     routedTo: allExpertIds,
              //     routedToName: allNames,
              //     approvedBy: uid,
              //     approvedAt: serverTimestamp(),
              //   });
              // });

              const msgRef = doc(db, 'broadcastChats', chatId, 'messages', msg.id);
              await runTransaction(db, async (tx) => {
                const freshMsg = await tx.get(msgRef);
                if (!freshMsg.exists()) {
                  throw new Error('ALREADY_HANDLED');
                }
                const currentStatus = freshMsg.data().status;
                // pending ya rerouted dono se aage reroute allowed hai,
                // approved/rejected (final states) ke baad block
                if (currentStatus !== MSG_STATUS.PENDING && currentStatus !== MSG_STATUS.REROUTED) {
                  throw new Error('ALREADY_HANDLED');
                }
                tx.update(msgRef, {
                  status: MSG_STATUS.REROUTED,
                  routedTo: allExpertIds,
                  routedToName: allNames,
                  approvedBy: uid,
                  approvedAt: serverTimestamp(),
                  rerouteSource: 'sheet',
                });
              });

              await addDoc(
                collection(db, 'broadcastChats', chatId, 'messages'),
                {
                  type: 'text',
                  text: `Your message has been forwarded to ${allNames}. They will respond shortly.`,
                  senderId: uid,
                  senderRole: 'system',
                  senderName: 'Admin',
                  status: MSG_STATUS.APPROVED,
                  createdAt: serverTimestamp(),
                },
              );

              const newSubName = selectedSubs[0]?.name
                || selectedExperts[0]?.subName
                || subcategoryName;

              // ── FIX: merge expertIds instead of overwriting ──
              // Old code did `expertIds: allExpertIds` which wiped out experts
              // routed by any earlier reroute on a different pending message.
              await updateDoc(doc(db, 'broadcastChats', chatId), {
                subcategoryName: newSubName,
                expertIds: arrayUnion(...allExpertIds),
                lastMessage: `Forwarded to ${allNames}`,
                lastMessageStatus: MSG_STATUS.REROUTED,
                pendingReview: false,
                updatedAt: serverTimestamp(),
                rerouteHistory: arrayUnion({
                  messageId: msg.id,
                  toExpertIds: allExpertIds,
                  toExpertNames: allNames,
                  byAdminId: uid,
                  at: Timestamp.now(),
                }),
              });

              setSelectedSubs([]);
              setSelectedExperts([]);
              setExpandedSub(null);
              onClose();
            } catch (e) {
              if (e.message === 'ALREADY_HANDLED') {
                Alert.alert(
                  'Already Handled',
                  'This message was already replied to or rerouted (possibly by another admin). Refreshing…',
                );
                onClose();
              } else {
                console.error('Reroute forward error:', e);
                Alert.alert('Error', 'Could not reroute message. Please try again.');
              }
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  }, [canForward, selectedSubs, selectedExperts, summaryText, msg, chatId, subcategoryName, onClose]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { maxHeight: '85%' }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.rerouteHeaderRow}>
            <View style={styles.rerouteHeaderIcon}>
              <Icon name="share-2" size={16} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: C.reroute }]}>
                Re-route to Specialist
              </Text>
              <Text style={styles.sheetSub}>
                Select specialization or individual experts
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.rerouteCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={16} color={C.inactive} />
            </TouchableOpacity>
          </View>

          {/* Current subcategory */}
          <View style={styles.currentSubRow}>
            <Icon name="map-pin" size={11} color={C.inactive} />
            <Text style={styles.currentSubLabel}>Current: </Text>
            <Text style={styles.currentSubValue} numberOfLines={1}>
              {subcategoryName || 'Unknown'}
            </Text>
          </View>

          {/* Message preview */}
          {msg && (
            <View style={[styles.previewBox, { borderLeftColor: C.reroute }]}>
              <Text style={styles.previewLabel}>Forwarding message</Text>
              <Text style={styles.previewText} numberOfLines={2}>
                {msg.type === 'text' ? msg.text :
                  msg.type === 'image' ? '📷 Image' : '🎤 Voice'}
              </Text>
            </View>
          )}

          {/* Selection summary */}
          {totalSelected > 0 && (
            <View style={styles.multiSummaryBox}>
              <Icon name="check-circle" size={13} color={C.reroute} />
              <Text style={styles.multiSummaryText} numberOfLines={2}>
                {summaryText}
              </Text>
              <View style={styles.rerouteCountBadge}>
                <Text style={styles.rerouteCountText}>{totalSelected}</Text>
              </View>
            </View>
          )}

          {/* List */}
          {loading ? (
            <View style={styles.rerouteLoadingWrap}>
              <ActivityIndicator color={C.reroute} />
              <Text style={styles.rerouteLoadingText}>Loading specializations…</Text>
            </View>
          ) : subcategories.length === 0 ? (
            <View style={styles.rerouteLoadingWrap}>
              <Icon name="users" size={32} color={C.border} />
              <Text style={styles.rerouteLoadingText}>No other specializations found</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {subcategories.map((sub) => {
                const isSubSelected = selectedSubs.some((s) => s.id === sub.id);
                const isExpanded = expandedSub === sub.id;
                const expertSelCount = selectedExperts.filter((e) => e.subId === sub.id).length;
                const hasAnySelected = isSubSelected || expertSelCount > 0;

                return (
                  <View key={sub.id}>

                    {/* ── Subcategory Row ── */}
                    <TouchableOpacity
                      style={[styles.rerouteSubRow, hasAnySelected && styles.rerouteSubRowOn]}
                      onPress={() => sub.expertCount > 0 && toggleSub(sub)}
                      activeOpacity={sub.expertCount > 0 ? 0.75 : 1}
                    >
                      {/* Checkbox */}
                      <View style={[
                        styles.rerouteCheckboxSub,
                        isSubSelected && { backgroundColor: C.reroute, borderColor: C.reroute },
                      ]}>
                        {isSubSelected && <Icon name="check" size={11} color="#FFF" />}
                      </View>

                      {/* Icon avatar */}
                      <View style={[
                        styles.rerouteSubAvatar,
                        { backgroundColor: hasAnySelected ? C.reroute : C.primary },
                      ]}>
                        <MatIcon name="shape-outline" size={16} color="#FFF" />
                      </View>

                      {/* Name + meta */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[styles.rerouteSubName, hasAnySelected && { color: C.reroute }]}
                          numberOfLines={1}
                        >
                          {sub.name}
                        </Text>
                        <View style={styles.rerouteMetaRow}>
                          <Icon name="users" size={10} color={C.inactive} />
                          <Text style={styles.rerouteMetaText}>
                            {sub.expertCount} expert{sub.expertCount !== 1 ? 's' : ''} available
                            {expertSelCount > 0 ? ` · ${expertSelCount} selected` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Badge */}
                      {sub.expertCount > 0 ? (
                        <View style={styles.rerouteAvailBadge}>
                          <Text style={styles.rerouteAvailText}>Available</Text>
                        </View>
                      ) : (
                        <View style={styles.rerouteNoneBadge}>
                          <Text style={styles.rerouteNoneText}>No experts</Text>
                        </View>
                      )}

                      {/* Expand arrow */}
                      {sub.expertCount > 0 && (
                        <TouchableOpacity
                          onPress={() => toggleExpand(sub)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.rerouteExpandBtn}
                          activeOpacity={0.7}
                        >
                          <Icon
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={C.reroute}
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {/* ── Individual Expert Rows ── */}
                    {isExpanded && sub.expertNames.map((expert) => {
                      const isExpertOn = selectedExperts.some(
                        (e) => e.expertId === expert.id && e.subId === sub.id,
                      );

                      return (
                        <TouchableOpacity
                          key={expert.id}
                          style={[styles.rerouteExpertRow, isExpertOn && styles.rerouteExpertRowOn]}
                          onPress={() => toggleExpert(sub, expert)}
                          activeOpacity={0.75}
                        >
                          {/* Indent line */}
                          <View style={styles.rerouteIndentWrap}>
                            <View style={styles.rerouteIndentLine} />
                          </View>

                          {/* Checkbox */}
                          <View style={[
                            styles.rerouteCheckboxExpert,
                            isExpertOn && { backgroundColor: C.reroute, borderColor: C.reroute },
                          ]}>
                            {isExpertOn && <Icon name="check" size={10} color="#FFF" />}
                          </View>

                          {/* Avatar with initials */}
                          <View style={[
                            styles.rerouteExpertAvatar,
                            { backgroundColor: isExpertOn ? C.reroute : getAvatarColor(expert.name) },
                          ]}>
                            <Text style={styles.rerouteExpertAvatarText}>
                              {getInitials(expert.name)}
                            </Text>
                          </View>

                          {/* Name */}
                          <Text
                            style={[
                              styles.rerouteExpertName,
                              isExpertOn && { color: C.reroute, fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {expert.name}
                          </Text>

                          {isExpertOn && (
                            <Icon name="check-circle" size={15} color={C.reroute} />
                          )}
                        </TouchableOpacity>
                      );
                    })}

                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Buttons */}
          <View style={[styles.sheetBtnRow, { marginTop: 14 }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendReplyBtn,
                { backgroundColor: C.reroute },
                !canForward && { opacity: 0.4 },
              ]}
              onPress={handleForward}
              disabled={!canForward}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Icon name="share-2" size={15} color="#FFF" />
              }
              <Text style={styles.sendReplyBtnText}>
                {totalSelected > 0 ? `Forward to ${totalSelected}` : 'Forward'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES — paste inside your existing StyleSheet.create({})
// ─────────────────────────────────────────────────────────────────────────────
/*

  rerouteSubRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingVertical  : 12,
    paddingHorizontal: 12,
    borderRadius     : 12,
    marginBottom     : 6,
    backgroundColor  : C.bg,
    borderWidth      : 1,
    borderColor      : C.border,
    gap              : 10,
  },
  rerouteSubRowOn: {
    borderColor    : C.reroute,
    backgroundColor: C.rerouteBg,
  },
  rerouteSubAvatar: {
    width         : 36,
    height        : 36,
    borderRadius  : 10,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  rerouteSubName: {
    fontSize  : 13,
    fontWeight: '700',
    color     : C.textMain,
  },

  rerouteCheckboxSub: {
    width         : 20,
    height        : 20,
    borderRadius  : 6,
    borderWidth   : 2,
    borderColor   : C.border,
    alignItems    : 'center',
    justifyContent: 'center',
  },

  rerouteExpandBtn: {
    width         : 30,
    height        : 30,
    borderRadius  : 8,
    backgroundColor: C.rerouteBg,
    alignItems    : 'center',
    justifyContent: 'center',
    marginLeft    : 4,
  },

  rerouteExpertRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingVertical  : 10,
    paddingHorizontal: 10,
    marginBottom     : 4,
    marginLeft       : 16,
    borderRadius     : 10,
    backgroundColor  : C.surface,
    borderWidth      : 1,
    borderColor      : C.border,
    gap              : 8,
  },
  rerouteExpertRowOn: {
    borderColor    : C.reroute,
    backgroundColor: C.rerouteBg,
  },

  rerouteIndentWrap: {
    width         : 10,
    alignSelf     : 'stretch',
    alignItems    : 'center',
    justifyContent: 'center',
  },
  rerouteIndentLine: {
    width          : 2,
    flex           : 1,
    backgroundColor: C.border,
    borderRadius   : 1,
  },

  rerouteCheckboxExpert: {
    width         : 18,
    height        : 18,
    borderRadius  : 5,
    borderWidth   : 2,
    borderColor   : C.border,
    alignItems    : 'center',
    justifyContent: 'center',
  },

  rerouteExpertAvatar: {
    width         : 32,
    height        : 32,
    borderRadius  : 16,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  rerouteExpertAvatarText: {
    fontSize  : 11,
    fontWeight: '800',
    color     : '#FFF',
  },

  rerouteExpertName: {
    flex      : 1,
    fontSize  : 13,
    fontWeight: '500',
    color     : C.textMain,
  },

  rerouteCountBadge: {
    backgroundColor  : C.reroute,
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : 10,
    minWidth         : 24,
    alignItems       : 'center',
  },
  rerouteCountText: {
    fontSize  : 11,
    fontWeight: '800',
    color     : '#FFF',
  },

*/
// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = memo(({
  chat, messages, msgLoading, adminName,
  onClose, onToggleStatus, handleImagePress
}) => {
  if (!chat) return null;

  const isActive = !!chat.isActive;
  const expertCount = chat.expertIds?.length ?? 0;
  const topic = chat.subcategoryName || chat.categoryName || 'Broadcast';

  const [replyTarget, setReplyTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rerouteTarget, setRerouteTarget] = useState(null);

  const existingReplierIds = useMemo(() => [
    ...messages
      .filter(m => m.senderRole === 'expert' || m.senderRole === 'admin')
      .map(m => m.senderId)
      .filter(Boolean),
    ...(chat.expertId ? [chat.expertId] : []),
    ...(Array.isArray(chat.expertIds) ? chat.expertIds.filter(Boolean) : []),
  ], [messages, chat.expertId, chat.expertIds]);

  const pendingCount = useMemo(
    () => messages.filter(
      (m) => m.senderRole === 'user' && m.status === MSG_STATUS.PENDING,
    ).length,
    [messages],
  );

  const keyExtractor = useCallback((item) => item.id, []);
  const renderBubble = useCallback(({ item }) => (
    <Bubble
      msg={item}
      isAdminMode
      onApprove={setReplyTarget}
      // onReject={setRejectTarget}
      onReroute={setRerouteTarget}
      handleImagePress={handleImagePress}
    />
  ), []);

  return (
    <View style={styles.modalBox}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.modalHeader}>
        <View style={[styles.modalAvatar, { backgroundColor: getAvatarColor(chat.userName) }]}>
          <Text style={styles.modalAvatarText}>{getInitials(chat.userName)}</Text>
        </View>
        <View style={styles.modalHeaderInfo}>
          <Text style={styles.modalSender} numberOfLines={1}>
            {chat.userName ?? 'User'}
          </Text>
          <View style={styles.modalTopicRow}>
            <IonIcon name="megaphone-outline" size={12} color={C.primary} />
            <Text style={styles.modalTopic} numberOfLines={1}>{topic}</Text>
          </View>
        </View>
        <View style={[styles.statusChip, {
          backgroundColor: isActive ? C.successBg : '#F1F5F9',
        }]}>
          <View style={[styles.dot, {
            backgroundColor: isActive ? C.success : C.inactive,
          }]} />
          <Text style={[styles.statusChipText, {
            color: isActive ? C.success : C.textSub,
          }]}>
            {isActive ? 'Active' : 'Closed'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="x" size={18} color={C.inactive} />
        </TouchableOpacity>
      </View>

      {/* Pending alert strip */}
      {/* {pendingCount > 0 && (
        <View style={styles.pendingStrip}>
          <Icon name="clock" size={13} color={C.pending} />
          <Text style={styles.pendingStripText}>
            {pendingCount} message{pendingCount > 1 ? 's' : ''} waiting for your review
          </Text>
        </View>
      )} */}

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={12} color={C.primary} />
          <Text style={styles.metaText}>Started {fullDate(chat.createdAt)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="users" size={12} color={C.primary} />
          <Text style={styles.metaText}>
            {expertCount} expert{expertCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="clock" size={12} color={C.primary} />
          <Text style={styles.metaText}>{relativeTime(chat.updatedAt)}</Text>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.msgArea}>
        {msgLoading ? (
          <View style={styles.msgCenter}>
            <ActivityIndicator color={C.primary} />
            <Text style={styles.msgCenterText}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.msgCenter}>
            <IonIcon name="megaphone-outline" size={40} color={C.border} />
            <Text style={styles.msgCenterText}>No messages yet</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderBubble}
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={8}
            removeClippedSubviews
          />
        )}
      </View>

      {/* Action button */}
      {/* <TouchableOpacity
        style={[styles.actionBtn, {
          backgroundColor: isActive ? C.amberBg : C.successBg,
        }]}
        onPress={() => onToggleStatus(chat.id, isActive)}
        activeOpacity={0.8}
      >
        <Icon
          name={isActive ? 'lock' : 'unlock'}
          size={16}
          color={isActive ? C.amber : C.success}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.actionBtnText, {
          color: isActive ? C.amber : C.success,
        }]}>
          {isActive ? 'Close Broadcast' : 'Reopen Broadcast'}
        </Text>
      </TouchableOpacity> */}

      {/* Sub-sheets */}
      <ReplySheet
        visible={!!replyTarget}
        msg={replyTarget}
        chatId={chat.id}
        adminName={adminName}
        onClose={() => setReplyTarget(null)}
      />
      {/* <RejectSheet
        visible={!!rejectTarget}
        msg={rejectTarget}
        chatId={chat.id}
        onClose={() => setRejectTarget(null)}
      /> */}
      <RerouteSheet
        visible={!!rerouteTarget}
        msg={rerouteTarget}
        chatId={chat.id}
        categoryName={chat.categoryName}
        existingReplierIds={existingReplierIds}
        subcategoryName={chat.categoryName}
        onClose={() => setRerouteTarget(null)}
      />
    </View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BroadcastChats() {
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const msgUnsubRef = useRef(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (user?.displayName) setAdminName(user.displayName);
  }, []);

  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, 'broadcastChats'),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(false);
      },
      () => { setLoading(false); setError(true); },
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!selected) { setMessages([]); return; }

    setMsgLoading(true);
    const db = getFirestore();
    const q = query(
      collection(db, 'broadcastChats', selected.id, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    msgUnsubRef.current = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMsgLoading(false);
      },
      () => setMsgLoading(false),
    );
    return () => {
      if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    };
  }, [selected?.id]);

  const counts = useMemo(() => {
    const enabledChats = chats.filter((c) => c.ChatEnabled === true);

    return {
      all: enabledChats.length,
      pending: enabledChats.filter((c) => c.pendingReview).length,
      active: enabledChats.filter((c) => c.isActive && !c.pendingReview).length,
      closed: enabledChats.filter((c) => !c.isActive).length,
    };
  }, [chats]);

  const filtered = useMemo(() => {
    // let list = chats;
    let list = chats.filter((c) => c.ChatEnabled === true);
    if (filter === 'pending') list = list.filter((c) => c.pendingReview);
    if (filter === 'active') list = list.filter((c) => c.isActive && !c.pendingReview);
    if (filter === 'closed') list = list.filter((c) => !c.isActive);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        c.userName?.toLowerCase().includes(s) ||
        c.categoryName?.toLowerCase().includes(s) ||
        c.subcategoryName?.toLowerCase().includes(s) ||
        c.lastMessage?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [chats, filter, search]);

  const openChat = useCallback((item) => setSelected(item), []);
  const closeChat = useCallback(() => setSelected(null), []);

  const toggleStatus = useCallback(async (id, currentlyActive) => {
    try {
      closeChat();
      await updateDoc(
        doc(getFirestore(), 'broadcastChats', id),
        { isActive: !currentlyActive },
      );
    } catch (err) { console.error('Toggle error:', err); }
  }, [closeChat]);

  // ── Open / close full-screen image viewer ────────────────────────────────────
  const handleImagePress = useCallback((uri) => {
    if (uri) setFullScreenImage(uri);
  }, []);

  const handleCloseFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);



  const keyExtractor = useCallback((item) => item.id, []);
  const renderItem = useCallback(({ item }) => (
    <BroadcastCard item={item} onPress={() => openChat(item)} />
  ), [openChat]);

  const EmptyState = useCallback(() => (
    <View style={styles.empty}>
      <IonIcon name="megaphone-outline" size={56} color={C.border} />
      <Text style={styles.emptyTitle}>
        {search ? 'Nothing found' : filter === 'pending' ? 'No pending reviews' : 'No chats yet'}
      </Text>
      <Text style={styles.emptySub}>
        {search ? 'Try different keywords or clear filters.' : 'Chats will appear here.'}
      </Text>
    </View>
  ), [search, filter]);

  const pt = Platform.OS === 'ios' ? insets.top + 12 : insets.top + 16;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={[styles.header, { paddingTop: pt }]}>
          <Text style={styles.headerTitle}>All Chats</Text>
          <Text style={styles.headerSub}>Loading…</Text>
        </View>
        <View style={styles.headerLine} />
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centred]}>
        <Icon name="wifi-off" size={40} color={C.inactive} />
        <Text style={styles.errTitle}>Failed to load</Text>
        <Text style={styles.errSub}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: pt }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <IonIcon name="megaphone-outline" size={18} color={C.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>All Chats</Text>
            <Text style={styles.headerSub}>
              {counts.all} total · {counts.active} active
              {counts.pending > 0 ? ` · ${counts.pending} pending` : ''}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.headerLine} />

      {/* Pending banner */}
      {/* {counts.pending > 0 && (
        <TouchableOpacity
          style={styles.reviewBanner}
          onPress={() => setFilter('pending')}
          activeOpacity={0.85}
        >
          <Icon name="alert-circle" size={15} color={C.pending} />
          <Text style={styles.reviewBannerText}>
            {counts.pending} chat{counts.pending > 1 ? 's' : ''} need your review
          </Text>
          <Icon name="chevron-right" size={14} color={C.pending} />
        </TouchableOpacity>
      )} */}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={15} color={C.inactive} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by user, topic or message…"
          placeholderTextColor={C.inactive}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={15} color={C.inactive} />
          </TouchableOpacity>
        )}
      </View>

      <FilterBar active={filter} counts={counts} onSelect={setFilter} />

      {/* Stats strip */}
      {/* <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.pending }]}>{counts.pending}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.success }]}>{counts.active}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.inactive }]}>{counts.closed}</Text>
          <Text style={styles.statLbl}>Closed</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.primary }]}>{counts.all}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
      </View> */}

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={closeChat}
      >
        <View style={styles.overlay}>
          <DetailModal
            chat={selected}
            messages={messages}
            msgLoading={msgLoading}
            adminName={adminName}
            onClose={closeChat}
            onToggleStatus={toggleStatus}
            handleImagePress={handleImagePress}
          />
          <FullScreenImageViewer
            uri={fullScreenImage}
            onClose={handleCloseFullScreenImage}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centred: { justifyContent: 'center', alignItems: 'center', padding: 32 },

  header: { backgroundColor: C.surface, paddingHorizontal: 20, paddingBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.textMain },
  headerSub: { fontSize: 12, color: C.inactive, marginTop: 1, fontWeight: '500' },
  headerLine: { height: 1, backgroundColor: C.border },

  reviewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.pendingBg, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  reviewBannerText: { flex: 1, fontSize: 13, fontWeight: '700', color: C.pending },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textMain },

  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, gap: 6 },
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    paddingVertical: 9, borderWidth: 1, borderColor: C.border, gap: 4,
  },
  pillOn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  pillPending: { backgroundColor: C.pendingBg, borderColor: '#BFDBFE' },
  pillText: { fontSize: 12, fontWeight: '600', color: C.inactive },
  pillTextOn: { color: C.primary },
  pillBadge: {
    backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  pillBadgeOn: { backgroundColor: C.border },
  pillBadgeText: { fontSize: 10, fontWeight: '700', color: C.inactive },
  pillBadgeTextOn: { color: C.primary },

  statsStrip: {
    flexDirection: 'row', backgroundColor: C.surface,
    marginHorizontal: 16, marginTop: 10, borderRadius: 14,
    paddingVertical: 13, borderWidth: 1, borderColor: C.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: C.primary },
  statLbl: { fontSize: 10, color: C.inactive, marginTop: 2 },
  statLine: { width: 1, backgroundColor: C.border },

  list: { paddingHorizontal: 16, paddingTop: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16,
    paddingVertical: 14, paddingRight: 14,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  rerouteSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  rerouteSubRowOn: {
    borderColor: C.reroute,
    backgroundColor: C.rerouteBg,
  },
  rerouteSubAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerouteSubName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMain,
  },

  rerouteCheckboxSub: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rerouteExpandBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.rerouteBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  rerouteExpertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
    marginLeft: 16,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  rerouteExpertRowOn: {
    borderColor: C.reroute,
    backgroundColor: C.rerouteBg,
  },

  rerouteIndentWrap: {
    width: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerouteIndentLine: {
    width: 2,
    flex: 1,
    backgroundColor: C.border,
    borderRadius: 1,
  },

  rerouteCheckboxExpert: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rerouteExpertAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerouteExpertAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },

  rerouteExpertName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: C.textMain,
  },

  rerouteCountBadge: {
    backgroundColor: C.reroute,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  rerouteCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  stripe: { width: 4, height: '100%', marginRight: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, position: 'relative',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  pendingDotBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.pending, borderWidth: 2, borderColor: C.surface,
  },
  cardBody: { flex: 1, justifyContent: 'center' },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 3,
  },
  senderName: { fontSize: 13, fontWeight: '700', color: C.textMain, flex: 1, marginRight: 8 },
  cardTime: { fontSize: 11, color: C.inactive },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  topicText: { fontSize: 12, fontWeight: '600', color: C.primary, flexShrink: 1 },
  lastMsg: { fontSize: 12, color: C.textSub, marginBottom: 6 },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  expertPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  expertPillText: { fontSize: 10, color: C.textSub, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },

  skeletonCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  skeletonIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#EDE9FE', marginRight: 12,
  },
  skA: { height: 13, width: '65%', backgroundColor: '#EDE9FE', borderRadius: 6, marginBottom: 8 },
  skB: { height: 11, width: '45%', backgroundColor: '#F5F3FF', borderRadius: 6, marginBottom: 8 },
  skC: { height: 10, width: '30%', backgroundColor: '#F5F3FF', borderRadius: 6 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.textMain, marginTop: 16 },
  emptySub: { fontSize: 13, color: C.inactive, marginTop: 6, textAlign: 'center' },
  errTitle: { fontSize: 17, fontWeight: '700', color: C.textMain, marginTop: 14 },
  errSub: { fontSize: 13, color: C.inactive, marginTop: 6, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, height: '90%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },

  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  modalAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  modalHeaderInfo: { flex: 1 },
  modalSender: { fontSize: 15, fontWeight: '800', color: C.textMain },
  modalTopicRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  modalTopic: { fontSize: 12, fontWeight: '600', color: C.primary },
  statusChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },

  pendingStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.pendingBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  pendingStripText: { fontSize: 12, fontWeight: '700', color: C.pending, flex: 1 },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg,
    borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  metaItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  metaText: { fontSize: 11, color: C.textSub },
  metaDivider: { width: 1, height: 16, backgroundColor: C.border },

  msgArea: {
    flex: 1, backgroundColor: C.bg, borderRadius: 16,
    marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  msgCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  msgCenterText: { fontSize: 13, color: C.inactive },

  msgRow: { marginBottom: 14 },
  msgRowPending: {
    backgroundColor: 'rgba(239,246,255,0.6)',
    borderRadius: 16, padding: 8, marginHorizontal: -4,
  },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  senderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, marginLeft: 2,
  },
  senderLabel: { fontSize: 11, color: C.inactive },

  bubble: {
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleExpert: {
    backgroundColor: C.surface, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
  },
  bubblePendingHighlight: { borderWidth: 2, borderColor: '#93C5FD' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#FFF' },
  bubbleTextExpert: { color: C.textMain },
  bubbleTime: { fontSize: 10, color: C.inactive, marginTop: 4, textAlign: 'right' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.65)' },

  imgWrap: { maxWidth: '78%', borderRadius: 16, padding: 4, overflow: 'hidden' },
  msgImg: { width: 200, height: 200, borderRadius: 12 },

  voiceWrap: {
    flexDirection: 'row', alignItems: 'center',
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  playBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 8 },
  waveBar: { width: 3, borderRadius: 2 },
  voiceDur: { fontSize: 12, fontWeight: '700' },

  msgStatusPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    marginBottom: 4, alignSelf: 'flex-end',
  },
  msgStatusPillText: { fontSize: 10, fontWeight: '700' },

  adminActions: {
    flexDirection: 'row', gap: 6, marginTop: 6,
    flexWrap: 'wrap', justifyContent: 'flex-end',
  },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  adminBtnText: { fontSize: 12, fontWeight: '700' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 15, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  actionBtnText: { fontWeight: '700', fontSize: 15 },

  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 50,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.primary, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: C.textSub, marginBottom: 14 },

  previewBox: {
    backgroundColor: C.bg, borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.primary, marginBottom: 14,
    borderRadius: 0,
  },
  previewLabel: {
    fontSize: 10, fontWeight: '700', color: C.inactive,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  previewText: { fontSize: 14, color: C.textMain, lineHeight: 20 },

  replyTabRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  replyTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  replyTabOn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  replyTabText: { fontSize: 13, fontWeight: '600', color: C.inactive },
  replyTabTextOn: { color: C.primary },

  replyInput: {
    backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14, color: C.textMain, borderWidth: 1, borderColor: C.border,
    minHeight: 90, textAlignVertical: 'top', marginBottom: 14,
  },

  imagePickArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 16,
    borderStyle: 'dashed', marginBottom: 14, overflow: 'hidden',
  },
  imagePickBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 28, gap: 8,
  },
  imagePickIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  imagePickBtnText: { fontSize: 14, fontWeight: '700', color: C.textMain },
  imagePickBtnSub: { fontSize: 12, color: C.inactive },
  imagePreviewWrap: { position: 'relative' },
  imagePreview: { width: '100%', height: 180, borderRadius: 16 },
  imageRemoveBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },

  voiceArea: {
    borderWidth: 1, borderColor: C.border,
    borderRadius: 16, marginBottom: 14, backgroundColor: C.bg,
  },
  voiceRecordBox: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 16,
  },
  voiceMicWrap: {},
  voiceMicBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceTimer: { fontSize: 22, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  voiceHint: { fontSize: 13, color: C.inactive, textAlign: 'center' },
  voiceReadyBox: { padding: 16, gap: 12 },
  voiceReadyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceReadyIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  voiceReadyLabel: { fontSize: 14, fontWeight: '700', color: C.textMain },
  voiceReadyDur: { fontSize: 12, color: C.textSub, marginTop: 2 },
  voiceDiscardBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center',
  },
  miniWaveform: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 3, paddingVertical: 4,
  },
  miniWaveBar: { width: 3, borderRadius: 2, backgroundColor: C.primary, opacity: 0.5 },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  uploadingText: { fontSize: 13, color: C.textSub },

  sheetBtnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: C.textSub },
  sendReplyBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary,
  },
  sendReplyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Reroute sheet styles ───────────────────────────────────────────────────
  rerouteHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  rerouteHeaderIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  rerouteCloseBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },

  currentSubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, padding: 10, borderRadius: 10,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  currentSubLabel: { fontSize: 12, color: C.inactive, fontWeight: '500' },
  currentSubValue: { fontSize: 12, color: C.primary, fontWeight: '700', flex: 1 },

  // Mode toggle tabs
  modeToggleRow: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  modeTabOn: { backgroundColor: C.rerouteBg, borderColor: C.reroute },
  modeTabText: { fontSize: 13, fontWeight: '600', color: C.inactive },
  modeTabTextOn: { color: C.reroute },

  modeBadge: {
    backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  modeBadgeOn: { backgroundColor: C.reroute },
  modeBadgeText: { fontSize: 10, fontWeight: '700', color: C.inactive },
  modeBadgeTextOn: { color: '#FFF' },

  // Selected summary
  multiSummaryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.rerouteBg, borderRadius: 10, padding: 10,
    marginBottom: 10, borderWidth: 1, borderColor: '#DDD6FE',
  },
  multiSummaryText: { fontSize: 12, fontWeight: '700', color: C.reroute, flex: 1 },

  rerouteLoadingWrap: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  rerouteLoadingText: { fontSize: 13, color: C.inactive },

  // Expert rows
  expertRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 8,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, gap: 10,
  },
  expertRowOn: { borderColor: C.reroute, backgroundColor: C.rerouteBg },
  expertAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  expertAvatarText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  expertName: { fontSize: 14, fontWeight: '700', color: C.textMain },
  expertSpec: { fontSize: 12, color: C.textSub, marginTop: 2 },

  rerouteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rerouteMetaText: { fontSize: 11, color: C.inactive },

  // Checkbox (multiple mode)
  rerouteCheckbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Radio button (single mode)
  rerouteRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rerouteRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.reroute,
  },

  // Available / no-experts badges
  rerouteAvailBadge: {
    backgroundColor: C.successBg, paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: 6,
  },
  rerouteAvailText: { fontSize: 10, fontWeight: '700', color: C.success },
  rerouteNoneBadge: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  rerouteNoneText: { fontSize: 10, fontWeight: '700', color: C.inactive },
  // ── Full-screen image viewer ───────────────────────────────────────────────
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