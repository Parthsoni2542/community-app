// // // // /**
// // // //  * ExpertReplyChat.jsx
// // // //  * Real-time chat screen for the Expert side.
// // // //  * Mirrors ChatScreen.jsx architecture exactly:
// // // //  *  - MessageItem extracted and memoised
// // // //  *  - All handlers wrapped in useCallback
// // // //  *  - FlatList with full performance props
// // // //  *  - Sticky-scroll (only auto-scrolls when near bottom)
// // // //  *  - isMounted guard on all async ops
// // // //  *  - Parallel Firestore writes via Promise.all
// // // //  *  - Animated upload progress bar
// // // //  *  - Image timestamp badge overlaid on image (consistent with ChatScreen)
// // // //  *  - Gradient header matching ChatScreen style
// // // //  *  - All Hindi text replaced with professional English
// // // //  */

// // // // import React, {
// // // //   useEffect, useState, useRef, useCallback, useMemo,
// // // // } from 'react';
// // // // import {
// // // //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// // // //   TextInput, KeyboardAvoidingView, Platform,
// // // //   ActivityIndicator, StatusBar, Alert, Image,
// // // //   Animated, Dimensions,
// // // // } from 'react-native';
// // // // import LinearGradient from 'react-native-linear-gradient';
// // // // import Icon from 'react-native-vector-icons/Feather';
// // // // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// // // // import {
// // // //   getFirestore, collection, query, orderBy,
// // // //   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
// // // // } from '@react-native-firebase/firestore';
// // // // import { getAuth } from '@react-native-firebase/auth';
// // // // import ImagePicker from 'react-native-image-crop-picker';
// // // // import { uploadImage } from '../../utils/mediaUpload';

// // // // const { width } = Dimensions.get('window');

// // // // // ─── Palette (mirrors ChatScreen) ────────────────────────────────────────────
// // // // const AVATAR_PALETTES = [
// // // //   { grad: ['#2563EB', '#1D4ED8'] },
// // // //   { grad: ['#7C3AED', '#6D28D9'] },
// // // //   { grad: ['#DB2777', '#BE185D'] },
// // // //   { grad: ['#059669', '#047857'] },
// // // //   { grad: ['#D97706', '#B45309'] },
// // // //   { grad: ['#0D7B7A', '#0A4F4E'] },
// // // // ];
// // // // const getPalette = (name) =>
// // // //   AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// // // // // ─── Constants (mirrors ChatScreen) ──────────────────────────────────────────
// // // // const INPUT_MIN_HEIGHT = 2;
// // // // const INPUT_MAX_LINES = 5;
// // // // const INPUT_LINE_HEIGHT = 12;
// // // // const SCROLL_THRESHOLD = 120; // px from bottom → sticky scroll active

// // // // // ─── DateSeparator ────────────────────────────────────────────────────────────
// // // // const DateSeparator = React.memo(({ label }) => (
// // // //   <View style={styles.dateSeparator}>
// // // //     <View style={styles.dateLine} />
// // // //     <View style={styles.datePill}>
// // // //       <Text style={styles.datePillText}>{label}</Text>
// // // //     </View>
// // // //     <View style={styles.dateLine} />
// // // //   </View>
// // // // ));

// // // // // ─── UserAvatar (shown next to user messages, mirrors ExpertAvatar) ───────────
// // // // const UserAvatar = React.memo(({ name, palette, invisible }) => (
// // // //   <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
// // // //     <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
// // // //       <Text style={styles.userAvatarText}>
// // // //         {name?.charAt(0)?.toUpperCase() || 'U'}
// // // //       </Text>
// // // //     </LinearGradient>
// // // //   </View>
// // // // ));

// // // // // ─── TextBubble ───────────────────────────────────────────────────────────────
// // // // const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
// // // //   <View
// // // //     style={[
// // // //       styles.bubble,
// // // //       isMe ? styles.bubbleMe : styles.bubbleOther,
// // // //       isMe  && isConsecutive && { borderTopRightRadius: 6 },
// // // //       !isMe && isConsecutive && { borderTopLeftRadius: 6 },
// // // //     ]}
// // // //   >
// // // //     <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
// // // //       {item.text}
// // // //     </Text>
// // // //     <View style={styles.msgMeta}>
// // // //       <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// // // //         {time}
// // // //       </Text>
// // // //       {isMe && (
// // // //         <MatIcon
// // // //           name="check-all"
// // // //           size={13}
// // // //           color="rgba(221,214,254,0.9)"
// // // //           style={{ marginLeft: 3 }}
// // // //         />
// // // //       )}
// // // //     </View>
// // // //   </View>
// // // // ));

// // // // // ─── ImageBubble ──────────────────────────────────────────────────────────────
// // // // const ImageBubble = React.memo(({ item, isMe, time }) => (
// // // //   <View style={[
// // // //     styles.imgBubble,
// // // //     isMe ? styles.imgBubbleMe : styles.imgBubbleOther,
// // // //   ]}>
// // // //     <Image
// // // //       source={{ uri: item.imageUrl }}
// // // //       style={styles.msgImage}
// // // //       resizeMode="cover"
// // // //     />
// // // //     <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
// // // //       <Text style={styles.imgTimeText}>{time}</Text>
// // // //       {isMe && (
// // // //         <MatIcon
// // // //           name="check-all"
// // // //           size={11}
// // // //           color="rgba(255,255,255,0.9)"
// // // //           style={{ marginLeft: 2 }}
// // // //         />
// // // //       )}
// // // //     </View>
// // // //   </View>
// // // // ));

// // // // // ─── MessageItem — memoised, mirrors ChatScreen's MessageItem ─────────────────
// // // // const MessageItem = React.memo(({
// // // //   item, index, messages, uid, userName, palette,
// // // //   formatTime, formatDate,
// // // // }) => {
// // // //   // Expert = "me" on this screen (senderRole === 'expert')
// // // //   const isMe = item.senderRole === 'expert';

// // // //   const showDate = index === 0 || (
// // // //     messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
// // // //     item.createdAt?.toDate?.()?.toDateString()
// // // //   );
// // // //   const isConsecutive =
// // // //     index > 0 &&
// // // //     messages[index - 1]?.senderRole === item.senderRole &&
// // // //     !showDate;

// // // //   const time = formatTime(item.createdAt);

// // // //   return (
// // // //     <>
// // // //       {showDate && item.createdAt && (
// // // //         <DateSeparator label={formatDate(item.createdAt)} />
// // // //       )}

// // // //       <View
// // // //         style={[
// // // //           styles.msgRow,
// // // //           isMe ? styles.msgRowMe : styles.msgRowOther,
// // // //           isConsecutive && { marginTop: 2 },
// // // //         ]}
// // // //       >
// // // //         {/* Show user avatar on the left for messages from user */}
// // // //         {!isMe && (
// // // //           <UserAvatar
// // // //             name={userName}
// // // //             palette={palette}
// // // //             invisible={isConsecutive}
// // // //           />
// // // //         )}

// // // //         {item.type === 'text' && (
// // // //           <TextBubble
// // // //             item={item}
// // // //             isMe={isMe}
// // // //             isConsecutive={isConsecutive}
// // // //             time={time}
// // // //           />
// // // //         )}

// // // //         {item.type === 'image' && (
// // // //           <ImageBubble item={item} isMe={isMe} time={time} />
// // // //         )}
// // // //       </View>
// // // //     </>
// // // //   );
// // // // });

// // // // // ─── UploadBar — animated, mirrors ChatScreen ─────────────────────────────────
// // // // const UploadBar = React.memo(({ anim }) => (
// // // //   <Animated.View
// // // //     style={[
// // // //       styles.uploadBar,
// // // //       {
// // // //         maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
// // // //         opacity: anim,
// // // //       },
// // // //     ]}
// // // //   >
// // // //     <ActivityIndicator size="small" color="#FFFFFF" />
// // // //     <Text style={styles.uploadText}>Uploading image…</Text>
// // // //   </Animated.View>
// // // // ));

// // // // // ─── EmptyState ───────────────────────────────────────────────────────────────
// // // // const EmptyState = React.memo(({ userName }) => (
// // // //   <View style={styles.emptyState}>
// // // //     <View style={styles.emptyIconWrap}>
// // // //       <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.emptyIconGrad}>
// // // //         <Icon name="message-circle" size={36} color="#7C3AED" />
// // // //       </LinearGradient>
// // // //     </View>
// // // //     <Text style={styles.emptyTitle}>No Messages Yet</Text>
// // // //     <Text style={styles.emptySubtitle}>
// // // //       When {userName} sends a message,{'\n'}it will appear here.
// // // //     </Text>
// // // //     <View style={styles.emptyTipRow}>
// // // //       <Icon name="shield" size={13} color="#7C3AED" />
// // // //       <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
// // // //     </View>
// // // //   </View>
// // // // ));

// // // // // ─── ChatHeader ───────────────────────────────────────────────────────────────
// // // // const ChatHeader = React.memo(({ userName, palette, onBack }) => (
// // // //   <LinearGradient
// // // //     colors={['#0A4F4E', '#0D7B7A']}
// // // //     start={{ x: 0, y: 0 }}
// // // //     end={{ x: 1, y: 1 }}
// // // //     style={styles.header}
// // // //   >
// // // //     <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
// // // //       <Icon name="arrow-left" size={20} color="#FFFFFF" />
// // // //     </TouchableOpacity>

// // // //     <View style={styles.headerInfo}>
// // // //       {/* <LinearGradient colors={palette.grad} style={styles.headerAvatar}>
// // // //         <Text style={styles.headerAvatarText}>
// // // //           {userName?.charAt(0)?.toUpperCase() || 'U'}
// // // //         </Text>
// // // //       </LinearGradient> */}
// // // //       <View style={styles.headerTextWrap}>
// // // //         <Text style={styles.headerName} numberOfLines={1}>{userName || 'User'}</Text>
// // // //         {/* <Text style={styles.headerRole}>Customer</Text> */}
// // // //       </View>
// // // //     </View>

// // // //     <View style={styles.headerActions}>
// // // //       <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
// // // //         <Icon name="phone" size={17} color="rgba(255,255,255,0.85)" />
// // // //       </TouchableOpacity>
// // // //       <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
// // // //         <Icon name="more-vertical" size={17} color="rgba(255,255,255,0.85)" />
// // // //       </TouchableOpacity>
// // // //     </View>
// // // //   </LinearGradient>
// // // // ));

// // // // // ─── InputBar — mirrors ChatScreen's InputBar ─────────────────────────────────
// // // // const InputBar = React.memo(({
// // // //   text, setText, inputHeight, onContentSizeChange,
// // // //   onSend, onImagePick, sending,
// // // // }) => {
// // // //   const sendScale = useRef(new Animated.Value(1)).current;

// // // //   const handleSend = useCallback(() => {
// // // //     Animated.sequence([
// // // //       Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
// // // //       Animated.timing(sendScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
// // // //     ]).start();
// // // //     onSend();
// // // //   }, [onSend, sendScale]);

// // // //   const canSend = !!text.trim() && !sending;

// // // //   return (
// // // //     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
// // // //       <View style={styles.inputBar}>
// // // //         <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
// // // //           <Icon name="image" size={20} color="#7C3AED" />
// // // //         </TouchableOpacity>

// // // //         <TextInput
// // // //           style={[
// // // //             styles.input,
// // // //             {
// // // //               height: Math.max(
// // // //                 INPUT_MIN_HEIGHT,
// // // //                 Math.min(
// // // //                   inputHeight,
// // // //                   INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1),
// // // //                 ),
// // // //               ),
// // // //             },
// // // //           ]}
// // // //           placeholder="Type your reply…"
// // // //           placeholderTextColor="#9CA3AF"
// // // //           value={text}
// // // //           onChangeText={setText}
// // // //           multiline
// // // //           maxLength={500}
// // // //           onContentSizeChange={onContentSizeChange}
// // // //         />

// // // //         <Animated.View style={{ transform: [{ scale: sendScale }] }}>
// // // //           <TouchableOpacity
// // // //             style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
// // // //             onPress={handleSend}
// // // //             disabled={!canSend}
// // // //             activeOpacity={0.85}
// // // //           >
// // // //             {sending ? (
// // // //               <ActivityIndicator size="small" color="#FFFFFF" />
// // // //             ) : (
// // // //               <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
// // // //             )}
// // // //           </TouchableOpacity>
// // // //         </Animated.View>
// // // //       </View>
// // // //     </KeyboardAvoidingView>
// // // //   );
// // // // });

// // // // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // // // export default function ExpertReplyChat({ route, navigation }) {
// // // //   const { chatId, userName } = route.params;

// // // //   const [messages, setMessages]             = useState([]);
// // // //   const [text, setText]                     = useState('');
// // // //   const [loading, setLoading]               = useState(true);
// // // //   const [loadError, setLoadError]           = useState(false);
// // // //   const [sending, setSending]               = useState(false);
// // // //   const [uploadingMedia, setUploadingMedia] = useState(false);
// // // //   const [inputHeight, setInputHeight]       = useState(INPUT_MIN_HEIGHT);

// // // //   const flatRef      = useRef(null);
// // // //   const uploadAnim   = useRef(new Animated.Value(0)).current;
// // // //   const isNearBottom = useRef(true);
// // // //   const isMounted    = useRef(true);

// // // //   const uid     = getAuth().currentUser?.uid;
// // // //   const palette = useMemo(() => getPalette(userName), [userName]);

// // // //   // ── Unmount guard ─────────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     isMounted.current = true;
// // // //     return () => { isMounted.current = false; };
// // // //   }, []);

// // // //   // ── Upload bar animation ──────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     Animated.timing(uploadAnim, {
// // // //       toValue: uploadingMedia ? 1 : 0,
// // // //       duration: 250,
// // // //       useNativeDriver: false,
// // // //     }).start();
// // // //   }, [uploadingMedia, uploadAnim]);

// // // //   // ── Mark chat as read when expert opens it ────────────────────────────────
// // // //   useEffect(() => {
// // // //     if (!chatId) return;
// // // //     const db = getFirestore();
// // // //     updateDoc(doc(db, 'chats', chatId), { unreadCount: 0 }).catch(() => {});
// // // //   }, [chatId]);

// // // //   // ── Firestore real-time listener ──────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     const db = getFirestore();
// // // //     const q  = query(
// // // //       collection(db, 'chats', chatId, 'messages'),
// // // //       orderBy('createdAt', 'asc'),
// // // //     );
// // // //     const unsub = onSnapshot(
// // // //       q,
// // // //       (snap) => {
// // // //         if (!isMounted.current) return;
// // // //         setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// // // //         setLoading(false);
// // // //         if (isNearBottom.current) {
// // // //           setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
// // // //         }
// // // //       },
// // // //       () => {
// // // //         if (!isMounted.current) return;
// // // //         setLoading(false);
// // // //         setLoadError(true);
// // // //       },
// // // //     );
// // // //     return unsub;
// // // //   }, [chatId]);

// // // //   // ── Save message — parallel Firestore writes ──────────────────────────────
// // // //   const saveMessage = useCallback(async (msgData) => {
// // // //     const db = getFirestore();
// // // //     const msgPayload = {
// // // //       ...msgData,
// // // //       senderId  : uid,
// // // //       senderRole: 'expert',
// // // //       createdAt : serverTimestamp(),
// // // //     };
// // // //     const lastMsg =
// // // //       msgData.type === 'text'  ? msgData.text  :
// // // //       msgData.type === 'image' ? '📷 Image'    : '';

// // // //     await Promise.all([
// // // //       addDoc(collection(db, 'chats', chatId, 'messages'), msgPayload),
// // // //       updateDoc(doc(db, 'chats', chatId), {
// // // //         lastMessage: lastMsg,
// // // //         updatedAt  : serverTimestamp(),
// // // //         unreadCount: 1,
// // // //       }),
// // // //     ]);
// // // //   }, [chatId, uid]);

// // // //   // ── Text message ──────────────────────────────────────────────────────────
// // // //   const sendTextMessage = useCallback(async () => {
// // // //     const trimmed = text.trim();
// // // //     if (!trimmed || sending) return;
// // // //     setText('');
// // // //     setInputHeight(INPUT_MIN_HEIGHT);
// // // //     setSending(true);
// // // //     try {
// // // //       await saveMessage({ type: 'text', text: trimmed });
// // // //     } catch (e) {
// // // //       console.error('sendTextMessage:', e);
// // // //       Alert.alert('Send Failed', 'Your message could not be sent. Please try again.');
// // // //     } finally {
// // // //       if (isMounted.current) setSending(false);
// // // //     }
// // // //   }, [text, sending, saveMessage]);

// // // //   // ── Image pick ────────────────────────────────────────────────────────────
// // // //   const handlePickerResponse = useCallback(async (image) => {
// // // //     if (!image?.path) return;
// // // //     setUploadingMedia(true);
// // // //     try {
// // // //       const imageUrl = await uploadImage(image.path, chatId);
// // // //       if (!isMounted.current) return;
// // // //       await saveMessage({ type: 'image', imageUrl });
// // // //     } catch {
// // // //       if (!isMounted.current) return;
// // // //       Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
// // // //     } finally {
// // // //       if (isMounted.current) setUploadingMedia(false);
// // // //     }
// // // //   }, [chatId, saveMessage]);

// // // //   const handleImagePick = useCallback(() => {
// // // //     Alert.alert('Select Image', 'Choose a source', [
// // // //       {
// // // //         text   : 'Camera',
// // // //         onPress: () =>
// // // //           ImagePicker.openCamera({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
// // // //             .then(handlePickerResponse)
// // // //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// // // //       },
// // // //       {
// // // //         text   : 'Gallery',
// // // //         onPress: () =>
// // // //           ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
// // // //             .then(handlePickerResponse)
// // // //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// // // //       },
// // // //       { text: 'Cancel', style: 'cancel' },
// // // //     ]);
// // // //   }, [handlePickerResponse]);

// // // //   // ── Helpers ───────────────────────────────────────────────────────────────
// // // //   const formatTime = useCallback((ts) => {
// // // //     if (!ts?.toDate) return '';
// // // //     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
// // // //   }, []);

// // // //   const formatDate = useCallback((ts) => {
// // // //     if (!ts?.toDate) return '';
// // // //     const d         = ts.toDate();
// // // //     const now       = new Date();
// // // //     const yesterday = new Date();
// // // //     yesterday.setDate(now.getDate() - 1);
// // // //     if (d.toDateString() === now.toDateString())       return 'Today';
// // // //     if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
// // // //     return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// // // //   }, []);

// // // //   // ── Sticky-scroll tracking ────────────────────────────────────────────────
// // // //   const handleScroll = useCallback(({ nativeEvent }) => {
// // // //     const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
// // // //     const distFromBottom =
// // // //       contentSize.height - layoutMeasurement.height - contentOffset.y;
// // // //     isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
// // // //   }, []);

// // // //   // ── Input height ──────────────────────────────────────────────────────────
// // // //   const handleContentSizeChange = useCallback((e) => {
// // // //     setInputHeight(e.nativeEvent.contentSize.height + 20);
// // // //   }, []);

// // // //   // ── FlatList render item (stable reference) ───────────────────────────────
// // // //   const renderItem = useCallback(({ item, index }) => (
// // // //     <MessageItem
// // // //       item={item}
// // // //       index={index}
// // // //       messages={messages}
// // // //       uid={uid}
// // // //       userName={userName}
// // // //       palette={palette}
// // // //       formatTime={formatTime}
// // // //       formatDate={formatDate}
// // // //     />
// // // //   ), [messages, uid, userName, palette, formatTime, formatDate]);

// // // //   const keyExtractor = useCallback((item) => item.id, []);

// // // //   const ListEmptyComponent = useMemo(() => (
// // // //     <EmptyState userName={userName} />
// // // //   ), [userName]);

// // // //   // ── Error state ───────────────────────────────────────────────────────────
// // // //   if (loadError) {
// // // //     return (
// // // //       <View style={[styles.container, styles.centered]}>
// // // //         <Icon name="wifi-off" size={40} color="#94A3B8" />
// // // //         <Text style={styles.errorTitle}>Unable to Load Chat</Text>
// // // //         <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
// // // //         <TouchableOpacity
// // // //           style={styles.retryBtn}
// // // //           onPress={() => { setLoadError(false); setLoading(true); }}
// // // //           activeOpacity={0.8}
// // // //         >
// // // //           <Text style={styles.retryBtnText}>Retry</Text>
// // // //         </TouchableOpacity>
// // // //       </View>
// // // //     );
// // // //   }

// // // //   // ── Render ────────────────────────────────────────────────────────────────
// // // //   return (
// // // //     <View style={styles.container}>
// // // //       <StatusBar barStyle="light-content" backgroundColor="#4C1D95" translucent />

// // // //       <ChatHeader
// // // //         userName={userName}
// // // //         palette={palette}
// // // //         onBack={() => navigation.goBack()}
// // // //       />

// // // //       <UploadBar anim={uploadAnim} />

// // // //       {loading ? (
// // // //         <View style={styles.centered}>
// // // //           <ActivityIndicator size="large" color="#0D7B7A" />
// // // //           <Text style={styles.loadingText}>Loading conversation…</Text>
// // // //         </View>
// // // //       ) : (
// // // //         <FlatList
// // // //           ref={flatRef}
// // // //           data={messages}
// // // //           keyExtractor={keyExtractor}
// // // //           renderItem={renderItem}
// // // //           contentContainerStyle={styles.listContent}
// // // //           onScroll={handleScroll}
// // // //           scrollEventThrottle={100}
// // // //           onContentSizeChange={() => {
// // // //             if (isNearBottom.current) {
// // // //               flatRef.current?.scrollToEnd({ animated: true });
// // // //             }
// // // //           }}
// // // //           showsVerticalScrollIndicator={false}
// // // //           ListEmptyComponent={ListEmptyComponent}
// // // //           initialNumToRender={20}
// // // //           maxToRenderPerBatch={10}
// // // //           windowSize={10}
// // // //           removeClippedSubviews={Platform.OS === 'android'}
// // // //           maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
// // // //         />
// // // //       )}

