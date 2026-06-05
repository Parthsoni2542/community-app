// import React, {
//   useEffect, useState, useCallback, memo,
// } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   Modal,
//   ActivityIndicator,
//   StatusBar,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { useSafeAreaInsets }  from 'react-native-safe-area-context';
// import { useNavigation }      from '@react-navigation/native';
// import Icon    from 'react-native-vector-icons/Feather';
// import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {
//   getFirestore,
//   collection,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
//   orderBy,
//   query,
// } from '@react-native-firebase/firestore';

// // ── Design tokens — consistent with AdminDashboard & navigators ───────────────

// const COLORS = {
//   primary      : '#0D7B7A',
//   primaryLight : '#F0FDFA',
//   primaryBorder: '#E0F2F1',
//   inactive     : '#94A3B8',
//   surface      : '#FFFFFF',
//   background   : '#F4FAFA',
//   textPrimary  : '#0F172A',
//   textSub      : '#64748B',
//   danger       : '#DC2626',
//   dangerBg     : '#FEE2E2',
//   shadow       : '#0D7B7A',
// };

// // ── Icon options for category picker ─────────────────────────────────────────
// // Using emoji here intentionally — these are user-facing category icons,
// // not UI chrome. Vector icons are used for all action buttons.

// const ICON_OPTIONS = [
//   '🏥', '⚖️', '💼', '🦷', '👁️', '🧠',
//   '❤️', '🦴', '👶', '💊', '🩺', '📋',
//   '🔬', '🩻', '🧬',
// ];

// // Fixed row height enables getItemLayout — avoids layout measurement overhead
// const CARD_HEIGHT    = 78;
// const CARD_MARGIN    = 10;
// const ITEM_HEIGHT    = CARD_HEIGHT + CARD_MARGIN;

// // ── Sub-components ────────────────────────────────────────────────────────────

// const SkeletonCard = memo(() => (
//   <View style={styles.skeletonCard}>
//     <View style={styles.skeletonIcon} />
//     <View style={styles.skeletonLines}>
//       <View style={styles.skeletonLineA} />
//       <View style={styles.skeletonLineB} />
//     </View>
//   </View>
// ));

// /**
//  * CategoryCard — memoized to prevent FlatList full re-renders.
//  * Edit and delete use separate TouchableOpacity nodes with their own
//  * onPress; the parent card press navigates to SubCategories.
//  * Note: In React Native, touches don't bubble like the web, so we
//  * structure the layout so action buttons don't overlap the card press area.
//  */
// const CategoryCard = memo(({ item, onEdit, onDelete, onPress }) => (
//   <TouchableOpacity
//     style={styles.card}
//     onPress={onPress}
//     activeOpacity={0.75}
//   >
//     {/* Icon */}
//     <View style={styles.cardIconWrap}>
//       <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
//     </View>

//     {/* Text */}
//     <View style={styles.cardText}>
//       <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
//       {item.description ? (
//         <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
//       ) : (
//         <View style={styles.subHint}>
//           <Icon name="chevron-right" size={12} color={COLORS.primary} />
//           <Text style={styles.subHintText}>View subcategories</Text>
//         </View>
//       )}
//     </View>

//     {/* Actions */}
//     <TouchableOpacity
//       style={styles.actionBtn}
//       onPress={onEdit}
//       hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
//     >
//       <Icon name="edit-2" size={15} color={COLORS.primary} />
//     </TouchableOpacity>

//     <TouchableOpacity
//       style={[styles.actionBtn, styles.actionBtnDanger]}
//       onPress={onDelete}
//       hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
//     >
//       <Icon name="trash-2" size={15} color={COLORS.danger} />
//     </TouchableOpacity>
//   </TouchableOpacity>
// ));

// // ── Main screen ───────────────────────────────────────────────────────────────

// export default function ManageCategories() {
//   const navigation = useNavigation();
//   const insets     = useSafeAreaInsets();

//   const [categories,    setCategories]    = useState([]);
//   const [loading,       setLoading]       = useState(true);
//   const [error,         setError]         = useState(false);
//   const [modalVisible,  setModalVisible]  = useState(false);
//   const [saving,        setSaving]        = useState(false);

