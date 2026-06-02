// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
//   StatusBar,
// } from 'react-native';
// import {
//   getFirestore, collection, query, orderBy,
//   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// export default function ExpertReplyChat({ route, navigation }) {
//   const { chatId, userName } = route.params;
//   const [messages, setMessages] = useState([]);
//   const [text, setText]         = useState('');
//   const [loading, setLoading]   = useState(true);
//   const [sending, setSending]   = useState(false);
//   const flatRef                 = useRef(null);

//   const uid       = auth().currentUser?.uid;

//   useEffect(() => {
//     const db    = getFirestore();
//     const q     = query(
//       collection(db, 'chats', chatId, 'messages'),
//       orderBy('createdAt', 'asc'),
//     );
//     const unsub = onSnapshot(q, (snap) => {
//       setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//       setLoading(false);
//       setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
//     });
//     return unsub;
//   }, [chatId]);

//   const sendMessage = async () => {
//     if (!text.trim() || sending) return;
//     setSending(true);
//     const trimmed = text.trim();
//     setText('');
//     try {
//       const db = getFirestore();
//       await addDoc(collection(db, 'chats', chatId, 'messages'), {
//         text      : trimmed,
//         senderId  : uid,
//         senderRole: 'expert',
//         createdAt : serverTimestamp(),
//       });
//       await updateDoc(doc(db, 'chats', chatId), {
//         lastMessage: trimmed,
//         updatedAt  : serverTimestamp(),
//       });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setSending(false);
//     }
//   };

//   const formatTime = (ts) => {
//     if (!ts?.toDate) return '';
//     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
//   };

//   const renderMsg = ({ item, index }) => {
//     const isMe      = item.senderId === uid;
//     const showDate  = index === 0 || (
//       messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
//       item.createdAt?.toDate?.()?.toDateString()
//     );

//     return (
//       <>
//         {showDate && item.createdAt && (
//           <View style={styles.dateBadge}>
//             <Text style={styles.dateBadgeText}>
//               {item.createdAt.toDate().toLocaleDateString('en-IN', {
//                 day: 'numeric', month: 'short', year: 'numeric',
//               })}
//             </Text>
//           </View>
//         )}
//         <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
//           <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
//             <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
//               {item.text}
//             </Text>
//             <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
//               {formatTime(item.createdAt)}
//               {isMe ? '  ✓✓' : ''}
//             </Text>
//           </View>
//         </View>
//       </>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//           <Text style={styles.backArrow}>←</Text>
//         </TouchableOpacity>
//         <View style={styles.headerAvatar}>
//           <Text style={{ fontSize: 18 }}>👤</Text>
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.headerName}>{userName}</Text>
//           <Text style={styles.headerStatus}>● Online</Text>
//         </View>
//       </View>

//       {/* Messages */}
//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color="#7C3AED" />
//         </View>
//       ) : (
//         <FlatList
//           ref={flatRef}
//           data={messages}
//           keyExtractor={(item) => item.id}
//           renderItem={renderMsg}
//           contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
//           onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
//           ListEmptyComponent={
//             <View style={styles.emptyMsg}>
//               <Text style={styles.emptyMsgIcon}>💬</Text>
//               <Text style={styles.emptyMsgText}>Koi message nahi hai</Text>
//               <Text style={styles.emptyMsgSub}>User ka question aane par yahan dikhega</Text>
//             </View>
//           }
//         />
//       )}

//       {/* Input */}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         keyboardVerticalOffset={0}
//       >
//         <View style={styles.inputWrap}>
//           <TextInput
//             style={styles.input}
//             placeholder="Reply likho..."
//             placeholderTextColor="#9CA3AF"
//             value={text}
//             onChangeText={setText}
//             multiline
//             maxLength={500}
//           />
//           <TouchableOpacity
//             style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
//             onPress={sendMessage}
//             disabled={!text.trim() || sending}
//           >
//             {sending
//               ? <ActivityIndicator size="small" color="#FFFFFF" />
//               : <Text style={styles.sendIcon}>➤</Text>
//             }
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container      : { flex: 1, backgroundColor: '#F0F2F5' },
//   centered       : { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header         : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
//     paddingTop: 52, paddingBottom: 14, gap: 12,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   backBtn        : { padding: 4 },
//   backArrow      : { fontSize: 24, color: '#7C3AED', fontWeight: '700' },
//   headerAvatar   : {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center',
//   },
//   headerName     : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
//   headerStatus   : { fontSize: 12, color: '#10B981', marginTop: 1 },