// // // //       <InputBar
// // // //         text={text}
// // // //         setText={setText}
// // // //         inputHeight={inputHeight}
// // // //         onContentSizeChange={handleContentSizeChange}
// // // //         onSend={sendTextMessage}
// // // //         onImagePick={handleImagePick}
// // // //         sending={sending}
// // // //       />
// // // //     </View>
// // // //   );
// // // // }

// // // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // // const styles = StyleSheet.create({
// // // //   container    : { flex: 1, backgroundColor: '#F5F3FF' },
// // // //   centered     : { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
// // // //   loadingText  : { fontSize: 14, color: '#64748B', fontWeight: '500' },

// // // //   // Error state
// // // //   errorTitle   : { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
// // // //   errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
// // // //   retryBtn     : {
// // // //     marginTop: 20, backgroundColor: '#7C3AED',
// // // //     paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
// // // //   },
// // // //   retryBtnText : { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

// // // //   // ── Header ──
// // // //   header: {
// // // //     flexDirection   : 'row',
// // // //     alignItems      : 'center',
// // // //     paddingTop      : 52,
// // // //     paddingBottom   : 14,
// // // //     paddingHorizontal: 12,
// // // //     gap             : 10,
// // // //   },
// // // //   headerBackBtn: {
// // // //     width: 38, height: 38, borderRadius: 12,
// // // //     backgroundColor: 'rgba(255,255,255,0.15)',
// // // //     justifyContent: 'center', alignItems: 'center',
// // // //     marginTop: 4,
// // // //   },
// // // //   headerInfo: {
// // // //     flex: 1, flexDirection: 'row', alignItems: 'center',
// // // //     gap: 10, marginTop: 4,
// // // //   },
// // // //   headerAvatar: {
// // // //     width: 40, height: 40, borderRadius: 13,
// // // //     justifyContent: 'center', alignItems: 'center',
// // // //   },
// // // //   headerAvatarText : { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
// // // //   headerTextWrap   : { flex: 1 },
// // // //   headerName       : { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
// // // //   headerRole       : { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
// // // //   headerActions    : { flexDirection: 'row', gap: 4, marginTop: 4 },
// // // //   headerActionBtn  : {
// // // //     width: 36, height: 36, borderRadius: 10,
// // // //     backgroundColor: 'rgba(255,255,255,0.12)',
// // // //     justifyContent: 'center', alignItems: 'center',
// // // //   },

// // // //   // ── Upload bar ──
// // // //   uploadBar: {
// // // //     flexDirection: 'row', alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //     backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden',
// // // //   },
// // // //   uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

// // // //   // ── Messages ──
// // // //   listContent: { padding: 16, paddingBottom: 8 },

// // // //   dateSeparator: {
// // // //     flexDirection: 'row', alignItems: 'center',
// // // //     marginVertical: 16, gap: 10,
// // // //   },
// // // //   dateLine   : { flex: 1, height: 1, backgroundColor: '#DDD6FE' },
// // // //   datePill   : {
// // // //     backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4,
// // // //     borderRadius: 20, borderWidth: 1, borderColor: '#C4B5FD',
// // // //   },
// // // //   datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

// // // //   msgRow      : { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
// // // //   msgRowMe    : { justifyContent: 'flex-end' },
// // // //   msgRowOther : { justifyContent: 'flex-start' },

// // // //   userAvatar    : { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
// // // //   userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
// // // //   userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

// // // //   bubble: {
// // // //     maxWidth: width * 0.72, borderRadius: 18,
// // // //     paddingHorizontal: 14, paddingVertical: 10,
// // // //   },
// // // //   bubbleMe: {
// // // //     backgroundColor: '#0D7B7A',
// // // //     borderBottomRightRadius: 4,
// // // //   },
// // // //   bubbleOther: {
// // // //     backgroundColor: '#FFFFFF',
// // // //     borderBottomLeftRadius: 4,
// // // //     borderWidth: 1, borderColor: '#EDE9FE',
// // // //     shadowColor: '#0D7B7A',
// // // //     shadowOpacity: 0.06, shadowRadius: 6,
// // // //     shadowOffset: { width: 0, height: 2 },
// // // //     elevation: 2,
// // // //   },
// // // //   msgText     : { fontSize: 15, lineHeight: 22 },
// // // //   msgTextMe   : { color: '#FFFFFF' },
// // // //   msgTextOther: { color: '#1E293B' },
// // // //   msgMeta     : {
// // // //     flexDirection: 'row', alignItems: 'center',
// // // //     justifyContent: 'flex-end', marginTop: 4,
// // // //   },
// // // //   msgTime     : { fontSize: 10, fontWeight: '500' },
// // // //   msgTimeMe   : { color: 'rgba(255,255,255,0.65)' },
// // // //   msgTimeOther: { color: '#94A3B8' },

// // // //   imgBubble     : { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
// // // //   imgBubbleMe   : { borderBottomRightRadius: 4 },
// // // //   imgBubbleOther: { borderBottomLeftRadius: 4 },
// // // //   msgImage      : { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
// // // //   imgTimeBadge  : {
// // // //     position: 'absolute', bottom: 8,
// // // //     flexDirection: 'row', alignItems: 'center',
// // // //     backgroundColor: 'rgba(0,0,0,0.45)',
// // // //     paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
// // // //   },
// // // //   imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

// // // //   // ── Empty state ──
// // // //   emptyState  : { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
// // // //   emptyIconWrap: { marginBottom: 20 },
// // // //   emptyIconGrad: {
// // // //     width: 80, height: 80, borderRadius: 24,
// // // //     justifyContent: 'center', alignItems: 'center',
// // // //   },
// // // //   emptyTitle   : { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
// // // //   emptySubtitle: {
// // // //     fontSize: 14, color: '#64748B', textAlign: 'center',
// // // //     lineHeight: 21, marginBottom: 16,
// // // //   },
// // // //   emptyTipRow  : {
// // // //     flexDirection: 'row', alignItems: 'center', gap: 6,
// // // //     backgroundColor: '#EDE9FE', paddingHorizontal: 14,
// // // //     paddingVertical: 7, borderRadius: 20,
// // // //   },
// // // //   emptyTipText : { fontSize: 12, color: '#7C3AED', fontWeight: '700' },

// // // //   // ── Input bar ──
// // // //   inputBar: {
// // // //     flexDirection: 'row', alignItems: 'flex-end',
// // // //     backgroundColor: '#FFFFFF', paddingHorizontal: 12,
// // // //     paddingVertical: 10,
// // // //     paddingBottom: Platform.OS === 'ios' ? 28 : 10,
// // // //     gap: 8, borderTopWidth: 1, borderTopColor: '#EDE9FE',
// // // //     shadowColor: '#7C3AED', shadowOpacity: 0.06,
// // // //     shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
// // // //     elevation: 8,
// // // //   },
// // // //   attachBtn: {
// // // //     width: 50, height: 50, borderRadius: 14,
// // // //     backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center',
// // // //     borderWidth: 1, borderColor: '#DDD6FE',
// // // //   },
// // // //   input: {
// // // //     flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16,
// // // //     paddingHorizontal: 16,
// // // //     paddingTop: Platform.OS === 'ios' ? 12 : 10,
// // // //     paddingBottom: Platform.OS === 'ios' ? 12 : 10,
// // // //     fontSize: 15, color: '#1E293B',
// // // //     borderWidth: 1, borderColor: '#E2E8F0',
// // // //     lineHeight: INPUT_LINE_HEIGHT,
// // // //   },
// // // //   sendBtn: {
// // // //     width: 50, height: 50, borderRadius: 14,
// // // //     justifyContent: 'center', alignItems: 'center',
// // // //   },
// // // //   sendBtnActive: {
// // // //     backgroundColor: '#7C3AED',
// // // //     shadowColor: '#7C3AED', shadowOpacity: 0.35,
// // // //     shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
// // // //     elevation: 5,
// // // //   },
// // // //   sendBtnInactive: {
// // // //     backgroundColor: '#F1F5F9',
// // // //     borderWidth: 1, borderColor: '#E2E8F0',
// // // //   },
// // // // });



// // // /**
// // //  * ExpertReplyChat.jsx
// // //  * Real-time chat screen for the Expert side.
// // //  * Voice messages added — mirrors ChatScreen.jsx voice architecture exactly.
// // //  */

// // // import React, {
// // //   useEffect, useState, useRef, useCallback, useMemo,
// // // } from 'react';
// // // import {
// // //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// // //   TextInput, KeyboardAvoidingView, Platform,
// // //   ActivityIndicator, StatusBar, Alert, Image,
// // //   Animated, Dimensions, PermissionsAndroid,
// // // } from 'react-native';
// // // import LinearGradient from 'react-native-linear-gradient';
// // // import Icon from 'react-native-vector-icons/Feather';
// // // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// // // import {
// // //   getFirestore, collection, query, orderBy,
// // //   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
// // // } from '@react-native-firebase/firestore';
// // // import { getAuth } from '@react-native-firebase/auth';
// // // import ImagePicker from 'react-native-image-crop-picker';
// // // import AudioRecord from 'react-native-audio-record';
// // // import Sound from 'react-native-sound';
// // // import { uploadImage, uploadVoice } from '../../utils/mediaUpload';

// // // Sound.setCategory('Playback');

// // // const { width } = Dimensions.get('window');

// // // // ─── Palette ──────────────────────────────────────────────────────────────────
// // // const AVATAR_PALETTES = [
// // //   { grad: ['#2563EB', '#1D4ED8'] },
// // //   { grad: ['#7C3AED', '#6D28D9'] },
// // //   { grad: ['#DB2777', '#BE185D'] },
// // //   { grad: ['#059669', '#047857'] },
// // //   { grad: ['#D97706', '#B45309'] },
// // //   { grad: ['#0D7B7A', '#0A4F4E'] },
// // // ];
// // // const getPalette = (name) =>
// // //   AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// // // // ─── Constants ────────────────────────────────────────────────────────────────
// // // const INPUT_MIN_HEIGHT = 2;
// // // const INPUT_MAX_LINES = 5;
// // // const INPUT_LINE_HEIGHT = 12;
// // // const SCROLL_THRESHOLD = 120;
// // // const MAX_RECORD_SECS = 60;

// // // // ─── DateSeparator ────────────────────────────────────────────────────────────
// // // const DateSeparator = React.memo(({ label }) => (
// // //   <View style={styles.dateSeparator}>
// // //     <View style={styles.dateLine} />
// // //     <View style={styles.datePill}>
// // //       <Text style={styles.datePillText}>{label}</Text>
// // //     </View>
// // //     <View style={styles.dateLine} />
// // //   </View>
// // // ));

// // // // ─── UserAvatar ───────────────────────────────────────────────────────────────
// // // const UserAvatar = React.memo(({ name, palette, invisible }) => (
// // //   <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
// // //     <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
// // //       <Text style={styles.userAvatarText}>
// // //         {name?.charAt(0)?.toUpperCase() || 'U'}
// // //       </Text>
// // //     </LinearGradient>
// // //   </View>
// // // ));

// // // // ─── TextBubble ───────────────────────────────────────────────────────────────
// // // const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
// // //   <View style={[
// // //     styles.bubble,
// // //     isMe ? styles.bubbleMe : styles.bubbleOther,
// // //     isMe && isConsecutive && { borderTopRightRadius: 6 },
// // //     !isMe && isConsecutive && { borderTopLeftRadius: 6 },
// // //   ]}>
// // //     <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
// // //       {item.text}
// // //     </Text>
// // //     <View style={styles.msgMeta}>
// // //       <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// // //         {time}
// // //       </Text>
// // //       {isMe && (
// // //         <MatIcon name="check-all" size={13} color="rgba(221,214,254,0.9)" style={{ marginLeft: 3 }} />
// // //       )}
// // //     </View>
// // //   </View>
// // // ));

// // // // ─── ImageBubble ──────────────────────────────────────────────────────────────
// // // const ImageBubble = React.memo(({ item, isMe, time }) => (
// // //   <View style={[styles.imgBubble, isMe ? styles.imgBubbleMe : styles.imgBubbleOther]}>
// // //     <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
// // //     <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
// // //       <Text style={styles.imgTimeText}>{time}</Text>
// // //       {isMe && (
// // //         <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
// // //       )}
// // //     </View>
// // //   </View>
// // // ));

// // // // ─── VoiceBubble ──────────────────────────────────────────────────────────────
// // // const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
// // //   const [playing, setPlaying] = useState(false);

// // //   const handlePress = useCallback(() => {
// // //     onPlay(item.voiceUrl, playing, setPlaying);
// // //   }, [item.voiceUrl, playing, onPlay]);

// // //   const durSecs = item.duration ?? 0;
// // //   const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
// // //   const bars = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

// // //   return (
// // //     <View style={[
// // //       styles.bubble,
// // //       isMe ? styles.bubbleMe : styles.bubbleOther,
// // //       styles.voiceBubble,
// // //     ]}>
// // //       <TouchableOpacity
// // //         onPress={handlePress}
// // //         style={[
// // //           styles.voicePlayBtn,
// // //           { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#EDE9FE' },
// // //         ]}
// // //         activeOpacity={0.75}
// // //       >
// // //         <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#7C3AED'} />
// // //       </TouchableOpacity>

// // //       <View style={styles.waveform}>
// // //         {bars.map((h, i) => (
// // //           <View
// // //             key={i}
// // //             style={[
// // //               styles.waveBar,
// // //               { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#7C3AED' },
// // //             ]}
// // //           />
// // //         ))}
// // //       </View>

// // //       <View style={{ alignItems: 'flex-end' }}>
// // //         <Text style={[styles.voiceDuration, isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#7C3AED' }]}>
// // //           {durLabel}
// // //         </Text>
// // //         <View style={styles.msgMeta}>
// // //           <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// // //             {time}
// // //           </Text>
// // //           {isMe && (
// // //             <MatIcon name="check-all" size={11} color="rgba(221,214,254,0.9)" style={{ marginLeft: 2 }} />
// // //           )}
// // //         </View>
// // //       </View>
// // //     </View>
// // //   );
// // // });

// // // // ─── MessageItem ──────────────────────────────────────────────────────────────
// // // const MessageItem = React.memo(({
// // //   item, index, messages, uid, userName, palette,
// // //   formatTime, formatDate, onPlayVoice,
// // // }) => {
// // //   const isMe = item.senderRole === 'expert';
// // //   const showDate = index === 0 || (
// // //     messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
// // //     item.createdAt?.toDate?.()?.toDateString()
// // //   );
// // //   const isConsecutive =
// // //     index > 0 &&
// // //     messages[index - 1]?.senderRole === item.senderRole &&
// // //     !showDate;

// // //   const time = formatTime(item.createdAt);

// // //   return (
// // //     <>
// // //       {showDate && item.createdAt && (
// // //         <DateSeparator label={formatDate(item.createdAt)} />
// // //       )}
// // //       <View style={[
// // //         styles.msgRow,
// // //         isMe ? styles.msgRowMe : styles.msgRowOther,
// // //         isConsecutive && { marginTop: 2 },
// // //       ]}>
// // //         {!isMe && (
// // //           <UserAvatar name={userName} palette={palette} invisible={isConsecutive} />
// // //         )}

// // //         {item.type === 'text' && (
// // //           <TextBubble item={item} isMe={isMe} isConsecutive={isConsecutive} time={time} />
// // //         )}
// // //         {item.type === 'image' && (
// // //           <ImageBubble item={item} isMe={isMe} time={time} />
// // //         )}
// // //         {item.type === 'voice' && (
// // //           <VoiceBubble item={item} isMe={isMe} time={time} onPlay={onPlayVoice} />
// // //         )}
// // //       </View>
// // //     </>
// // //   );
// // // });

// // // // ─── UploadBar ────────────────────────────────────────────────────────────────
// // // const UploadBar = React.memo(({ anim, label }) => (
// // //   <Animated.View style={[
// // //     styles.uploadBar,
// // //     {
// // //       maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
// // //       opacity: anim,
// // //     },
// // //   ]}>
// // //     <ActivityIndicator size="small" color="#FFFFFF" />
// // //     <Text style={styles.uploadText}>{label}</Text>
// // //   </Animated.View>
// // // ));

// // // // ─── EmptyState ───────────────────────────────────────────────────────────────
// // // const EmptyState = React.memo(({ userName }) => (
// // //   <View style={styles.emptyState}>
// // //     <View style={styles.emptyIconWrap}>
// // //       <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.emptyIconGrad}>
// // //         <Icon name="message-circle" size={36} color="#7C3AED" />
// // //       </LinearGradient>
// // //     </View>
// // //     <Text style={styles.emptyTitle}>No Messages Yet</Text>
// // //     <Text style={styles.emptySubtitle}>
// // //       When {userName} sends a message,{'\n'}it will appear here.
// // //     </Text>
// // //     <View style={styles.emptyTipRow}>
// // //       <Icon name="shield" size={13} color="#7C3AED" />
// // //       <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
// // //     </View>
// // //   </View>
// // // ));

// // // // ─── ChatHeader ───────────────────────────────────────────────────────────────
// // // const ChatHeader = React.memo(({ userName, palette, onBack }) => (
// // //   <LinearGradient
// // //     colors={['#0A4F4E', '#0D7B7A']}
// // //     start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
// // //     style={styles.header}
// // //   >
// // //     <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
// // //       <Icon name="arrow-left" size={20} color="#FFFFFF" />
// // //     </TouchableOpacity>
// // //     <View style={styles.headerInfo}>
// // //       <View style={styles.headerTextWrap}>
// // //         <Text style={styles.headerName} numberOfLines={1}>{userName || 'User'}</Text>
// // //       </View>
// // //     </View>
// // //     <View style={styles.headerActions}>
// // //       <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
// // //         <Icon name="phone" size={17} color="rgba(255,255,255,0.85)" />
// // //       </TouchableOpacity>
// // //       <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.75}>
// // //         <Icon name="more-vertical" size={17} color="rgba(255,255,255,0.85)" />
// // //       </TouchableOpacity>
// // //     </View>
// // //   </LinearGradient>
// // // ));

// // // // ─── InputBar ─────────────────────────────────────────────────────────────────
// // // const InputBar = React.memo(({
// // //   text, setText, inputHeight, onContentSizeChange,
// // //   onSend, onImagePick, sending,
// // //   isRecording, recordingSecs,
// // //   onStartRecord, onStopRecord,
// // //   uploadingVoice,
// // // }) => {
// // //   const sendScale = useRef(new Animated.Value(1)).current;

// // //   const handleSend = useCallback(() => {
// // //     Animated.sequence([
// // //       Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
// // //       Animated.timing(sendScale, { toValue: 1, duration: 120, useNativeDriver: true }),
// // //     ]).start();
// // //     onSend();
// // //   }, [onSend, sendScale]);

// // //   const canSend = !!text.trim() && !sending;

// // //   // ── Recording UI ──────────────────────────────────────────────────────────
// // //   if (isRecording) {
// // //     return (
// // //       <View style={styles.inputBar}>
// // //         <View style={styles.recordingBar}>
// // //           <View style={styles.recordingDot} />
// // //           <Text style={styles.recordingTimer}>
// // //             0:{String(recordingSecs).padStart(2, '0')}
// // //           </Text>
// // //           <Text style={styles.recordingHint}>Recording… tap ■ to send</Text>
// // //           <TouchableOpacity style={styles.stopRecordBtn} onPress={onStopRecord} activeOpacity={0.8}>
// // //             <Icon name="send" size={16} color="#FFFFFF" />
// // //           </TouchableOpacity>
// // //         </View>
// // //       </View>
// // //     );
// // //   }

// // //   // ── Normal UI ─────────────────────────────────────────────────────────────
// // //   return (
// // //     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
// // //       <View style={styles.inputBar}>
// // //         <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
// // //           <Icon name="image" size={20} color="#7C3AED" />
// // //         </TouchableOpacity>

// // //         <TextInput
// // //           style={[
// // //             styles.input,
// // //             {
// // //               height: Math.max(
// // //                 INPUT_MIN_HEIGHT,
// // //                 Math.min(inputHeight, INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1)),
// // //               ),
// // //             },
// // //           ]}
// // //           placeholder="Type your reply…"
// // //           placeholderTextColor="#9CA3AF"
// // //           value={text}
// // //           onChangeText={setText}
// // //           multiline
// // //           maxLength={500}
// // //           onContentSizeChange={onContentSizeChange}
// // //         />

// // //         {/* Mic — when input empty | Send — when text typed */}
// // //         {!text.trim() ? (
// // //           <TouchableOpacity
// // //             style={[styles.sendBtn, styles.sendBtnActive]}
// // //             onPress={onStartRecord}
// // //             disabled={uploadingVoice}
// // //             activeOpacity={0.85}
// // //           >
// // //             {uploadingVoice
// // //               ? <ActivityIndicator size="small" color="#FFFFFF" />
// // //               : <Icon name="mic" size={18} color="#FFFFFF" />
// // //             }
// // //           </TouchableOpacity>
// // //         ) : (
// // //           <Animated.View style={{ transform: [{ scale: sendScale }] }}>
// // //             <TouchableOpacity
// // //               style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
// // //               onPress={handleSend}
// // //               disabled={!canSend}
// // //               activeOpacity={0.85}
// // //             >
// // //               {sending
// // //                 ? <ActivityIndicator size="small" color="#FFFFFF" />
// // //                 : <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
// // //               }
// // //             </TouchableOpacity>
// // //           </Animated.View>
// // //         )}
// // //       </View>
// // //     </KeyboardAvoidingView>
// // //   );
// // // });

// // // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // // export default function ExpertReplyChat({ route, navigation }) {
// // //   // const { chatId, userName } = route.params;
// // //   const {
// // //     chatId,
// // //     userName,
// // //     isBroadcast = false,
// // //     subcategoryName = '',
// // //     categoryName = '',
// // //   } = route.params;

// // //   const [messages, setMessages] = useState([]);
// // //   const [text, setText] = useState('');
// // //   const [loading, setLoading] = useState(true);
// // //   const [loadError, setLoadError] = useState(false);
// // //   const [sending, setSending] = useState(false);
// // //   const [uploadingMedia, setUploadingMedia] = useState(false);
// // //   const [uploadingVoice, setUploadingVoice] = useState(false);
// // //   const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);

// // //   const chatCollection = isBroadcast ? 'broadcastChats' : 'chats';

// // //   // ── Voice state ───────────────────────────────────────────────────────────
// // //   const [isRecording, setIsRecording] = useState(false);
// // //   const [recordingSecs, setRecordingSecs] = useState(0);
// // //   const recordingTimer = useRef(null);
// // //   const currentSound = useRef(null);

// // //   const flatRef = useRef(null);
// // //   const uploadAnim = useRef(new Animated.Value(0)).current;
// // //   const isNearBottom = useRef(true);
// // //   const isMounted = useRef(true);

// // //   const uid = getAuth().currentUser?.uid;
// // //   const palette = useMemo(() => getPalette(userName), [userName]);

// // //   // ── Unmount guard ─────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     isMounted.current = true;
// // //     return () => {
// // //       isMounted.current = false;
// // //       clearInterval(recordingTimer.current);
// // //       if (currentSound.current) {
// // //         currentSound.current.stop();
// // //         currentSound.current.release();
// // //       }
// // //     };
// // //   }, []);

// // //   // ── AudioRecord init ──────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     AudioRecord.init({
// // //       sampleRate: 44100,
// // //       channels: 1,
// // //       bitsPerSample: 16,
// // //       wavFile: `voice_expert_${Date.now()}.wav`,
// // //     });
// // //   }, []);

// // //   // ── Upload bar animation ──────────────────────────────────────────────────
// // //   const uploadVisible = uploadingMedia || uploadingVoice;
// // //   useEffect(() => {
// // //     Animated.timing(uploadAnim, {
// // //       toValue: uploadVisible ? 1 : 0,
// // //       duration: 250,
// // //       useNativeDriver: false,
// // //     }).start();
// // //   }, [uploadVisible, uploadAnim]);

// // //   // // ── Mark chat as read when expert opens it ────────────────────────────────
// // //   // useEffect(() => {
// // //   //   if (!chatId) return;
// // //   //   const db = getFirestore();
// // //   //   updateDoc(doc(db, 'chats', chatId), { unreadCount: 0 }).catch(() => { });
// // //   // }, [chatId]);

// // //   useEffect(() => {
// // //   if (!chatId || isBroadcast) return;  // ← broadcast mein skip
// // //   const db = getFirestore();
// // //   updateDoc(doc(db, 'chats', chatId), { unreadCount: 0 }).catch(() => {});
// // // }, [chatId, isBroadcast]);

// // //   // ── Firestore real-time listener ──────────────────────────────────────────
// // //   useEffect(() => {
// // //     const db = getFirestore();
// // //     const q = query(
// // //       collection(db, 'chatCollection', chatId, 'messages'),
// // //       orderBy('createdAt', 'asc'),
// // //     );
// // //     const unsub = onSnapshot(
// // //       q,
// // //       (snap) => {
// // //         if (!isMounted.current) return;
// // //         setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// // //         setLoading(false);
// // //         if (isNearBottom.current) {
// // //           setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
// // //         }
// // //       },
// // //       () => {
// // //         if (!isMounted.current) return;
// // //         setLoading(false);
// // //         setLoadError(true);
// // //       },
// // //     );
// // //     return unsub;
// // //   }, [chatId]);

// // //   // ── Save message ──────────────────────────────────────────────────────────
// // //   const saveMessage = useCallback(async (msgData) => {
// // //     const db = getFirestore();
// // //     const msgPayload = {
// // //       ...msgData,
// // //       senderId: uid,
// // //       senderRole: 'expert',
// // //       createdAt: serverTimestamp(),
// // //     };
// // //     const lastMsg =
// // //       msgData.type === 'text' ? msgData.text :
// // //         msgData.type === 'image' ? '📷 Image' :
// // //           msgData.type === 'voice' ? '🎤 Voice message' : '';

// // //     await Promise.all([
// // //       addDoc(collection(db, 'chatCollection', chatId, 'messages'), msgPayload),
// // //       updateDoc(doc(db, 'chatCollection', chatId), {
// // //         lastMessage: lastMsg,
// // //         updatedAt: serverTimestamp(),
// // //         unreadCount: 1,
// // //       }),
// // //     ]);
// // //   }, [chatId, uid]);

// // //   // ── Send text ─────────────────────────────────────────────────────────────
// // //   const sendTextMessage = useCallback(async () => {
// // //     const trimmed = text.trim();
// // //     if (!trimmed || sending) return;
// // //     setText('');
// // //     setInputHeight(INPUT_MIN_HEIGHT);
// // //     setSending(true);
// // //     try {
// // //       await saveMessage({ type: 'text', text: trimmed });
// // //     } catch {
// // //       Alert.alert('Send Failed', 'Your message could not be sent. Please try again.');
// // //     } finally {
// // //       if (isMounted.current) setSending(false);
// // //     }
// // //   }, [text, sending, saveMessage]);

// // //   // ── Image pick & upload ───────────────────────────────────────────────────
// // //   const handlePickerResponse = useCallback(async (image) => {
// // //     if (!image?.path) return;
// // //     setUploadingMedia(true);
// // //     try {
// // //       const imageUrl = await uploadImage(image.path, chatId);
// // //       if (!isMounted.current) return;
// // //       await saveMessage({ type: 'image', imageUrl });
// // //     } catch {
// // //       if (!isMounted.current) return;
// // //       Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
// // //     } finally {
// // //       if (isMounted.current) setUploadingMedia(false);
// // //     }
// // //   }, [chatId, saveMessage]);

// // //   const handleImagePick = useCallback(() => {
// // //     Alert.alert('Select Image', 'Choose a source', [
// // //       {
// // //         text: 'Camera',
// // //         onPress: () =>
// // //           ImagePicker.openCamera({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
// // //             .then(handlePickerResponse)
// // //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// // //       },
// // //       {
// // //         text: 'Gallery',
// // //         onPress: () =>
// // //           ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.75, cropping: false })
// // //             .then(handlePickerResponse)
// // //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// // //       },
// // //       { text: 'Cancel', style: 'cancel' },
// // //     ]);
// // //   }, [handlePickerResponse]);

// // //   // ── Mic permission ────────────────────────────────────────────────────────
// // //   const requestMicPermission = useCallback(async () => {
// // //     if (Platform.OS !== 'android') return true;
// // //     const granted = await PermissionsAndroid.request(
// // //       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
// // //       {
// // //         title: 'Microphone Permission',
// // //         message: 'App needs microphone to record voice messages.',
// // //         buttonPositive: 'Allow',
// // //       },
// // //     );
// // //     return granted === PermissionsAndroid.RESULTS.GRANTED;
// // //   }, []);

// // //   // ── Start recording ───────────────────────────────────────────────────────
// // //   const handleStartRecording = useCallback(async () => {
// // //     const ok = await requestMicPermission();
// // //     if (!ok) {
// // //       Alert.alert('Permission Denied', 'Microphone permission is required to send voice messages.');
// // //       return;
// // //     }
// // //     try {
// // //       AudioRecord.init({
// // //         sampleRate: 44100,
// // //         channels: 1,
// // //         bitsPerSample: 16,
// // //         wavFile: `voice_expert_${Date.now()}.wav`,
// // //       });
// // //       AudioRecord.start();
// // //       setIsRecording(true);
// // //       setRecordingSecs(0);

// // //       recordingTimer.current = setInterval(() => {
// // //         setRecordingSecs((s) => {
// // //           if (s >= MAX_RECORD_SECS - 1) {
// // //             handleStopRecording();
// // //             return s;
// // //           }
// // //           return s + 1;
// // //         });
// // //       }, 1000);
// // //     } catch (e) {
// // //       console.error('Start recording error:', e);
// // //       Alert.alert('Error', 'Could not start recording.');
// // //     }
// // //   }, [requestMicPermission]);

// // //   // ── Stop recording & upload ───────────────────────────────────────────────
// // //   const handleStopRecording = useCallback(async () => {
// // //     if (!isRecording) return;
// // //     clearInterval(recordingTimer.current);
// // //     setIsRecording(false);

// // //     let capturedSecs = 0;
// // //     setRecordingSecs((s) => { capturedSecs = s; return 0; });

// // //     try {
// // //       const path = await AudioRecord.stop();
// // //       if (!path) return;

// // //       setUploadingVoice(true);
// // //       const fileUri = Platform.OS === 'android' ? `file://${path}` : path;
// // //       const voiceUrl = await uploadVoice(fileUri, chatId);

// // //       if (!isMounted.current) return;
// // //       await saveMessage({ type: 'voice', voiceUrl, duration: capturedSecs });
// // //     } catch (e) {
// // //       console.error('Stop recording error:', e);
// // //       if (isMounted.current) {
// // //         Alert.alert('Voice Error', 'Could not send voice message. Please try again.');
// // //       }
// // //     } finally {
// // //       if (isMounted.current) setUploadingVoice(false);
// // //     }
// // //   }, [isRecording, chatId, saveMessage]);

// // //   // ── Play voice ────────────────────────────────────────────────────────────
// // //   const handlePlayVoice = useCallback((url, isPlaying, setPlaying) => {
// // //     if (currentSound.current) {
// // //       currentSound.current.stop();
// // //       currentSound.current.release();
// // //       currentSound.current = null;
// // //     }

// // //     if (isPlaying) {
// // //       setPlaying(false);
// // //       return;
// // //     }

// // //     setPlaying(true);
// // //     const sound = new Sound(url, '', (error) => {
// // //       if (error) {
// // //         console.error('Sound load error:', error);
// // //         Alert.alert('Error', 'Could not play voice message.');
// // //         setPlaying(false);
// // //         return;
// // //       }
// // //       currentSound.current = sound;
// // //       sound.play(() => {
// // //         setPlaying(false);
// // //         sound.release();
// // //         currentSound.current = null;
// // //       });
// // //     });
// // //   }, []);

// // //   // ── Helpers ───────────────────────────────────────────────────────────────
// // //   const formatTime = useCallback((ts) => {
// // //     if (!ts?.toDate) return '';
// // //     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
// // //   }, []);

// // //   const formatDate = useCallback((ts) => {
// // //     if (!ts?.toDate) return '';
// // //     const d = ts.toDate();
// // //     const now = new Date();
// // //     const yesterday = new Date();
// // //     yesterday.setDate(now.getDate() - 1);
// // //     if (d.toDateString() === now.toDateString()) return 'Today';
// // //     if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
// // //     return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// // //   }, []);

// // //   const handleScroll = useCallback(({ nativeEvent }) => {
// // //     const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
// // //     const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
// // //     isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
// // //   }, []);

// // //   const handleContentSizeChange = useCallback((e) => {
// // //     setInputHeight(e.nativeEvent.contentSize.height + 20);
// // //   }, []);

// // //   // ── FlatList ──────────────────────────────────────────────────────────────
// // //   const renderItem = useCallback(({ item, index }) => (
// // //     <MessageItem
// // //       item={item}
// // //       index={index}
// // //       messages={messages}
// // //       uid={uid}
// // //       userName={userName}
// // //       palette={palette}
// // //       formatTime={formatTime}
// // //       formatDate={formatDate}
// // //       onPlayVoice={handlePlayVoice}
// // //     />
// // //   ), [messages, uid, userName, palette, formatTime, formatDate, handlePlayVoice]);

// // //   const keyExtractor = useCallback((item) => item.id, []);
// // //   const ListEmptyComponent = useMemo(() => <EmptyState userName={userName} />, [userName]);
// // //   const uploadLabel = uploadingVoice ? 'Sending voice message…' : 'Uploading image…';

// // //   // ── Error state ───────────────────────────────────────────────────────────
// // //   if (loadError) {
// // //     return (
// // //       <View style={[styles.container, styles.centered]}>
// // //         <Icon name="wifi-off" size={40} color="#94A3B8" />
// // //         <Text style={styles.errorTitle}>Unable to Load Chat</Text>
// // //         <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
// // //         <TouchableOpacity
// // //           style={styles.retryBtn}
// // //           onPress={() => { setLoadError(false); setLoading(true); }}
// // //           activeOpacity={0.8}
// // //         >
// // //           <Text style={styles.retryBtnText}>Retry</Text>
// // //         </TouchableOpacity>
// // //       </View>
// // //     );
// // //   }

// // //   // ── Render ────────────────────────────────────────────────────────────────
// // //   return (
// // //     <View style={styles.container}>
// // //       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

// // //       <ChatHeader userName={userName} palette={palette} onBack={() => navigation.goBack()} />

// // //       <UploadBar anim={uploadAnim} label={uploadLabel} />

// // //       {loading ? (
// // //         <View style={styles.centered}>
// // //           <ActivityIndicator size="large" color="#0D7B7A" />
// // //           <Text style={styles.loadingText}>Loading conversation…</Text>
// // //         </View>
// // //       ) : (
// // //         <FlatList
// // //           ref={flatRef}
// // //           data={messages}
// // //           keyExtractor={keyExtractor}
// // //           renderItem={renderItem}
// // //           contentContainerStyle={styles.listContent}
// // //           onScroll={handleScroll}
// // //           scrollEventThrottle={100}
// // //           onContentSizeChange={() => {
// // //             if (isNearBottom.current) flatRef.current?.scrollToEnd({ animated: true });
// // //           }}
// // //           showsVerticalScrollIndicator={false}
// // //           ListEmptyComponent={ListEmptyComponent}
// // //           initialNumToRender={20}
// // //           maxToRenderPerBatch={10}
// // //           windowSize={10}
// // //           removeClippedSubviews={Platform.OS === 'android'}
// // //           maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
// // //         />
// // //       )}

// // //       <InputBar
// // //         text={text}
// // //         setText={setText}
// // //         inputHeight={inputHeight}
// // //         onContentSizeChange={handleContentSizeChange}
// // //         onSend={sendTextMessage}
// // //         onImagePick={handleImagePick}
// // //         sending={sending}
// // //         isRecording={isRecording}
// // //         recordingSecs={recordingSecs}
// // //         onStartRecord={handleStartRecording}
// // //         onStopRecord={handleStopRecording}
// // //         uploadingVoice={uploadingVoice}
// // //       />
// // //     </View>
// // //   );
// // // }

// // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // const styles = StyleSheet.create({
// // //   container: { flex: 1, backgroundColor: '#F5F3FF' },
// // //   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
// // //   loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

// // //   errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
// // //   errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
// // //   retryBtn: { marginTop: 20, backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
// // //   retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

// // //   // Header
// // //   header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 12, gap: 10 },
// // //   headerBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
// // //   headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
// // //   headerTextWrap: { flex: 1 },
// // //   headerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
// // //   headerActions: { flexDirection: 'row', gap: 4, marginTop: 4 },
// // //   headerActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

// // //   // Upload bar
// // //   uploadBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden' },
// // //   uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

// // //   // List
// // //   listContent: { padding: 16, paddingBottom: 8 },

// // //   // Date separator
// // //   dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
// // //   dateLine: { flex: 1, height: 1, backgroundColor: '#DDD6FE' },
// // //   datePill: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#C4B5FD' },
// // //   datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

// // //   // Message row
// // //   msgRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
// // //   msgRowMe: { justifyContent: 'flex-end' },
// // //   msgRowOther: { justifyContent: 'flex-start' },

// // //   userAvatar: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
// // //   userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
// // //   userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

// // //   // Bubble
// // //   bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
// // //   bubbleMe: { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
// // //   bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#7C3AED', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
// // //   msgText: { fontSize: 15, lineHeight: 22 },
// // //   msgTextMe: { color: '#FFFFFF' },
// // //   msgTextOther: { color: '#1E293B' },
// // //   msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
// // //   msgTime: { fontSize: 10, fontWeight: '500' },
// // //   msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
// // //   msgTimeOther: { color: '#94A3B8' },

// // //   // Image bubble
// // //   imgBubble: { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
// // //   imgBubbleMe: { borderBottomRightRadius: 4 },
// // //   imgBubbleOther: { borderBottomLeftRadius: 4 },
// // //   msgImage: { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
// // //   imgTimeBadge: { position: 'absolute', bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
// // //   imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

// // //   // Voice bubble
// // //   voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, maxWidth: width * 0.75 },
// // //   voicePlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
// // //   waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
// // //   waveBar: { width: 3, borderRadius: 2 },
// // //   voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },

// // //   // Empty state
// // //   emptyState: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
// // //   emptyIconWrap: { marginBottom: 20 },
// // //   emptyIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
// // //   emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
// // //   emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 16 },
// // //   emptyTipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
// // //   emptyTipText: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },

// // //   // Input bar
// // //   inputBar: {
// // //     flexDirection: 'row', alignItems: 'flex-end',
// // //     backgroundColor: '#FFFFFF', paddingHorizontal: 12,
// // //     paddingVertical: 10,
// // //     paddingBottom: Platform.OS === 'ios' ? 28 : 10,
// // //     gap: 8, borderTopWidth: 1, borderTopColor: '#EDE9FE',
// // //     shadowColor: '#7C3AED', shadowOpacity: 0.06,
// // //     shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
// // //     elevation: 8,
// // //   },
// // //   attachBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD6FE' },
// // //   input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 10, paddingBottom: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0', lineHeight: INPUT_LINE_HEIGHT },
// // //   sendBtn: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
// // //   sendBtnActive: { backgroundColor: '#7C3AED', shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
// // //   sendBtnInactive: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },

// // //   // Recording bar
// // //   recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
// // //   recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
// // //   recordingTimer: { fontSize: 14, fontWeight: '800', color: '#DC2626', minWidth: 36 },
// // //   recordingHint: { flex: 1, fontSize: 12, color: '#64748B' },
// // //   stopRecordBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
// // // });


// // import React, {
// //   useEffect, useState, useRef, useCallback, useMemo,
// // } from 'react';
// // import {
// //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// //   TextInput, KeyboardAvoidingView, Platform,
// //   ActivityIndicator, StatusBar, Alert, Image,
// //   Animated, Dimensions, PermissionsAndroid,
// // } from 'react-native';
// // import LinearGradient from 'react-native-linear-gradient';
// // import Icon from 'react-native-vector-icons/Feather';
// // import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// // import {
// //   getFirestore, collection, query, orderBy,
// //   onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc,
// // } from '@react-native-firebase/firestore';
// // import auth from '@react-native-firebase/auth';
// // import ImagePicker from 'react-native-image-crop-picker';
// // import AudioRecord from 'react-native-audio-record';
// // import { uploadImage, uploadVoice } from '../../utils/mediaUpload';
// // import Sound from 'react-native-sound';
// // Sound.setCategory('Playback');

// // const { width } = Dimensions.get('window');

// // // ─── Palette ──────────────────────────────────────────────────────────────────
// // const AVATAR_PALETTES = [
// //   { grad: ['#2563EB', '#1D4ED8'] },
// //   { grad: ['#7C3AED', '#6D28D9'] },
// //   { grad: ['#DB2777', '#BE185D'] },
// //   { grad: ['#059669', '#047857'] },
// //   { grad: ['#D97706', '#B45309'] },
// //   { grad: ['#0D7B7A', '#0A4F4E'] },
// // ];
// // const getPalette = (name) =>
// //   AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// // // ─── Constants ────────────────────────────────────────────────────────────────
// // const MAX_RECORD_SECS = 60;
// // const INPUT_MIN_HEIGHT = 2;
// // const INPUT_MAX_LINES = 5;
// // const INPUT_LINE_HEIGHT = 12;
// // const SCROLL_THRESHOLD = 120; // px from bottom → sticky scroll active

// // // ─── DateSeparator ────────────────────────────────────────────────────────────
// // const DateSeparator = React.memo(({ label }) => (
// //   <View style={styles.dateSeparator}>
// //     <View style={styles.dateLine} />
// //     <View style={styles.datePill}>
// //       <Text style={styles.datePillText}>{label}</Text>
// //     </View>
// //     <View style={styles.dateLine} />
// //   </View>
// // ));

// // // ─── UserAvatar ───────────────────────────────────────────────────────────────
// // const UserAvatar = React.memo(({ name, invisible }) => {
// //   const palette = getPalette(name);
// //   return (
// //     <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
// //       <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
// //         <Text style={styles.userAvatarText}>
// //           {name?.charAt(0)?.toUpperCase() || 'U'}
// //         </Text>
// //       </LinearGradient>
// //     </View>
// //   );
// // });

// // // ─── TextBubble ───────────────────────────────────────────────────────────────
// // const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
// //   <View style={[
// //     styles.bubble,
// //     isMe ? styles.bubbleMe : styles.bubbleOther,
// //     isMe && isConsecutive && { borderTopRightRadius: 6 },
// //     !isMe && isConsecutive && { borderTopLeftRadius: 6 },
// //   ]}>
// //     {/* Sender name for broadcast (when multiple experts can reply) */}
// //     {/* {!isMe && item.senderName ? (
// //       <Text style={styles.senderName}>{item.senderName}</Text>
// //     ) : null} */}
// //     <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
// //       {item.text}
// //     </Text>
// //     <View style={styles.msgMeta}>
// //       <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// //         {time}
// //       </Text>
// //       {isMe && (
// //         <MatIcon name="check-all" size={13} color="rgba(191,219,254,0.9)" style={{ marginLeft: 3 }} />
// //       )}
// //     </View>
// //   </View>
// // ));

