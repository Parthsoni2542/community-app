// // const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
// // const admin = require('firebase-admin');

// // admin.initializeApp();
// // const db = admin.firestore();

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Notification Flow Summary:
// // //
// // //  User sends msg          →  Admin notified
// // //  Admin replies           →  User notified
// // //  Admin re-routes msg     →  Expert(s) notified          (Function 3)
// // //  Expert replies          →  Admin + User both notified  (Function 2 ✅ fixed)
// // //  Expert re-routes chat   →  New Expert(s) notified      (Function 4)
// // // ─────────────────────────────────────────────────────────────────────────────

// // function getNotifBody(message) {
// //   if (message.type === 'image') return '📷 Sent an image';
// //   if (message.type === 'voice') return '🎤 Sent a voice message';
// //   if (message.type === 'text' && message.text) {
// //     return message.text.length > 100
// //       ? message.text.substring(0, 100) + '...'
// //       : message.text;
// //   }
// //   return 'New message';
// // }

// // function getNotifTitle(senderName, senderRole) {
// //   if (senderRole === 'user') return `${senderName} 💬`;
// //   if (senderRole === 'expert') return `${senderName} replied 🩺`;
// //   if (senderRole === 'admin') return `Admin replied 👨‍💼`;
// //   return senderName;
// // }

// // async function getTokensForUids(uids) {
// //   if (!uids || uids.length === 0) return [];
// //   const uniqueUids = [...new Set(uids.filter(Boolean))];
// //   const docs = await Promise.all(
// //     uniqueUids.map((uid) => db.collection('users').doc(uid).get()),
// //   );
// //   const tokenMap = [];
// //   docs.forEach((d, idx) => {
// //     const token = d.exists ? d.data()?.fcmToken : null;
// //     if (token) tokenMap.push({ uid: uniqueUids[idx], token });
// //     else console.log(`⚠️ No FCM token for uid: ${uniqueUids[idx]}`);
// //   });
// //   return tokenMap;
// // }

// // async function getAdminTokens() {
// //   const snapshot = await db.collection('users').where('role', '==', 'admin').get();
// //   const tokenMap = [];
// //   snapshot.forEach((d) => {
// //     const token = d.data()?.fcmToken;
// //     if (token) tokenMap.push({ uid: d.id, token });
// //     else console.log(`⚠️ No FCM token for admin uid: ${d.id}`);
// //   });
// //   return tokenMap;
// // }

// // async function sendAndCleanup(tokenMap, payload) {
// //   if (tokenMap.length === 0) {
// //     console.log('❌ No valid FCM tokens — skipping send');
// //     return;
// //   }
// //   const multicast = { tokens: tokenMap.map((t) => t.token), ...payload };
// //   const response = await admin.messaging().sendEachForMulticast(multicast);
// //   console.log(`✅ Sent: ${response.successCount} | Failed: ${response.failureCount}`);

// //   const cleanupPromises = [];
// //   response.responses.forEach((resp, idx) => {
// //     if (!resp.success) {
// //       const errorCode = resp.error?.code;
// //       console.log(`❌ Token failed — uid: ${tokenMap[idx].uid} | error: ${errorCode}`);
// //       if (
// //         errorCode === 'messaging/invalid-registration-token' ||
// //         errorCode === 'messaging/registration-token-not-registered'
// //       ) {
// //         cleanupPromises.push(
// //           db.collection('users').doc(tokenMap[idx].uid)
// //             .update({ fcmToken: null })
// //             .then(() => console.log(`🗑️ Removed bad token for uid: ${tokenMap[idx].uid}`))
// //             .catch((e) => console.error('Token cleanup error:', e)),
// //         );
// //       }
// //     }
// //   });
// //   if (cleanupPromises.length > 0) await Promise.all(cleanupPromises);
// // }

// // // ──────────────────────────────────────────────────────────────────────────────
// // // FUNCTION 1: Direct 1-to-1 chat  (chats/{chatId}/messages/{messageId})
// // // ──────────────────────────────────────────────────────────────────────────────
// // exports.sendChatNotification = onDocumentCreated(
// //   { document: 'chats/{chatId}/messages/{messageId}', region: 'asia-south1' },
// //   async (event) => {
// //     const message = event.data.data();
// //     const chatId = event.params.chatId;
// //     if (message.senderRole === 'system') return null;

// //     try {
// //       const chatDoc = await db.collection('chats').doc(chatId).get();
// //       if (!chatDoc.exists) return null;
// //       const chat = chatDoc.data();

// //       const receiverId = message.senderRole === 'user' ? chat.expertId : chat.userId;
// //       if (!receiverId) return null;

// //       let senderName = message.senderName || null;
// //       if (!senderName) {
// //         const senderDoc = await db.collection('users').doc(message.senderId).get();
// //         senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
// //       }

// //       const tokenMap = await getTokensForUids([receiverId]);
// //       await sendAndCleanup(tokenMap, {
// //         notification: {
// //           title: getNotifTitle(senderName, message.senderRole),
// //           body: getNotifBody(message),
// //         },
// //         data: {
// //           chatId,
// //           senderRole: message.senderRole || '',
// //           type: message.type || 'text',
// //           screen: 'Chat',
// //           isBroadcast: 'false',
// //         },
// //         android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //         apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //       });
// //     } catch (error) {
// //       console.error('❌ sendChatNotification error:', error);
// //     }
// //     return null;
// //   },
// // );