//   // Form state
//   const [catName, setCatName] = useState('');
//   const [catIcon, setCatIcon] = useState(ICON_OPTIONS[0]);
//   const [catDesc, setCatDesc] = useState('');
//   const [editId,  setEditId]  = useState(null);

//   // ── Firestore real-time listener ──────────────────────────────────────────
//   useEffect(() => {
//     const db  = getFirestore();
//     const q   = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));

//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//         setError(false);
//       },
//       (err) => {
//         console.error('Categories snapshot error:', err);
//         setLoading(false);
//         setError(true);
//       },
//     );

//     return unsub;
//   }, []);

//   // ── Modal helpers ─────────────────────────────────────────────────────────

//   const openAdd = useCallback(() => {
//     setEditId(null);
//     setCatName('');
//     setCatIcon(ICON_OPTIONS[0]);
//     setCatDesc('');
//     setModalVisible(true);
//   }, []);

//   const openEdit = useCallback((item) => {
//     setEditId(item.id);
//     setCatName(item.name);
//     setCatIcon(item.icon || ICON_OPTIONS[0]);
//     setCatDesc(item.description || '');
//     setModalVisible(true);
//   }, []);

//   const closeModal = useCallback(() => setModalVisible(false), []);

//   // ── CRUD handlers ─────────────────────────────────────────────────────────

//   const handleSave = useCallback(async () => {
//     if (!catName.trim()) {
//       Alert.alert('Required', 'Please enter a category name.');
//       return;
//     }
//     setSaving(true);
//     const db   = getFirestore();
//     const data = {
//       name       : catName.trim(),
//       icon       : catIcon,
//       description: catDesc.trim(),
//     };
//     try {
//       if (editId) {
//         await updateDoc(doc(db, 'categories', editId), data);
//       } else {
//         await addDoc(collection(db, 'categories'), {
//           ...data,
//           createdAt: serverTimestamp(),
//         });
//       }
//       setModalVisible(false);
//     } catch (err) {
//       Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   }, [catName, catIcon, catDesc, editId]);

//   const handleDelete = useCallback((id, name) => {
//     Alert.alert(
//       'Delete Category',
//       `Are you sure you want to delete "${name}"? This action cannot be undone.`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text   : 'Delete',
//           style  : 'destructive',
//           onPress: async () => {
//             try {
//               const db = getFirestore();
//               await deleteDoc(doc(db, 'categories', id));
//             } catch (err) {
//               Alert.alert('Error', 'Failed to delete category. Please try again.');
//             }
//           },
//         },
//       ],
//     );
//   }, []);

//   const handleCardPress = useCallback((item) => {
//     navigation.navigate('SubCategories', {
//       categoryId  : item.id,
//       categoryName: item.name,
//       categoryIcon: item.icon || '📁',
//     });
//   }, [navigation]);

//   // ── FlatList helpers ──────────────────────────────────────────────────────

//   const keyExtractor = useCallback((item) => item.id, []);

//   const getItemLayout = useCallback((_, index) => ({
//     length: ITEM_HEIGHT,
//     offset: ITEM_HEIGHT * index,
//     index,
//   }), []);

//   const renderItem = useCallback(({ item }) => (
//     <CategoryCard
//       item={item}
//       onPress={() => handleCardPress(item)}
//       onEdit={() => openEdit(item)}
//       onDelete={() => handleDelete(item.id, item.name)}
//     />
//   ), [handleCardPress, openEdit, handleDelete]);

//   const ListEmpty = useCallback(() => (
//     <View style={styles.emptyBox}>
//       <MatIcon name="shape-outline" size={52} color={COLORS.primaryBorder} />
//       <Text style={styles.emptyTitle}>No Categories Yet</Text>
//       <Text style={styles.emptySub}>Tap "+ New" to create your first category.</Text>
//     </View>
//   ), []);

//   // ── Header padding ────────────────────────────────────────────────────────
//   const headerPaddingTop = Platform.OS === 'ios'
//     ? insets.top + 12
//     : insets.top + 16;

