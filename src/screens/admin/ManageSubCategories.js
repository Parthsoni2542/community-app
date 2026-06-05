// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, Alert, Modal, ActivityIndicator,
//   StatusBar, KeyboardAvoidingView, Platform,
// } from 'react-native';
// import {
//   getFirestore, collection, onSnapshot,
//   addDoc, updateDoc, deleteDoc, doc,
//   serverTimestamp, orderBy, query,
// } from '@react-native-firebase/firestore';

// const EMOJI_OPTIONS = [
//   '❤️','🧠','🦴','👁️','🦷','👶','🩺','💊','🔬','🩻',
//   '🧬','🫁','🫀','🦻','👃','💉','🩹','🏃','🧘','⚕️',
// ];

// export default function ManageSubCategories({ route, navigation }) {
//   const { categoryId, categoryName, categoryIcon } = route.params;

//   const [subcategories, setSubcategories] = useState([]);
//   const [loading, setLoading]             = useState(true);
//   const [modalVisible, setModal]          = useState(false);
//   const [subName, setSubName]             = useState('');
//   const [subIcon, setSubIcon]             = useState('❤️');
//   const [subDesc, setSubDesc]             = useState('');
//   const [editId, setEditId]               = useState(null);
//   const [saving, setSaving]               = useState(false);

//   useEffect(() => {
//     const db = getFirestore();
//     const q  = query(
//       collection(db, 'categories', categoryId, 'subcategories'),
//       orderBy('createdAt', 'desc'),
//     );
//     const unsub = onSnapshot(q, (snap) => {
//       setSubcategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//       setLoading(false);
//     });
//     return unsub;
//   }, [categoryId]);

//   const openAdd = () => {
//     setEditId(null); setSubName(''); setSubIcon('❤️'); setSubDesc(''); setModal(true);
//   };
//   const openEdit = (item) => {
//     setEditId(item.id); setSubName(item.name);
//     setSubIcon(item.icon || '❤️'); setSubDesc(item.description || '');
//     setModal(true);
//   };

//   const handleSave = async () => {
//     if (!subName.trim()) { Alert.alert('Error', 'Subcategory naam daalo'); return; }
//     setSaving(true);
//     const db   = getFirestore();
//     const data = { name: subName.trim(), icon: subIcon, description: subDesc.trim(), categoryId };
//     try {
//       if (editId) {
//         await updateDoc(
//           doc(db, 'categories', categoryId, 'subcategories', editId), data,
//         );
//       } else {
//         await addDoc(
//           collection(db, 'categories', categoryId, 'subcategories'),
//           { ...data, createdAt: serverTimestamp() },
//         );
//       }
//       setModal(false);
//     } catch (e) {
//       Alert.alert('Error', e.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = (id, name) => {
//     Alert.alert('Delete?', `"${name}" delete hoga`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive',
//         onPress: async () => {
//           const db = getFirestore();
//           await deleteDoc(doc(db, 'categories', categoryId, 'subcategories', id));
//         },
//       },
//     ]);
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.card}>
//       <View style={styles.cardIconWrap}>
//         <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.cardName}>{item.name}</Text>
//         {item.description ? (
//           <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
//         ) : null}
//       </View>
//       <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
//         <Text style={styles.editBtnText}>Edit</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id, item.name)}>
//         <Text style={styles.delBtnText}>🗑️</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#2563EB" />
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//           <Text style={styles.backArrow}>←</Text>
//         </TouchableOpacity>
//         <View style={{ flex: 1 }}>
//           <View style={styles.headerTop}>
            
//             <Text style={styles.headerTitle}>{categoryName}</Text>
//           </View>
//           <Text style={styles.headerSub}>{subcategories.length} subcategories</Text>
//         </View>
//         <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
//           <Text style={styles.addBtnText}>+ New</Text>
//         </TouchableOpacity>
//       </View>