// // // ─── ImageBubble ──────────────────────────────────────────────────────────────
// // const ImageBubble = React.memo(({ item, isMe, time }) => (
// //   <View style={[styles.imgBubble, isMe ? styles.imgBubbleMe : styles.imgBubbleOther]}>
// //     <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
// //     <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
// //       <Text style={styles.imgTimeText}>{time}</Text>
// //       {isMe && (
// //         <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
// //       )}
// //     </View>
// //   </View>
// // ));

// // // ─── VoiceBubble ──────────────────────────────────────────────────────────────
// // const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
// //   const [playing, setPlaying] = useState(false);
// //   const handlePress = useCallback(() => {
// //     onPlay(item.voiceUrl, playing, setPlaying);
// //   }, [item.voiceUrl, playing, onPlay]);

// //   const durSecs = item.duration ?? 0;
// //   const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
// //   const bars = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

// //   return (
// //     <View style={[
// //       styles.bubble,
// //       isMe ? styles.bubbleMe : styles.bubbleOther,
// //       styles.voiceBubble,
// //     ]}>
// //       <TouchableOpacity
// //         onPress={handlePress}
// //         style={[
// //           styles.voicePlayBtn,
// //           { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#E0F2F1' },
// //         ]}
// //         activeOpacity={0.75}
// //       >
// //         <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#0D7B7A'} />
// //       </TouchableOpacity>
// //       <View style={styles.waveform}>
// //         {bars.map((h, i) => (
// //           <View
// //             key={i}
// //             style={[
// //               styles.waveBar,
// //               { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#0D7B7A' },
// //             ]}
// //           />
// //         ))}
// //       </View>
// //       <View style={{ alignItems: 'flex-end' }}>
// //         <Text style={[
// //           styles.voiceDuration,
// //           isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#0D7B7A' },
// //         ]}>
// //           {durLabel}
// //         </Text>
// //         <View style={styles.msgMeta}>
// //           <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// //             {time}
// //           </Text>
// //           {isMe && (
// //             <MatIcon name="check-all" size={11} color="rgba(191,219,254,0.9)" style={{ marginLeft: 2 }} />
// //           )}
// //         </View>
// //       </View>
// //     </View>
// //   );
// // });

// // // ─── MessageItem ──────────────────────────────────────────────────────────────
// // const MessageItem = React.memo(({
// //   item, index, messages, uid, userName, palette,
// //   formatTime, formatDate, onPlayVoice,
// // }) => {
// //   // Expert side: isMe = expert ne bheja (senderRole === 'expert')
// //   // User side: isMe = user ne bheja (senderId === uid)
// //   // Here we are expert, so isMe = senderRole === 'expert'
// //   const isMe = item.senderRole === 'expert';

// //   const showDate = index === 0 || (
// //     messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
// //     item.createdAt?.toDate?.()?.toDateString()
// //   );
// //   const isConsecutive =
// //     index > 0 &&
// //     messages[index - 1]?.senderRole === item.senderRole &&
// //     !showDate;

// //   const time = formatTime(item.createdAt);

// //   return (
// //     <>
// //       {showDate && item.createdAt && (
// //         <DateSeparator label={formatDate(item.createdAt)} />
// //       )}
// //       <View style={[
// //         styles.msgRow,
// //         isMe ? styles.msgRowMe : styles.msgRowOther,
// //         isConsecutive && { marginTop: 2 },
// //       ]}>
// //         {/* User ka avatar left side pe */}
// //         {!isMe && (
// //           <UserAvatar
// //             name={item.userName || userName}
// //             invisible={isConsecutive}
// //           />
// //         )}

// //         {item.type === 'text' && (
// //           <TextBubble
// //             item={item}
// //             isMe={isMe}
// //             isConsecutive={isConsecutive}
// //             time={time}
// //           />
// //         )}
// //         {/* <Text>{item.userName}</Text> */}
// //         {item.type === 'image' && (
// //           <ImageBubble item={item} isMe={isMe} time={time} />
// //         )}
// //         {item.type === 'voice' && (
// //           <VoiceBubble item={item} isMe={isMe} time={time} onPlay={onPlayVoice} />
// //         )}
// //       </View>
// //     </>
// //   );
// // });

// // // ─── UploadBar ────────────────────────────────────────────────────────────────
// // const UploadBar = React.memo(({ anim, label }) => (
// //   <Animated.View style={[
// //     styles.uploadBar,
// //     {
// //       maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
// //       opacity: anim,
// //     },
// //   ]}>
// //     <ActivityIndicator size="small" color="#FFFFFF" />
// //     <Text style={styles.uploadText}>{label}</Text>
// //   </Animated.View>
// // ));

// // // ─── EmptyState ───────────────────────────────────────────────────────────────
// // const EmptyState = React.memo(({ userName, isBroadcast }) => (
// //   <View style={styles.emptyState}>
// //     <View style={styles.emptyIconWrap}>
// //       <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
// //         <Icon name={isBroadcast ? 'users' : 'message-circle'} size={36} color="#0D7B7A" />
// //       </LinearGradient>
// //     </View>
// //     <Text style={styles.emptyTitle}>
// //       {isBroadcast ? 'Broadcast Chat' : 'New Conversation'}
// //     </Text>
// //     <Text style={styles.emptySubtitle}>
// //       {isBroadcast
// //         ? `User needs help. Be the first expert to respond.`
// //         : `${userName || 'User'} is waiting for your reply.`
// //       }
// //     </Text>
// //     <View style={styles.emptyTipRow}>
// //       <Icon name="shield" size={13} color="#059669" />
// //       <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
// //     </View>
// //   </View>
// // ));

// // // ─── ChatHeader ───────────────────────────────────────────────────────────────
// // const ChatHeader = React.memo(({ userName, onBack, isBroadcast, subcategoryName }) => (
// //   <LinearGradient
// //     colors={['#0A4F4E', '#0D7B7A']}
// //     start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
// //     style={styles.header}
// //   >
// //     <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
// //       <Icon name="arrow-left" size={20} color="#FFFFFF" />
// //     </TouchableOpacity>
// //     <View style={styles.headerInfo}>
// //       <View style={styles.headerTextWrap}>
// //         <Text style={styles.headerName} numberOfLines={1}>
// //           {isBroadcast ? 'Users Chats' : (userName || 'User')}
// //         </Text>
// //         <View style={styles.headerSubRow}>
// //           {isBroadcast ? (
// //             <>
// //               <Icon name="users" size={11} color="rgba(255,255,255,0.75)" />
// //               <Text style={styles.headerSub}>Chats</Text>
// //             </>
// //           ) : (
// //             <>
// //               <View style={styles.onlineDot} />
// //               <Text style={styles.headerSub}>{userName || 'User'}</Text>
// //             </>
// //           )}
// //         </View>
// //       </View>
// //     </View>
// //     <View style={styles.headerActions} />
// //   </LinearGradient>
// // ));

// // // ─── InputBar ─────────────────────────────────────────────────────────────────
// // const InputBar = React.memo(({
// //   text, setText, inputHeight, onContentSizeChange,
// //   onSend, onImagePick, sending,
// //   isRecording, recordingSecs,
// //   onStartRecord, onStopRecord,
// //   uploadingVoice,
// // }) => {
// //   const sendScale = useRef(new Animated.Value(1)).current;

// //   const handleSend = useCallback(() => {
// //     Animated.sequence([
// //       Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
// //       Animated.timing(sendScale, { toValue: 1, duration: 120, useNativeDriver: true }),
// //     ]).start();
// //     onSend();
// //   }, [onSend, sendScale]);

// //   const canSend = !!text.trim() && !sending;

// //   if (isRecording) {
// //     return (
// //       <View style={styles.inputBar}>
// //         <View style={styles.recordingBar}>
// //           <View style={styles.recordingDot} />
// //           <Text style={styles.recordingTimer}>
// //             0:{String(recordingSecs).padStart(2, '0')}
// //           </Text>
// //           <Text style={styles.recordingHint}>Recording… tap ■ to send</Text>
// //           <TouchableOpacity
// //             style={styles.stopRecordBtn}
// //             onPress={onStopRecord}
// //             activeOpacity={0.8}
// //           >
// //             <Icon name="send" size={16} color="#FFFFFF" />
// //           </TouchableOpacity>
// //         </View>
// //       </View>
// //     );
// //   }

// //   return (
// //     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
// //       <View style={styles.inputBar}>
// //         <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
// //           <Icon name="image" size={20} color="#0D7B7A" />
// //         </TouchableOpacity>

// //         <TextInput
// //           style={[
// //             styles.input,
// //             {
// //               height: Math.max(
// //                 INPUT_MIN_HEIGHT,
// //                 Math.min(inputHeight, INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1)),
// //               ),
// //             },
// //           ]}
// //           placeholder="Type a reply…"
// //           placeholderTextColor="#9CA3AF"
// //           value={text}
// //           onChangeText={setText}
// //           multiline
// //           maxLength={500}
// //           onContentSizeChange={onContentSizeChange}
// //         />

// //         {!text.trim() ? (
// //           <TouchableOpacity
// //             style={[styles.sendBtn, styles.sendBtnActive]}
// //             onPress={onStartRecord}
// //             disabled={uploadingVoice}
// //             activeOpacity={0.85}
// //           >
// //             {uploadingVoice
// //               ? <ActivityIndicator size="small" color="#FFFFFF" />
// //               : <Icon name="mic" size={18} color="#FFFFFF" />
// //             }
// //           </TouchableOpacity>
// //         ) : (
// //           <Animated.View style={{ transform: [{ scale: sendScale }] }}>
// //             <TouchableOpacity
// //               style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
// //               onPress={handleSend}
// //               disabled={!canSend}
// //               activeOpacity={0.85}
// //             >
// //               {sending
// //                 ? <ActivityIndicator size="small" color="#FFFFFF" />
// //                 : <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
// //               }
// //             </TouchableOpacity>
// //           </Animated.View>
// //         )}
// //       </View>
// //     </KeyboardAvoidingView>
// //   );
// // });

// // // ─── Main Screen ──────────────────────────────────────────────────────────────
// // export default function ExpertReplyChat({ route, navigation }) {
// //   const {
// //     chatId,
// //     userName = 'User',
// //     isBroadcast = false,
// //     subcategoryName = '',
// //     categoryName = '',
// //   } = route.params;

// //   // Broadcast = 'broadcastChats', normal = 'chats'
// //   const chatCollection = isBroadcast ? 'broadcastChats' : 'chats';

// //   const [messages, setMessages] = useState([]);
// //   const [text, setText] = useState('');
// //   const [loadError, setLoadError] = useState(false);
// //   const [sending, setSending] = useState(false);
// //   const [uploadingMedia, setUploadingMedia] = useState(false);
// //   const [uploadingVoice, setUploadingVoice] = useState(false);
// //   const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
// //   const [profileLoading, setProfileLoading] = useState(true);
// //   const [messagesLoading, setMessagesLoading] = useState(true);
// //   const [profile, setProfile] = useState(null);

// //   const [isRecording, setIsRecording] = useState(false);
// //   const [recordingSecs, setRecordingSecs] = useState(0);
// //   const recordingTimer = useRef(null);

// //   const flatRef = useRef(null);
// //   const uploadAnim = useRef(new Animated.Value(0)).current;
// //   const isNearBottom = useRef(true);
// //   const isMounted = useRef(true);
// //   const currentSound = useRef(null);

// //   const uid = auth().currentUser?.uid;
// //   const palette = useMemo(() => getPalette(userName), [userName]);

// //   const loading = profileLoading || messagesLoading;

// //   // ── Unmount guard ────────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     isMounted.current = true;
// //     return () => {
// //       isMounted.current = false;
// //       clearInterval(recordingTimer.current);
// //       if (currentSound.current) {
// //         currentSound.current.stop();
// //         currentSound.current.release();
// //       }
// //     };
// //   }, []);

// //   // ── AudioRecord init ─────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     AudioRecord.init({
// //       sampleRate: 44100,
// //       channels: 1,
// //       bitsPerSample: 16,
// //       wavFile: `voice_${Date.now()}.wav`,
// //     });
// //   }, []);

// //   // ── Upload bar animation ─────────────────────────────────────────────────────
// //   const uploadVisible = uploadingMedia || uploadingVoice;
// //   useEffect(() => {
// //     Animated.timing(uploadAnim, {
// //       toValue: uploadVisible ? 1 : 0,
// //       duration: 250,
// //       useNativeDriver: false,
// //     }).start();
// //   }, [uploadVisible, uploadAnim]);

// //   // ── Fetch expert profile ─────────────────────────────────────────────────────
// //   useEffect(() => {
// //     if (!uid) { setProfileLoading(false); return; }
// //     (async () => {
// //       try {
// //         const db = getFirestore();
// //         const d = await getDoc(doc(db, 'users', uid));
// //         if (!isMounted.current) return;
// //         if (d.exists()) setProfile(d.data());
// //       } catch {
// //         // silent
// //       } finally {
// //         if (isMounted.current) setProfileLoading(false);
// //       }
// //     })();
// //   }, [uid]);

// //   // ── Messages listener ────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     if (!chatId) {
// //       setMessagesLoading(false);
// //       setLoadError(true);
// //       return;
// //     }

// //     const db = getFirestore();
// //     const q = query(
// //       collection(db, chatCollection, chatId, 'messages'),
// //       orderBy('createdAt', 'asc'),
// //     );

// //     const unsub = onSnapshot(
// //       q,
// //       (snap) => {
// //         if (!isMounted.current) return;
// //         setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// //         setMessagesLoading(false);
// //         if (isNearBottom.current) {
// //           setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
// //         }
// //       },
// //       (err) => {
// //         console.error('ExpertReplyChat messages error:', err);
// //         if (!isMounted.current) return;
// //         setMessagesLoading(false);
// //         setLoadError(true);
// //       },
// //     );
// //     return unsub;
// //   }, [chatId, chatCollection]);

// //   // ── Save message (expert ke taraf se) ────────────────────────────────────────
// //   const saveMessage = useCallback(async (msgData) => {
// //     const db = getFirestore();

// //     const msgPayload = {
// //       ...msgData,
// //       senderId: uid,
// //       senderRole: 'expert',           // ← Expert always 'expert'
// //       senderName: profile?.name || 'Expert',
// //       createdAt: serverTimestamp(),
// //     };

// //     const lastMsg =
// //       msgData.type === 'text' ? msgData.text :
// //         msgData.type === 'image' ? '📷 Image' :
// //           msgData.type === 'voice' ? '🎤 Voice message' : '';

// //     await Promise.all([
// //       addDoc(collection(db, chatCollection, chatId, 'messages'), msgPayload),
// //       updateDoc(doc(db, chatCollection, chatId), {
// //         lastMessage: lastMsg,
// //         updatedAt: serverTimestamp(),
// //         expertAccepted: true,         // Mark as accepted when expert replies
// //       }),
// //     ]);
// //   }, [chatId, uid, profile, chatCollection]);

// //   // ── Send text ────────────────────────────────────────────────────────────────
// //   const sendTextMessage = useCallback(async () => {
// //     const trimmed = text.trim();
// //     if (!trimmed || sending) return;
// //     setText('');
// //     setInputHeight(INPUT_MIN_HEIGHT);
// //     setSending(true);
// //     try {
// //       await saveMessage({ type: 'text', text: trimmed });
// //     } catch (e) {
// //       console.error('Send error:', e);
// //       Alert.alert('Send Failed', 'Could not send message. Please try again.');
// //     } finally {
// //       if (isMounted.current) setSending(false);
// //     }
// //   }, [text, sending, saveMessage]);

// //   // ── Image pick & upload ──────────────────────────────────────────────────────
// //   const handlePickerResponse = useCallback(async (image) => {
// //     if (!image?.path) return;
// //     setUploadingMedia(true);
// //     try {
// //       const imageUrl = await uploadImage(image.path, chatId);
// //       if (!isMounted.current) return;
// //       await saveMessage({ type: 'image', imageUrl });
// //     } catch {
// //       if (!isMounted.current) return;
// //       Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
// //     } finally {
// //       if (isMounted.current) setUploadingMedia(false);
// //     }
// //   }, [chatId, saveMessage]);

// //   const handleImagePick = useCallback(() => {
// //     Alert.alert('Select Image', 'Choose a source', [
// //       {
// //         text: 'Camera',
// //         onPress: () =>
// //           ImagePicker.openCamera({
// //             mediaType: 'photo', compressImageQuality: 0.75, cropping: true,
// //             cropperCircleOverlay: false,
// //             freeStyleCropEnabled: true,
// //             cropperToolbarTitle: 'Crop Image',
// //             cropperActiveWidgetColor: '#0D7B7A',
// //             cropperStatusBarColor: '#0A4F4E',
// //             cropperToolbarColor: '#0A4F4E',
// //             cropperToolbarWidgetColor: '#FFFFFF',
// //           })
// //             .then(handlePickerResponse)
// //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// //       },
// //       {
// //         text: 'Gallery',
// //         onPress: () =>
// //           ImagePicker.openPicker({ mediaType: 'photo', compressImageQuality: 0.75,  cropping: true,
// //             cropperCircleOverlay: false,
// //             freeStyleCropEnabled: true,
// //             cropperToolbarTitle: 'Crop Image',
// //             cropperActiveWidgetColor: '#0D7B7A',
// //             cropperStatusBarColor: '#0A4F4E',
// //             cropperToolbarColor: '#0A4F4E',
// //             cropperToolbarWidgetColor: '#FFFFFF', })
// //             .then(handlePickerResponse)
// //             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
// //       },
// //       { text: 'Cancel', style: 'cancel' },
// //     ]);
// //   }, [handlePickerResponse]);

// //   // ── Mic permission ───────────────────────────────────────────────────────────
// //   const requestMicPermission = useCallback(async () => {
// //     if (Platform.OS !== 'android') return true;
// //     const granted = await PermissionsAndroid.request(
// //       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
// //       {
// //         title: 'Microphone Permission',
// //         message: 'App needs microphone to record voice messages.',
// //         buttonPositive: 'Allow',
// //       },
// //     );
// //     return granted === PermissionsAndroid.RESULTS.GRANTED;
// //   }, []);

// //   // ── Stop recording ───────────────────────────────────────────────────────────
// //   const handleStopRecording = useCallback(async () => {
// //     if (!isRecording) return;
// //     clearInterval(recordingTimer.current);
// //     setIsRecording(false);

// //     let capturedSecs = 0;
// //     setRecordingSecs((s) => { capturedSecs = s; return 0; });

// //     try {
// //       const path = await AudioRecord.stop();
// //       if (!path) return;
// //       setUploadingVoice(true);
// //       const fileUri = Platform.OS === 'android' ? `file://${path}` : path;
// //       const voiceUrl = await uploadVoice(fileUri, chatId);
// //       if (!isMounted.current) return;
// //       await saveMessage({ type: 'voice', voiceUrl, duration: capturedSecs });
// //     } catch (e) {
// //       console.error('Stop recording error:', e);
// //       if (isMounted.current) Alert.alert('Voice Error', 'Could not send voice message.');
// //     } finally {
// //       if (isMounted.current) setUploadingVoice(false);
// //     }
// //   }, [isRecording, chatId, saveMessage]);

// //   // ── Start recording ──────────────────────────────────────────────────────────
// //   const handleStartRecording = useCallback(async () => {
// //     const ok = await requestMicPermission();
// //     if (!ok) {
// //       Alert.alert('Permission Denied', 'Microphone permission is required.');
// //       return;
// //     }
// //     try {
// //       AudioRecord.init({
// //         sampleRate: 44100,
// //         channels: 1,
// //         bitsPerSample: 16,
// //         wavFile: `voice_${Date.now()}.wav`,
// //       });
// //       AudioRecord.start();
// //       setIsRecording(true);
// //       setRecordingSecs(0);
// //       recordingTimer.current = setInterval(() => {
// //         setRecordingSecs((s) => {
// //           if (s >= MAX_RECORD_SECS - 1) {
// //             handleStopRecording();
// //             return s;
// //           }
// //           return s + 1;
// //         });
// //       }, 1000);
// //     } catch (e) {
// //       console.error('Start recording error:', e);
// //       Alert.alert('Error', 'Could not start recording.');
// //     }
// //   }, [requestMicPermission, handleStopRecording]);

// //   // ── Play voice ───────────────────────────────────────────────────────────────
// //   const handlePlayVoice = useCallback((url, isPlaying, setPlaying) => {
// //     if (currentSound.current) {
// //       currentSound.current.stop();
// //       currentSound.current.release();
// //       currentSound.current = null;
// //     }
// //     if (isPlaying) { setPlaying(false); return; }
// //     setPlaying(true);
// //     const sound = new Sound(url, '', (error) => {
// //       if (error) {
// //         Alert.alert('Error', 'Could not play voice message.');
// //         setPlaying(false);
// //         return;
// //       }
// //       currentSound.current = sound;
// //       sound.play(() => {
// //         setPlaying(false);
// //         sound.release();
// //         currentSound.current = null;
// //       });
// //     });
// //   }, []);

// //   // ── Helpers ──────────────────────────────────────────────────────────────────
// //   const formatTime = useCallback((ts) => {
// //     if (!ts?.toDate) return '';
// //     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
// //   }, []);

