import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

// ✅ Image Upload
export const uploadImage = async (uri, chatId) => {
  try {
    const filename = `chat_images/${chatId}_${Date.now()}.jpg`;

    const reference = storage().ref(filename);

    await reference.putFile(uri);

    const downloadUrl = await reference.getDownloadURL();

    console.log('Uploaded URL:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.log('Upload Error:', error);
    throw error;
  }
};

// ✅ Voice Upload
export const uploadVoice = async (uri, chatId) => {
  try {
    const filename  = `chat_voice/${chatId}_${Date.now()}.mp4`;
    const reference = storage().ref(filename);

    const response  = await fetch(uri);
    const blob      = await response.blob();
    await reference.put(blob);

    const url = await reference.getDownloadURL();
    console.log('✅ Voice uploaded:', url);
    return url;
  } catch (e) {
    console.error('❌ Voice upload error:', e.message);
    throw e;
  }
};