// // // ──────────────────────────────────────────────────────────────────────────────
// // // FUNCTION 2: Broadcast chat  (broadcastChats/{chatId}/messages/{messageId})
// // //
// // //  user sends    → admin notified (if ChatEnabled)
// // //  admin replies → user notified
// // //  expert replies → user notified + admin notified  ✅ FIXED
// // // ──────────────────────────────────────────────────────────────────────────────
// // exports.sendBroadcastChatNotification = onDocumentCreated(
// //   { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
// //   async (event) => {
// //     const message = event.data.data();
// //     const chatId = event.params.chatId;
// //     if (message.senderRole === 'system') return null;

// //     try {
// //       const chatDoc = await db.collection('broadcastChats').doc(chatId).get();
// //       if (!chatDoc.exists) return null;
// //       const chat = chatDoc.data();

// //       let senderName = message.senderName || null;
// //       if (!senderName) {
// //         const senderDoc = await db.collection('users').doc(message.senderId).get();
// //         senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
// //       }

// //       if (message.senderRole === 'user') {
// //         if (!chat.ChatEnabled) return null;

// //         // 1. Admin ko notify
// //         const adminTokenMap = await getAdminTokens();
// //         await sendAndCleanup(adminTokenMap, {
// //           notification: {
// //             title: `New message from ${senderName} 💬`,
// //             body: getNotifBody(message),
// //           },
// //           data: {
// //             chatId,
// //             senderRole: message.senderRole,
// //             type: message.type || 'text',
// //             screen: 'AdminChat',
// //             isBroadcast: 'true',
// //           },
// //           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //         });

// //         // 2. Jo expert chat handle kar rahe hain unko bhi notify ✅
// //         const expertIds = Array.isArray(chat.activeExpertIds)
// //           ? chat.activeExpertIds
// //           : chat.expertId ? [chat.expertId] : [];

// //         if (expertIds.length > 0) {
// //           const expertTokenMap = await getTokensForUids(expertIds);
// //           await sendAndCleanup(expertTokenMap, {
// //             notification: {
// //               title: `${senderName} 💬`,
// //               body: getNotifBody(message),
// //             },
// //             data: {
// //               chatId,
// //               senderRole: message.senderRole,
// //               type: message.type || 'text',
// //               screen: 'ExpertReplyChat',
// //               isBroadcast: 'true',
// //             },
// //             android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //             apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //           });
// //         }
// //       }
// //       // ── Admin replies → notify user ────────────────────────────────────────
// //       else if (message.senderRole === 'admin') {
// //         const userId = chat.userId;
// //         if (!userId) return null;

// //         const tokenMap = await getTokensForUids([userId]);
// //         await sendAndCleanup(tokenMap, {
// //           notification: {
// //             title: 'Admin replied 👨‍💼',
// //             body: getNotifBody(message),
// //           },
// //           data: {
// //             chatId,
// //             senderRole: message.senderRole,
// //             type: message.type || 'text',
// //             screen: 'Chat',
// //             isBroadcast: 'true',
// //           },
// //           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //         });

// //         // ── Expert replies → notify user + notify admin ✅ ─────────────────────
// //       } else if (message.senderRole === 'expert') {
// //         const userId = chat.userId;

// //         // 1. Notify user
// //         if (userId) {
// //           const userTokenMap = await getTokensForUids([userId]);
// //           await sendAndCleanup(userTokenMap, {
// //             notification: {
// //               title: getNotifTitle(senderName, 'expert'),
// //               body: getNotifBody(message),
// //             },
// //             data: {
// //               chatId,
// //               senderRole: message.senderRole,
// //               type: message.type || 'text',
// //               screen: 'ExpertReplyChat',
// //               isBroadcast: 'true',
// //             },
// //             android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //             apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //           });
// //         }

// //         // 2. Notify admin ✅ NEW
// //         const adminTokenMap = await getAdminTokens();
// //         await sendAndCleanup(adminTokenMap, {
// //           notification: {
// //             title: `${senderName} replied to a query 🩺`,
// //             body: getNotifBody(message),
// //           },
// //           data: {
// //             chatId,
// //             senderRole: message.senderRole,
// //             type: message.type || 'text',
// //             screen: 'AdminChat',
// //             isBroadcast: 'true',
// //           },
// //           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //         });
// //       }
// //     } catch (error) {
// //       console.error('❌ sendBroadcastChatNotification error:', error);
// //     }
// //     return null;
// //   },
// // );

// // // ──────────────────────────────────────────────────────────────────────────────
// // // FUNCTION 3: Admin per-message reroute  (RerouteSheet.js)
// // //   message status: pending → rerouted,  routedTo: [expertIds]
// // //
// // //   ✅ FIX: Guard against double-fire with Function 4.
// // //   RerouteSheet.js must set rerouteSource: 'sheet' on the message update.
// // //   RerouteModal.js sets rerouteSource: 'modal' on the chat update.
// // //   If rerouteSource === 'modal' here, we skip (Function 4 handles it).
// // // ──────────────────────────────────────────────────────────────────────────────
// // exports.notifyExpertOnMessageReroute = onDocumentUpdated(
// //   { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
// //   async (event) => {
// //     const before = event.data.before.data();
// //     const after = event.data.after.data();
// //     const chatId = event.params.chatId;