// //   const formatDate = useCallback((ts) => {
// //     if (!ts?.toDate) return '';
// //     const d = ts.toDate();
// //     const now = new Date();
// //     const yesterday = new Date();
// //     yesterday.setDate(now.getDate() - 1);
// //     if (d.toDateString() === now.toDateString()) return 'Today';
// //     if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
// //     return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// //   }, []);

// //   const handleScroll = useCallback(({ nativeEvent }) => {
// //     const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
// //     const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
// //     isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
// //   }, []);

// //   const handleContentSizeChange = useCallback((e) => {
// //     setInputHeight(e.nativeEvent.contentSize.height + 20);
// //   }, []);

// //   // ── FlatList ─────────────────────────────────────────────────────────────────
// //   const renderItem = useCallback(({ item, index }) => (
// //     <MessageItem
// //       item={item}
// //       index={index}
// //       messages={messages}
// //       uid={uid}
// //       userName={userName}
// //       palette={palette}
// //       formatTime={formatTime}
// //       formatDate={formatDate}
// //       onPlayVoice={handlePlayVoice}
// //     />
// //   ), [messages, uid, userName, palette, formatTime, formatDate, handlePlayVoice]);

// //   const keyExtractor = useCallback((item) => item.id, []);

// //   const ListEmptyComponent = useMemo(() => (
// //     <EmptyState userName={userName} isBroadcast={isBroadcast} />
// //   ), [userName, isBroadcast]);

// //   const uploadLabel = uploadingVoice ? 'Sending voice message…' : 'Uploading image…';

// //   // ── Error state ──────────────────────────────────────────────────────────────
// //   if (loadError) {
// //     return (
// //       <View style={[styles.container, styles.centered]}>
// //         <Icon name="wifi-off" size={40} color="#94A3B8" />
// //         <Text style={styles.errorTitle}>Unable to Load Chat</Text>
// //         <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
// //         <TouchableOpacity
// //           style={styles.retryBtn}
// //           onPress={() => {
// //             setLoadError(false);
// //             setMessagesLoading(true);
// //           }}
// //           activeOpacity={0.8}
// //         >
// //           <Text style={styles.retryBtnText}>Retry</Text>
// //         </TouchableOpacity>
// //       </View>
// //     );
// //   }

// //   // ── Render ───────────────────────────────────────────────────────────────────
// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

// //       <ChatHeader
// //         userName={userName}
// //         onBack={() => navigation.goBack()}
// //         isBroadcast={isBroadcast}
// //         subcategoryName={subcategoryName}
// //       />

// //       <UploadBar anim={uploadAnim} label={uploadLabel} />

// //       {loading ? (
// //         <View style={styles.centered}>
// //           <ActivityIndicator size="large" color="#0D7B7A" />
// //           <Text style={styles.loadingText}>Loading conversation…</Text>
// //         </View>
// //       ) : (
// //         <FlatList
// //           ref={flatRef}
// //           data={messages}
// //           keyExtractor={keyExtractor}
// //           renderItem={renderItem}
// //           contentContainerStyle={styles.listContent}
// //           onScroll={handleScroll}
// //           scrollEventThrottle={100}
// //           onContentSizeChange={() => {
// //             if (isNearBottom.current) flatRef.current?.scrollToEnd({ animated: true });
// //           }}
// //           showsVerticalScrollIndicator={false}
// //           ListEmptyComponent={ListEmptyComponent}
// //           initialNumToRender={20}
// //           maxToRenderPerBatch={10}
// //           windowSize={10}
// //           removeClippedSubviews={Platform.OS === 'android'}
// //           maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
// //         />
// //       )}

// //       <InputBar
// //         text={text}
// //         setText={setText}
// //         inputHeight={inputHeight}
// //         onContentSizeChange={handleContentSizeChange}
// //         onSend={sendTextMessage}
// //         onImagePick={handleImagePick}
// //         sending={sending}
// //         isRecording={isRecording}
// //         recordingSecs={recordingSecs}
// //         onStartRecord={handleStartRecording}
// //         onStopRecord={handleStopRecording}
// //         uploadingVoice={uploadingVoice}
// //       />
// //     </View>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────
// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: '#EFF4F4' },
// //   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
// //   loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

// //   errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
// //   errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
// //   retryBtn: { marginTop: 20, backgroundColor: '#0D7B7A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
// //   retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

// //   // Header
// //   header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 12, gap: 10 },
// //   headerBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
// //   headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
// //   headerTextWrap: { flex: 1 },
// //   headerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
// //   headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
// //   headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
// //   headerActions: { flexDirection: 'row', gap: 4, marginTop: 4 },
// //   onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },

// //   // Upload bar
// //   uploadBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden' },
// //   uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

// //   listContent: { padding: 16, paddingBottom: 8 },

// //   // Date separator
// //   dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
// //   dateLine: { flex: 1, height: 1, backgroundColor: '#D1E8E7' },
// //   datePill: { backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#B2DFDB' },
// //   datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

// //   // Message rows
// //   msgRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
// //   msgRowMe: { justifyContent: 'flex-end' },
// //   msgRowOther: { justifyContent: 'flex-start' },

// //   // User avatar (left side)
// //   userAvatar: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
// //   userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
// //   userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

// //   // Bubbles
// //   bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
// //   bubbleMe: { backgroundColor: '#0D7B7A', borderBottomRightRadius: 4 },
// //   bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2F4F4', shadowColor: '#0D7B7A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
// //   senderName: { fontSize: 11, fontWeight: '700', color: '#0D7B7A', marginBottom: 4 },
// //   msgText: { fontSize: 15, lineHeight: 22 },
// //   msgTextMe: { color: '#FFFFFF' },
// //   msgTextOther: { color: '#1E293B' },
// //   msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
// //   msgTime: { fontSize: 10, fontWeight: '500' },
// //   msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
// //   msgTimeOther: { color: '#94A3B8' },

// //   // Image bubble
// //   imgBubble: { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
// //   imgBubbleMe: { borderBottomRightRadius: 4 },
// //   imgBubbleOther: { borderBottomLeftRadius: 4 },
// //   msgImage: { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
// //   imgTimeBadge: { position: 'absolute', bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
// //   imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

// //   // Voice bubble
// //   voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, maxWidth: width * 0.75 },
// //   voicePlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
// //   waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
// //   waveBar: { width: 3, borderRadius: 2 },
// //   voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },

// //   // Empty state
// //   emptyState: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
// //   emptyIconWrap: { marginBottom: 20 },
// //   emptyIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
// //   emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
// //   emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 16 },
// //   emptyTipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
// //   emptyTipText: { fontSize: 12, color: '#059669', fontWeight: '700' },

// //   // Input bar
// //   inputBar: {
// //     flexDirection: 'row', alignItems: 'flex-end',
// //     backgroundColor: '#FFFFFF',
// //     paddingHorizontal: 12, paddingVertical: 10,
// //     paddingBottom: Platform.OS === 'ios' ? 28 : 10,
// //     gap: 8,
// //     borderTopWidth: 1, borderTopColor: '#E0F2F1',
// //     shadowColor: '#0D7B7A', shadowOpacity: 0.06,
// //     shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
// //     elevation: 8,
// //   },
// //   attachBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CCEFED' },
// //   input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 10, paddingBottom: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0', lineHeight: INPUT_LINE_HEIGHT },
// //   sendBtn: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
// //   sendBtnActive: { backgroundColor: '#0D7B7A', shadowColor: '#0D7B7A', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
// //   sendBtnInactive: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },

// //   // Recording bar
// //   recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
// //   recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
// //   recordingTimer: { fontSize: 14, fontWeight: '800', color: '#DC2626', minWidth: 36 },
// //   recordingHint: { flex: 1, fontSize: 12, color: '#64748B' },
// //   stopRecordBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0D7B7A', justifyContent: 'center', alignItems: 'center' },
// // });


// import React, {
//   useEffect, useState, useRef, useCallback, useMemo,
// } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, KeyboardAvoidingView, Platform,
//   ActivityIndicator, StatusBar, Alert, Image,
//   Animated, Dimensions, PermissionsAndroid, ScrollView,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {
//   getFirestore, collection, query, orderBy,
//   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
//   getDoc, getDocs, where, Timestamp, arrayUnion,
// } from '@react-native-firebase/firestore';

// import auth from '@react-native-firebase/auth';
// import ImagePicker from 'react-native-image-crop-picker';
// import AudioRecord from 'react-native-audio-record';
// import { uploadImage, uploadVoice } from '../../utils/mediaUpload';
// import Sound from 'react-native-sound';
// Sound.setCategory('Playback');

// const { width } = Dimensions.get('window');

// // ─── Palette ──────────────────────────────────────────────────────────────────
// const AVATAR_PALETTES = [
//   { grad: ['#2563EB', '#1D4ED8'] },
//   { grad: ['#7C3AED', '#6D28D9'] },
//   { grad: ['#DB2777', '#BE185D'] },
//   { grad: ['#059669', '#047857'] },
//   { grad: ['#D97706', '#B45309'] },
//   { grad: ['#0D7B7A', '#0A4F4E'] },
// ];
// const getPalette = (name) =>
//   AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// // ─── Constants ────────────────────────────────────────────────────────────────
// const MAX_RECORD_SECS = 60;
// const INPUT_MIN_HEIGHT = 44;   // minimum touch target + text visible
// const INPUT_MAX_LINES = 4;
// const INPUT_LINE_HEIGHT = 22;  // fontSize 15 ke liye proper line height
// const SCROLL_THRESHOLD = 120;

// // ─── DateSeparator ────────────────────────────────────────────────────────────
// const DateSeparator = React.memo(({ label }) => (
//   <View style={styles.dateSeparator}>
//     <View style={styles.dateLine} />
//     <View style={styles.datePill}>
//       <Text style={styles.datePillText}>{label}</Text>
//     </View>
//     <View style={styles.dateLine} />
//   </View>
// ));

// // ─── UserAvatar ───────────────────────────────────────────────────────────────
// const UserAvatar = React.memo(({ name, invisible }) => {
//   const palette = getPalette(name);
//   return (
//     <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
//       <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
//         <Text style={styles.userAvatarText}>
//           {name?.charAt(0)?.toUpperCase() || 'U'}
//         </Text>
//       </LinearGradient>
//     </View>
//   );
// });

// // ─── TextBubble ───────────────────────────────────────────────────────────────
// // const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
// //   <View style={[
// //     styles.bubble,
// //     isMe ? styles.bubbleMe : styles.bubbleOther,
// //     isMe  && isConsecutive && { borderTopRightRadius: 6 },
// //     !isMe && isConsecutive && { borderTopLeftRadius: 6 },
// //   ]}>
// //     {!isMe && item.senderName ? (
// //       <Text style={styles.senderName}>{item.senderName}</Text>
// //     ) : null}
// //     <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
// //       {item.text}
// //     </Text>
// //     <View style={styles.msgMeta}>
// //       <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// //         {time}
// //       </Text>
// //       {isMe && (
// //         <MatIcon name="check-all" size={13} color="rgba(191,219,254,0.9)" style={{ marginLeft: 3 }} />
// //       )}
// //     </View>
// //   </View>
// // ));

// const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
//   <View style={[
//     styles.bubble,
//     isMe ? styles.bubbleMe : styles.bubbleOther,
//     isMe && isConsecutive && { borderTopRightRadius: 6 },
//     !isMe && isConsecutive && { borderTopLeftRadius: 6 },
//   ]}>
//     {/* ✅ Sender label - har message pe (consecutive nahi hone par) */}
//     {item.senderName ? (
//       <Text style={[styles.senderName, isMe && styles.senderNameMe]}>
//         {item.senderRole === 'expert'
//           ? `Replied by ${item.senderName}`
//           : item.senderName}
//       </Text>
//     ) : null}

//     <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
//       {item.text}
//     </Text>
//     <View style={styles.msgMeta}>
//       <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
//         {time}
//       </Text>
//       {isMe && (
//         <MatIcon name="check-all" size={13} color="rgba(191,219,254,0.9)" style={{ marginLeft: 3 }} />
//       )}
//     </View>
//   </View>
// ));

// // ─── ImageBubble ──────────────────────────────────────────────────────────────
// // const ImageBubble = React.memo(({ item, isMe, time }) => (
// //   <View style={[styles.imgBubble, isMe ? styles.imgBubbleMe : styles.imgBubbleOther]}>
// //     <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
// //     <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
// //       <Text style={styles.imgTimeText}>{time}</Text>
// //       {isMe && (
// //         <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
// //       )}
// //     </View>
// //   </View>
// // ));

// const ImageBubble = React.memo(({ item, isMe, time }) => (
//   <View style={[styles.imgBubble, isMe ? styles.imgBubbleMe : styles.imgBubbleOther]}>
//     {/* ✅ Sender label image ke upar */}
//     {item.senderName ? (
//       <View style={[styles.imgSenderBadge, isMe ? { right: 6 } : { left: 6 }]}>
//         <Text style={styles.imgSenderText}>
//           {item.senderRole === 'expert' ? `Replied by ${item.senderName}` : item.senderName}
//         </Text>
//       </View>
//     ) : null}
//     <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
//     <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
//       <Text style={styles.imgTimeText}>{time}</Text>
//       {isMe && (
//         <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
//       )}
//     </View>
//   </View>
// ));

// // ─── VoiceBubble ──────────────────────────────────────────────────────────────
// // const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
// //   const [playing, setPlaying] = useState(false);
// //   const handlePress = useCallback(() => {
// //     onPlay(item.voiceUrl, playing, setPlaying);
// //   }, [item.voiceUrl, playing, onPlay]);

// //   const durSecs  = item.duration ?? 0;
// //   const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
// //   const bars     = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

// //   return (
// //     <View style={[
// //       styles.bubble,
// //       isMe ? styles.bubbleMe : styles.bubbleOther,
// //       styles.voiceBubble,
// //     ]}>


// //       <TouchableOpacity
// //         onPress={handlePress}
// //         style={[
// //           styles.voicePlayBtn,
// //           { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#E0F2F1' },
// //         ]}
// //         activeOpacity={0.75}
// //       >
// //         <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#0D7B7A'} />
// //       </TouchableOpacity>

// //       <View style={styles.waveform}>
// //         {bars.map((h, i) => (
// //           <View
// //             key={i}
// //             style={[
// //               styles.waveBar,
// //               { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#0D7B7A' },
// //             ]}
// //           />
// //         ))}
// //       </View>
// //       <View style={{ alignItems: 'flex-end' }}>
// //         <Text style={[
// //           styles.voiceDuration,
// //           isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#0D7B7A' },
// //         ]}>
// //           {durLabel}
// //         </Text>
// //         <View style={styles.msgMeta}>
// //           <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// //             {time}
// //           </Text>
// //           {isMe && (
// //             <MatIcon name="check-all" size={11} color="rgba(191,219,254,0.9)" style={{ marginLeft: 2 }} />
// //           )}
// //         </View>
// //       </View>

// //     </View>
// //   );
// // });

// const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
//   const [playing, setPlaying] = useState(false);
//   const handlePress = useCallback(() => {
//     onPlay(item.voiceUrl, playing, setPlaying);
//   }, [item.voiceUrl, playing, onPlay]);

//   const durSecs = item.duration ?? 0;
//   const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
//   const bars = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

//   return (
//     <View style={[
//       styles.bubble,
//       isMe ? styles.bubbleMe : styles.bubbleOther,
//       styles.voiceBubble,
//     ]}>
//       {/* ✅ Sender label */}
//       {item.senderName && item.senderRole !== 'system' ? (
//         <Text style={[styles.senderName, isMe && styles.senderNameMe, styles.voiceSenderName]}>
//           {item.senderRole === 'expert'
//             ? `Replied by ${item.senderName}`
//             : item.senderName}
//         </Text>
//       ) : null}

//       <View style={styles.voiceRow}>
//         <TouchableOpacity
//           onPress={handlePress}
//           style={[
//             styles.voicePlayBtn,
//             { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#E0F2F1' },
//           ]}
//           activeOpacity={0.75}
//         >
//           <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#0D7B7A'} />
//         </TouchableOpacity>
//         <View style={styles.waveform}>
//           {bars.map((h, i) => (
//             <View
//               key={i}
//               style={[
//                 styles.waveBar,
//                 { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#0D7B7A' },
//               ]}
//             />
//           ))}
//         </View>
//         <View style={{ alignItems: 'flex-end' }}>
//           <Text style={[
//             styles.voiceDuration,
//             isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#0D7B7A' },
//           ]}>
//             {durLabel}
//           </Text>
//           <View style={styles.msgMeta}>
//             <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
//               {time}
//             </Text>
//             {isMe && (
//               <MatIcon name="check-all" size={11} color="rgba(191,219,254,0.9)" style={{ marginLeft: 2 }} />
//             )}
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// });

// // ─── MessageItem ──────────────────────────────────────────────────────────────
// const MessageItem = React.memo(({
//   item, index, messages, uid, userName, palette,
//   formatTime, formatDate, onPlayVoice,
// }) => {
//   const isMe = item.senderRole === 'expert';

//   const showDate = index === 0 || (
//     messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
//     item.createdAt?.toDate?.()?.toDateString()
//   );
//   const isConsecutive =
//     index > 0 &&
//     messages[index - 1]?.senderRole === item.senderRole &&
//     !showDate;

//   const time = formatTime(item.createdAt);

//   return (
//     <>
//       {showDate && item.createdAt && (
//         <DateSeparator label={formatDate(item.createdAt)} />
//       )}
//       <View style={[
//         styles.msgRow,
//         isMe ? styles.msgRowMe : styles.msgRowOther,
//         isConsecutive && { marginTop: 2 },
//       ]}>
//         {!isMe && (
//           <UserAvatar
//             name={item.userName || userName}
//             invisible={isConsecutive}
//           />
//         )}
//         {item.type === 'text' && (
//           <TextBubble item={item} isMe={isMe} isConsecutive={isConsecutive} time={time} />
//         )}
//         {item.type === 'image' && (
//           <ImageBubble item={item} isMe={isMe} time={time} />
//         )}
//         {item.type === 'voice' && (
//           <VoiceBubble item={item} isMe={isMe} time={time} onPlay={onPlayVoice} />
//         )}
//       </View>
//     </>
//   );
// });

// // ─── UploadBar ────────────────────────────────────────────────────────────────
// const UploadBar = React.memo(({ anim, label }) => (
//   <Animated.View style={[
//     styles.uploadBar,
//     {
//       maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 42] }),
//       opacity: anim,
//     },
//   ]}>
//     <ActivityIndicator size="small" color="#FFFFFF" />
//     <Text style={styles.uploadText}>{label}</Text>
//   </Animated.View>
// ));

// // ─── EmptyState ───────────────────────────────────────────────────────────────
// const EmptyState = React.memo(({ userName, isBroadcast }) => (
//   <View style={styles.emptyState}>
//     <View style={styles.emptyIconWrap}>
//       <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
//         <Icon name={isBroadcast ? 'users' : 'message-circle'} size={36} color="#0D7B7A" />
//       </LinearGradient>
//     </View>
//     <Text style={styles.emptyTitle}>
//       {isBroadcast ? 'Broadcast Chat' : 'New Conversation'}
//     </Text>
//     <Text style={styles.emptySubtitle}>
//       {isBroadcast
//         ? 'User needs help. Be the first expert to respond.'
//         : `${userName || 'User'} is waiting for your reply.`}
//     </Text>
//     <View style={styles.emptyTipRow}>
//       <Icon name="shield" size={13} color="#059669" />
//       <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
//     </View>
//   </View>
// ));

// // ─── RerouteModal ─────────────────────────────────────────────────────────────
// const RerouteModal = React.memo(({
//   visible, onClose, onSelect, subcategories, loading, currentSubcategoryName,
// }) => (
//   <View style={[
//     rerouteStyles.modalWrap,
//     { display: visible ? 'flex' : 'none' },
//   ]}>
//     <TouchableOpacity
//       style={rerouteStyles.backdrop}
//       onPress={onClose}
//       activeOpacity={1}
//     />
//     <View style={rerouteStyles.sheet}>
//       <View style={rerouteStyles.handle} />

//       {/* Header */}
//       <View style={rerouteStyles.headerRow}>
//         <View style={rerouteStyles.headerIcon}>
//           <Icon name="share-2" size={16} color="#0D7B7A" />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={rerouteStyles.title}>Reroute to Expert</Text>
//           <Text style={rerouteStyles.sub}>
//             Select a specialization to forward this query
//           </Text>
//         </View>
//         <TouchableOpacity
//           onPress={onClose}
//           style={rerouteStyles.closeBtn}
//           hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//         >
//           <Icon name="x" size={16} color="#64748B" />
//         </TouchableOpacity>
//       </View>

//       {/* Current tag */}
//       <View style={rerouteStyles.currentRow}>
//         <MatIcon name="map-marker-outline" size={12} color="#94A3B8" />
//         <Text style={rerouteStyles.currentLabel}>Current: </Text>
//         <Text style={rerouteStyles.currentValue}>
//           {currentSubcategoryName || 'Unknown'}
//         </Text>
//       </View>

//       {/* List */}
//       {loading ? (
//         <View style={rerouteStyles.loadingWrap}>
//           <ActivityIndicator color="#0D7B7A" />
//           <Text style={rerouteStyles.loadingText}>Loading specializations…</Text>
//         </View>
//       ) : subcategories.length === 0 ? (
//         <View style={rerouteStyles.loadingWrap}>
//           <MatIcon name="account-off-outline" size={40} color="#CBD5E1" />
//           <Text style={rerouteStyles.emptyText}>No other specializations found</Text>
//         </View>
//       ) : (
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           style={{ maxHeight: 340 }}
//           contentContainerStyle={{ paddingBottom: 8 }}
//         >
//           {subcategories.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={rerouteStyles.subRow}
//               onPress={() => onSelect(item)}
//               activeOpacity={0.75}
//             >
//               {/* Icon */}
//               <View style={rerouteStyles.subIcon}>
//                 <MatIcon name="shape-outline" size={16} color="#0D7B7A" />
//               </View>

