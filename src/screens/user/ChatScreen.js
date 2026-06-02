// // import React, { useEffect, useState, useRef } from 'react';
// // import {
// //   View, Text, StyleSheet, FlatList, TouchableOpacity,
// //   TextInput, KeyboardAvoidingView, Platform,
// //   ActivityIndicator, StatusBar,
// // } from 'react-native';
// // import {
// //   getFirestore, collection, query, orderBy,
// //   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
// // } from '@react-native-firebase/firestore';
// // import auth from '@react-native-firebase/auth';

// // export default function ChatScreen({ route, navigation }) {
// //   const { chatId, expertName } = route.params;
// //   const [messages, setMessages] = useState([]);
// //   const [text, setText]         = useState('');
// //   const [loading, setLoading]   = useState(true);
// //   const [sending, setSending]   = useState(false);
// //   const flatRef                 = useRef(null);
// //   const uid                     = auth().currentUser?.uid;

// //   useEffect(() => {
// //     const db    = getFirestore();
// //     const q     = query(
// //       collection(db, 'chats', chatId, 'messages'),
// //       orderBy('createdAt', 'asc'),
// //     );
// //     const unsub = onSnapshot(q, (snap) => {
// //       setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
// //       setLoading(false);
// //       setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
// //     });
// //     return unsub;
// //   }, [chatId]);

// //   const sendMessage = async () => {
// //     if (!text.trim() || sending) return;
// //     const trimmed = text.trim();
// //     setText('');
// //     setSending(true);
// //     try {
// //       const db = getFirestore();
// //       await addDoc(collection(db, 'chats', chatId, 'messages'), {
// //         text      : trimmed,
// //         senderId  : uid,
// //         senderRole: 'user',
// //         createdAt : serverTimestamp(),
// //       });
// //       await updateDoc(doc(db, 'chats', chatId), {
// //         lastMessage: trimmed,
// //         updatedAt  : serverTimestamp(),
// //       });
// //     } catch (e) {
// //       console.error(e);
// //     } finally {
// //       setSending(false);
// //     }
// //   };

// //   const formatTime = (ts) => {
// //     if (!ts?.toDate) return '';
// //     return ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
// //   };

// //   const renderMsg = ({ item, index }) => {
// //     const isMe     = item.senderId === uid;
// //     const showDate = index === 0 || (
// //       messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
// //       item.createdAt?.toDate?.()?.toDateString()
// //     );

// //     return (
// //       <>
// //         {showDate && item.createdAt && (
// //           <View style={styles.dateBadge}>
// //             <Text style={styles.dateBadgeText}>
// //               {item.createdAt.toDate().toLocaleDateString('en-IN', {
// //                 day: 'numeric', month: 'short',
// //               })}
// //             </Text>
// //           </View>
// //         )}
// //         <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
// //           {!isMe && (
// //             <View style={styles.expertDot}>
// //               <Text style={{ fontSize: 14 }}>🩺</Text>
// //             </View>
// //           )}
// //           <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
// //             <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
// //               {item.text}
// //             </Text>
// //             <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
// //               {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
// //             </Text>
// //           </View>
// //         </View>
// //       </>
// //     );
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

// //       {/* Header */}
// //       <View style={styles.header}>
// //         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
// //           <Text style={styles.backArrow}>←</Text>
// //         </TouchableOpacity>
// //         <View style={styles.headerAvatar}>
// //           <Text style={{ fontSize: 18 }}>🩺</Text>
// //         </View>
// //         <View style={{ flex: 1 }}>
// //           <Text style={styles.headerName}>{expertName}</Text>
// //           <Text style={styles.headerStatus}>● Online</Text>
// //         </View>
// //       </View>

// //       {loading ? (
// //         <View style={styles.centered}>
// //           <ActivityIndicator size="large" color="#2563EB" />
// //         </View>
// //       ) : (
// //         <FlatList
// //           ref={flatRef}
// //           data={messages}
// //           keyExtractor={(item) => item.id}
// //           renderItem={renderMsg}
// //           contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
// //           onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
// //           ListEmptyComponent={
// //             <View style={styles.emptyMsg}>
// //               <Text style={styles.emptyMsgIcon}>👋</Text>
// //               <Text style={styles.emptyMsgText}>Apna sawal puchho!</Text>
// //               <Text style={styles.emptyMsgSub}>{expertName} aapki madad karenge</Text>
// //             </View>
// //           }
// //         />
// //       )}

