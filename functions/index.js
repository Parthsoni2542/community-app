// // const functions = require('firebase-functions');
// // const admin     = require('firebase-admin');

// // // ✅ Service account se initialize karo
// // const serviceAccount = require('./communityadvisory-76bf6-6eb69b2f8a06.json');
// // // ⚠️ Upar wali line mein apni actual file ka naam daalo

// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount),
// // });

// // // ✅ Jab bhi naya message aaye — notification bhejo
// // exports.sendChatNotification = functions.firestore
// //   .document('chats/{chatId}/messages/{messageId}')
// //   .onCreate(async (snap, context) => {

// //     const message = snap.data();
// //     const chatId  = context.params.chatId;

// //     console.log('📩 New message:', message.text, 'in chat:', chatId);

// //     try {
// //       // Chat document fetch karo
// //       const chatDoc = await admin.firestore()
// //         .collection('chats')
// //         .doc(chatId)
// //         .get();

// //       if (!chatDoc.exists) {
// //         console.log('❌ Chat not found');
// //         return null;
// //       }

// //       const chat = chatDoc.data();

// //       // ✅ Receiver decide karo
// //       // User ne bheja → Expert ko notify karo
// //       // Expert ne bheja → User ko notify karo
// //       const receiverId = message.senderRole === 'user'
// //         ? chat.expertId
// //         : chat.userId;

// //       if (!receiverId) {
// //         console.log('❌ Receiver not found');
// //         return null;
// //       }

// //       // Receiver ka FCM Token lo
// //       const receiverDoc = await admin.firestore()
// //         .collection('users')
// //         .doc(receiverId)
// //         .get();

// //       if (!receiverDoc.exists) {
// //         console.log('❌ Receiver doc not found');
// //         return null;
// //       }

// //       const fcmToken = receiverDoc.data()?.fcmToken;
// //       if (!fcmToken) {
// //         console.log('❌ FCM token not found for:', receiverId);
// //         return null;
// //       }

// //       // Sender ka naam lo
// //       const senderDoc = await admin.firestore()
// //         .collection('users')
// //         .doc(message.senderId)
// //         .get();

// //       const senderName = senderDoc.exists()
// //         ? senderDoc.data().name
// //         : 'Someone';

// //       // ✅ Notification title/body
// //       const title = message.senderRole === 'user'
// //         ? `${senderName} 💬`
// //         : `Dr. ${senderName} 🩺`;

// //       const body = message.text?.length > 100
// //         ? message.text.substring(0, 100) + '...'
// //         : message.text;

// //       // ✅ Notification bhejo
// //       const notificationPayload = {
// //         token       : fcmToken,
// //         notification: { title, body },
// //         data        : {
// //           chatId,
// //           senderRole: message.senderRole,
// //           screen    : message.senderRole === 'user' ? 'ExpertReplyChat' : 'Chat',
// //         },
// //         android: {
// //           priority   : 'high',
// //           notification: {
// //             sound    : 'default',
// //             channelId: 'default',
// //           },
// //         },
// //       };

// //       const response = await admin.messaging().send(notificationPayload);
// //       console.log('✅ Notification sent successfully:', response);

// //     } catch (error) {
// //       console.error('❌ Notification error:', error);
// //     }

// //     return null;
// //   });


// const { onDocumentCreated } = require('firebase-functions/v2/firestore');
// const admin                 = require('firebase-admin');

// const serviceAccount = require('./communityadvisory-76bf6-6eb69b2f8a06.json');

// // ⚠️ Apni actual file ka naam daalo

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// exports.sendChatNotification = onDocumentCreated(
//   'chats/{chatId}/messages/{messageId}',
//   async (event) => {
//     const message = event.data.data();
//     const chatId  = event.params.chatId;

//     console.log('📩 New message in chat:', chatId);

//     try {
//       // Chat fetch karo
//       const chatDoc = await admin.firestore()
//         .collection('chats').doc(chatId).get();

//       if (!chatDoc.exists) return null;

//       const chat = chatDoc.data();

//       // Receiver decide karo
//       const receiverId = message.senderRole === 'user'
//         ? chat.expertId
//         : chat.userId;

//       if (!receiverId) return null;

//       // Receiver ka FCM token
//       const receiverDoc = await admin.firestore()
//         .collection('users').doc(receiverId).get();

//       if (!receiverDoc.exists) return null;

//       const fcmToken = receiverDoc.data()?.fcmToken;
//       if (!fcmToken) {
//         console.log('❌ No FCM token for:', receiverId);
//         return null;
//       }

//       // Sender name
//       const senderDoc = await admin.firestore()
//         .collection('users').doc(message.senderId).get();

//       const senderName = senderDoc.exists
//         ? senderDoc.data().name
//         : 'Someone';

//       // Title/Body
//       const title = message.senderRole === 'user'
//         ? `${senderName} 💬`
//         : `${senderName} 🩺`;

//       const body = message.text?.length > 100
//         ? message.text.substring(0, 100) + '...'
//         : message.text;

//       // Send notification
//       await admin.messaging().send({
//         token       : fcmToken,
//         notification: { title, body },
//         data        : {
//           chatId,
//           senderRole: message.senderRole,
//         },
//         android: {
//           priority   : 'high',
//           notification: {
//             sound    : 'default',
//             channelId: 'default',
//           },
//         },
//       });

//       console.log('✅ Notification sent to:', receiverId);

//     } catch (error) {
//       console.error('❌ Error:', error);
//     }

//     return null;
//   },
// );



const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin                 = require('firebase-admin');

const serviceAccount = require('./communityadvisory-76bf6-6eb69b2f8a06.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendChatNotification = onDocumentCreated(
  {
    document: 'chats/{chatId}/messages/{messageId}',
    region  : 'us-central1',  // ✅ asia-south1 ki jagah us-central1
  },
  async (event) => {
    const message = event.data.data();
    const chatId  = event.params.chatId;

    console.log('📩 New message in chat:', chatId);

    try {
      const chatDoc = await admin.firestore()
        .collection('chats').doc(chatId).get();

      if (!chatDoc.exists) return null;

      const chat       = chatDoc.data();
      const receiverId = message.senderRole === 'user'
        ? chat.expertId
        : chat.userId;

      if (!receiverId) return null;

      const receiverDoc = await admin.firestore()
        .collection('users').doc(receiverId).get();

      if (!receiverDoc.exists) return null;

      const fcmToken = receiverDoc.data()?.fcmToken;
      if (!fcmToken) {
        console.log('❌ No FCM token for:', receiverId);
        return null;
      }

      const senderDoc  = await admin.firestore()
        .collection('users').doc(message.senderId).get();
      const senderName = senderDoc.exists
        ? senderDoc.data().name
        : 'Someone';

      const title = message.senderRole === 'user'
        ? `${senderName} 💬`
        : `${senderName} 🩺`;

      const body = message.text?.length > 100
        ? message.text.substring(0, 100) + '...'
        : message.text;

      await admin.messaging().send({
        token       : fcmToken,
        notification: { title, body },
        data        : { chatId, senderRole: message.senderRole },
        android     : {
          priority   : 'high',
          notification: { sound: 'default', channelId: 'default' },
        },
      });

      console.log('✅ Notification sent to:', receiverId);

    } catch (error) {
      console.error('❌ Error:', error);
    }

    return null;
  },
);