//       {/* List */}
//       <FlatList
//         data={subcategories}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//         ListEmptyComponent={
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>📋</Text>
//             <Text style={styles.emptyText}>Koi subcategory nahi hai</Text>
//             <Text style={styles.emptySub}>+ New dabao aur pehli subcategory banao</Text>
//           </View>
//         }
//       />

//       {/* Modal */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <KeyboardAvoidingView
//           style={styles.modalOverlay}
//           behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//           <View style={styles.modalBox}>
//             <View style={styles.modalHandle} />
//             <Text style={styles.modalTitle}>
//               {editId ? '✏️  Edit Subcategory' : '➕  New Subcategory'}
//             </Text>

//             {/* Parent Category Info */}
//             <View style={styles.parentBadge}>
//               <Text style={styles.parentIcon}>{categoryIcon}</Text>
//               <Text style={styles.parentName}>Under: {categoryName}</Text>
//             </View>

//             {/* Icon Picker */}
//             <Text style={styles.fieldLabel}>Icon Choose karo</Text>
//             <View style={styles.emojiGrid}>
//               {EMOJI_OPTIONS.map((e) => (
//                 <TouchableOpacity
//                   key={e}
//                   style={[styles.emojiBtn, subIcon === e && styles.emojiBtnActive]}
//                   onPress={() => setSubIcon(e)}
//                 >
//                   <Text style={styles.emojiText}>{e}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Name */}
//             <Text style={styles.fieldLabel}>Subcategory Name *</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="e.g. Cardiologist, Criminal Lawyer..."
//               placeholderTextColor="#9CA3AF"
//               value={subName}
//               onChangeText={setSubName}
//             />

//             {/* Description */}
//             <Text style={styles.fieldLabel}>Description (Optional)</Text>
//             <TextInput
//               style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
//               placeholder="Short description..."
//               placeholderTextColor="#9CA3AF"
//               value={subDesc}
//               onChangeText={setSubDesc}
//               multiline
//             />

//             {/* Preview */}
//             <View style={styles.preview}>
//               <Text style={styles.previewIcon}>{subIcon}</Text>
//               <View>
//                 <Text style={styles.previewName}>{subName || 'Subcategory Name'}</Text>
//                 <Text style={styles.previewDesc}>{categoryIcon} {categoryName}</Text>
//               </View>
//             </View>

//             {/* Buttons */}
//             <View style={styles.modalBtns}>
//               <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
//                 {saving
//                   ? <ActivityIndicator color="#fff" size="small" />
//                   : <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Save'}</Text>
//                 }
//               </TouchableOpacity>
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container    : { flex: 1, backgroundColor: '#F8FAFC' },
//   centered     : { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header       : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 16,
//     paddingTop: 52, paddingBottom: 14,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   backBtn      : { marginRight: 10, padding: 6 },
//   backArrow    : { fontSize: 22, color: '#2563EB', fontWeight: '700' },
//   headerTop    : { flexDirection: 'row', alignItems: 'center' },
//   categoryIcon : { fontSize: 20, marginRight: 6 },
//   headerTitle  : { fontSize: 18, fontWeight: '800', color: '#0F172A' },
//   headerSub    : { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   addBtn       : { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24 },
//   addBtnText   : { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

//   card         : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 14, marginBottom: 10,
//     borderWidth: 1, borderColor: '#F1F5F9',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   cardIconWrap : {
//     width: 46, height: 46, borderRadius: 12,
//     backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12,
//   },
//   cardIcon     : { fontSize: 22 },
//   cardName     : { fontSize: 15, fontWeight: '700', color: '#1E293B' },
//   cardDesc     : { fontSize: 12, color: '#94A3B8', marginTop: 3 },
//   editBtn      : { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 6 },
//   editBtnText  : { color: '#2563EB', fontWeight: '600', fontSize: 13 },
//   delBtn       : { padding: 6 },
//   delBtnText   : { fontSize: 18 },

//   empty        : { alignItems: 'center', paddingTop: 80 },
//   emptyIcon    : { fontSize: 52, marginBottom: 14 },
//   emptyText    : { fontSize: 17, fontWeight: '700', color: '#1E293B' },
//   emptySub     : { fontSize: 13, color: '#94A3B8', marginTop: 6 },