// //       <KeyboardAvoidingView
// //         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
// //       >
// //         <View style={styles.inputWrap}>
// //           <TextInput
// //             style={styles.input}
// //             placeholder="Apna sawal likhein..."
// //             placeholderTextColor="#9CA3AF"
// //             value={text}
// //             onChangeText={setText}
// //             multiline
// //             maxLength={500}
// //           />
// //           <TouchableOpacity
// //             style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
// //             onPress={sendMessage}
// //             disabled={!text.trim() || sending}
// //           >
// //             {sending
// //               ? <ActivityIndicator size="small" color="#FFFFFF" />
// //               : <Text style={styles.sendIcon}>➤</Text>
// //             }
// //           </TouchableOpacity>
// //         </View>
// //       </KeyboardAvoidingView>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container     : { flex: 1, backgroundColor: '#F0F2F5' },
// //   centered      : { flex: 1, justifyContent: 'center', alignItems: 'center' },
// //   header        : {
// //     flexDirection: 'row', alignItems: 'center',
// //     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
// //     paddingTop: 52, paddingBottom: 14, gap: 12,
// //     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
// //   },
// //   backBtn       : { padding: 4 },
// //   backArrow     : { fontSize: 24, color: '#2563EB', fontWeight: '700' },
// //   headerAvatar  : {
// //     width: 40, height: 40, borderRadius: 20,
// //     backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
// //   },
// //   headerName    : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
// //   headerStatus  : { fontSize: 12, color: '#10B981', marginTop: 1 },
// //   dateBadge     : { alignItems: 'center', marginVertical: 10 },
// //   dateBadgeText : {
// //     fontSize: 12, color: '#94A3B8',
// //     backgroundColor: '#E2E8F0', paddingHorizontal: 12,
// //     paddingVertical: 4, borderRadius: 12,
// //   },
// //   msgRow        : { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
// //   msgRowMe      : { justifyContent: 'flex-end' },
// //   msgRowOther   : { justifyContent: 'flex-start' },
// //   expertDot     : {
// //     width: 30, height: 30, borderRadius: 15,
// //     backgroundColor: '#EFF6FF', justifyContent: 'center',
// //     alignItems: 'center', marginRight: 8,
// //   },
// //   bubble        : { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
// //   bubbleMe      : { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
// //   bubbleOther   : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
// //   msgText       : { fontSize: 15, lineHeight: 22 },
// //   msgTextMe     : { color: '#FFFFFF' },
// //   msgTextOther  : { color: '#1E293B' },
// //   msgTime       : { fontSize: 10, marginTop: 4 },
// //   msgTimeMe     : { color: '#BFDBFE', textAlign: 'right' },
// //   msgTimeOther  : { color: '#94A3B8' },
// //   emptyMsg      : { alignItems: 'center', paddingTop: 80 },
// //   emptyMsgIcon  : { fontSize: 48, marginBottom: 12 },
// //   emptyMsgText  : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
// //   emptyMsgSub   : { fontSize: 13, color: '#94A3B8', marginTop: 6 },
// //   inputWrap     : {
// //     flexDirection: 'row', alignItems: 'flex-end',
// //     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
// //     paddingVertical: 12, gap: 10,
// //     borderTopWidth: 1, borderTopColor: '#F1F5F9',
// //   },
// //   input         : {
// //     flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24,
// //     paddingHorizontal: 16, paddingVertical: 10,
// //     fontSize: 15, color: '#1E293B', maxHeight: 100,
// //     borderWidth: 1, borderColor: '#E2E8F0',
// //   },
// //   sendBtn       : {
// //     width: 46, height: 46, borderRadius: 23,
// //     backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
// //   },
// //   sendBtnOff    : { backgroundColor: '#BFDBFE' },
// //   sendIcon      : { fontSize: 18, color: '#FFFFFF' },
// // });



// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, KeyboardAvoidingView, Platform,
//   ActivityIndicator, StatusBar, Alert, Image,
//   PermissionsAndroid,
// } from 'react-native';
// import {
//   getFirestore, collection, query, orderBy,
//   onSnapshot, addDoc, serverTimestamp, doc, updateDoc,
// } from '@react-native-firebase/firestore';
// import auth           from '@react-native-firebase/auth';
// import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// import { uploadImage, uploadVoice } from '../../utils/mediaUpload';

// const audioRecorderPlayer = new AudioRecorderPlayer();

// export default function ChatScreen({ route, navigation }) {
//   const { chatId, expertName, expertId } = route.params;

//   const [messages, setMessages]     = useState([]);
//   const [text, setText]             = useState('');
//   const [loading, setLoading]       = useState(true);
//   const [sending, setSending]       = useState(false);
//   const [recording, setRecording]   = useState(false);
//   const [recordTime, setRecordTime] = useState('00:00');
//   const [playingId, setPlayingId]   = useState(null);
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const flatRef = useRef(null);
//   const uid     = auth().currentUser?.uid;

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

//   // ✅ Message Save helper
//   const saveMessage = async (msgData) => {
//     const db = getFirestore();
//     await addDoc(collection(db, 'chats', chatId, 'messages'), {
//       ...msgData,
//       senderId  : uid,
//       senderRole: 'user',
//       createdAt : serverTimestamp(),
//     });
//     await updateDoc(doc(db, 'chats', chatId), {
//       lastMessage: msgData.type === 'text'
//         ? msgData.text
//         : msgData.type === 'image'
//         ? '📷 Image'
//         : '🎤 Voice message',
//       updatedAt: serverTimestamp(),
//     });
//   };

//   // ✅ Text Message
//   const sendTextMessage = async () => {
//     if (!text.trim() || sending) return;
//     const trimmed = text.trim();
//     setText('');
//     setSending(true);
//     try {
//       await saveMessage({ type: 'text', text: trimmed });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setSending(false);
//     }
//   };

//   // ✅ Image Pick karo
//   const handleImagePick = () => {
//     Alert.alert('Image Select karo', '', [
//       {
//         text   : '📷 Camera',
//         onPress: () => launchCamera(
//           { mediaType: 'photo', quality: 0.7 },
//           handleImageResponse,
//         ),
//       },
//       {
//         text   : '🖼️ Gallery',
//         onPress: () => launchImageLibrary(
//           { mediaType: 'photo', quality: 0.7 },
//           handleImageResponse,
//         ),
//       },
//       { text: 'Cancel', style: 'cancel' },
//     ]);
//   };

//   const handleImageResponse = async (response) => {
//     if (response.didCancel || !response.assets?.[0]) return;
//     const uri = response.assets[0].uri;
//     setUploadingMedia(true);
//     try {
//       const imageUrl = await uploadImage(uri, chatId);
//       await saveMessage({ type: 'image', imageUrl });
//     } catch (e) {
//       Alert.alert('Error', 'Image upload failed');
//     } finally {
//       setUploadingMedia(false);
//     }
//   };

//   // ✅ Voice Record
//   const requestAudioPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         {
//           title  : 'Microphone Permission',
//           message: 'Voice message ke liye microphone access chahiye',
//           buttonPositive: 'Allow',
//         },
//       );
//       return granted === PermissionsAndroid.RESULTS.GRANTED;
//     }
//     return true;
//   };

//   const startRecording = async () => {
//     const permitted = await requestAudioPermission();
//     if (!permitted) {
//       Alert.alert('Permission Denied', 'Microphone permission nahi mili');
//       return;
//     }
//     try {
//       const path = Platform.OS === 'android'
//         ? `${require('react-native').default?.NativeModules?.RNFSManager
//             ? '' : ''}voice_${Date.now()}.mp4`
//         : `voice_${Date.now()}.m4a`;

//       await audioRecorderPlayer.startRecorder(path);
//       setRecording(true);

