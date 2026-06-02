// Expert ko notify karo jab user message bheje
export const sendChatNotification = async (toUid, title, body, data = {}) => {
  try {
    // Receiver ka FCM token Firestore se lo
    const { getFirestore, doc, getDoc } = require('@react-native-firebase/firestore');
    const db      = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', toUid));

    if (!userDoc.exists()) return;

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return;

    // Firebase Cloud Messaging REST API
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': 'key=YOUR_SERVER_KEY', // 👈 Firebase Console se lo
      },
      body: JSON.stringify({
        to          : fcmToken,
        notification: { title, body, sound: 'default' },
        data        : { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        priority    : 'high',
      }),
    });

    const result = await response.json();
    console.log('✅ Notification sent:', result);
  } catch (e) {
    console.error('Notification error:', e);
  }
};