//   modalOverlay : { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
//   modalBox     : {
//     backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     padding: 24, paddingBottom: 36,
//   },
//   modalHandle  : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
//   modalTitle   : { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },

//   parentBadge  : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginBottom: 16,
//     borderWidth: 1, borderColor: '#BBF7D0',
//   },
//   parentIcon   : { fontSize: 18, marginRight: 8 },
//   parentName   : { fontSize: 13, fontWeight: '600', color: '#16A34A' },

//   fieldLabel   : { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

//   emojiGrid    : { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
//   emojiBtn     : { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
//   emojiBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
//   emojiText    : { fontSize: 20 },

//   input        : {
//     backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
//     borderRadius: 12, padding: 13, fontSize: 15, color: '#1E293B', marginBottom: 12,
//   },

//   preview      : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 18,
//     borderWidth: 1, borderColor: '#BBF7D0',
//   },
//   previewIcon  : { fontSize: 28, marginRight: 12 },
//   previewName  : { fontSize: 14, fontWeight: '700', color: '#166534' },
//   previewDesc  : { fontSize: 12, color: '#86EFAC', marginTop: 2 },

//   modalBtns    : { flexDirection: 'row', gap: 12 },
//   cancelBtn    : { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, alignItems: 'center' },
//   cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
//   saveBtn      : { flex: 1, backgroundColor: '#2563EB', borderRadius: 14, padding: 14, alignItems: 'center' },
//   saveBtnText  : { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
// });



import React, {
  useEffect, useState, useCallback, memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets }  from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageCropPicker        from 'react-native-image-crop-picker';
import storage                from '@react-native-firebase/storage';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from '@react-native-firebase/firestore';

// ── Design tokens — identical to ManageCategories ─────────────────────────────

const COLORS = {
  primary      : '#0D7B7A',
  primaryLight : '#F0FDFA',
  primaryBorder: '#E0F2F1',
  inactive     : '#94A3B8',
  surface      : '#FFFFFF',
  background   : '#F4FAFA',
  textPrimary  : '#0F172A',
  textSub      : '#64748B',
  danger       : '#DC2626',
  dangerBg     : '#FEE2E2',
  shadow       : '#0D7B7A',
};

// Fixed row height → enables getItemLayout
const CARD_HEIGHT = 78;
const CARD_MARGIN = 10;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

// ── Image upload helper (mirrors ManageCategories) ────────────────────────────