//   dateBadge      : { alignItems: 'center', marginVertical: 10 },
//   dateBadgeText  : { fontSize: 12, color: '#94A3B8', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

//   msgRow         : { marginBottom: 8 },
//   msgRowMe       : { alignItems: 'flex-end' },
//   msgRowOther    : { alignItems: 'flex-start' },
//   bubble         : { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
//   bubbleMe       : { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
//   bubbleOther    : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
//   msgText        : { fontSize: 15, lineHeight: 22 },
//   msgTextMe      : { color: '#FFFFFF' },
//   msgTextOther   : { color: '#1E293B' },
//   msgTime        : { fontSize: 10, marginTop: 4 },
//   msgTimeMe      : { color: '#C4B5FD', textAlign: 'right' },
//   msgTimeOther   : { color: '#94A3B8' },

//   emptyMsg       : { alignItems: 'center', paddingTop: 80 },
//   emptyMsgIcon   : { fontSize: 48, marginBottom: 12 },
//   emptyMsgText   : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
//   emptyMsgSub    : { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

//   inputWrap      : {
//     flexDirection: 'row', alignItems: 'flex-end',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
//     paddingVertical: 12, gap: 10,
//     borderTopWidth: 1, borderTopColor: '#F1F5F9',
//   },
//   input          : {
//     flex: 1, backgroundColor: '#F8FAFC',
//     borderRadius: 24, paddingHorizontal: 16,
//     paddingVertical: 10, fontSize: 15, color: '#1E293B',
//     maxHeight: 100, borderWidth: 1, borderColor: '#E2E8F0',
//   },
//   sendBtn        : {
//     width: 46, height: 46, borderRadius: 23,
//     backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
//   },
//   sendBtnDisabled: { backgroundColor: '#C4B5FD' },
//   sendIcon       : { fontSize: 18, color: '#FFFFFF' },
// });


import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, Alert, Image,
} from 'react-native';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import ImagePicker from 'react-native-image-crop-picker';
import { uploadImage } from '../../utils/mediaUpload';