//               {/* Info */}
//               <View style={{ flex: 1 }}>
//                 <Text style={rerouteStyles.subName} numberOfLines={1}>
//                   {item.name}
//                 </Text>
//                 <View style={rerouteStyles.subMeta}>
//                   <Icon name="users" size={10} color="#94A3B8" />
//                   <Text style={rerouteStyles.subMetaText}>
//                     {item.expertCount} expert{item.expertCount !== 1 ? 's' : ''} available
//                   </Text>
//                 </View>
//               </View>

//               {/* Badge + Arrow */}
//               <View style={{ alignItems: 'flex-end', gap: 4 }}>
//                 {item.expertCount > 0 ? (
//                   <View style={rerouteStyles.availableBadge}>
//                     <Text style={rerouteStyles.availableBadgeText}>Available</Text>
//                   </View>
//                 ) : (
//                   <View style={rerouteStyles.unavailableBadge}>
//                     <Text style={rerouteStyles.unavailableBadgeText}>No experts</Text>
//                   </View>
//                 )}
//                 <Icon name="chevron-right" size={14} color="#CBD5E1" />
//               </View>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       )}

//       {/* Cancel */}
//       <TouchableOpacity style={rerouteStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
//         <Text style={rerouteStyles.cancelText}>Cancel</Text>
//       </TouchableOpacity>
//     </View>
//   </View>
// ));

// // ─── ChatHeader ───────────────────────────────────────────────────────────────
// const ChatHeader = React.memo(({
//   userName, onBack, isBroadcast, subcategoryName, onReroute,
// }) => (
//   <LinearGradient
//     colors={['#0A4F4E', '#0D7B7A']}
//     start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//     style={styles.header}
//   >
//     <TouchableOpacity onPress={onBack} style={styles.headerBackBtn} activeOpacity={0.75}>
//       <Icon name="arrow-left" size={20} color="#FFFFFF" />
//     </TouchableOpacity>

//     <View style={styles.headerInfo}>
//       <View style={styles.headerTextWrap}>
//         <Text style={styles.headerName} numberOfLines={1}>
//           {isBroadcast ? 'Consultation Chat' : (userName || 'User')}
//         </Text>
//         <View style={styles.headerSubRow}>
//           {isBroadcast ? (
//             <>
//               <Icon name="users" size={11} color="rgba(255,255,255,0.75)" />
//               <Text style={styles.headerSub}>Chats</Text>
//             </>
//           ) : (
//             <>
//               <View style={styles.onlineDot} />
//               <Text style={styles.headerSub}>{userName || 'User'}</Text>
//             </>
//           )}
//         </View>
//       </View>
//     </View>

//     {/* Reroute button */}
//     <TouchableOpacity
//       style={styles.headerActionBtn}
//       onPress={onReroute}
//       activeOpacity={0.75}
//     >
//       <Icon name="share-2" size={17} color="rgba(255,255,255,0.85)" />
//     </TouchableOpacity>
//   </LinearGradient>
// ));

// // ─── InputBar ─────────────────────────────────────────────────────────────────
// const InputBar = React.memo(({
//   text, setText, inputHeight, onContentSizeChange,
//   onSend, onImagePick, sending,
//   isRecording, recordingSecs,
//   onStartRecord, onStopRecord,
//   uploadingVoice,
// }) => {
//   const sendScale = useRef(new Animated.Value(1)).current;

//   const handleSend = useCallback(() => {
//     Animated.sequence([
//       Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
//       Animated.timing(sendScale, { toValue: 1, duration: 120, useNativeDriver: true }),
//     ]).start();
//     onSend();
//   }, [onSend, sendScale]);

//   const canSend = !!text.trim() && !sending;

//   if (isRecording) {
//     return (
//       <View style={styles.inputBar}>
//         <View style={styles.recordingBar}>
//           <View style={styles.recordingDot} />
//           <Text style={styles.recordingTimer}>
//             0:{String(recordingSecs).padStart(2, '0')}
//           </Text>
//           <Text style={styles.recordingHint}>Recording… tap to send</Text>
//           <TouchableOpacity style={styles.stopRecordBtn} onPress={onStopRecord} activeOpacity={0.8}>
//             <Icon name="send" size={16} color="#FFFFFF" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <View style={styles.inputBar}>
//         <TouchableOpacity style={styles.attachBtn} onPress={onImagePick} activeOpacity={0.75}>
//           <Icon name="image" size={20} color="#0D7B7A" />
//         </TouchableOpacity>

//         <TextInput
//           style={[
//             styles.input,
//             {
//               height: Math.max(
//                 INPUT_MIN_HEIGHT,
//                 Math.min(inputHeight, INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1)),
//               ),
//             },
//           ]}
//           placeholder="Type a reply…"
//           placeholderTextColor="#9CA3AF"
//           value={text}
//           onChangeText={setText}
//           multiline
//           maxLength={500}
//           onContentSizeChange={onContentSizeChange}
//           textAlignVertical="top"           // ← multiline ke liye top alignment
//         />

//         {/* <TextInput
//           style={[
//             styles.input,
//             {
//               height: Math.max(
//                 INPUT_MIN_HEIGHT,
//                 Math.min(
//                   inputHeight,
//                   INPUT_MIN_HEIGHT + INPUT_LINE_HEIGHT * (INPUT_MAX_LINES - 1),
//                 ),
//               ),
//             },
//           ]}
//           placeholder="Type a reply…"
//           placeholderTextColor="#9CA3AF"
//           value={text}
//           onChangeText={setText}
//           multiline
//           maxLength={500}
//           onContentSizeChange={onContentSizeChange}
//         /> */}

//         {!text.trim() ? (
//           <TouchableOpacity
//             style={[styles.sendBtn, styles.sendBtnActive]}
//             onPress={onStartRecord}
//             disabled={uploadingVoice}
//             activeOpacity={0.85}
//           >
//             {uploadingVoice
//               ? <ActivityIndicator size="small" color="#FFFFFF" />
//               : <Icon name="mic" size={18} color="#FFFFFF" />
//             }
//           </TouchableOpacity>
//         ) : (
//           <Animated.View style={{ transform: [{ scale: sendScale }] }}>
//             <TouchableOpacity
//               style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
//               onPress={handleSend}
//               disabled={!canSend}
//               activeOpacity={0.85}
//             >
//               {sending
//                 ? <ActivityIndicator size="small" color="#FFFFFF" />
//                 : <Icon name="send" size={18} color={canSend ? '#FFFFFF' : '#94A3B8'} />
//               }
//             </TouchableOpacity>
//           </Animated.View>
//         )}
//       </View>
//     </KeyboardAvoidingView>
//   );
// });

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function ExpertReplyChat({ route, navigation }) {
//   const {
//     chatId,
//     userName = 'User',
//     isBroadcast = false,
//     subcategoryName = '',
//     categoryName = '',
//     expertIds = [],
//   } = route.params;

//   const chatCollection = isBroadcast ? 'broadcastChats' : 'chats';

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState('');
//   const [loadError, setLoadError] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const [uploadingVoice, setUploadingVoice] = useState(false);
//   const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
//   const [profileLoading, setProfileLoading] = useState(true);
//   const [messagesLoading, setMessagesLoading] = useState(true);
//   const [profile, setProfile] = useState(null);

//   // ── Voice state ────────────────────────────────────────────────────────────
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingSecs, setRecordingSecs] = useState(0);
//   const recordingTimer = useRef(null);

//   // ── Reroute state ──────────────────────────────────────────────────────────
//   const [showReroute, setShowReroute] = useState(false);
//   const [subcategories, setSubcategories] = useState([]);
//   const [rerouteLoading, setRerouteLoading] = useState(false);
//   const [rerouting, setRerouting] = useState(false);

//   const flatRef = useRef(null);
//   const uploadAnim = useRef(new Animated.Value(0)).current;
//   const isNearBottom = useRef(true);
//   const isMounted = useRef(true);
//   const currentSound = useRef(null);

//   const uid = auth().currentUser?.uid;
//   const palette = useMemo(() => getPalette(userName), [userName]);
//   const loading = profileLoading || messagesLoading;

//   // ── Unmount guard ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     isMounted.current = true;
//     return () => {
//       isMounted.current = false;
//       clearInterval(recordingTimer.current);
//       if (currentSound.current) {
//         currentSound.current.stop();
//         currentSound.current.release();
//       }
//     };
//   }, []);

//   // ── AudioRecord init ───────────────────────────────────────────────────────
//   useEffect(() => {
//     AudioRecord.init({
//       sampleRate: 44100,
//       channels: 1,
//       bitsPerSample: 16,
//       wavFile: `voice_${Date.now()}.wav`,
//     });
//   }, []);

//   // ── Upload bar animation ───────────────────────────────────────────────────
//   const uploadVisible = uploadingMedia || uploadingVoice;
//   useEffect(() => {
//     Animated.timing(uploadAnim, {
//       toValue: uploadVisible ? 1 : 0,
//       duration: 250,
//       useNativeDriver: false,
//     }).start();
//   }, [uploadVisible, uploadAnim]);

//   // ── Fetch expert profile ───────────────────────────────────────────────────
//   useEffect(() => {
//     if (!uid) { setProfileLoading(false); return; }
//     (async () => {
//       try {
//         const db = getFirestore();
//         const d = await getDoc(doc(db, 'users', uid));
//         if (!isMounted.current) return;
//         if (d.exists()) setProfile(d.data());
//       } catch { /* silent */ } finally {
//         if (isMounted.current) setProfileLoading(false);
//       }
//     })();
//   }, [uid]);

//   // ── Messages listener ──────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!chatId) { setMessagesLoading(false); setLoadError(true); return; }
//     const db = getFirestore();
//     const q = query(
//       collection(db, chatCollection, chatId, 'messages'),
//       orderBy('createdAt', 'asc'),
//     );
//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         if (!isMounted.current) return;
//         setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setMessagesLoading(false);
//         if (isNearBottom.current) {
//           setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
//         }
//       },
//       (err) => {
//         console.error('ExpertReplyChat messages error:', err);
//         if (!isMounted.current) return;
//         setMessagesLoading(false);
//         setLoadError(true);
//       },
//     );
//     return unsub;
//   }, [chatId, chatCollection]);

//   // ── Fetch subcategories for reroute ───────────────────────────────────────
//   // Firestore structure:
//   //   categories/{catId}/subcategories/{subId}  → { name, ... }
//   //   users → { role:'expert', subcategoryId, subcategoryName, isActive }
//   const fetchSubcategoriesForReroute = useCallback(async () => {
//     setRerouteLoading(true);
//     try {
//       const db = getFirestore();

//       // Step 1: Find the category document by name
//       const catSnap = await getDocs(
//         query(collection(db, 'categories'), where('name', '==', categoryName)),
//       );
//       if (catSnap.empty) {
//         setSubcategories([]);
//         return;
//       }
//       const catId = catSnap.docs[0].id;

//       // Step 2: Fetch all subcategories of that category
//       const subSnap = await getDocs(
//         collection(db, 'categories', catId, 'subcategories'),
//       );

//       // Step 3: For each subcategory count active experts
//       const results = await Promise.all(
//         subSnap.docs.map(async (d) => {
//           const subData = d.data();

//           // Count experts who have this subcategoryId
//           const expertSnap = await getDocs(
//             query(
//               collection(db, 'users'),
//               where('role', '==', 'expert'),
//               where('subcategoryId', '==', d.id),
//               where('isActive', '==', true),
//             ),
//           );

//           return {
//             id: d.id,
//             name: subData.name || 'Unknown',
//             expertCount: expertSnap.size,
//             expertIds: expertSnap.docs.map((e) => e.id),
//           };
//         }),
//       );

//       // Step 4: Exclude the current subcategory
//       const filtered = results.filter(
//         (s) => s.name.toLowerCase() !== subcategoryName.toLowerCase(),
//       );

//       if (isMounted.current) setSubcategories(filtered);
//     } catch (e) {
//       console.error('fetchSubcategories error:', e);
//       if (isMounted.current) setSubcategories([]);
//     } finally {
//       if (isMounted.current) setRerouteLoading(false);
//     }
//   }, [categoryName, subcategoryName]);

//   // ── Open reroute modal ─────────────────────────────────────────────────────
//   const handleOpenReroute = useCallback(() => {
//     setShowReroute(true);
//     fetchSubcategoriesForReroute();
//   }, [fetchSubcategoriesForReroute]);

//   const handleCloseReroute = useCallback(() => setShowReroute(false), []);

//   // ── Reroute: create new broadcastChat for target experts ───────────────────
//   // const handleRerouteSelect = useCallback(async (targetSub) => {
//   //   if (targetSub.expertCount === 0) {
//   //     Alert.alert(
//   //       'No Experts Available',
//   //       `No active experts found for "${targetSub.name}". Cannot reroute.`,
//   //     );
//   //     return;
//   //   }

//   //   setShowReroute(false);

//   //   Alert.alert(
//   //     'Confirm Reroute',
//   //     `Forward this query to ${targetSub.expertCount} expert(s) in "${targetSub.name}"?`,
//   //     [
//   //       { text: 'Cancel', style: 'cancel' },
//   //       {
//   //         text   : 'Reroute',
//   //         onPress: async () => {
//   //           setRerouting(true);
//   //           try {
//   //             const db = getFirestore();

//   //             // Last message text for context
//   //             const lastMsg = messages[messages.length - 1]?.text
//   //               || messages[messages.length - 1]?.type === 'image' ? '📷 Image'
//   //               : messages[messages.length - 1]?.type === 'voice'  ? '🎤 Voice'
//   //               : 'Query rerouted';

//   //             // Create new broadcastChat for target experts
//   //             const newDocRef = await addDoc(collection(db, 'broadcastChats'), {
//   //               // User info (original)
//   //               userName,
//   //               userId         : messages[0]?.senderId || '',

//   //               // Category info (target)
//   //               categoryName,
//   //               subcategoryName: targetSub.name,
//   //               subcategoryId  : targetSub.id,

//   //               // Experts who will receive this
//   //               expertIds      : targetSub.expertIds,

//   //               // Message context
//   //               lastMessage    : `[Rerouted] ${lastMsg}`,
//   //               isActive       : true,

//   //               // Timestamps
//   //               createdAt      : serverTimestamp(),
//   //               updatedAt      : serverTimestamp(),

//   //               // Trace — where did this come from
//   //               reroutedFrom   : chatId,
//   //               reroutedBy     : uid,
//   //               reroutedByName : profile?.name || 'Expert',
//   //               originalSubcategoryName: subcategoryName,
//   //             });

//   //             // Also add a system message in original chat for audit trail
//   //             await addDoc(collection(db, chatCollection, chatId, 'messages'), {
//   //               type      : 'text',
//   //               text      : `🔁 Query rerouted to "${targetSub.name}" specialists by ${profile?.name || 'Expert'}`,
//   //               senderId  : uid,
//   //               senderRole: 'system',
//   //               senderName: 'System',
//   //               createdAt : serverTimestamp(),
//   //             });

//   //             // Update original chat's lastMessage
//   //             await updateDoc(doc(db, chatCollection, chatId), {
//   //               lastMessage: `🔁 Rerouted to ${targetSub.name}`,
//   //               updatedAt  : serverTimestamp(),
//   //             });

//   //             Alert.alert(
//   //               'Rerouted Successfully ✓',
//   //               `Query forwarded to ${targetSub.expertCount} expert(s) in "${targetSub.name}".`,
//   //             );
//   //           } catch (e) {
//   //             console.error('Reroute error:', e);
//   //             Alert.alert('Error', 'Could not reroute. Please try again.');
//   //           } finally {
//   //             if (isMounted.current) setRerouting(false);
//   //           }
//   //         },
//   //       },
//   //     ],
//   //   );
//   // }, [
//   //   chatId, chatCollection, userName, categoryName, subcategoryName,
//   //   messages, uid, profile,
//   // ]);

//   // ── Reroute: update SAME chat doc, no new chat created ─────────────────────
//   const handleRerouteSelect = useCallback(async (targetSub) => {
//     if (targetSub.expertCount === 0) {
//       Alert.alert(
//         'No Experts Available',
//         `No active experts found for "${targetSub.name}". Cannot reroute.`,
//       );
//       return;
//     }

//     setShowReroute(false);

//     Alert.alert(
//       'Confirm Reroute',
//       `Forward this query to ${targetSub.expertCount} expert(s) in "${targetSub.name}"?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Reroute',
//           onPress: async () => {
//             setRerouting(true);
//             try {
//               const db = getFirestore();
//               const fromSubName = subcategoryName;

//               // Build the reroute history entry. Arrays can't contain
//               // serverTimestamp() sentinels, so use a client Timestamp here.
//               const rerouteEntry = {
//                 fromSubcategory: fromSubName || null,
//                 fromSubcategoryId: route?.params?.subcategoryId || null,
//                 toSubcategory: targetSub.name,
//                 toSubcategoryId: targetSub.id,
//                 byExpertId: uid,
//                 byExpertName: profile?.name || 'Expert',
//                 at: Timestamp.now(),
//               };

//               // 1) Update the SAME chat doc's routing fields.
//               //    Conversation, chatId, and messages subcollection are untouched.
//               await updateDoc(doc(db, chatCollection, chatId), {
//                 subcategoryId: targetSub.id,
//                 subcategoryName: targetSub.name,

//                 // ✅ Old experts ka access history ke liye banaye rakho —
//                 //    purana uid array se hatao mat, naye experts add karo
//                 expertIds: arrayUnion(...targetSub.expertIds),

//                 // ✅ Active inbox filtering ke liye alag field —
//                 //    sirf naye subcategory ke experts ko "pending" dikhega
//                 activeExpertIds: targetSub.expertIds,

//                 expertAccepted: false, // new experts' inbox treats it as unclaimed
//                 lastMessage: `🔁 Rerouted to ${targetSub.name}`,
//                 updatedAt: serverTimestamp(), // ✅ fine — top-level field, not in array
//                 rerouteHistory: arrayUnion(rerouteEntry), // ✅ no serverTimestamp inside
//               });

//               // 2) Add a system message in the SAME messages subcollection
//               //    so the full history (visible to user + new experts) shows the handoff.
//               await addDoc(collection(db, chatCollection, chatId, 'messages'), {
//                 type: 'text',
//                 text: `🔁 This consultation was rerouted to ${targetSub.name} specialists.`,
//                 senderId: uid,
//                 senderRole: 'system',
//                 senderName: 'System',
//                 createdAt: serverTimestamp(), // ✅ top-level field — fine
//               });

//               Alert.alert(
//                 'Rerouted Successfully ✓',
//                 `Query forwarded to ${targetSub.expertCount} expert(s) in "${targetSub.name}". The same conversation is now visible to them.`,
//               );

//               // navigation.goBack();
//             } catch (e) {
//               console.error('Reroute error:', e);
//               Alert.alert('Error', 'Could not reroute. Please try again.');
//             } finally {
//               if (isMounted.current) setRerouting(false);
//             }
//           },
//         },
//       ],
//     );
//   }, [
//     chatId, chatCollection, subcategoryName, categoryName,
//     uid, profile, navigation, route,
//   ]);
//   // ── Save message ───────────────────────────────────────────────────────────
//   const saveMessage = useCallback(async (msgData) => {
//     const db = getFirestore();
//     const msgPayload = {
//       ...msgData,
//       senderId: uid,
//       senderRole: 'expert',
//       senderName: profile?.name || 'Expert',
//       createdAt: serverTimestamp(),
//     };
//     const lastMsg =
//       msgData.type === 'text' ? msgData.text :
//         msgData.type === 'image' ? '📷 Image' :
//           msgData.type === 'voice' ? '🎤 Voice message' : '';

//     await Promise.all([
//       addDoc(collection(db, chatCollection, chatId, 'messages'), msgPayload),
//       updateDoc(doc(db, chatCollection, chatId), {
//         lastMessage: lastMsg,
//         updatedAt: serverTimestamp(),
//         expertAccepted: true,
//       }),
//     ]);
//   }, [chatId, uid, profile, chatCollection]);

//   // ── Send text ──────────────────────────────────────────────────────────────
//   const sendTextMessage = useCallback(async () => {
//     const trimmed = text.trim();
//     if (!trimmed || sending) return;
//     setText('');
//     setInputHeight(INPUT_MIN_HEIGHT);
//     setSending(true);
//     try {
//       await saveMessage({ type: 'text', text: trimmed });
//     } catch (e) {
//       console.error('Send error:', e);
//       Alert.alert('Send Failed', 'Could not send message. Please try again.');
//     } finally {
//       if (isMounted.current) setSending(false);
//     }
//   }, [text, sending, saveMessage]);

//   // ── Image pick & upload ────────────────────────────────────────────────────
//   const handlePickerResponse = useCallback(async (image) => {
//     if (!image?.path) return;
//     setUploadingMedia(true);
//     try {
//       const imageUrl = await uploadImage(image.path, chatId);
//       if (!isMounted.current) return;
//       await saveMessage({ type: 'image', imageUrl });
//     } catch {
//       if (!isMounted.current) return;
//       Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
//     } finally {
//       if (isMounted.current) setUploadingMedia(false);
//     }
//   }, [chatId, saveMessage]);