//       audioRecorderPlayer.addRecordBackListener((e) => {
//         const secs = Math.floor(e.currentPosition / 1000);
//         const mm   = Math.floor(secs / 60).toString().padStart(2, '0');
//         const ss   = (secs % 60).toString().padStart(2, '0');
//         setRecordTime(`${mm}:${ss}`);
//       });
//     } catch (e) {
//       console.error('Record error:', e);
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       const uri = await audioRecorderPlayer.stopRecorder();
//       audioRecorderPlayer.removeRecordBackListener();
//       setRecording(false);
//       setRecordTime('00:00');

//       if (!uri) return;
//       setUploadingMedia(true);
//       const voiceUrl = await uploadVoice(uri, chatId);
//       await saveMessage({ type: 'voice', voiceUrl });
//     } catch (e) {
//       Alert.alert('Error', 'Voice upload failed');
//     } finally {
//       setUploadingMedia(false);
//     }
//   };

//   // ✅ Voice Play
//   const playVoice = async (msgId, voiceUrl) => {
//     try {
//       if (playingId === msgId) {
//         await audioRecorderPlayer.stopPlayer();
//         setPlayingId(null);
//         return;
//       }
//       setPlayingId(msgId);
//       await audioRecorderPlayer.startPlayer(voiceUrl);
//       audioRecorderPlayer.addPlayBackListener((e) => {
//         if (e.currentPosition >= e.duration) {
//           setPlayingId(null);
//           audioRecorderPlayer.stopPlayer();
//         }
//       });
//     } catch (e) {
//       console.error('Play error:', e);
//       setPlayingId(null);
//     }
//   };

//   const formatTime = (ts) => {
//     if (!ts?.toDate) return '';
//     return ts.toDate().toLocaleTimeString('en-IN', {
//       hour: '2-digit', minute: '2-digit',
//     });
//   };

//   // ✅ Message Bubble render
//   const renderMsg = ({ item, index }) => {
//     const isMe     = item.senderId === uid;
//     const showDate = index === 0 || (
//       messages[index - 1]?.createdAt?.toDate?.()?.toDateString() !==
//       item.createdAt?.toDate?.()?.toDateString()
//     );

//     return (
//       <>
//         {showDate && item.createdAt && (
//           <View style={styles.dateBadge}>
//             <Text style={styles.dateBadgeText}>
//               {item.createdAt.toDate().toLocaleDateString('en-IN', {
//                 day: 'numeric', month: 'short',
//               })}
//             </Text>
//           </View>
//         )}

//         <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
//           {!isMe && (
//             <View style={styles.expertDot}>
//               <Text style={{ fontSize: 14 }}>🩺</Text>
//             </View>
//           )}

//           {/* ── Text Message ── */}
//           {item.type === 'text' && (
//             <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
//               <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
//                 {item.text}
//               </Text>
//               <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
//                 {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
//               </Text>
//             </View>
//           )}

//           {/* ── Image Message ── */}
//           {item.type === 'image' && (
//             <View style={[styles.imgBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
//               <Image
//                 source={{ uri: item.imageUrl }}
//                 style={styles.msgImage}
//                 resizeMode="cover"
//               />
//               <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther, { marginTop: 4 }]}>
//                 {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
//               </Text>
//             </View>
//           )}

//           {/* ── Voice Message ── */}
//           {item.type === 'voice' && (
//             <TouchableOpacity
//               style={[styles.voiceBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
//               onPress={() => playVoice(item.id, item.voiceUrl)}
//             >
//               <View style={styles.voiceRow}>
//                 <View style={[
//                   styles.playBtn,
//                   { backgroundColor: isMe ? 'rgba(255,255,255,0.3)' : '#EFF6FF' },
//                 ]}>
//                   <Text style={{ fontSize: 16 }}>
//                     {playingId === item.id ? '⏹' : '▶️'}
//                   </Text>
//                 </View>
//                 {/* Waveform visual */}
//                 <View style={styles.waveform}>
//                   {[8, 14, 10, 18, 12, 16, 8, 14, 10, 12].map((h, i) => (
//                     <View
//                       key={i}
//                       style={[
//                         styles.waveBar,
//                         {
//                           height         : h,
//                           backgroundColor: isMe
//                             ? 'rgba(255,255,255,0.8)'
//                             : '#2563EB',
//                           opacity: playingId === item.id ? 1 : 0.6,
//                         },
//                       ]}
//                     />
//                   ))}
//                 </View>
//                 <Text style={[
//                   styles.voiceLabel,
//                   { color: isMe ? 'rgba(255,255,255,0.8)' : '#64748B' },
//                 ]}>
//                   🎤 Voice
//                 </Text>
//               </View>
//               <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
//                 {formatTime(item.createdAt)}{isMe ? ' ✓✓' : ''}
//               </Text>
//             </TouchableOpacity>
//           )}
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
//           <Text style={{ fontSize: 18 }}>🩺</Text>
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.headerName}>{expertName}</Text>
//           <Text style={styles.headerStatus}>● Online</Text>
//         </View>
//       </View>