//   // ── Loading state ─────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
//         <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
//           <View>
//             <Text style={styles.headerTitle}>Categories</Text>
//             <Text style={styles.headerSub}>Loading...</Text>
//           </View>
//         </View>
//         <View style={styles.headerDivider} />
//         <View style={styles.skeletonContainer}>
//           {[1, 2, 3, 4, 5].map((k) => <SkeletonCard key={k} />)}
//         </View>
//       </View>
//     );
//   }

//   // ── Error state ───────────────────────────────────────────────────────────
//   if (error) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <Icon name="wifi-off" size={40} color={COLORS.inactive} />
//         <Text style={styles.errorTitle}>Failed to Load</Text>
//         <Text style={styles.errorSub}>Check your connection and try again.</Text>
//       </View>
//     );
//   }

//   // ── Main render ───────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

//       {/* Header */}
//       <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
//         <View>
//           <Text style={styles.headerTitle}>Categories</Text>
//           <Text style={styles.headerSub}>
//             {categories.length} {categories.length === 1 ? 'category' : 'categories'}
//           </Text>
//         </View>
//         <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
//           <Icon name="plus" size={16} color={COLORS.surface} />
//           <Text style={styles.addBtnText}>New</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.headerDivider} />

//       {/* List */}
//       <FlatList
//         data={categories}
//         keyExtractor={keyExtractor}
//         renderItem={renderItem}
//         getItemLayout={getItemLayout}
//         ListEmptyComponent={ListEmpty}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//         removeClippedSubviews={true}
//         contentContainerStyle={[
//           styles.listContent,
//           { paddingBottom: insets.bottom + 100 },
//         ]}
//         showsVerticalScrollIndicator={false}
//       />

//       {/* Add / Edit Modal */}
//       <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
//         <KeyboardAvoidingView
//           style={styles.modalOverlay}
//           behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//           <View style={[styles.modalBox, { paddingBottom: insets.bottom + 24 }]}>

//             {/* Handle */}
//             <View style={styles.modalHandle} />

//             {/* Title row */}
//             <View style={styles.modalTitleRow}>
//               <View style={styles.modalTitleIcon}>
//                 <Icon
//                   name={editId ? 'edit-2' : 'plus'}
//                   size={16}
//                   color={COLORS.primary}
//                 />
//               </View>
//               <Text style={styles.modalTitle}>
//                 {editId ? 'Edit Category' : 'New Category'}
//               </Text>
//               <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//                 <Icon name="x" size={20} color={COLORS.inactive} />
//               </TouchableOpacity>
//             </View>

//             {/* Icon picker */}
//             <Text style={styles.fieldLabel}>Select Icon</Text>
//             <View style={styles.iconGrid}>
//               {ICON_OPTIONS.map((emoji) => (
//                 <TouchableOpacity
//                   key={emoji}
//                   style={[
//                     styles.iconBtn,
//                     catIcon === emoji && styles.iconBtnActive,
//                   ]}
//                   onPress={() => setCatIcon(emoji)}
//                   activeOpacity={0.7}
//                 >
//                   <Text style={styles.iconBtnText}>{emoji}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Name input */}
//             <Text style={styles.fieldLabel}>Category Name <Text style={styles.required}>*</Text></Text>
//             <TextInput
//               style={styles.input}
//               placeholder="e.g. Doctor, Lawyer, Accountant..."
//               placeholderTextColor={COLORS.inactive}
//               value={catName}
//               onChangeText={setCatName}
//               returnKeyType="next"
//               autoCapitalize="words"
//             />

//             {/* Description input */}
//             <Text style={styles.fieldLabel}>Description <Text style={styles.optional}>(Optional)</Text></Text>
//             <TextInput
//               style={styles.inputMulti}
//               placeholder="Brief description of this category..."
//               placeholderTextColor={COLORS.inactive}
//               value={catDesc}
//               onChangeText={setCatDesc}
//               multiline
//               numberOfLines={3}
//               textAlignVertical="top"
//             />

//             {/* Live preview */}
//             <View style={styles.preview}>
//               <Text style={styles.previewIcon}>{catIcon}</Text>
//               <View style={styles.previewText}>
//                 <Text style={styles.previewName} numberOfLines={1}>
//                   {catName || 'Category Name'}
//                 </Text>
//                 <Text style={styles.previewDesc} numberOfLines={1}>
//                   {catDesc || 'Description will appear here'}
//                 </Text>
//               </View>
//               <Icon name="chevron-right" size={16} color={COLORS.primary} />
//             </View>