// //     // Only fire for user messages going pending → rerouted
// //     if (after.senderRole !== 'user') return null;
// //     if (before.status !== 'pending' || after.status !== 'rerouted') return null;

// //     // ✅ FIX: Skip if this reroute came from RerouteModal (Function 4 handles that)
// //     if (after.rerouteSource === 'modal') {
// //       console.log('⏭️ Skipping message reroute — triggered by modal (Function 4 handles it)');
// //       return null;
// //     }

// //     const expertIds = Array.isArray(after.routedTo)
// //       ? after.routedTo
// //       : after.routedTo ? [after.routedTo] : [];
// //     if (expertIds.length === 0) return null;

// //     const tokenMap = await getTokensForUids(expertIds);
// //     await sendAndCleanup(tokenMap, {
// //       notification: {
// //         title: 'New question forwarded to you 📬',
// //         body: getNotifBody(after),
// //       },
// //       data: {
// //         chatId,
// //         senderRole: after.senderRole,
// //         type: after.type || 'text',
// //         screen: 'ExpertReplyChat',
// //         isBroadcast: 'true',
// //       },
// //       android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //       apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //     });
// //     return null;
// //   },
// // );

// // // ──────────────────────────────────────────────────────────────────────────────
// // // FUNCTION 4: Expert whole-chat reroute  (RerouteModal in ExpertReplyChat)
// // //   chat.activeExpertIds changes → newly added experts get notified.
// // //   Works for both broadcastChats and chats collections.
// // //
// // //   RerouteModal.js must set rerouteSource: 'modal' on the chat updateDoc.
// // // ──────────────────────────────────────────────────────────────────────────────
// // async function notifyOnActiveExpertIdsChange(event, isBroadcast) {
// //   const before = event.data.before.data();
// //   const after = event.data.after.data();
// //   const chatId = event.params.chatId;

// //   const beforeIds = new Set(before.activeExpertIds || []);
// //   const afterIds = after.activeExpertIds || [];
// //   const newExpertIds = afterIds.filter((id) => !beforeIds.has(id));
// //   if (newExpertIds.length === 0) return null;

// //   const tokenMap = await getTokensForUids(newExpertIds);
// //   await sendAndCleanup(tokenMap, {
// //     notification: {
// //       title: 'Query forwarded to you 📬',
// //       body: `${after.userName || 'A user'} needs help — ${after.subcategoryName || after.categoryName || 'consultation'}`,
// //     },
// //     data: {
// //       chatId,
// //       screen: 'ExpertReplyChat',
// //       isBroadcast: isBroadcast ? 'true' : 'false',
// //     },
// //     android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
// //     apns: { payload: { aps: { sound: 'default', badge: 1 } } },
// //   });
// //   return null;
// // }

// // exports.notifyExpertOnChatRerouteBroadcast = onDocumentUpdated(
// //   { document: 'broadcastChats/{chatId}', region: 'asia-south1' },
// //   (event) => notifyOnActiveExpertIdsChange(event, true),
// // );

// // exports.notifyExpertOnChatRerouteDirect = onDocumentUpdated(
// //   { document: 'chats/{chatId}', region: 'asia-south1' },
// //   (event) => notifyOnActiveExpertIdsChange(event, false),
// // );



// const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
// const admin = require('firebase-admin');

// admin.initializeApp();
// const db = admin.firestore();

// // ─────────────────────────────────────────────────────────────────────────────
// // Notification Flow Summary:
// //
// //  User sends msg          →  Admin notified + assigned Expert(s) notified ✅ FIXED
// //  Admin replies            →  User notified
// //  Admin re-routes msg      →  Expert(s) notified                          (Function 3)
// //  Expert replies            →  Admin + User both notified                 (Function 2 ✅ fixed earlier)
// //  Expert re-routes chat     →  New Expert(s) notified                     (Function 4)
// //
// //  NOTE: chat.expertIds is the field RerouteSheet.js (admin) actually writes
// //  (arrayUnion) when a message is rerouted to expert(s). It is read here to
// //  decide who to notify when the user sends a follow-up message.
// // ─────────────────────────────────────────────────────────────────────────────

// function getNotifBody(message) {
//   if (message.type === 'image') return '📷 Sent an image';
//   if (message.type === 'voice') return '🎤 Sent a voice message';
//   if (message.type === 'text' && message.text) {
//     return message.text.length > 100
//       ? message.text.substring(0, 100) + '...'
//       : message.text;
//   }
//   return 'New message';
// }

// function getNotifTitle(senderName, senderRole) {
//   if (senderRole === 'user')   return `${senderName} 💬`;
//   if (senderRole === 'expert') return `${senderName} replied 🩺`;
//   if (senderRole === 'admin')  return `Admin replied 👨‍💼`;
//   return senderName;
// }