//   const handleImagePick = useCallback(() => {
//     Alert.alert('Select Image', 'Choose a source', [
//       {
//         text: 'Camera',
//         onPress: () =>
//           ImagePicker.openCamera({
//             mediaType: 'photo', compressImageQuality: 0.75, cropping: true,
//             cropperActiveWidgetColor: '#0D7B7A',
//             cropperStatusBarColor: '#0A4F4E',
//             cropperToolbarColor: '#0A4F4E',
//             cropperToolbarWidgetColor: '#FFFFFF',
//           })
//             .then(handlePickerResponse)
//             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
//       },
//       {
//         text: 'Gallery',
//         onPress: () =>
//           ImagePicker.openPicker({
//             mediaType: 'photo', compressImageQuality: 0.75, cropping: true,
//             cropperActiveWidgetColor: '#0D7B7A',
//             cropperStatusBarColor: '#0A4F4E',
//             cropperToolbarColor: '#0A4F4E',
//             cropperToolbarWidgetColor: '#FFFFFF',
//           })
//             .then(handlePickerResponse)
//             .catch((e) => { if (e.code !== 'E_PICKER_CANCELLED') console.error(e); }),
//       },
//       { text: 'Cancel', style: 'cancel' },
//     ]);
//   }, [handlePickerResponse]);

//   // ── Mic permission ─────────────────────────────────────────────────────────
//   const requestMicPermission = useCallback(async () => {
//     if (Platform.OS !== 'android') return true;
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//       {
//         title: 'Microphone Permission',
//         message: 'App needs microphone to record voice messages.',
//         buttonPositive: 'Allow',
//       },
//     );
//     return granted === PermissionsAndroid.RESULTS.GRANTED;
//   }, []);

//   // ── Stop recording ─────────────────────────────────────────────────────────
//   const handleStopRecording = useCallback(async () => {
//     if (!isRecording) return;
//     clearInterval(recordingTimer.current);
//     setIsRecording(false);
//     let capturedSecs = 0;
//     setRecordingSecs((s) => { capturedSecs = s; return 0; });
//     try {
//       const path = await AudioRecord.stop();
//       if (!path) return;
//       setUploadingVoice(true);
//       const fileUri = Platform.OS === 'android' ? `file://${path}` : path;
//       const voiceUrl = await uploadVoice(fileUri, chatId);
//       if (!isMounted.current) return;
//       await saveMessage({ type: 'voice', voiceUrl, duration: capturedSecs });
//     } catch (e) {
//       console.error('Stop recording error:', e);
//       if (isMounted.current) Alert.alert('Voice Error', 'Could not send voice message.');
//     } finally {
//       if (isMounted.current) setUploadingVoice(false);
//     }
//   }, [isRecording, chatId, saveMessage]);

//   // ── Start recording ────────────────────────────────────────────────────────
//   const handleStartRecording = useCallback(async () => {
//     const ok = await requestMicPermission();
//     if (!ok) {
//       Alert.alert('Permission Denied', 'Microphone permission is required.');
//       return;
//     }
//     try {
//       AudioRecord.init({
//         sampleRate: 44100,
//         channels: 1,
//         bitsPerSample: 16,
//         wavFile: `voice_${Date.now()}.wav`,
//       });
//       AudioRecord.start();
//       setIsRecording(true);
//       setRecordingSecs(0);
//       recordingTimer.current = setInterval(() => {
//         setRecordingSecs((s) => {
//           if (s >= MAX_RECORD_SECS - 1) { handleStopRecording(); return s; }
//           return s + 1;
//         });
//       }, 1000);
//     } catch (e) {
//       console.error('Start recording error:', e);
//       Alert.alert('Error', 'Could not start recording.');
//     }
//   }, [requestMicPermission, handleStopRecording]);

//   // ── Play voice ─────────────────────────────────────────────────────────────
//   const handlePlayVoice = useCallback((url, isPlaying, setPlaying) => {
//     if (currentSound.current) {
//       currentSound.current.stop();
//       currentSound.current.release();
//       currentSound.current = null;
//     }
//     if (isPlaying) { setPlaying(false); return; }
//     setPlaying(true);
//     const sound = new Sound(url, '', (error) => {
//       if (error) {
//         Alert.alert('Error', 'Could not play voice message.');
//         setPlaying(false);
//         return;
//       }
//       currentSound.current = sound;
//       sound.play(() => {
//         setPlaying(false);
//         sound.release();
//         currentSound.current = null;
//       });
//     });
//   }, []);

//   // ── Helpers ────────────────────────────────────────────────────────────────
//   const formatTime = useCallback((ts) => {
//     if (!ts?.toDate) return '';
//     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
//   }, []);

//   const formatDate = useCallback((ts) => {
//     if (!ts?.toDate) return '';
//     const d = ts.toDate();
//     const now = new Date();
//     const yesterday = new Date();
//     yesterday.setDate(now.getDate() - 1);
//     if (d.toDateString() === now.toDateString()) return 'Today';
//     if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
//     return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
//   }, []);

//   const handleScroll = useCallback(({ nativeEvent }) => {
//     const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
//     const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
//     isNearBottom.current = distFromBottom < SCROLL_THRESHOLD;
//   }, []);

//   const handleContentSizeChange = useCallback((e) => {
//     setInputHeight(e.nativeEvent.contentSize.height + 100);
//   }, []);

//   // ── FlatList ───────────────────────────────────────────────────────────────
//   const renderItem = useCallback(({ item, index }) => (
//     <MessageItem
//       item={item}
//       index={index}
//       messages={messages}
//       uid={uid}
//       userName={userName}
//       palette={palette}
//       formatTime={formatTime}
//       formatDate={formatDate}
//       onPlayVoice={handlePlayVoice}
//     />
//   ), [messages, uid, userName, palette, formatTime, formatDate, handlePlayVoice]);

//   const keyExtractor = useCallback((item) => item.id, []);
//   const ListEmptyComponent = useMemo(() => (
//     <EmptyState userName={userName} isBroadcast={isBroadcast} />
//   ), [userName, isBroadcast]);
//   const uploadLabel = uploadingVoice ? 'Sending voice message…' : 'Uploading image…';

//   // ── Error state ────────────────────────────────────────────────────────────
//   if (loadError) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <Icon name="wifi-off" size={40} color="#94A3B8" />
//         <Text style={styles.errorTitle}>Unable to Load Chat</Text>
//         <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
//         <TouchableOpacity
//           style={styles.retryBtn}
//           onPress={() => { setLoadError(false); setMessagesLoading(true); }}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.retryBtnText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

//       <ChatHeader
//         userName={userName}
//         onBack={() => navigation.goBack()}
//         isBroadcast={isBroadcast}
//         subcategoryName={subcategoryName}
//         onReroute={handleOpenReroute}
//       />

//       <UploadBar anim={uploadAnim} label={uploadLabel} />

//       {/* Rerouting overlay */}
//       {rerouting && (
//         <View style={styles.reroutingOverlay}>
//           <ActivityIndicator color="#0D7B7A" />
//           <Text style={styles.reroutingText}>Rerouting query…</Text>
//         </View>
//       )}

//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color="#0D7B7A" />
//           <Text style={styles.loadingText}>Loading conversation…</Text>
//         </View>
//       ) : (
//         <FlatList
//           ref={flatRef}
//           data={messages}
//           keyExtractor={keyExtractor}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContent}
//           onScroll={handleScroll}
//           scrollEventThrottle={100}
//           onContentSizeChange={() => {
//             if (isNearBottom.current) flatRef.current?.scrollToEnd({ animated: true });
//           }}
//           showsVerticalScrollIndicator={false}
//           ListEmptyComponent={ListEmptyComponent}
//           initialNumToRender={20}
//           maxToRenderPerBatch={10}
//           windowSize={10}
//           removeClippedSubviews={Platform.OS === 'android'}
//           maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
//         />
//       )}

//       <InputBar
//         text={text}
//         setText={setText}
//         inputHeight={inputHeight}
//         onContentSizeChange={handleContentSizeChange}
//         onSend={sendTextMessage}
//         onImagePick={handleImagePick}
//         sending={sending}
//         isRecording={isRecording}
//         recordingSecs={recordingSecs}
//         onStartRecord={handleStartRecording}
//         onStopRecord={handleStopRecording}
//         uploadingVoice={uploadingVoice}
//       />

//       {/* Reroute Modal — rendered inside main View (no Modal component) */}
//       <RerouteModal
//         visible={showReroute}
//         onClose={handleCloseReroute}
//         onSelect={handleRerouteSelect}
//         subcategories={subcategories}
//         loading={rerouteLoading}
//         currentSubcategoryName={subcategoryName}
//       />
//     </View>
//   );
// }

// // ─── Main Styles ──────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#EFF4F4' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
//   loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

//   errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
//   errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
//   retryBtn: { marginTop: 20, backgroundColor: '#0D7B7A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
//   retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

//   // Header
//   header: { flexDirection: 'row', alignItems: 'center', paddingTop: 0, paddingBottom: 10, paddingHorizontal: 12, gap: 10 },
//   headerBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
//   headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
//   headerTextWrap: { flex: 1 },
//   headerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
//   headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
//   headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
//   headerActions: { flexDirection: 'row', gap: 4, marginTop: 4 },
//   headerActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
//   onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },

//   senderName: { fontSize: 11, fontWeight: '700', color: '#0D7B7A', marginBottom: 4 },
//   senderNameMe: { color: 'rgba(255,255,255,0.85)' }, // expert ke apne message pe white-ish

//   imgSenderBadge: {
//     position: 'absolute', top: 6,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     paddingHorizontal: 7, paddingVertical: 3,
//     borderRadius: 10, zIndex: 1,
//   },
//   imgSenderText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },

//   // Upload bar
//   uploadBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D7B7A', gap: 10, overflow: 'hidden' },
//   uploadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

//   // Rerouting overlay
//   reroutingOverlay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDFA', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: '#E0F2F1' },
//   reroutingText: { fontSize: 13, color: '#0D7B7A', fontWeight: '600' },

//   listContent: { padding: 16, paddingBottom: 8 },

//   // Date separator
//   dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
//   dateLine: { flex: 1, height: 1, backgroundColor: '#D1E8E7' },
//   datePill: { backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#B2DFDB' },
//   datePillText: { fontSize: 11, color: '#0D7B7A', fontWeight: '700', letterSpacing: 0.3 },

//   // Message rows
//   msgRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
//   msgRowMe: { justifyContent: 'flex-end' },
//   msgRowOther: { justifyContent: 'flex-start' },

//   userAvatar: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
//   userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
//   userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

//   bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 10 },
//   bubbleMe: { backgroundColor: '#0D7B7A', borderBottomRightRadius: 4 },
//   bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2F4F4', shadowColor: '#0D7B7A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
//   senderName: { fontSize: 11, fontWeight: '700', color: '#0D7B7A', marginBottom: 5 },
//   msgText: { fontSize: 15, lineHeight: 20 },
//   msgTextMe: { color: '#FFFFFF' },
//   msgTextOther: { color: '#1E293B' },
//   msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 0 },
//   msgTime: { fontSize: 10, fontWeight: '500' },
//   msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
//   msgTimeOther: { color: '#94A3B8' },

//   imgBubble: { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
//   imgBubbleMe: { borderBottomRightRadius: 4 },
//   imgBubbleOther: { borderBottomLeftRadius: 4 },
//   msgImage: { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
//   imgTimeBadge: { position: 'absolute', bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
//   imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

//   // voiceBubble  : { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180, maxWidth: width * 0.75 },
//   // voicePlayBtn : { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
//   // waveform     : { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
//   // waveBar      : { width: 3, borderRadius: 2 },
//   // voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },


//   voiceBubble: { gap: 6, minWidth: 180, maxWidth: width * 0.75 }, // ✅ row hata diya, ab column
//   voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, // ✅ naya
//   voiceSenderName: { marginBottom: 2 }, // optional fine-tune spacing
//   voicePlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
//   waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
//   waveBar: { width: 3, borderRadius: 2 },
//   voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },

//   emptyState: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32 },
//   emptyIconWrap: { marginBottom: 20 },
//   emptyIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
//   emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
//   emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 16 },
//   emptyTipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
//   emptyTipText: { fontSize: 12, color: '#059669', fontWeight: '700' },

//   inputBar: {
//     flexDirection: 'row', alignItems: 'flex-end',
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 12, paddingVertical: 10,
//     paddingBottom: Platform.OS === 'ios' ? 28 : 10,
//     gap: 8,
//     borderTopWidth: 1, borderTopColor: '#E0F2F1',
//     shadowColor: '#0D7B7A', shadowOpacity: 0.06,
//     shadowRadius: 10, shadowOffset: { width: 0, height: -3 },
//     elevation: 8,
//   },
//   attachBtn: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CCEFED' },
//   // input          : { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 10, paddingBottom: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0', lineHeight: INPUT_LINE_HEIGHT },
//   input: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'ios' ? 10 : 8,
//     paddingBottom: Platform.OS === 'ios' ? 10 : 8,
//     fontSize: 15,
//     color: '#1E293B',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     lineHeight: INPUT_LINE_HEIGHT,
//     textAlignVertical: 'center',      // ← Android vertical fix
//     includeFontPadding: false,        // ← Android font clipping fix
//   },
//   sendBtn: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
//   sendBtnActive: { backgroundColor: '#0D7B7A', shadowColor: '#0D7B7A', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
//   sendBtnInactive: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },

//   recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
//   recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
//   recordingTimer: { fontSize: 14, fontWeight: '800', color: '#DC2626', minWidth: 36 },
//   recordingHint: { flex: 1, fontSize: 12, color: '#64748B' },
//   stopRecordBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0D7B7A', justifyContent: 'center', alignItems: 'center' },
// });

// // ─── Reroute Modal Styles ─────────────────────────────────────────────────────
// const rerouteStyles = StyleSheet.create({
//   modalWrap: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'flex-end',
//     zIndex: 999,
//   },
//   backdrop: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//   },
//   sheet: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: Platform.OS === 'ios' ? 34 : 20,
//     maxHeight: '80%',
//   },
//   handle: { width: 40, height: 4, backgroundColor: '#E0F2F1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

//   headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
//   headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0F2F1' },
//   title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
//   sub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },

//   currentRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDFA', padding: 10, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#E0F2F1' },
//   currentLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
//   currentValue: { fontSize: 12, color: '#0D7B7A', fontWeight: '700', flex: 1 },

//   loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
//   loadingText: { fontSize: 13, color: '#94A3B8' },
//   emptyText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

//   subRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
//   subIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0F2F1' },
//   subName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
//   subMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
//   subMetaText: { fontSize: 11, color: '#94A3B8' },

//   availableBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
//   availableBadgeText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
//   unavailableBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
//   unavailableBadgeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

//   cancelBtn: { backgroundColor: '#F4FAFA', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#E0F2F1' },
//   cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
// });


import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, Alert, Image,
  Animated, Dimensions, PermissionsAndroid, ScrollView, Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
  getDoc, getDocs, where, Timestamp, arrayUnion,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import AudioRecord from 'react-native-audio-record';
import { uploadImage, uploadVoice } from '../../utils/mediaUpload';
import Sound from 'react-native-sound';
Sound.setCategory('Playback');

const { width, height } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
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

const AVATAR_COLORS = [
  '#7C3AED', '#0D7B7A', '#DB2777',
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

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RECORD_SECS = 60;
const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_LINES = 4;
const INPUT_LINE_HEIGHT = 22;
const SCROLL_THRESHOLD = 120;

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

// ─── UserAvatar ───────────────────────────────────────────────────────────────
const UserAvatar = React.memo(({ name, invisible }) => {
  const palette = getPalette(name);
  return (
    <View style={[styles.userAvatar, invisible && { opacity: 0 }]}>
      <LinearGradient colors={palette.grad} style={styles.userAvatarGrad}>
        <Text style={styles.userAvatarText}>
          {name?.charAt(0)?.toUpperCase() || 'U'}
        </Text>
      </LinearGradient>
    </View>
  );
});



// ─── TextBubble ───────────────────────────────────────────────────────────────
const TextBubble = React.memo(({ item, isMe, isConsecutive, time }) => (
  <View style={[
    styles.bubble,
    isMe ? styles.bubbleMe : styles.bubbleOther,
    isMe && isConsecutive && { borderTopRightRadius: 6 },
    !isMe && isConsecutive && { borderTopLeftRadius: 6 },
  ]}>
    {!isConsecutive && item.senderName ? (
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
));

// ─── ImageBubble ──────────────────────────────────────────────────────────────
const ImageBubble = React.memo(({ item, isMe, time, onPress }) => {
  const handlePress = useCallback(() => {
    if (item.imageUrl) onPress(item.imageUrl);
  }, [item.imageUrl, onPress]);


  return (
    <View style={[styles.imgBubble, isMe ? styles.imgBubbleMe : styles.imgBubbleOther]}>
      {item.senderName ? (
        <View style={[styles.imgSenderBadge, isMe ? { right: 6 } : { left: 6 }]}>
          <Text style={styles.imgSenderText}>
            {item.senderRole === 'expert' ? `Replied by ${item.senderName}` : item.senderName}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
      </TouchableOpacity>
      {/* <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" /> */}
      <View style={[styles.imgTimeBadge, isMe ? { right: 6 } : { left: 6 }]}>
        <Text style={styles.imgTimeText}>{time}</Text>
        {isMe && (
          <MatIcon name="check-all" size={11} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />
        )}
      </View>
    </View>)
});

// ─── VoiceBubble ──────────────────────────────────────────────────────────────
const VoiceBubble = React.memo(({ item, isMe, time, onPlay }) => {
  const [playing, setPlaying] = useState(false);
  const handlePress = useCallback(() => {
    onPlay(item.voiceUrl, playing, setPlaying);
  }, [item.voiceUrl, playing, onPlay]);

  const durSecs = item.duration ?? 0;
  const durLabel = `0:${String(durSecs).padStart(2, '0')}`;
  const bars = [4, 8, 14, 10, 16, 8, 12, 6, 14, 10, 8, 12];

  return (
    <View style={[
      styles.bubble,
      isMe ? styles.bubbleMe : styles.bubbleOther,
      styles.voiceBubble,
    ]}>
      {!isMe && item.senderName && item.senderRole !== 'system' ? (
        <Text style={[styles.senderName, styles.voiceSenderName]}>
          {item.senderRole === 'expert'
            ? `Replied by ${item.senderName}`
            : item.senderName}
        </Text>
      ) : null}

      <View style={styles.voiceRow}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.voicePlayBtn,
            { backgroundColor: isMe ? 'rgba(255,255,255,0.25)' : '#E0F2F1' },
          ]}
          activeOpacity={0.75}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} color={isMe ? '#FFFFFF' : '#0D7B7A'} />
        </TouchableOpacity>
        <View style={styles.waveform}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: h, backgroundColor: isMe ? 'rgba(255,255,255,0.7)' : '#0D7B7A' },
              ]}
            />
          ))}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[
            styles.voiceDuration,
            isMe ? { color: 'rgba(255,255,255,0.9)' } : { color: '#0D7B7A' },
          ]}>
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
  );
});