//       {/* Uploading indicator */}
//       {uploadingMedia && (
//         <View style={styles.uploadingBar}>
//           <ActivityIndicator size="small" color="#FFFFFF" />
//           <Text style={styles.uploadingText}>Uploading...</Text>
//         </View>
//       )}

//       {loading ? (
//         <View style={styles.centered}>
//           <ActivityIndicator size="large" color="#2563EB" />
//         </View>
//       ) : (
//         <FlatList
//           ref={flatRef}
//           data={messages}
//           keyExtractor={(item) => item.id}
//           renderItem={renderMsg}
//           contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
//           onContentSizeChange={() =>
//             flatRef.current?.scrollToEnd({ animated: true })
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyMsg}>
//               <Text style={styles.emptyMsgIcon}>👋</Text>
//               <Text style={styles.emptyMsgText}>Apna sawal puchho!</Text>
//               <Text style={styles.emptyMsgSub}>{expertName} aapki madad karenge</Text>
//             </View>
//           }
//         />
//       )}

//       {/* Input Bar */}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         {/* Recording UI */}
//         {recording ? (
//           <View style={styles.recordingBar}>
//             <View style={styles.recordingDot} />
//             <Text style={styles.recordingText}>Recording... {recordTime}</Text>
//             <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording}>
//               <Text style={styles.stopRecordText}>⏹ Send</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <View style={styles.inputWrap}>
//             {/* Image Button */}
//             <TouchableOpacity style={styles.mediaBtn} onPress={handleImagePick}>
//               <Text style={styles.mediaBtnIcon}>📷</Text>
//             </TouchableOpacity>

//             {/* Text Input */}
//             <TextInput
//               style={styles.input}
//               placeholder="Apna sawal likhein..."
//               placeholderTextColor="#9CA3AF"
//               value={text}
//               onChangeText={setText}
//               multiline
//               maxLength={500}
//             />

//             {/* Voice or Send Button */}
//             {text.trim() ? (
//               <TouchableOpacity
//                 style={[styles.sendBtn, sending && styles.sendBtnOff]}
//                 onPress={sendTextMessage}
//                 disabled={sending}
//               >
//                 {sending
//                   ? <ActivityIndicator size="small" color="#FFFFFF" />
//                   : <Text style={styles.sendIcon}>➤</Text>
//                 }
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity
//                 style={styles.voiceBtn}
//                 onPress={startRecording}
//               >
//                 <Text style={styles.voiceBtnIcon}>🎤</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
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
//   backArrow      : { fontSize: 24, color: '#2563EB', fontWeight: '700' },
//   headerAvatar   : {
//     width: 40, height: 40, borderRadius: 20,
//     backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
//   },
//   headerName     : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
//   headerStatus   : { fontSize: 12, color: '#10B981', marginTop: 1 },

//   uploadingBar   : {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: '#2563EB', padding: 8, gap: 8,
//   },
//   uploadingText  : { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

//   dateBadge      : { alignItems: 'center', marginVertical: 10 },
//   dateBadgeText  : {
//     fontSize: 12, color: '#94A3B8',
//     backgroundColor: '#E2E8F0',
//     paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
//   },