// async function getTokensForUids(uids) {
//   if (!uids || uids.length === 0) return [];
//   const uniqueUids = [...new Set(uids.filter(Boolean))];
//   const docs = await Promise.all(
//     uniqueUids.map((uid) => db.collection('users').doc(uid).get()),
//   );
//   const tokenMap = [];
//   docs.forEach((d, idx) => {
//     const token = d.exists ? d.data()?.fcmToken : null;
//     if (token) tokenMap.push({ uid: uniqueUids[idx], token });
//     else console.log(`⚠️ No FCM token for uid: ${uniqueUids[idx]}`);
//   });
//   return tokenMap;
// }

// async function getAdminTokens() {
//   const snapshot = await db.collection('users').where('role', '==', 'admin').get();
//   const tokenMap = [];
//   snapshot.forEach((d) => {
//     const token = d.data()?.fcmToken;
//     if (token) tokenMap.push({ uid: d.id, token });
//     else console.log(`⚠️ No FCM token for admin uid: ${d.id}`);
//   });
//   return tokenMap;
// }

// async function sendAndCleanup(tokenMap, payload) {
//   if (tokenMap.length === 0) {
//     console.log('❌ No valid FCM tokens — skipping send');
//     return;
//   }
//   const multicast = { tokens: tokenMap.map((t) => t.token), ...payload };
//   const response = await admin.messaging().sendEachForMulticast(multicast);
//   console.log(`✅ Sent: ${response.successCount} | Failed: ${response.failureCount}`);

//   const cleanupPromises = [];
//   response.responses.forEach((resp, idx) => {
//     if (!resp.success) {
//       const errorCode = resp.error?.code;
//       console.log(`❌ Token failed — uid: ${tokenMap[idx].uid} | error: ${errorCode}`);
//       if (
//         errorCode === 'messaging/invalid-registration-token' ||
//         errorCode === 'messaging/registration-token-not-registered'
//       ) {
//         cleanupPromises.push(
//           db.collection('users').doc(tokenMap[idx].uid)
//             .update({ fcmToken: null })
//             .then(() => console.log(`🗑️ Removed bad token for uid: ${tokenMap[idx].uid}`))
//             .catch((e) => console.error('Token cleanup error:', e)),
//         );
//       }
//     }
//   });
//   if (cleanupPromises.length > 0) await Promise.all(cleanupPromises);
// }

// // ──────────────────────────────────────────────────────────────────────────────
// // FUNCTION 1: Direct 1-to-1 chat  (chats/{chatId}/messages/{messageId})
// // ──────────────────────────────────────────────────────────────────────────────
// exports.sendChatNotification = onDocumentCreated(
//   { document: 'chats/{chatId}/messages/{messageId}', region: 'asia-south1' },
//   async (event) => {
//     const message = event.data.data();
//     const chatId  = event.params.chatId;
//     if (message.senderRole === 'system') return null;

//     try {
//       const chatDoc = await db.collection('chats').doc(chatId).get();
//       if (!chatDoc.exists) return null;
//       const chat = chatDoc.data();

//       const receiverId = message.senderRole === 'user' ? chat.expertId : chat.userId;
//       if (!receiverId) return null;

//       let senderName = message.senderName || null;
//       if (!senderName) {
//         const senderDoc = await db.collection('users').doc(message.senderId).get();
//         senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
//       }

//       const tokenMap = await getTokensForUids([receiverId]);
//       await sendAndCleanup(tokenMap, {
//         notification: {
//           title: getNotifTitle(senderName, message.senderRole),
//           body:  getNotifBody(message),
//         },
//         data: {
//           chatId,
//           senderRole: message.senderRole || '',
//           type: message.type || 'text',
//           screen: 'Chat',
//           isBroadcast: 'false',
//         },
//         android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//         apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//       });
//     } catch (error) {
//       console.error('❌ sendChatNotification error:', error);
//     }
//     return null;
//   },
// );

// // ──────────────────────────────────────────────────────────────────────────────
// // FUNCTION 2: Broadcast chat  (broadcastChats/{chatId}/messages/{messageId})
// //
// //  user sends     → admin notified (if ChatEnabled) + assigned expert(s) ✅ FIXED
// //  admin replies   → user notified
// //  expert replies  → user notified + admin notified
// // ──────────────────────────────────────────────────────────────────────────────
// exports.sendBroadcastChatNotification = onDocumentCreated(
//   { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
//   async (event) => {
//     const message = event.data.data();
//     const chatId  = event.params.chatId;
//     if (message.senderRole === 'system') return null;

//     try {
//       const chatDoc = await db.collection('broadcastChats').doc(chatId).get();
//       if (!chatDoc.exists) return null;
//       const chat = chatDoc.data();

//       let senderName = message.senderName || null;
//       if (!senderName) {
//         const senderDoc = await db.collection('users').doc(message.senderId).get();
//         senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
//       }

//       // ── User sends message → notify admin + assigned expert(s) ✅ FIXED ────
//       if (message.senderRole === 'user') {
//         if (!chat.ChatEnabled) return null;