// ─── MessageItem ──────────────────────────────────────────────────────────────
const MessageItem = React.memo(({
  item, index, messages, uid, userName, palette,
  formatTime, formatDate, onPlayVoice, onImagePress
}) => {
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
      <View style={[
        styles.msgRow,
        isMe ? styles.msgRowMe : styles.msgRowOther,
        isConsecutive && { marginTop: 2 },
      ]}>
        {!isMe && (
          <UserAvatar
            name={item.userName || userName}
            invisible={isConsecutive}
          />
        )}
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

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = React.memo(({ userName, isBroadcast }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <LinearGradient colors={['#E0F7F6', '#B2DFDE']} style={styles.emptyIconGrad}>
        <Icon name={isBroadcast ? 'users' : 'message-circle'} size={36} color="#0D7B7A" />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>
      {isBroadcast ? 'Broadcast Chat' : 'New Conversation'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {isBroadcast
        ? 'User needs help. Be the first expert to respond.'
        : `${userName || 'User'} is waiting for your reply.`}
    </Text>
    <View style={styles.emptyTipRow}>
      <Icon name="shield" size={13} color="#059669" />
      <Text style={styles.emptyTipText}>Private &amp; confidential</Text>
    </View>
  </View>
));

;

// ─── RerouteModal ─────────────────────────────────────────────────────────────
const RerouteModal = React.memo(({
  visible,
  onClose,
  chatId,
  chatCollection,
  categoryName,
  subcategoryName,
  uid,
  profile,
  route,
}) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [expandedSub, setExpandedSub] = useState(null);
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [sending, setSending] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setSelectedSubs([]);
      setExpandedSub(null);
      setSelectedExperts([]);
    }
  }, [visible]);

  // Fetch subcategories + experts
  useEffect(() => {
    if (!visible || !categoryName) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const db = getFirestore();

        const catSnap = await getDocs(
          query(collection(db, 'categories'), where('name', '==', categoryName)),
        );
        if (catSnap.empty) { setSubcategories([]); return; }

        const catId = catSnap.docs[0].id;

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

        const expertMap = {};
        expertSnap.docs.forEach((d) => {
          const data = d.data();
          if (!expertMap[data.subcategoryId]) expertMap[data.subcategoryId] = [];
          expertMap[data.subcategoryId].push({
            id: d.id,
            name: data.displayName || data.name || 'Expert',
          });
        });

        const results = subSnap.docs.map((d) => {
          const experts = expertMap[d.id] || [];
          return {
            id: d.id,
            name: d.data().name || 'Unknown',
            expertCount: experts.length,
            expertIds: experts.map((e) => e.id),
            expertNames: experts,
            isCurrent:
              d.data().name?.toLowerCase() === (subcategoryName || '').toLowerCase(),
          };
        });

        setSubcategories(results);
      } catch (e) {
        console.error('RerouteModal fetch error:', e);
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [visible, categoryName, subcategoryName]);

  // Toggle whole subcategory
  const toggleSub = useCallback((sub) => {
    setSelectedExperts((prev) => prev.filter((e) => e.subId !== sub.id));
    setSelectedSubs((prev) => {
      const exists = prev.some((s) => s.id === sub.id);
      return exists ? prev.filter((s) => s.id !== sub.id) : [...prev, sub];
    });
  }, []);

  // Toggle expand
  const toggleExpand = useCallback((sub) => {
    setExpandedSub((prev) => (prev === sub.id ? null : sub.id));
  }, []);

  // Toggle individual expert
  const toggleExpert = useCallback((sub, expert) => {
    setSelectedSubs((prev) => prev.filter((s) => s.id !== sub.id));
    setSelectedExperts((prev) => {
      const exists = prev.some(
        (e) => e.expertId === expert.id && e.subId === sub.id,
      );
      if (exists) {
        return prev.filter(
          (e) => !(e.expertId === expert.id && e.subId === sub.id),
        );
      }
      return [
        ...prev,
        { subId: sub.id, expertId: expert.id, expertName: expert.name, subName: sub.name },
      ];
    });
  }, []);

  const summaryText = useMemo(() => {
    const parts = [];
    selectedSubs.forEach((s) => parts.push(`All ${s.expertCount} in ${s.name}`));
    if (selectedExperts.length > 0) {
      parts.push(selectedExperts.map((e) => e.expertName).join(', '));
    }
    return parts.join(' · ');
  }, [selectedSubs, selectedExperts]);

  const totalSelected =
    selectedSubs.reduce((a, s) => a + s.expertCount, 0) + selectedExperts.length;

  const canForward = totalSelected > 0 && !sending;

  // Handle forward
  const handleForward = useCallback(async () => {
    if (!canForward) return;

    const allExpertIds = [
      ...new Set([
        ...selectedSubs.flatMap((s) => s.expertIds),
        ...selectedExperts.map((e) => e.expertId),
      ]),
    ];

    Alert.alert(
      'Confirm Reroute',
      `Forward this query to: ${summaryText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forward',
          onPress: async () => {
            setSending(true);
            try {
              const db = getFirestore();

              const subNames = selectedSubs.map((s) => s.name);
              const expertNames = selectedExperts.map((e) => e.expertName);
              const allNames = [...subNames, ...expertNames].join(', ');

              const newSubName =
                selectedSubs[0]?.name ||
                selectedExperts[0]?.subName ||
                subcategoryName;

              const rerouteEntry = {
                fromSubcategory: subcategoryName || null,
                fromSubcategoryId: route?.params?.subcategoryId || null,
                toSubcategory: newSubName,
                toExpertIds: allExpertIds,
                byExpertId: uid,
                byExpertName: profile?.name || 'Expert',
                at: Timestamp.now(),
              };

              await updateDoc(doc(db, chatCollection, chatId), {
                subcategoryName: newSubName,
                expertIds: arrayUnion(...allExpertIds),
                activeExpertIds: allExpertIds,
                expertAccepted: false,
                lastMessage: `Rerouted to ${allNames}`,
                updatedAt: serverTimestamp(),
                rerouteHistory: arrayUnion(rerouteEntry),
                rerouteSource: 'modal',     
              });

              await addDoc(
                collection(db, chatCollection, chatId, 'messages'),
                {
                  type: 'text',
                  text: `This query has been forwarded to ${allNames}. They will respond shortly.`,
                  senderId: uid,
                  senderRole: 'system',
                  senderName: 'System',
                  createdAt: serverTimestamp(),
                },
              );

              Alert.alert(
                'Rerouted Successfully ✓',
                `Query forwarded to ${totalSelected} expert(s) in "${allNames}".`,
              );

              setSelectedSubs([]);
              setSelectedExperts([]);
              setExpandedSub(null);
              onClose();
            } catch (e) {
              console.error('RerouteModal forward error:', e);
              Alert.alert('Error', 'Could not reroute. Please try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  }, [
    canForward, selectedSubs, selectedExperts, summaryText,
    totalSelected, chatId, chatCollection, subcategoryName,
    uid, profile, route, onClose,
  ]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={rerouteStyles.overlay}>
        <View style={rerouteStyles.sheet}>
          <View style={rerouteStyles.handle} />

          {/* Header */}
          <View style={rerouteStyles.headerRow}>
            <View style={rerouteStyles.headerIcon}>
              <Icon name="share-2" size={16} color="#0D7B7A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rerouteStyles.title}>Re-route to Specialist</Text>
              <Text style={rerouteStyles.sub}>
                Select specialization or individual experts
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={rerouteStyles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Current subcategory */}
          <View style={rerouteStyles.currentRow}>
            <Icon name="map-pin" size={11} color="#94A3B8" />
            <Text style={rerouteStyles.currentLabel}>Current: </Text>
            <Text style={rerouteStyles.currentValue} numberOfLines={1}>
              {subcategoryName || 'Unknown'}
            </Text>
          </View>

          {/* Selection summary */}
          {totalSelected > 0 && (
            <View style={rerouteStyles.summaryBox}>
              <Icon name="check-circle" size={13} color="#6D28D9" />
              <Text style={rerouteStyles.summaryText} numberOfLines={2}>
                {summaryText}
              </Text>
              <View style={rerouteStyles.countBadge}>
                <Text style={rerouteStyles.countBadgeText}>{totalSelected}</Text>
              </View>
            </View>
          )}

          {/* List */}
          {loading ? (
            <View style={rerouteStyles.centerWrap}>
              <ActivityIndicator color="#6D28D9" />
              <Text style={rerouteStyles.centerText}>Loading specializations…</Text>
            </View>
          ) : subcategories.length === 0 ? (
            <View style={rerouteStyles.centerWrap}>
              <MatIcon name="account-off-outline" size={40} color="#CBD5E1" />
              <Text style={rerouteStyles.centerText}>No specializations found</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {subcategories.map((sub) => {
                const isSubSelected = selectedSubs.some((s) => s.id === sub.id);
                const isExpanded = expandedSub === sub.id;
                const expertSelCount = selectedExperts.filter((e) => e.subId === sub.id).length;
                const hasAnySelected = isSubSelected || expertSelCount > 0;

                return (
                  <View key={sub.id}>
                    {/* Subcategory Row */}
                    <TouchableOpacity
                      style={[
                        rerouteStyles.subRow,
                        hasAnySelected && rerouteStyles.subRowOn,
                        sub.isCurrent && rerouteStyles.subRowCurrent,
                      ]}
                      onPress={() => !sub.isCurrent && sub.expertCount > 0 && toggleSub(sub)}
                      activeOpacity={sub.expertCount > 0 && !sub.isCurrent ? 0.75 : 1}
                    >
                      {/* Checkbox */}
                      <View style={[
                        rerouteStyles.checkbox,
                        isSubSelected && rerouteStyles.checkboxOn,
                      ]}>
                        {isSubSelected && <Icon name="check" size={11} color="#FFF" />}
                      </View>

                      {/* Icon avatar */}
                      <View style={[
                        rerouteStyles.subAvatar,
                        {
                          backgroundColor: sub.isCurrent
                            ? '#94A3B8'
                            : hasAnySelected ? '#6D28D9' : '#0D7B7A',
                        },
                      ]}>
                        <MatIcon name="shape-outline" size={16} color="#FFF" />
                      </View>

                      {/* Name + meta */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            rerouteStyles.subName,
                            hasAnySelected && { color: '#6D28D9' },
                            sub.isCurrent && { color: '#94A3B8' },
                          ]}
                          numberOfLines={1}
                        >
                          {sub.name}{sub.isCurrent ? '  (current)' : ''}
                        </Text>
                        <View style={rerouteStyles.metaRow}>
                          <Icon name="users" size={10} color="#94A3B8" />
                          <Text style={rerouteStyles.metaText}>
                            {sub.expertCount} expert{sub.expertCount !== 1 ? 's' : ''}
                            {expertSelCount > 0 ? ` · ${expertSelCount} selected` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Badge */}
                      {sub.isCurrent ? (
                        <View style={rerouteStyles.currentBadge}>
                          <Text style={rerouteStyles.currentBadgeText}>Current</Text>
                        </View>
                      ) : sub.expertCount > 0 ? (
                        <View style={rerouteStyles.availBadge}>
                          <Text style={rerouteStyles.availBadgeText}>Available</Text>
                        </View>
                      ) : (
                        <View style={rerouteStyles.noneBadge}>
                          <Text style={rerouteStyles.noneBadgeText}>No experts</Text>
                        </View>
                      )}

                      {/* Expand arrow */}
                      {sub.expertCount > 0 && !sub.isCurrent && (
                        <TouchableOpacity
                          onPress={() => toggleExpand(sub)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={rerouteStyles.expandBtn}
                          activeOpacity={0.7}
                        >
                          <Icon
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#6D28D9"
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {/* Individual Expert Rows */}
                    {isExpanded && sub.expertNames.map((expert) => {
                      const isExpertOn = selectedExperts.some(
                        (e) => e.expertId === expert.id && e.subId === sub.id,
                      );
                      return (
                        <TouchableOpacity
                          key={expert.id}
                          style={[
                            rerouteStyles.expertRow,
                            isExpertOn && rerouteStyles.expertRowOn,
                          ]}
                          onPress={() => toggleExpert(sub, expert)}
                          activeOpacity={0.75}
                        >
                          {/* Indent line */}
                          <View style={rerouteStyles.indentWrap}>
                            <View style={rerouteStyles.indentLine} />
                          </View>

                          {/* Checkbox */}
                          <View style={[
                            rerouteStyles.checkboxSm,
                            isExpertOn && rerouteStyles.checkboxOn,
                          ]}>
                            {isExpertOn && <Icon name="check" size={10} color="#FFF" />}
                          </View>

                          {/* Avatar */}
                          <View style={[
                            rerouteStyles.expertAvatar,
                            {
                              backgroundColor: isExpertOn
                                ? '#6D28D9'
                                : getAvatarColor(expert.name),
                            },
                          ]}>
                            <Text style={rerouteStyles.expertAvatarText}>
                              {getInitials(expert.name)}
                            </Text>
                          </View>

                          {/* Name */}
                          <Text
                            style={[
                              rerouteStyles.expertName,
                              isExpertOn && { color: '#6D28D9', fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {expert.name}
                          </Text>

                          {isExpertOn && (
                            <Icon name="check-circle" size={15} color="#6D28D9" />
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
          <View style={rerouteStyles.btnRow}>
            <TouchableOpacity
              style={rerouteStyles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={rerouteStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[rerouteStyles.forwardBtn, !canForward && { opacity: 0.4 }]}
              onPress={handleForward}
              disabled={!canForward}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Icon name="share-2" size={15} color="#FFF" />
              }
              <Text style={rerouteStyles.forwardBtnText}>
                {totalSelected > 0 ? `Forward to ${totalSelected}` : 'Forward'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
});

// ─── ChatHeader ───────────────────────────────────────────────────────────────
const ChatHeader = React.memo(({
  userName, onBack, isBroadcast, subcategoryName, onReroute,
}) => (
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
        <Text style={styles.headerName} numberOfLines={1}>
          {isBroadcast ? 'Consultation Chat' : (userName || 'User')}
        </Text>
        <View style={styles.headerSubRow}>
          {isBroadcast ? (
            <>
              <Icon name="users" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={styles.headerSub}>Chats</Text>
            </>
          ) : (
            <>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>{userName || 'User'}</Text>
            </>
          )}
        </View>
      </View>
    </View>

    <TouchableOpacity
      style={styles.headerActionBtn}
      onPress={onReroute}
      activeOpacity={0.75}
    >
      <Icon name="share-2" size={17} color="rgba(255,255,255,0.85)" />
    </TouchableOpacity>
  </LinearGradient>
));

// ─── InputBar ─────────────────────────────────────────────────────────────────
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
          <Text style={styles.recordingHint}>Recording… tap to send</Text>
          <TouchableOpacity style={styles.stopRecordBtn} onPress={onStopRecord} activeOpacity={0.8}>
            <Icon name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
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
          placeholder="Type a reply…"
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
    </KeyboardAvoidingView>
  );
});


const FullScreenImageViewer = React.memo(({ uri, onClose }) => {
  console.log("FullScreenImageViewer", uri);
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
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExpertReplyChat({ route, navigation }) {
  const {
    chatId,
    userName = 'User',
    isBroadcast = false,
    subcategoryName = '',
    categoryName = '',
    expertIds = [],
  } = route.params;

  const chatCollection = isBroadcast ? 'broadcastChats' : 'chats';

  // ── State ──────────────────────────────────────────────────────────────────
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

  // ── Voice state ────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const recordingTimer = useRef(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // ── Reroute state ──────────────────────────────────────────────────────────
  const [showReroute, setShowReroute] = useState(false);

  const flatRef = useRef(null);
  const uploadAnim = useRef(new Animated.Value(0)).current;
  const isNearBottom = useRef(true);
  const isMounted = useRef(true);
  const currentSound = useRef(null);

  const uid = auth().currentUser?.uid;
  const palette = useMemo(() => getPalette(userName), [userName]);
  const loading = profileLoading || messagesLoading;

  // ── Unmount guard ──────────────────────────────────────────────────────────
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

  // ── AudioRecord init ───────────────────────────────────────────────────────
  useEffect(() => {
    AudioRecord.init({
      sampleRate: 44100,
      channels: 1,
      bitsPerSample: 16,
      wavFile: `voice_${Date.now()}.wav`,
    });
  }, []);

  // ── Upload bar animation ───────────────────────────────────────────────────
  const uploadVisible = uploadingMedia || uploadingVoice;
  useEffect(() => {
    Animated.timing(uploadAnim, {
      toValue: uploadVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [uploadVisible, uploadAnim]);

  // ── Fetch expert profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) { setProfileLoading(false); return; }
    (async () => {
      try {
        const db = getFirestore();
        const d = await getDoc(doc(db, 'users', uid));
        if (!isMounted.current) return;
        if (d.exists()) setProfile(d.data());
      } catch { /* silent */ } finally {
        if (isMounted.current) setProfileLoading(false);
      }
    })();
  }, [uid]);

  // ── Messages listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) { setMessagesLoading(false); setLoadError(true); return; }
    const db = getFirestore();
    const q = query(
      collection(db, chatCollection, chatId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted.current) return;
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMessagesLoading(false);
        if (isNearBottom.current) {
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      },
      (err) => {
        console.error('ExpertReplyChat messages error:', err);
        if (!isMounted.current) return;
        setMessagesLoading(false);
        setLoadError(true);
      },
    );
    return unsub;
  }, [chatId, chatCollection]);

  // ── Save message ───────────────────────────────────────────────────────────
  const saveMessage = useCallback(async (msgData) => {
    const db = getFirestore();
    const msgPayload = {
      ...msgData,
      senderId: uid,
      senderRole: 'expert',
      senderName: profile?.name || 'Expert',
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
        updatedAt: serverTimestamp(),
        expertAccepted: true,
      }),
    ]);
  }, [chatId, uid, profile, chatCollection]);

  // ── Send text ──────────────────────────────────────────────────────────────
  const sendTextMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setInputHeight(INPUT_MIN_HEIGHT);
    setSending(true);
    try {
      await saveMessage({ type: 'text', text: trimmed });
    } catch (e) {
      console.error('Send error:', e);
      Alert.alert('Send Failed', 'Could not send message. Please try again.');
    } finally {
      if (isMounted.current) setSending(false);
    }
  }, [text, sending, saveMessage]);

  // ── Image pick & upload ────────────────────────────────────────────────────
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
            compressImageQuality: 0.75,
            cropping: true,
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
            compressImageQuality: 0.75,
            cropping: true,
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

  // ── Mic permission ─────────────────────────────────────────────────────────
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

  // ── Stop recording ─────────────────────────────────────────────────────────
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
      if (isMounted.current) Alert.alert('Voice Error', 'Could not send voice message.');
    } finally {
      if (isMounted.current) setUploadingVoice(false);
    }
  }, [isRecording, chatId, saveMessage]);

  // ── Start recording ────────────────────────────────────────────────────────
  const handleStartRecording = useCallback(async () => {
    const ok = await requestMicPermission();
    if (!ok) {
      Alert.alert('Permission Denied', 'Microphone permission is required.');
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

  // ── Play voice ─────────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  const handleContentSizeChange = useCallback((e) => {
    setInputHeight(e.nativeEvent.contentSize.height + (Platform.OS === 'android' ? 12 : 0));
  }, []);

  // ── Open / close full-screen image viewer ────────────────────────────────────
  const handleImagePress = useCallback((uri) => {
    console.log(uri);
    if (uri) setFullScreenImage(uri);
  }, []);

  const handleCloseFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);

  // ── FlatList ───────────────────────────────────────────────────────────────
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
      onPlayVoice={handlePlayVoice}
      onImagePress={handleImagePress}
    />
  ), [messages, uid, userName, palette, formatTime, formatDate, handlePlayVoice, handleImagePress]);

  const keyExtractor = useCallback((item) => item.id, []);
  const ListEmptyComponent = useMemo(() => (
    <EmptyState userName={userName} isBroadcast={isBroadcast} />
  ), [userName, isBroadcast]);

  const uploadLabel = uploadingVoice ? 'Sending voice message…' : 'Uploading image…';

  // ── Error state ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color="#94A3B8" />
        <Text style={styles.errorTitle}>Unable to Load Chat</Text>
        <Text style={styles.errorSubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoadError(false); setMessagesLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <ChatHeader
        userName={userName}
        onBack={() => navigation.goBack()}
        isBroadcast={isBroadcast}
        subcategoryName={subcategoryName}
        onReroute={() => setShowReroute(true)}
      />

      <UploadBar anim={uploadAnim} label={uploadLabel} />

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
            if (isNearBottom.current) flatRef.current?.scrollToEnd({ animated: true });
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

      <FullScreenImageViewer
        uri={fullScreenImage}
        onClose={handleCloseFullScreenImage}
      />

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



      {/* RerouteModal */}
      <RerouteModal
        visible={showReroute}
        onClose={() => setShowReroute(false)}
        chatId={chatId}
        chatCollection={chatCollection}
        categoryName={categoryName}
        subcategoryName={subcategoryName}
        uid={uid}
        profile={profile}
        route={route}
      />

    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  errorSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 4 },
  retryBtn: { marginTop: 20, backgroundColor: '#0D7B7A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
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

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 12, gap: 10 },
  headerBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  headerTextWrap: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 4, marginTop: 4 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },

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

  userAvatar: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
  userAvatarGrad: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  bubble: { maxWidth: width * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#0D7B7A', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2F4F4', shadowColor: '#0D7B7A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  senderName: { fontSize: 11, fontWeight: '700', color: '#0D7B7A', marginBottom: 4 },
  senderNameMe: { color: 'rgba(255,255,255,0.85)' },
  imgSenderBadge: { position: 'absolute', top: 6, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, zIndex: 1 },
  imgSenderText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },

  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextOther: { color: '#1E293B' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  msgTime: { fontSize: 10, fontWeight: '500' },
  msgTimeMe: { color: 'rgba(255,255,255,0.65)' },
  msgTimeOther: { color: '#94A3B8' },

  imgBubble: { maxWidth: width * 0.65, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imgBubbleMe: { borderBottomRightRadius: 4 },
  imgBubbleOther: { borderBottomLeftRadius: 4 },
  msgImage: { width: width * 0.6, height: width * 0.6, maxWidth: 240, maxHeight: 240 },
  imgTimeBadge: { position: 'absolute', bottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  imgTimeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '500' },

  voiceBubble: { gap: 6, minWidth: 180, maxWidth: width * 0.75 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceSenderName: { marginBottom: 2 },
  voicePlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  waveBar: { width: 3, borderRadius: 2 },
  voiceDuration: { fontSize: 12, fontWeight: '700', marginBottom: 2 },

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
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
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
});

// ─── Reroute Styles ───────────────────────────────────────────────────────────
const rerouteStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#E0F2F1',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E0F2F1',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#6D28D9' },
  sub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },

  currentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDFA', padding: 10, borderRadius: 10,
    marginBottom: 12, borderWidth: 1, borderColor: '#E0F2F1',
  },
  currentLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  currentValue: { fontSize: 12, color: '#0D7B7A', fontWeight: '700', flex: 1 },

  summaryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EDE9FE', borderRadius: 10, padding: 10,
    marginBottom: 10, borderWidth: 1, borderColor: '#DDD6FE',
  },
  summaryText: { fontSize: 12, fontWeight: '700', color: '#6D28D9', flex: 1 },
  countBadge: { backgroundColor: '#6D28D9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, minWidth: 24, alignItems: 'center' },
  countBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  centerWrap: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  centerText: { fontSize: 13, color: '#94A3B8' },

  subRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 6,
    backgroundColor: '#F4FAFA',
    borderWidth: 1, borderColor: '#E0F2F1', gap: 10,
  },
  subRowOn: { borderColor: '#6D28D9', backgroundColor: '#EDE9FE' },
  subRowCurrent: { opacity: 0.55 },
  subAvatar: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  subName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, color: '#94A3B8' },

  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  checkboxSm: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center' },

  expandBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },

  availBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  availBadgeText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
  noneBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  noneBadgeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  currentBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

  expertRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    marginBottom: 4, marginLeft: 16,
    borderRadius: 10, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E0F2F1', gap: 8,
  },
  expertRowOn: { borderColor: '#6D28D9', backgroundColor: '#EDE9FE' },

  indentWrap: { width: 10, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  indentLine: { width: 2, flex: 1, backgroundColor: '#E0F2F1', borderRadius: 1 },

  expertAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  expertAvatarText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  expertName: { flex: 1, fontSize: 13, fontWeight: '500', color: '#0F172A' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F4FAFA', borderWidth: 1, borderColor: '#E0F2F1' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  forwardBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#6D28D9' },
  forwardBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

});