//   msgRow         : { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
//   msgRowMe       : { justifyContent: 'flex-end' },
//   msgRowOther    : { justifyContent: 'flex-start' },
//   expertDot      : {
//     width: 30, height: 30, borderRadius: 15,
//     backgroundColor: '#EFF6FF', justifyContent: 'center',
//     alignItems: 'center', marginRight: 8,
//   },

//   bubble         : { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
//   bubbleMe       : { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
//   bubbleOther    : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
//   msgText        : { fontSize: 15, lineHeight: 22 },
//   msgTextMe      : { color: '#FFFFFF' },
//   msgTextOther   : { color: '#1E293B' },
//   msgTime        : { fontSize: 10, marginTop: 4 },
//   msgTimeMe      : { color: '#BFDBFE', textAlign: 'right' },
//   msgTimeOther   : { color: '#94A3B8' },

//   imgBubble      : { maxWidth: '75%', borderRadius: 16, overflow: 'hidden', padding: 4 },
//   msgImage       : { width: 200, height: 200, borderRadius: 12 },

//   voiceBubble    : { maxWidth: '75%', borderRadius: 18, padding: 12 },
//   voiceRow       : { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   playBtn        : { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
//   waveform       : { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
//   waveBar        : { width: 3, borderRadius: 2 },
//   voiceLabel     : { fontSize: 12, fontWeight: '600' },

//   emptyMsg       : { alignItems: 'center', paddingTop: 80 },
//   emptyMsgIcon   : { fontSize: 48, marginBottom: 12 },
//   emptyMsgText   : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
//   emptyMsgSub    : { fontSize: 13, color: '#94A3B8', marginTop: 6 },

//   inputWrap      : {
//     flexDirection: 'row', alignItems: 'flex-end',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 12,
//     paddingVertical: 10, gap: 8,
//     borderTopWidth: 1, borderTopColor: '#F1F5F9',
//   },
//   mediaBtn       : {
//     width: 42, height: 42, borderRadius: 21,
//     backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
//   },
//   mediaBtnIcon   : { fontSize: 20 },
//   input          : {
//     flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24,
//     paddingHorizontal: 16, paddingVertical: 10,
//     fontSize: 15, color: '#1E293B', maxHeight: 100,
//     borderWidth: 1, borderColor: '#E2E8F0',
//   },
//   sendBtn        : {
//     width: 44, height: 44, borderRadius: 22,
//     backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
//   },
//   sendBtnOff     : { backgroundColor: '#BFDBFE' },
//   sendIcon       : { fontSize: 18, color: '#FFFFFF' },
//   voiceBtn       : {
//     width: 44, height: 44, borderRadius: 22,
//     backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
//   },
//   voiceBtnIcon   : { fontSize: 20 },

//   recordingBar   : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
//     paddingVertical: 14, gap: 12,
//     borderTopWidth: 1, borderTopColor: '#F1F5F9',
//   },
//   recordingDot   : {
//     width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626',
//   },
//   recordingText  : { flex: 1, fontSize: 15, color: '#DC2626', fontWeight: '600' },
//   stopRecordBtn  : {
//     backgroundColor: '#2563EB', paddingHorizontal: 16,
//     paddingVertical: 10, borderRadius: 20,
//   },
//   stopRecordText : { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
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
import auth from '@react-native-firebase/auth';

// ✅ react-native-image-crop-picker
import ImagePicker from 'react-native-image-crop-picker';

// ❌ Voice — temporarily hidden
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// const audioRecorderPlayer = new AudioRecorderPlayer();

import { uploadImage } from '../../utils/mediaUpload';