//         // 1. Notify admin
//         const adminTokenMap = await getAdminTokens();
//         await sendAndCleanup(adminTokenMap, {
//           notification: {
//             title: `New message from ${senderName} 💬`,
//             body: getNotifBody(message),
//           },
//           data: {
//             chatId,
//             senderRole: message.senderRole,
//             type: message.type || 'text',
//             screen: 'AdminChat',
//             isBroadcast: 'true',
//           },
//           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//         });

//         // 2. Notify assigned expert(s).
//         //    `chat.expertIds` is the field RerouteSheet.js writes (arrayUnion)
//         //    when a message is rerouted to expert(s) — this is the correct
//         //    source of truth, NOT chat.activeExpertIds (that field belongs to
//         //    the separate ExpertReplyChat / RerouteModal flow — Function 4).
//         const expertIds = Array.isArray(chat.expertIds) ? chat.expertIds : [];

//         if (expertIds.length > 0) {
//           const expertTokenMap = await getTokensForUids(expertIds);
//           await sendAndCleanup(expertTokenMap, {
//             notification: {
//               title: `${senderName} 💬`,
//               body: getNotifBody(message),
//             },
//             data: {
//               chatId,
//               senderRole: message.senderRole,
//               type: message.type || 'text',
//               screen: 'ExpertReplyChat',
//               isBroadcast: 'true',
//             },
//             android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//             apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//           });
//         }

//       // ── Admin replies → notify user ────────────────────────────────────────
//       } else if (message.senderRole === 'admin') {
//         const userId = chat.userId;
//         if (!userId) return null;

//         const tokenMap = await getTokensForUids([userId]);
//         await sendAndCleanup(tokenMap, {
//           notification: {
//             title: 'Admin replied 👨‍💼',
//             body: getNotifBody(message),
//           },
//           data: {
//             chatId,
//             senderRole: message.senderRole,
//             type: message.type || 'text',
//             screen: 'Chat',
//             isBroadcast: 'true',
//           },
//           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//         });

//       // ── Expert replies → notify user + notify admin ────────────────────────
//       } else if (message.senderRole === 'expert') {
//         const userId = chat.userId;

//         // 1. Notify user
//         if (userId) {
//           const userTokenMap = await getTokensForUids([userId]);
//           await sendAndCleanup(userTokenMap, {
//             notification: {
//               title: getNotifTitle(senderName, 'expert'),
//               body: getNotifBody(message),
//             },
//             data: {
//               chatId,
//               senderRole: message.senderRole,
//               type: message.type || 'text',
//               screen: 'ExpertReplyChat',
//               isBroadcast: 'true',
//             },
//             android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//             apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//           });
//         }

//         // 2. Notify admin
//         const adminTokenMap = await getAdminTokens();
//         await sendAndCleanup(adminTokenMap, {
//           notification: {
//             title: `${senderName} replied to a query 🩺`,
//             body: getNotifBody(message),
//           },
//           data: {
//             chatId,
//             senderRole: message.senderRole,
//             type: message.type || 'text',
//             screen: 'AdminChat',
//             isBroadcast: 'true',
//           },
//           android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//           apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//         });
//       }
//     } catch (error) {
//       console.error('❌ sendBroadcastChatNotification error:', error);
//     }
//     return null;
//   },
// );

// // ──────────────────────────────────────────────────────────────────────────────
// // FUNCTION 3: Admin per-message reroute  (RerouteSheet.js)
// //   message status: pending → rerouted,  routedTo: [expertIds]
// //
// //   Guard against double-fire with Function 4.
// //   RerouteSheet.js sets rerouteSource: 'sheet' on the message update.
// //   RerouteModal.js sets rerouteSource: 'modal' on the chat update.
// //   If rerouteSource === 'modal' here, we skip (Function 4 handles it).
// //
// //   NOTE: RerouteSheet.js itself already writes the notified expert IDs into
// //   chat.expertIds (arrayUnion) at the same time it updates the message, so
// //   no extra chat-doc write is needed here — Function 2 reads chat.expertIds
// //   directly for subsequent user messages.
// // ──────────────────────────────────────────────────────────────────────────────
// exports.notifyExpertOnMessageReroute = onDocumentUpdated(
//   { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
//   async (event) => {
//     const before = event.data.before.data();
//     const after  = event.data.after.data();
//     const chatId = event.params.chatId;

//     // Only fire for user messages going pending → rerouted
//     if (after.senderRole !== 'user') return null;
//     if (before.status !== 'pending' || after.status !== 'rerouted') return null;

//     // Skip if this reroute came from RerouteModal (Function 4 handles that)
//     if (after.rerouteSource === 'modal') {
//       console.log('⏭️ Skipping message reroute — triggered by modal (Function 4 handles it)');
//       return null;
//     }

//     const expertIds = Array.isArray(after.routedTo)
//       ? after.routedTo
//       : after.routedTo ? [after.routedTo] : [];
//     if (expertIds.length === 0) return null;

//     const tokenMap = await getTokensForUids(expertIds);
//     await sendAndCleanup(tokenMap, {
//       notification: {
//         title: 'New question forwarded to you 📬',
//         body: getNotifBody(after),
//       },
//       data: {
//         chatId,
//         senderRole: after.senderRole,
//         type: after.type || 'text',
//         screen: 'ExpertReplyChat',
//         isBroadcast: 'true',
//       },
//       android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//       apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//     });
//     return null;
//   },
// );