export default function ExpertReplyChat({ route, navigation }) {
  const { chatId, userName } = route.params;

  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const flatRef = useRef(null);

  // ✅ V22 modular API — getAuth() instead of auth()
  const uid = getAuth().currentUser?.uid;

  // ── Firestore listener ──────────────────────────────────────────────────
  useEffect(() => {
    const db    = getFirestore();
    const q     = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [chatId]);

  // ── Mark chat as read when expert opens it ──────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    const db = getFirestore();
    updateDoc(doc(db, 'chats', chatId), {
      unreadCount: 0,
    }).catch(() => {});
  }, [chatId]);

  // ── Save message helper ─────────────────────────────────────────────────
  const saveMessage = async (msgData) => {
    const db = getFirestore();
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      ...msgData,
      senderId  : uid,
      senderRole: 'expert',
      createdAt : serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:
        msgData.type === 'text'  ? msgData.text
        : msgData.type === 'image' ? '📷 Image'
        : '',
      updatedAt  : serverTimestamp(),
      unreadCount: 1,
    });
  };

  // ── Text message ────────────────────────────────────────────────────────
  const sendTextMessage = async () => {
    if (!text.trim() || sending) return;
    const trimmed = text.trim();
    setText('');
    setSending(true);
    try {
      await saveMessage({ type: 'text', text: trimmed });
    } catch (e) {
      console.error('Send error:', e);
      Alert.alert('Error', 'Message send nahi hua');
    } finally {
      setSending(false);
    }
  };

  // ── Image pick ──────────────────────────────────────────────────────────
  const handleImagePick = () => {
    Alert.alert('Image Select karo', '', [
      {
        text   : '📷 Camera',
        onPress: () =>
          ImagePicker.openCamera({
            mediaType           : 'photo',
            compressImageQuality: 0.7,
            cropping            : false,
          })
            .then(handleCropPickerResponse)
            .catch((e) => {
              if (e.code !== 'E_PICKER_CANCELLED') console.error(e);
            }),
      },
      {
        text   : '🖼️ Gallery',
        onPress: () =>
          ImagePicker.openPicker({
            mediaType           : 'photo',
            compressImageQuality: 0.7,
            cropping            : false,
          })
            .then(handleCropPickerResponse)
            .catch((e) => {
              if (e.code !== 'E_PICKER_CANCELLED') console.error(e);
            }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCropPickerResponse = async (image) => {
    if (!image?.path) return;
    setUploadingMedia(true);
    try {
      const imageUrl = await uploadImage(image.path, chatId);
      await saveMessage({ type: 'image', imageUrl });
    } catch (e) {
      Alert.alert('Error', 'Image upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Render message bubble ───────────────────────────────────────────────
  const renderMsg = ({ item, index }) => {
    const isMe     = item.senderRole === 'expert';
    const showDate = index === 0 || (
      messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
      item.createdAt?.toDate?.()?.toDateString()
    );

    return (
      <>
        {showDate && item.createdAt && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {item.createdAt.toDate().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short',
              })}
            </Text>
          </View>
        )}

        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
          {!isMe && (
            <View style={styles.userDot}>
              <Text style={styles.userDotText}>
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {item.type === 'text' && (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                {item.text}
              </Text>
              <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
              </Text>
            </View>
          )}

          {item.type === 'image' && (
            <View style={[styles.imgBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.msgImage}
                resizeMode="cover"
              />
              <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther, { marginTop: 4 }]}>
                {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
              </Text>
            </View>
          )}
        </View>
      </>
    );
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {userName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{userName || 'User'}</Text>
          <Text style={styles.headerStatus}>● Active</Text>
        </View>
      </View>

      {uploadingMedia && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMsg}
          contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyMsg}>
              <Text style={styles.emptyMsgIcon}>💬</Text>
              <Text style={styles.emptyMsgText}>Koi message nahi hai</Text>
              <Text style={styles.emptyMsgSub}>
                {userName} ka koi sawal aane par yahan dikhega
              </Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputWrap}>
          <TouchableOpacity style={styles.mediaBtn} onPress={handleImagePick}>
            <Text style={styles.mediaBtnIcon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Reply likhein..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={sendTextMessage}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#F0F2F5' },
  centered       : { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header         : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: 52, paddingBottom: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn        : { padding: 4 },
  backArrow      : { fontSize: 24, color: '#7C3AED', fontWeight: '700' },
  headerAvatar   : {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  headerName     : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  headerStatus   : { fontSize: 12, color: '#10B981', marginTop: 1 },

  uploadingBar   : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', padding: 8, gap: 8,
  },
  uploadingText  : { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  dateBadge      : { alignItems: 'center', marginVertical: 10 },
  dateBadgeText  : {
    fontSize: 12, color: '#94A3B8',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },

  msgRow         : { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowMe       : { justifyContent: 'flex-end' },
  msgRowOther    : { justifyContent: 'flex-start' },

  userDot        : {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EDE9FE', justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  userDotText    : { fontSize: 13, fontWeight: '800', color: '#7C3AED' },

  bubble         : { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe       : { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
  bubbleOther    : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText        : { fontSize: 15, lineHeight: 22 },
  msgTextMe      : { color: '#FFFFFF' },
  msgTextOther   : { color: '#1E293B' },
  msgTime        : { fontSize: 10, marginTop: 4 },
  msgTimeMe      : { color: '#DDD6FE', textAlign: 'right' },
  msgTimeOther   : { color: '#94A3B8' },

  imgBubble      : { maxWidth: '75%', borderRadius: 16, overflow: 'hidden', padding: 4 },
  msgImage       : { width: 200, height: 200, borderRadius: 12 },

  emptyMsg       : { alignItems: 'center', paddingTop: 80 },
  emptyMsgIcon   : { fontSize: 48, marginBottom: 12 },
  emptyMsgText   : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptyMsgSub    : { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' },

  inputWrap      : {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  mediaBtn       : {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  mediaBtnIcon   : { fontSize: 20 },
  input          : {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#1E293B', maxHeight: 100,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sendBtn        : {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff     : { backgroundColor: '#C4B5FD' },
  sendIcon       : { fontSize: 18, color: '#FFFFFF' },
});