//             {/* Buttons */}
//             <View style={styles.modalBtns}>
//               <TouchableOpacity
//                 style={styles.cancelBtn}
//                 onPress={closeModal}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
//                 onPress={handleSave}
//                 disabled={saving}
//                 activeOpacity={0.8}
//               >
//                 {saving
//                   ? <ActivityIndicator color={COLORS.surface} size="small" />
//                   : (
//                     <>
//                       <Icon name={editId ? 'check' : 'plus'} size={16} color={COLORS.surface} />
//                       <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Save'}</Text>
//                     </>
//                   )
//                 }
//               </TouchableOpacity>
//             </View>

//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   container: {
//     flex           : 1,
//     backgroundColor: COLORS.background,
//   },
//   centered: {
//     justifyContent: 'center',
//     alignItems    : 'center',
//     padding       : 32,
//   },

//   // ── Header ──────────────────────────────────────────────────────────────
//   header: {
//     flexDirection    : 'row',
//     justifyContent   : 'space-between',
//     alignItems       : 'center',
//     backgroundColor  : COLORS.surface,
//     paddingHorizontal: 20,
//     paddingBottom    : 16,
//   },
//   headerTitle: {
//     fontSize  : 22,
//     fontWeight: '800',
//     color     : COLORS.textPrimary,
//   },
//   headerSub: {
//     fontSize  : 12,
//     color     : COLORS.inactive,
//     marginTop : 2,
//     fontWeight: '500',
//   },
//   headerDivider: {
//     height         : 1,
//     backgroundColor: COLORS.primaryBorder,
//   },
//   addBtn: {
//     flexDirection   : 'row',
//     alignItems      : 'center',
//     backgroundColor : COLORS.primary,
//     paddingHorizontal: 16,
//     paddingVertical : 10,
//     borderRadius    : 24,
//   },
//   addBtnText: {
//     color     : COLORS.surface,
//     fontWeight: '700',
//     fontSize  : 14,
//     marginLeft: 6,
//   },

//   // ── List ─────────────────────────────────────────────────────────────────
//   listContent: {
//     paddingHorizontal: 16,
//     paddingTop       : 16,
//   },

//   // ── Category card ────────────────────────────────────────────────────────
//   card: {
//     flexDirection    : 'row',
//     alignItems       : 'center',
//     backgroundColor  : COLORS.surface,
//     borderRadius     : 16,
//     paddingVertical  : 14,
//     paddingHorizontal: 14,
//     marginBottom     : CARD_MARGIN,
//     height           : CARD_HEIGHT,
//     // iOS shadow
//     shadowColor  : COLORS.shadow,
//     shadowOpacity: 0.07,
//     shadowRadius : 10,
//     shadowOffset : { width: 0, height: 3 },
//     // Android
//     elevation    : 2,
//   },
//   cardIconWrap: {
//     width          : 46,
//     height         : 46,
//     borderRadius   : 13,
//     backgroundColor: COLORS.primaryLight,
//     alignItems     : 'center',
//     justifyContent : 'center',
//     marginRight    : 12,
//     borderWidth    : 1,
//     borderColor    : COLORS.primaryBorder,
//   },
//   cardIcon: {
//     fontSize: 22,
//   },
//   cardText: {
//     flex         : 1,
//     justifyContent: 'center',
//   },
//   cardName: {
//     fontSize  : 15,
//     fontWeight: '700',
//     color     : COLORS.textPrimary,
//   },
//   cardDesc: {
//     fontSize : 12,
//     color    : COLORS.textSub,
//     marginTop: 3,
//   },
//   subHint: {
//     flexDirection: 'row',
//     alignItems   : 'center',
//     marginTop    : 3,
//   },
//   subHintText: {
//     fontSize  : 11,
//     color     : COLORS.primary,
//     fontWeight: '600',
//     marginLeft: 3,
//   },