// // ──────────────────────────────────────────────────────────────────────────────
// // FUNCTION 4: Expert whole-chat reroute  (RerouteModal in ExpertReplyChat)
// //   chat.activeExpertIds changes → newly added experts get notified.
// //   Works for both broadcastChats and chats collections.
// //
// //   RerouteModal.js must set rerouteSource: 'modal' on the chat updateDoc.
// // ──────────────────────────────────────────────────────────────────────────────
// async function notifyOnActiveExpertIdsChange(event, isBroadcast) {
//   const before = event.data.before.data();
//   const after  = event.data.after.data();
//   const chatId = event.params.chatId;

//   const beforeIds    = new Set(before.activeExpertIds || []);
//   const afterIds     = after.activeExpertIds || [];
//   const newExpertIds = afterIds.filter((id) => !beforeIds.has(id));
//   if (newExpertIds.length === 0) return null;

//   const tokenMap = await getTokensForUids(newExpertIds);
//   await sendAndCleanup(tokenMap, {
//     notification: {
//       title: 'Query forwarded to you 📬',
//       body: `${after.userName || 'A user'} needs help — ${after.subcategoryName || after.categoryName || 'consultation'}`,
//     },
//     data: {
//       chatId,
//       screen: 'ExpertReplyChat',
//       isBroadcast: isBroadcast ? 'true' : 'false',
//     },
//     android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
//     apns: { payload: { aps: { sound: 'default', badge: 1 } } },
//   });
//   return null;
// }

// exports.notifyExpertOnChatRerouteBroadcast = onDocumentUpdated(
//   { document: 'broadcastChats/{chatId}', region: 'asia-south1' },
//   (event) => notifyOnActiveExpertIdsChange(event, true),
// );

// exports.notifyExpertOnChatRerouteDirect = onDocumentUpdated(
//   { document: 'chats/{chatId}', region: 'asia-south1' },
//   (event) => notifyOnActiveExpertIdsChange(event, false),
// );



const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────────────────────────────────
// Notification Flow Summary:
//
//  User sends msg          →  Admin notified + assigned Expert(s) notified
//  Admin replies           →  User notified
//  Admin re-routes msg     →  Expert(s) notified                  (Function 3)
//  Expert replies          →  Admin + User both notified          (Function 2)
//  Expert re-routes chat   →  New Expert(s) notified              (Function 4)
//
//  FCM data fields (all strings — FCM only supports string values):
//    chatId, senderRole, type, screen, isBroadcast,
//    categoryName, subcategoryName, expertIds (JSON stringified array),
//    userName
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNotifBody(message) {
  if (message.type === 'image') return '📷 Sent an image';
  if (message.type === 'voice') return '🎤 Sent a voice message';
  if (message.type === 'text' && message.text) {
    return message.text.length > 100
      ? message.text.substring(0, 100) + '...'
      : message.text;
  }
  return 'New message';
}

function getNotifTitle(senderName, senderRole) {
  if (senderRole === 'user')   return `${senderName} 💬`;
  if (senderRole === 'expert') return `${senderName} replied 🩺`;
  if (senderRole === 'admin')  return `Admin replied 👨‍💼`;
  return senderName;
}

async function getTokensForUids(uids) {
  if (!uids || uids.length === 0) return [];
  const uniqueUids = [...new Set(uids.filter(Boolean))];
  const docs = await Promise.all(
    uniqueUids.map((uid) => db.collection('users').doc(uid).get()),
  );
  const tokenMap = [];
  docs.forEach((d, idx) => {
    const token = d.exists ? d.data()?.fcmToken : null;
    if (token) tokenMap.push({ uid: uniqueUids[idx], token });
    else console.log(`⚠️ No FCM token for uid: ${uniqueUids[idx]}`);
  });
  return tokenMap;
}

async function getAdminTokens() {
  const snapshot = await db.collection('users').where('role', '==', 'admin').get();
  const tokenMap = [];
  snapshot.forEach((d) => {
    const token = d.data()?.fcmToken;
    if (token) tokenMap.push({ uid: d.id, token });
    else console.log(`⚠️ No FCM token for admin uid: ${d.id}`);
  });
  return tokenMap;
}

async function sendAndCleanup(tokenMap, payload) {
  if (tokenMap.length === 0) {
    console.log('❌ No valid FCM tokens — skipping send');
    return;
  }
  const multicast = { tokens: tokenMap.map((t) => t.token), ...payload };
  const response = await admin.messaging().sendEachForMulticast(multicast);
  console.log(`✅ Sent: ${response.successCount} | Failed: ${response.failureCount}`);

  const cleanupPromises = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errorCode = resp.error?.code;
      console.log(`❌ Token failed — uid: ${tokenMap[idx].uid} | error: ${errorCode}`);
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        cleanupPromises.push(
          db.collection('users').doc(tokenMap[idx].uid)
            .update({ fcmToken: null })
            .then(() => console.log(`🗑️ Removed bad token for uid: ${tokenMap[idx].uid}`))
            .catch((e) => console.error('Token cleanup error:', e)),
        );
      }
    }
  });
  if (cleanupPromises.length > 0) await Promise.all(cleanupPromises);
}