const uploadImageToStorage = async (localUri) => {
  const filename  = `subcategories/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const reference = storage().ref(filename);
  await reference.putFile(localUri);
  return await reference.getDownloadURL();
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonLines}>
      <View style={styles.skeletonLineA} />
      <View style={styles.skeletonLineB} />
    </View>
  </View>
));

// ── SubCategoryCard ───────────────────────────────────────────────────────────

/**
 * Memoized card. `item.icon` holds a Firebase Storage URL (same pattern as
 * ManageCategories). Falls back to a MatIcon when no image is set.
 */
const SubCategoryCard = memo(({ item, onEdit, onDelete }) => (
  <View style={styles.card}>
    {/* Icon / image */}
    <View style={styles.cardIconWrap}>
      {/* {item.icon ? (
        <Image
          source={{ uri: item.icon }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : ( */}
        <MatIcon name="shape-outline" size={22} color={COLORS.primary} />
      {/* )} */}
    </View>

    {/* Text */}
    <View style={styles.cardText}>
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
      ) : (
        <Text style={styles.cardNoDesc}>No description</Text>
      )}
    </View>

    {/* Edit */}
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onEdit}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Icon name="edit-2" size={15} color={COLORS.primary} />
    </TouchableOpacity>

    {/* Delete */}
    <TouchableOpacity
      style={[styles.actionBtn, styles.actionBtnDanger]}
      onPress={onDelete}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Icon name="trash-2" size={15} color={COLORS.danger} />
    </TouchableOpacity>
  </View>
));

// ── Image picker (mirrors ManageCategories ImagePickerBox) ────────────────────

const ImagePickerBox = memo(({ uri, uploading, onPress }) => (
  <TouchableOpacity
    style={styles.imagePickerBox}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={uploading}
  >
    {uploading ? (
      <View style={styles.imagePickerPlaceholder}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.imagePickerHint}>Uploading image...</Text>
      </View>
    ) : uri ? (
      <>
        <Image source={{ uri }} style={styles.imagePickerPreview} resizeMode="cover" />
        <View style={styles.imagePickerOverlay}>
          <Icon name="camera" size={20} color={COLORS.surface} />
          <Text style={styles.imagePickerOverlayText}>Change Image</Text>
        </View>
      </>
    ) : (
      <View style={styles.imagePickerPlaceholder}>
        <View style={styles.imagePickerIconCircle}>
          <Icon name="image" size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.imagePickerLabel}>Tap to upload subcategory image</Text>
        <Text style={styles.imagePickerHint}>JPG or PNG, recommended 512×512</Text>
      </View>
    )}
  </TouchableOpacity>
));

// ── Parent category badge shown inside the modal ──────────────────────────────

/**
 * categoryIcon is either a remote URL string or null/undefined.
 * We render an <Image> for URLs, and a MatIcon fallback otherwise.
 */
const ParentBadge = memo(({ categoryName, categoryIcon }) => (
  <View style={styles.parentBadge}>
    <View style={styles.parentBadgeIcon}>
      {categoryIcon ? (
        <Image
          source={{ uri: categoryIcon }}
          style={styles.parentBadgeImage}
          resizeMode="cover"
        />
      ) : (
        <MatIcon name="shape-outline" size={16} color={COLORS.primary} />
      )}
    </View>
    <View>
      <Text style={styles.parentBadgeLabel}>Parent Service</Text>
      <Text style={styles.parentBadgeName} numberOfLines={1}>{categoryName}</Text>
    </View>
  </View>
));

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ManageSubCategories() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { categoryId, categoryName, categoryIcon } = route.params;

  const [subcategories, setSubcategories] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);

  // Form state
  const [subName,        setSubName]        = useState('');
  const [subDesc,        setSubDesc]        = useState('');
  const [editId,         setEditId]         = useState(null);
  const [localImageUri,  setLocalImageUri]  = useState(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState(null);

  // ── Firestore listener ────────────────────────────────────────────────────
  useEffect(() => {
    const db  = getFirestore();
    const q   = query(
      collection(db, 'categories', categoryId, 'subcategories'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setSubcategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('Subcategories snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );
    return unsub;
  }, [categoryId]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setSubName('');
    setSubDesc('');
    setLocalImageUri(null);
    setRemoteImageUrl(null);
    setEditId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEdit = useCallback((item) => {
    setEditId(item.id);
    setSubName(item.name);
    setSubDesc(item.description || '');
    setRemoteImageUrl(item.icon || null);
    setLocalImageUri(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  // ── Image picker ──────────────────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width               : 512,
        height              : 512,
        cropping            : true,
        cropperCircleOverlay: false,
        mediaType           : 'photo',
        compressImageQuality: 0.8,
      });

      setLocalImageUri(image.path);
      setUploading(true);
      const url = await uploadImageToStorage(image.path);
      setRemoteImageUrl(url);
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
        console.error('Image upload error:', err);
      }
    } finally {
      setUploading(false);
    }
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!subName.trim()) {
      Alert.alert('Required', 'Please enter a subcategory name.');
      return;
    }
    if (uploading) {
      Alert.alert('Please Wait', 'Image is still uploading.');
      return;
    }

    setSaving(true);
    const db   = getFirestore();
    const data = {
      name       : subName.trim(),
      icon       : remoteImageUrl || null,
      description: subDesc.trim(),
      categoryId,
    };

    try {
      if (editId) {
        await updateDoc(
          doc(db, 'categories', categoryId, 'subcategories', editId),
          data,
        );
      } else {
        await addDoc(
          collection(db, 'categories', categoryId, 'subcategories'),
          { ...data, createdAt: serverTimestamp() },
        );
      }
      setModalVisible(false);
      resetForm();
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [subName, subDesc, remoteImageUrl, editId, uploading, categoryId, resetForm]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id, name) => {
    Alert.alert(
      'Delete Subcategory',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text   : 'Delete',
          style  : 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(
                doc(getFirestore(), 'categories', categoryId, 'subcategories', id),
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to delete subcategory. Please try again.');
            }
          },
        },
      ],
    );
  }, [categoryId]);

  // ── FlatList helpers ──────────────────────────────────────────────────────

  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <SubCategoryCard
      item={item}
      onEdit={() => openEdit(item)}
      onDelete={() => handleDelete(item.id, item.name)}
    />
  ), [openEdit, handleDelete]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyBox}>
      <MatIcon name="shape-outline" size={52} color={COLORS.primaryBorder} />
      <Text style={styles.emptyTitle}>No Sub Services Yet</Text>
      <Text style={styles.emptySub}>Tap "+ New" to create the first Sub Services.</Text>
    </View>
  ), []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const previewUri       = localImageUri || remoteImageUrl;
  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
            <Text style={styles.headerSub}>Loading...</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((k) => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="wifi-off" size={40} color={COLORS.inactive} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorSub}>Check your connection and try again.</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {/* Parent service thumbnail */}
          {/* {categoryIcon ? (
            <Image
              source={{ uri: categoryIcon }}
              style={styles.headerThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.headerThumbFallback}>
              <MatIcon name="shape-outline" size={16} color={COLORS.primary} />
            </View>
          )} */}
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
            <Text style={styles.headerSub}>
              {subcategories.length}{' '}
              {subcategories.length === 1 ? 'Sub Services' : 'Sub Services'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Icon name="plus" size={16} color={COLORS.surface} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      {/* List */}
      <FlatList
        data={subcategories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalBox, { paddingBottom: insets.bottom + 24 }]}>

            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Title row */}
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Icon
                  name={editId ? 'edit-2' : 'plus'}
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.modalTitle}>
                {editId ? 'Edit Sub Services' : 'New Sub Services'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={20} color={COLORS.inactive} />
              </TouchableOpacity>
            </View>

            {/*
              ScrollView keeps all fields accessible when the soft keyboard
              is open on small screens — no fields get hidden.
            */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Parent service badge */}
              <ParentBadge
                categoryName={categoryName}
                categoryIcon={categoryIcon}
              />

              {/* Image picker */}
              <Text style={styles.fieldLabel}>
                Sub Services Image{' '}
                <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <ImagePickerBox
                uri={previewUri}
                uploading={uploading}
                onPress={handlePickImage}
              />

              {/* Name */}
              <Text style={styles.fieldLabel}>
                Sub Services Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cardiologist, Criminal Lawyer..."
                placeholderTextColor={COLORS.inactive}
                value={subName}
                onChangeText={setSubName}
                returnKeyType="next"
                autoCapitalize="words"
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>
                Description <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.inputMulti}
                placeholder="Brief description of this subcategory..."
                placeholderTextColor={COLORS.inactive}
                value={subDesc}
                onChangeText={setSubDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Buttons — outside ScrollView so they're always visible */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (saving || uploading) && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={saving || uploading}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Icon
                      name={editId ? 'check' : 'plus'}
                      size={16}
                      color={COLORS.surface}
                    />
                    <Text style={styles.saveBtnText}>
                      {editId ? 'Update' : 'Save'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems    : 'center',
    padding       : 32,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom    : 16,
  },
  backBtn: {
    width          : 38,
    height         : 38,
    borderRadius   : 12,
    backgroundColor: COLORS.primaryLight,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  headerCenter: {
    flex         : 1,
    flexDirection: 'row',
    alignItems   : 'center',
  },
  headerThumb: {
    width       : 32,
    height      : 32,
    borderRadius: 9,
    marginRight : 10,
  },
  headerThumbFallback: {
    width          : 32,
    height         : 32,
    borderRadius   : 9,
    backgroundColor: COLORS.primaryLight,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  headerTitle: {
    fontSize  : 18,
    fontWeight: '800',
    color     : COLORS.textPrimary,
  },
  headerSub: {
    fontSize  : 12,
    color     : COLORS.inactive,
    marginTop : 2,
    fontWeight: '500',
  },
  headerDivider: {
    height         : 1,
    backgroundColor: COLORS.primaryBorder,
  },
  addBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical  : 10,
    borderRadius     : 24,
  },
  addBtnText: {
    color     : COLORS.surface,
    fontWeight: '700',
    fontSize  : 14,
    marginLeft: 6,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop       : 16,
  },

  // ── Subcategory card ──────────────────────────────────────────────────────
  card: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    borderRadius     : 16,
    paddingVertical  : 14,
    paddingHorizontal: 14,
    marginBottom     : CARD_MARGIN,
    height           : CARD_HEIGHT,
    shadowColor      : COLORS.shadow,
    shadowOpacity    : 0.07,
    shadowRadius     : 10,
    shadowOffset     : { width: 0, height: 3 },
    elevation        : 2,
  },
  cardIconWrap: {
    width          : 46,
    height         : 46,
    borderRadius   : 13,
    backgroundColor: COLORS.primaryLight,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 12,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
    overflow       : 'hidden',
  },
  cardImage: {
    width : 46,
    height: 46,
  },
  cardText: {
    flex          : 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize  : 15,
    fontWeight: '700',
    color     : COLORS.textPrimary,
  },
  cardDesc: {
    fontSize : 12,
    color    : COLORS.textSub,
    marginTop: 3,
  },
  cardNoDesc: {
    fontSize : 12,
    color    : COLORS.inactive,
    marginTop: 3,
    fontStyle: 'italic',
  },
  actionBtn: {
    width          : 34,
    height         : 34,
    borderRadius   : 10,
    backgroundColor: COLORS.primaryLight,
    alignItems     : 'center',
    justifyContent : 'center',
    marginLeft     : 6,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  actionBtnDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor    : '#FCA5A5',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop       : 16,
  },
  skeletonCard: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    borderRadius     : 16,
    paddingVertical  : 14,
    paddingHorizontal: 14,
    marginBottom     : CARD_MARGIN,
    height           : CARD_HEIGHT,
  },
  skeletonIcon: {
    width          : 46,
    height         : 46,
    borderRadius   : 13,
    backgroundColor: '#D1F4F2',
    marginRight    : 12,
  },
  skeletonLines : { flex: 1 },
  skeletonLineA : {
    height         : 14,
    width          : '60%',
    backgroundColor: '#D1F4F2',
    borderRadius   : 6,
    marginBottom   : 8,
  },
  skeletonLineB : {
    height         : 11,
    width          : '40%',
    backgroundColor: '#E8F9F8',
    borderRadius   : 6,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems       : 'center',
    paddingTop       : 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize  : 17,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    marginTop : 16,
  },
  emptySub: {
    fontSize : 13,
    color    : COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorTitle: {
    fontSize  : 17,
    fontWeight: '700',
    color     : COLORS.textPrimary,
    marginTop : 14,
  },
  errorSub: {
    fontSize : 13,
    color    : COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent : 'flex-end',
  },
  modalBox: {
    backgroundColor     : COLORS.surface,
    borderTopLeftRadius : 28,
    borderTopRightRadius: 28,
    paddingHorizontal   : 24,
    paddingTop          : 12,
    // Cap height so content doesn't overflow on large phones
    maxHeight           : '92%',
  },
  modalHandle: {
    width          : 40,
    height         : 4,
    backgroundColor: COLORS.primaryBorder,
    borderRadius   : 2,
    alignSelf      : 'center',
    marginBottom   : 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    marginBottom : 20,
  },
  modalTitleIcon: {
    width          : 32,
    height         : 32,
    borderRadius   : 10,
    backgroundColor: COLORS.primaryLight,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  modalTitle: {
    flex      : 1,
    fontSize  : 18,
    fontWeight: '800',
    color     : COLORS.textPrimary,
  },

  // ── Parent badge ──────────────────────────────────────────────────────────
  parentBadge: {
    flexDirection  : 'row',
    alignItems     : 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius   : 12,
    padding        : 12,
    marginBottom   : 18,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  parentBadgeIcon: {
    width          : 36,
    height         : 36,
    borderRadius   : 10,
    backgroundColor: COLORS.surface,
    alignItems     : 'center',
    justifyContent : 'center',
    marginRight    : 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
    overflow       : 'hidden',
  },
  parentBadgeImage: {
    width : 36,
    height: 36,
  },
  parentBadgeLabel: {
    fontSize  : 10,
    fontWeight: '700',
    color     : COLORS.inactive,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  parentBadgeName: {
    fontSize  : 13,
    fontWeight: '700',
    color     : COLORS.primary,
    marginTop : 1,
  },

  // ── Field labels & inputs ─────────────────────────────────────────────────
  fieldLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    color        : COLORS.textSub,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom : 8,
  },
  required: { color: COLORS.danger },
  optional: {
    color        : COLORS.inactive,
    fontWeight   : '400',
    textTransform: 'none',
  },
  input: {
    backgroundColor  : COLORS.background,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
    borderRadius     : 12,
    paddingVertical  : 12,
    paddingHorizontal: 14,
    fontSize         : 15,
    color            : COLORS.textPrimary,
    marginBottom     : 14,
  },
  inputMulti: {
    backgroundColor  : COLORS.background,
    borderWidth      : 1,
    borderColor      : COLORS.primaryBorder,
    borderRadius     : 12,
    paddingVertical  : 12,
    paddingHorizontal: 14,
    fontSize         : 15,
    color            : COLORS.textPrimary,
    marginBottom     : 18,
    minHeight        : 72,
    textAlignVertical: 'top',
  },

  // ── Image picker ──────────────────────────────────────────────────────────
  imagePickerBox: {
    width          : '100%',
    height         : 140,
    borderRadius   : 16,
    borderWidth    : 1.5,
    borderColor    : COLORS.primaryBorder,
    borderStyle    : 'dashed',
    overflow       : 'hidden',
    marginBottom   : 16,
    backgroundColor: COLORS.primaryLight,
  },
  imagePickerPlaceholder: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  imagePickerIconCircle: {
    width          : 52,
    height         : 52,
    borderRadius   : 26,
    backgroundColor: COLORS.surface,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : 8,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  imagePickerLabel: {
    fontSize    : 13,
    fontWeight  : '600',
    color       : COLORS.primary,
    marginBottom: 3,
  },
  imagePickerHint: {
    fontSize: 11,
    color   : COLORS.inactive,
  },
  imagePickerPreview: {
    width : '100%',
    height: '100%',
  },
  imagePickerOverlay: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 38,
    backgroundColor: 'rgba(13,123,122,0.75)',
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  imagePickerOverlayText: {
    color     : COLORS.surface,
    fontWeight: '700',
    fontSize  : 13,
    marginLeft: 6,
  },

  // ── Modal buttons ─────────────────────────────────────────────────────────
  modalBtns: {
    flexDirection: 'row',
    marginTop    : 4,
  },
  cancelBtn: {
    flex           : 1,
    backgroundColor: COLORS.background,
    borderRadius   : 14,
    paddingVertical: 15,
    alignItems     : 'center',
    marginRight    : 12,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  cancelBtnText: {
    color     : COLORS.textSub,
    fontWeight: '700',
    fontSize  : 15,
  },
  saveBtn: {
    flex           : 1,
    backgroundColor: COLORS.primary,
    borderRadius   : 14,
    paddingVertical: 15,
    alignItems     : 'center',
    justifyContent : 'center',
    flexDirection  : 'row',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color     : COLORS.surface,
    fontWeight: '700',
    fontSize  : 15,
    marginLeft: 6,
  },
});