//   // Action buttons inside card
//   actionBtn: {
//     width          : 34,
//     height         : 34,
//     borderRadius   : 10,
//     backgroundColor: COLORS.primaryLight,
//     alignItems     : 'center',
//     justifyContent : 'center',
//     marginLeft     : 6,
//     borderWidth    : 1,
//     borderColor    : COLORS.primaryBorder,
//   },
//   actionBtnDanger: {
//     backgroundColor: COLORS.dangerBg,
//     borderColor    : '#FCA5A5',
//   },

//   // ── Skeleton ─────────────────────────────────────────────────────────────
//   skeletonContainer: {
//     paddingHorizontal: 16,
//     paddingTop       : 16,
//   },
//   skeletonCard: {
//     flexDirection    : 'row',
//     alignItems       : 'center',
//     backgroundColor  : COLORS.surface,
//     borderRadius     : 16,
//     paddingVertical  : 14,
//     paddingHorizontal: 14,
//     marginBottom     : CARD_MARGIN,
//     height           : CARD_HEIGHT,
//   },
//   skeletonIcon: {
//     width          : 46,
//     height         : 46,
//     borderRadius   : 13,
//     backgroundColor: '#D1F4F2',
//     marginRight    : 12,
//   },
//   skeletonLines: {
//     flex: 1,
//   },
//   skeletonLineA: {
//     height         : 14,
//     width          : '60%',
//     backgroundColor: '#D1F4F2',
//     borderRadius   : 6,
//     marginBottom   : 8,
//   },
//   skeletonLineB: {
//     height         : 11,
//     width          : '40%',
//     backgroundColor: '#E8F9F8',
//     borderRadius   : 6,
//   },

//   // ── Empty state ───────────────────────────────────────────────────────────
//   emptyBox: {
//     alignItems     : 'center',
//     paddingTop     : 80,
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize  : 17,
//     fontWeight: '700',
//     color     : COLORS.textPrimary,
//     marginTop : 16,
//   },
//   emptySub: {
//     fontSize  : 13,
//     color     : COLORS.inactive,
//     marginTop : 6,
//     textAlign : 'center',
//   },

//   // ── Error state ───────────────────────────────────────────────────────────
//   errorTitle: {
//     fontSize  : 17,
//     fontWeight: '700',
//     color     : COLORS.textPrimary,
//     marginTop : 14,
//   },
//   errorSub: {
//     fontSize : 13,
//     color    : COLORS.inactive,
//     marginTop: 6,
//     textAlign: 'center',
//   },

//   // ── Modal ─────────────────────────────────────────────────────────────────
//   modalOverlay: {
//     flex           : 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent : 'flex-end',
//   },
//   modalBox: {
//     backgroundColor     : COLORS.surface,
//     borderTopLeftRadius : 28,
//     borderTopRightRadius: 28,
//     paddingHorizontal   : 24,
//     paddingTop          : 12,
//   },
//   modalHandle: {
//     width          : 40,
//     height         : 4,
//     backgroundColor: COLORS.primaryBorder,
//     borderRadius   : 2,
//     alignSelf      : 'center',
//     marginBottom   : 20,
//   },
//   modalTitleRow: {
//     flexDirection : 'row',
//     alignItems    : 'center',
//     marginBottom  : 20,
//   },
//   modalTitleIcon: {
//     width          : 32,
//     height         : 32,
//     borderRadius   : 10,
//     backgroundColor: COLORS.primaryLight,
//     alignItems     : 'center',
//     justifyContent : 'center',
//     marginRight    : 10,
//     borderWidth    : 1,
//     borderColor    : COLORS.primaryBorder,
//   },
//   modalTitle: {
//     flex      : 1,
//     fontSize  : 18,
//     fontWeight: '800',
//     color     : COLORS.textPrimary,
//   },

//   // Field label
//   fieldLabel: {
//     fontSize     : 11,
//     fontWeight   : '700',
//     color        : COLORS.textSub,
//     letterSpacing: 0.6,
//     textTransform: 'uppercase',
//     marginBottom : 8,
//   },
//   required: {
//     color: COLORS.danger,
//   },
//   optional: {
//     color     : COLORS.inactive,
//     fontWeight: '400',
//   },