// ──────────────────────────────────────────────────────────────────────────────
// FUNCTION 1: Direct 1-to-1 chat  (chats/{chatId}/messages/{messageId})
// ──────────────────────────────────────────────────────────────────────────────
exports.sendChatNotification = onDocumentCreated(
  { document: 'chats/{chatId}/messages/{messageId}', region: 'asia-south1' },
  async (event) => {
    const message = event.data.data();
    const chatId  = event.params.chatId;
    if (message.senderRole === 'system') return null;

    try {
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) return null;
      const chat = chatDoc.data();

      const receiverId = message.senderRole === 'user' ? chat.expertId : chat.userId;
      if (!receiverId) return null;

      let senderName = message.senderName || null;
      if (!senderName) {
        const senderDoc = await db.collection('users').doc(message.senderId).get();
        senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
      }

      const tokenMap = await getTokensForUids([receiverId]);
      await sendAndCleanup(tokenMap, {
        notification: {
          title: getNotifTitle(senderName, message.senderRole),
          body:  getNotifBody(message),
        },
        data: {
          chatId,
          senderUid:       message.senderId || '',   // ✅ ADD THIS
          senderRole:      message.senderRole || '',
          type:            message.type || 'text',
          screen:          'Chat',
          isBroadcast:     'false',
          categoryName:    chat.categoryName    || '',
          subcategoryName: chat.subcategoryName || '',
          userName:        chat.userName        || '',
          expertIds:       JSON.stringify(chat.expertIds || []),
        },
        android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (error) {
      console.error('❌ sendChatNotification error:', error);
    }
    return null;
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// FUNCTION 2: Broadcast chat  (broadcastChats/{chatId}/messages/{messageId})
//
//  user sends     → admin notified (if ChatEnabled) + assigned expert(s) notified
//  admin replies  → user notified
//  expert replies → user notified + admin notified
// ──────────────────────────────────────────────────────────────────────────────
exports.sendBroadcastChatNotification = onDocumentCreated(
  { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
  async (event) => {
    const message = event.data.data();
    const chatId  = event.params.chatId;
    if (message.senderRole === 'system') return null;

    try {
      const chatDoc = await db.collection('broadcastChats').doc(chatId).get();
      if (!chatDoc.exists) return null;
      const chat = chatDoc.data();

      // Common chat fields for data payload (all must be strings)
      const commonChatData = {
        senderUid:       message.senderId    || '',
        categoryName:    chat.categoryName    || '',
        subcategoryName: chat.subcategoryName || '',
        userName:        chat.userName        || '',
        expertIds:       JSON.stringify(Array.isArray(chat.expertIds) ? chat.expertIds : []),
      };

      let senderName = message.senderName || null;
      if (!senderName) {
        const senderDoc = await db.collection('users').doc(message.senderId).get();
        senderName = senderDoc.exists ? (senderDoc.data().name || 'Someone') : 'Someone';
      }

      // ── User sends message → notify admin + assigned expert(s) ────────────
      if (message.senderRole === 'user') {
        if (!chat.ChatEnabled) return null;

        // 1. Notify admin
        const adminTokenMap = await getAdminTokens();
        await sendAndCleanup(adminTokenMap, {
          notification: {
            title: `New message from ${senderName} 💬`,
            body:  getNotifBody(message),
          },
          data: {
            chatId,
            senderRole:  message.senderRole,
            type:        message.type || 'text',
            screen:      'AdminChat',
            isBroadcast: 'true',
            ...commonChatData,
          },
          android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });

        // 2. Notify assigned expert(s)
        //    chat.expertIds is written by RerouteSheet.js via arrayUnion
        const expertIds = Array.isArray(chat.expertIds) ? chat.expertIds : [];
        if (expertIds.length > 0) {
          const expertTokenMap = await getTokensForUids(expertIds);
          await sendAndCleanup(expertTokenMap, {
            notification: {
              title: `${senderName} 💬`,
              body:  getNotifBody(message),
            },
            data: {
              chatId,
              senderRole:  message.senderRole,
              type:        message.type || 'text',
              screen:      'ExpertReplyChat',
              isBroadcast: 'true',
              ...commonChatData,
            },
            android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          });
        }

      // ── Admin replies → notify user ────────────────────────────────────────
      } else if (message.senderRole === 'admin') {
        const userId = chat.userId;
        if (!userId) return null;

        const tokenMap = await getTokensForUids([userId]);
        await sendAndCleanup(tokenMap, {
          notification: {
            title: 'Admin replied 👨‍💼',
            body:  getNotifBody(message),
          },
          data: {
            chatId,
            senderRole:  message.senderRole,
            type:        message.type || 'text',
            screen:      'MainChat',
            isBroadcast: 'true',
            ...commonChatData,
          },
          android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });

      // ── Expert replies → notify user + notify admin ────────────────────────
      } else if (message.senderRole === 'expert') {
        const userId = chat.userId;

        // 1. Notify user
        if (userId) {
          const userTokenMap = await getTokensForUids([userId]);
          await sendAndCleanup(userTokenMap, {
            notification: {
              title: getNotifTitle(senderName, 'expert'),
              body:  getNotifBody(message),
            },
            data: {
              chatId,
              senderRole:  message.senderRole,
              type:        message.type || 'text',
              screen:      'MainChat',
              isBroadcast: 'true',
              ...commonChatData,
            },
            android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          });
        }

        // 2. Notify admin
        const adminTokenMap = await getAdminTokens();
        await sendAndCleanup(adminTokenMap, {
          notification: {
            title: `${senderName} replied to a query 🩺`,
            body:  getNotifBody(message),
          },
          data: {
            chatId,
            senderRole:  message.senderRole,
            type:        message.type || 'text',
            screen:      'AdminChat',
            isBroadcast: 'true',
            ...commonChatData,
          },
          android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });
      }
    } catch (error) {
      console.error('❌ sendBroadcastChatNotification error:', error);
    }
    return null;
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// FUNCTION 3: Admin per-message reroute  (RerouteSheet.js)
//   message status: pending → rerouted,  routedTo: [expertIds]
//
//   Guard: RerouteSheet.js sets rerouteSource: 'sheet' on the message.
//          RerouteModal.js sets rerouteSource: 'modal' on the chat.
//          If rerouteSource === 'modal', skip — Function 4 handles it.
//
//   Chat doc is fetched here to get categoryName, subcategoryName, userName
//   for the notification data payload.
// ──────────────────────────────────────────────────────────────────────────────
exports.notifyExpertOnMessageReroute = onDocumentUpdated(
  { document: 'broadcastChats/{chatId}/messages/{messageId}', region: 'asia-south1' },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const chatId = event.params.chatId;

    // Only fire for user messages going pending → rerouted
    if (after.senderRole !== 'user') return null;
    if (before.status !== 'pending' || after.status !== 'rerouted') return null;

    // Skip if this reroute came from RerouteModal (Function 4 handles that)
    if (after.rerouteSource === 'modal') {
      console.log('⏭️ Skipping message reroute — triggered by modal (Function 4 handles it)');
      return null;
    }

    const expertIds = Array.isArray(after.routedTo)
      ? after.routedTo
      : after.routedTo ? [after.routedTo] : [];
    if (expertIds.length === 0) return null;

    // Fetch chat doc for extra fields needed in notification data
    const chatDoc = await db.collection('broadcastChats').doc(chatId).get();
    const chat    = chatDoc.exists ? chatDoc.data() : {};

    const tokenMap = await getTokensForUids(expertIds);
    await sendAndCleanup(tokenMap, {
      notification: {
        title: 'New question forwarded to you 📬',
        body:  getNotifBody(after),
      },
      data: {
        chatId,
        senderUid:       after.senderId      || '',   // ✅ ADD THIS
        senderRole:      after.senderRole,
        type:            after.type || 'text',
        screen:          'ExpertReplyChat',
        isBroadcast:     'true',
        categoryName:    chat.categoryName    || '',
        subcategoryName: chat.subcategoryName || '',
        userName:        chat.userName        || '',
        expertIds:       JSON.stringify(Array.isArray(chat.expertIds) ? chat.expertIds : expertIds),
      },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return null;
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// FUNCTION 4: Expert whole-chat reroute  (RerouteModal in ExpertReplyChat)
//   chat.activeExpertIds changes → newly added experts get notified.
//   Works for both broadcastChats and chats collections.
//
//   RerouteModal.js must set rerouteSource: 'modal' on the chat updateDoc.
// ──────────────────────────────────────────────────────────────────────────────
async function notifyOnActiveExpertIdsChange(event, isBroadcast) {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  const chatId = event.params.chatId;

  const beforeIds    = new Set(before.activeExpertIds || []);
  const afterIds     = after.activeExpertIds || [];
  const newExpertIds = afterIds.filter((id) => !beforeIds.has(id));
  if (newExpertIds.length === 0) return null;

  const tokenMap = await getTokensForUids(newExpertIds);
  await sendAndCleanup(tokenMap, {
    notification: {
      title: 'Query forwarded to you 📬',
      body:  `${after.userName || 'A user'} needs help — ${after.subcategoryName || after.categoryName || 'consultation'}`,
    },
    data: {
      chatId,
      screen:          'ExpertReplyChat',
      isBroadcast:     isBroadcast ? 'true' : 'false',
      categoryName:    after.categoryName    || '',
      subcategoryName: after.subcategoryName || '',
      userName:        after.userName        || '',
      expertIds:       JSON.stringify(Array.isArray(after.activeExpertIds) ? after.activeExpertIds : []),
      senderRole:      '',
      type:            'text',
    },
    android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });
  return null;
}

exports.notifyExpertOnChatRerouteBroadcast = onDocumentUpdated(
  { document: 'broadcastChats/{chatId}', region: 'asia-south1' },
  (event) => notifyOnActiveExpertIdsChange(event, true),
);

exports.notifyExpertOnChatRerouteDirect = onDocumentUpdated(
  { document: 'chats/{chatId}', region: 'asia-south1' },
  (event) => notifyOnActiveExpertIdsChange(event, false),
);