export default function ChatScreen({ route, navigation }) {
  const { chatId, expertName, expertId } = route.params;

  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  // const [recording, setRecording]      = useState(false);  // voice hidden
  // const [recordTime, setRecordTime]    = useState('00:00'); // voice hidden
  // const [playingId, setPlayingId]      = useState(null);    // voice hidden

  const flatRef = useRef(null);
  const uid     = auth().currentUser?.uid;

  console.log("auth().currentUser",auth().currentUser);

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

  // ── Save message helper ─────────────────────────────────────────────────
  const saveMessage = async (msgData) => {
    const db = getFirestore();
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      ...msgData,
      senderId  : uid,
      senderRole: 'user',
      createdAt : serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:
        msgData.type === 'text'  ? msgData.text
        : msgData.type === 'image' ? '📷 Image'
        : '',
      updatedAt: serverTimestamp(),
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
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // ── Image pick (react-native-image-crop-picker) ─────────────────────────
  const handleImagePick = () => {
    Alert.alert('Image Select karo', '', [
      {
        text   : '📷 Camera',
        onPress: () =>
          ImagePicker.openCamera({
            mediaType           : 'photo',
            compressImageQuality: 0.7,
            cropping            : false,   // true karo agar crop UI chahiye
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

  // image-crop-picker returns { path, mime, ... }  ← .path use karo, not .uri
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

  // ── Voice — hidden for now ──────────────────────────────────────────────
  // const requestAudioPermission = async () => { ... };
  // const startRecording = async () => { ... };
  // const stopRecording  = async () => { ... };
  // const playVoice      = async (msgId, voiceUrl) => { ... };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Render message bubble ───────────────────────────────────────────────
  const renderMsg = ({ item, index }) => {
    const isMe     = item.senderId === uid;
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
            <View style={styles.expertDot}>
              <Text style={{ fontSize: 14 }}>🩺</Text>
            </View>
          )}

          {/* ── Text Message ── */}
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

          {/* ── Image Message ── */}
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

          {/* ── Voice Message — hidden ── */}
          {/* {item.type === 'voice' && ( ... )} */}

        </View>
      </>
    );
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={{ fontSize: 18 }}>🩺</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{expertName}</Text>
          <Text style={styles.headerStatus}>● Online</Text>
        </View>
      </View>

      {/* Upload progress */}
      {uploadingMedia && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
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
              <Text style={styles.emptyMsgIcon}>👋</Text>
              <Text style={styles.emptyMsgText}>Apna sawal puchho!</Text>
              <Text style={styles.emptyMsgSub}>{expertName} aapki madad karenge</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputWrap}>
          {/* Image Button */}
          <TouchableOpacity style={styles.mediaBtn} onPress={handleImagePick}>
            <Text style={styles.mediaBtnIcon}>📷</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder="Apna sawal likhein..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />

          {/* Send Button  (voice button hidden) */}
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

          {/* Voice Button — hidden
          <TouchableOpacity style={styles.voiceBtn} onPress={startRecording}>
            <Text style={styles.voiceBtnIcon}>🎤</Text>
          </TouchableOpacity> */}
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
  backArrow      : { fontSize: 24, color: '#2563EB', fontWeight: '700' },
  headerAvatar   : {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  headerName     : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  headerStatus   : { fontSize: 12, color: '#10B981', marginTop: 1 },

  uploadingBar   : {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', padding: 8, gap: 8,
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
  expertDot      : {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EFF6FF', justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },

  bubble         : { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe       : { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bubbleOther    : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText        : { fontSize: 15, lineHeight: 22 },
  msgTextMe      : { color: '#FFFFFF' },
  msgTextOther   : { color: '#1E293B' },
  msgTime        : { fontSize: 10, marginTop: 4 },
  msgTimeMe      : { color: '#BFDBFE', textAlign: 'right' },
  msgTimeOther   : { color: '#94A3B8' },

  imgBubble      : { maxWidth: '75%', borderRadius: 16, overflow: 'hidden', padding: 4 },
  msgImage       : { width: 200, height: 200, borderRadius: 12 },

  emptyMsg       : { alignItems: 'center', paddingTop: 80 },
  emptyMsgIcon   : { fontSize: 48, marginBottom: 12 },
  emptyMsgText   : { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptyMsgSub    : { fontSize: 13, color: '#94A3B8', marginTop: 6 },

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
    backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff     : { backgroundColor: '#BFDBFE' },
  sendIcon       : { fontSize: 18, color: '#FFFFFF' },

  // Voice styles — hidden for now
  // voiceBtn, voiceBtnIcon, recordingBar, recordingDot,
  // recordingText, stopRecordBtn, stopRecordText,
  // voiceBubble, voiceRow, playBtn, waveform, waveBar, voiceLabel
});