//   // Icon picker grid — margins instead of gap for Android compat
//   iconGrid: {
//     flexDirection : 'row',
//     flexWrap      : 'wrap',
//     marginBottom  : 18,
//   },
//   iconBtn: {
//     width          : 44,
//     height         : 44,
//     borderRadius   : 12,
//     backgroundColor: COLORS.background,
//     alignItems     : 'center',
//     justifyContent : 'center',
//     borderWidth    : 1.5,
//     borderColor    : COLORS.primaryBorder,
//     marginRight    : 8,
//     marginBottom   : 8,
//   },
//   iconBtnActive: {
//     backgroundColor: COLORS.primaryLight,
//     borderColor    : COLORS.primary,
//   },
//   iconBtnText: {
//     fontSize: 22,
//   },

//   // Text inputs
//   input: {
//     backgroundColor: COLORS.background,
//     borderWidth    : 1,
//     borderColor    : COLORS.primaryBorder,
//     borderRadius   : 12,
//     paddingVertical: 12,
//     paddingHorizontal: 14,
//     fontSize       : 15,
//     color          : COLORS.textPrimary,
//     marginBottom   : 14,
//   },
//   inputMulti: {
//     backgroundColor : COLORS.background,
//     borderWidth     : 1,
//     borderColor     : COLORS.primaryBorder,
//     borderRadius    : 12,
//     paddingVertical : 12,
//     paddingHorizontal: 14,
//     fontSize        : 15,
//     color           : COLORS.textPrimary,
//     marginBottom    : 14,
//     minHeight       : 72,
//     textAlignVertical: 'top',
//   },

//   // Live preview card
//   preview: {
//     flexDirection    : 'row',
//     alignItems       : 'center',
//     backgroundColor  : COLORS.primaryLight,
//     borderRadius     : 14,
//     paddingVertical  : 12,
//     paddingHorizontal: 14,
//     marginBottom     : 20,
//     borderWidth      : 1,
//     borderColor      : COLORS.primaryBorder,
//   },
//   previewIcon: {
//     fontSize   : 28,
//     marginRight: 12,
//   },
//   previewText: {
//     flex: 1,
//   },
//   previewName: {
//     fontSize  : 14,
//     fontWeight: '700',
//     color     : COLORS.primary,
//   },
//   previewDesc: {
//     fontSize : 11,
//     color    : COLORS.inactive,
//     marginTop: 2,
//   },

//   // Modal action buttons — marginRight instead of gap
//   modalBtns: {
//     flexDirection: 'row',
//   },
//   cancelBtn: {
//     flex           : 1,
//     backgroundColor: COLORS.background,
//     borderRadius   : 14,
//     paddingVertical: 15,
//     alignItems     : 'center',
//     marginRight    : 12,
//     borderWidth    : 1,
//     borderColor    : COLORS.primaryBorder,
//   },
//   cancelBtnText: {
//     color     : COLORS.textSub,
//     fontWeight: '700',
//     fontSize  : 15,
//   },
//   saveBtn: {
//     flex           : 1,
//     backgroundColor: COLORS.primary,
//     borderRadius   : 14,
//     paddingVertical: 15,
//     alignItems     : 'center',
//     justifyContent : 'center',
//     flexDirection  : 'row',
//   },
//   saveBtnDisabled: {
//     opacity: 0.7,
//   },
//   saveBtnText: {
//     color     : COLORS.surface,
//     fontWeight: '700',
//     fontSize  : 15,
//     marginLeft: 6,
//   },
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
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets }  from 'react-native-safe-area-context';
import { useNavigation }      from '@react-navigation/native';
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

// ── Design tokens ─────────────────────────────────────────────────────────────

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

// ── Image upload helper ───────────────────────────────────────────────────────

/**
 * Uploads a local image URI to Firebase Storage under /categories/<filename>
 * and returns the public download URL.
 * The URL is stored in the existing `icon` field — no DB structure change.
 */
const uploadImageToStorage = async (localUri) => {
  const filename  = `categories/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const reference = storage().ref(filename);
  await reference.putFile(localUri);
  return await reference.getDownloadURL();
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonLines}>
      <View style={styles.skeletonLineA} />
      <View style={styles.skeletonLineB} />
    </View>
  </View>
));

const ServiceCard = memo(({ item, onEdit, onDelete, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {/* Service image / fallback icon */}
    <View style={styles.cardIconWrap}>
      {item.icon ? (
        <Image
          source={{ uri: item.icon }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <MatIcon name="shape-outline" size={24} color={COLORS.primary} />
      )}
    </View>

    {/* Text */}
    <View style={styles.cardText}>
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
      ) : (
        <View style={styles.subHint}>
          <Icon name="chevron-right" size={12} color={COLORS.primary} />
          <Text style={styles.subHintText}>View subcategories</Text>
        </View>
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
  </TouchableOpacity>
));

// ── Image picker button shown inside the modal ────────────────────────────────

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
        <Text style={styles.imagePickerLabel}>Tap to upload service image</Text>
        <Text style={styles.imagePickerHint}>JPG or PNG, recommended 512×512</Text>
      </View>
    )}
  </TouchableOpacity>
));

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ManageCategories() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);

  // Form state
  const [catName,    setCatName]    = useState('');
  const [catDesc,    setCatDesc]    = useState('');
  const [editId,     setEditId]     = useState(null);
  // localImageUri  — temporary local path shown while uploading
  // remoteImageUrl — final Firestore value (stored in `icon` field)
  const [localImageUri,  setLocalImageUri]  = useState(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState(null);

  // ── Firestore listener ────────────────────────────────────────────────────
  useEffect(() => {
    const db  = getFirestore();
    const q   = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('Services snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );
    return unsub;
  }, []);

  // ── Reset form ────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setCatName('');
    setCatDesc('');
    setLocalImageUri(null);
    setRemoteImageUrl(null);
    setEditId(null);
  }, []);

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = useCallback((item) => {
    setEditId(item.id);
    setCatName(item.name);
    setCatDesc(item.description || '');
    // item.icon holds the remote URL in existing DB
    setRemoteImageUrl(item.icon || null);
    setLocalImageUri(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  // ── Pick image from gallery ───────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width           : 512,
        height          : 512,
        cropping        : true,
        cropperCircleOverlay: false,
        mediaType       : 'photo',
        compressImageQuality: 0.8,
      });

      const localUri = image.path;
      setLocalImageUri(localUri);

      // Upload immediately so the user doesn't wait on Save
      setUploading(true);
      const url = await uploadImageToStorage(localUri);
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

  // ── Save (add / update) ───────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!catName.trim()) {
      Alert.alert('Required', 'Please enter a service name.');
      return;
    }
    if (uploading) {
      Alert.alert('Please wait', 'Image is still uploading.');
      return;
    }

    setSaving(true);
    const db = getFirestore();

    // `icon` field stores the remote URL — same field, no schema change
    const data = {
      name       : catName.trim(),
      icon       : remoteImageUrl || null,
      description: catDesc.trim(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, 'categories', editId), data);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [catName, catDesc, remoteImageUrl, editId, uploading, resetForm]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id, name) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text   : 'Delete',
          style  : 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(getFirestore(), 'categories', id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete service. Please try again.');
            }
          },
        },
      ],
    );
  }, []);

  // ── Navigate to subcategories ─────────────────────────────────────────────
  const handleCardPress = useCallback((item) => {
    navigation.navigate('SubCategories', {
      categoryId  : item.id,
      categoryName: item.name,
      categoryIcon: item.icon || null,
    });
  }, [navigation]);

  // ── FlatList optimisation helpers ─────────────────────────────────────────
  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <ServiceCard
      item={item}
      onPress={() => handleCardPress(item)}
      onEdit={() => openEdit(item)}
      onDelete={() => handleDelete(item.id, item.name)}
    />
  ), [handleCardPress, openEdit, handleDelete]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyBox}>
      <MatIcon name="shape-outline" size={52} color={COLORS.primaryBorder} />
      <Text style={styles.emptyTitle}>No Services Yet</Text>
      <Text style={styles.emptySub}>Tap "+ New" to create your first service.</Text>
    </View>
  ), []);

  // ── Header top padding ────────────────────────────────────────────────────
  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  // The URI to show in the picker box:
  // prefer localImageUri (instant feedback) → fallback to remoteImageUrl
  const previewUri = localImageUri || remoteImageUrl;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View>
            <Text style={styles.headerTitle}>Services</Text>
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

  // ── Error state ───────────────────────────────────────────────────────────
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
        <View>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSub}>
            {categories.length} {categories.length === 1 ? 'service' : 'services'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Icon name="plus" size={16} color={COLORS.surface} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      {/* List */}
      <FlatList
        data={categories}
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

            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Title row */}
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Icon name={editId ? 'edit-2' : 'plus'} size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>
                {editId ? 'Edit Service' : 'New Service'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={20} color={COLORS.inactive} />
              </TouchableOpacity>
            </View>

            {/* ── Image upload ──────────────────────────────────────────── */}
            <Text style={styles.fieldLabel}>
              Service Image <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <ImagePickerBox
              uri={previewUri}
              uploading={uploading}
              onPress={handlePickImage}
            />

            {/* ── Service name ──────────────────────────────────────────── */}
            <Text style={styles.fieldLabel}>
              Service Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Doctor, Lawyer, Accountant..."
              placeholderTextColor={COLORS.inactive}
              value={catName}
              onChangeText={setCatName}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* ── Description ───────────────────────────────────────────── */}
            <Text style={styles.fieldLabel}>
              Description <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              style={styles.inputMulti}
              placeholder="Brief description of this service..."
              placeholderTextColor={COLORS.inactive}
              value={catDesc}
              onChangeText={setCatDesc}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* ── Action buttons ────────────────────────────────────────── */}
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

  // Header
  header: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    backgroundColor  : COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom    : 16,
  },
  headerTitle: {
    fontSize  : 22,
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

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop       : 16,
  },

  // Service card
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
  subHint: {
    flexDirection: 'row',
    alignItems   : 'center',
    marginTop    : 3,
  },
  subHintText: {
    fontSize  : 11,
    color     : COLORS.primary,
    fontWeight: '600',
    marginLeft: 3,
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

  // Skeleton
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
  skeletonLines: { flex: 1 },
  skeletonLineA: {
    height         : 14,
    width          : '60%',
    backgroundColor: '#D1F4F2',
    borderRadius   : 6,
    marginBottom   : 8,
  },
  skeletonLineB: {
    height         : 11,
    width          : '40%',
    backgroundColor: '#E8F9F8',
    borderRadius   : 6,
  },

  // Empty state
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

  // Error state
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

  // Modal
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

  // Field label
  fieldLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    color        : COLORS.textSub,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom : 8,
  },
  required: { color: COLORS.danger },
  optional: { color: COLORS.inactive, fontWeight: '400', textTransform: 'none' },

  // Image picker box
  imagePickerBox: {
    width        : '100%',
    height       : 160,
    borderRadius : 16,
    borderWidth  : 1.5,
    borderColor  : COLORS.primaryBorder,
    borderStyle  : 'dashed',
    overflow     : 'hidden',
    marginBottom : 16,
    backgroundColor: COLORS.primaryLight,
  },
  imagePickerPlaceholder: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  imagePickerIconCircle: {
    width          : 56,
    height         : 56,
    borderRadius   : 28,
    backgroundColor: COLORS.surface,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : 10,
    borderWidth    : 1,
    borderColor    : COLORS.primaryBorder,
  },
  imagePickerLabel: {
    fontSize  : 14,
    fontWeight: '600',
    color     : COLORS.primary,
    marginBottom: 4,
  },
  imagePickerHint: {
    fontSize: 11,
    color   : COLORS.inactive,
  },
  imagePickerPreview: {
    width : '100%',
    height: '100%',
  },
  // "Change Image" overlay shown on top of the preview
  imagePickerOverlay: {
    position      : 'absolute',
    bottom        : 0,
    left          : 0,
    right         : 0,
    height        : 40,
    backgroundColor: 'rgba(13,123,122,0.75)',
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'center',
  },
  imagePickerOverlayText: {
    color     : COLORS.surface,
    fontWeight: '700',
    fontSize  : 13,
    marginLeft: 6,
  },

  // Text inputs
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

  // Modal buttons
  modalBtns: {
    flexDirection: 'row',
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