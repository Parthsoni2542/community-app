// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, Alert, Modal, ActivityIndicator,
// } from 'react-native';
// import firestore from '@react-native-firebase/firestore';

// export default function ManageCategories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [modalVisible, setModal]    = useState(false);
//   const [catName, setCatName]       = useState('');
//   const [catIcon, setCatIcon]       = useState('');
//   const [editId, setEditId]         = useState(null);

//   useEffect(() => {
//     const unsubscribe = firestore()
//       .collection('categories')
//       .orderBy('createdAt', 'desc')
//       .onSnapshot((snap) => {
//         setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//       });
//     return unsubscribe;
//   }, []);

//   const openAdd  = () => { setEditId(null); setCatName(''); setCatIcon(''); setModal(true); };
//   const openEdit = (item) => { setEditId(item.id); setCatName(item.name); setCatIcon(item.icon); setModal(true); };

//   const handleSave = async () => {
//     if (!catName.trim()) { Alert.alert('Error', 'Category naam daalo'); return; }
//     const data = { name: catName.trim(), icon: catIcon.trim() || '📁' };
//     if (editId) {
//       await firestore().collection('categories').doc(editId).update(data);
//     } else {
//       await firestore().collection('categories').add({ ...data, createdAt: firestore.FieldValue.serverTimestamp() });
//     }
//     setModal(false);
//   };

//   const handleDelete = (id) => {
//     Alert.alert('Delete?', 'Kya aap sure hain?', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => firestore().collection('categories').doc(id).delete() },
//     ]);
//   };

//   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Categories</Text>
//         <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
//           <Text style={styles.addBtnText}>+ Add</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={categories}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.icon}>{item.icon}</Text>
//             <Text style={styles.name}>{item.name}</Text>
//             <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
//               <Text style={{ color: '#2563EB' }}>Edit</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.delBtn}>
//               <Text style={{ color: '#DC2626' }}>Del</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>Koi category nahi hai</Text>}
//       />

//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>{editId ? 'Edit Category' : 'New Category'}</Text>
//             <TextInput style={styles.input} placeholder="Category Name" placeholderTextColor="#9CA3AF" value={catName} onChangeText={setCatName} />
//             <TextInput style={styles.input} placeholder="Icon Emoji (e.g. 🏥)" placeholderTextColor="#9CA3AF" value={catIcon} onChangeText={setCatIcon} />
//             <View style={{ flexDirection: 'row', gap: 10 }}>
//               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setModal(false)}>
//                 <Text style={{ color: '#374151' }}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2563EB' }]} onPress={handleSave}>
//                 <Text style={{ color: '#fff' }}>Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container   : { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   title       : { fontSize: 20, fontWeight: '700', color: '#111827' },
//   addBtn      : { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
//   addBtnText  : { color: '#fff', fontWeight: '600' },
//   row         : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
//   icon        : { fontSize: 24, marginRight: 12 },
//   name        : { flex: 1, fontSize: 15, color: '#111827' },
//   editBtn     : { padding: 8, marginRight: 4 },
//   delBtn      : { padding: 8 },
//   empty       : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
//   modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
//   modalBox    : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
//   modalTitle  : { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
//   input       : { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', marginBottom: 12 },
//   modalBtn    : { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
// });



// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   TextInput, Alert, Modal, ActivityIndicator,
// } from 'react-native';
// import firestore from '@react-native-firebase/firestore';

// export default function ManageCategories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [modalVisible, setModal]    = useState(false);
//   const [catName, setCatName]       = useState('');
//   const [catIcon, setCatIcon]       = useState('');
//   const [editId, setEditId]         = useState(null);

//   useEffect(() => {
//     const unsubscribe = firestore()
//       .collection('categories')
//       .orderBy('createdAt', 'desc')
//       .onSnapshot((snap) => {
//         setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//       });
//     return unsubscribe;
//   }, []);

//   const openAdd  = () => { setEditId(null); setCatName(''); setCatIcon(''); setModal(true); };
//   const openEdit = (item) => { setEditId(item.id); setCatName(item.name); setCatIcon(item.icon); setModal(true); };

//   const handleSave = async () => {
//     if (!catName.trim()) { Alert.alert('Error', 'Category naam daalo'); return; }
//     const data = { name: catName.trim(), icon: catIcon.trim() || '📁' };
//     if (editId) {
//       await firestore().collection('categories').doc(editId).update(data);
//     } else {
//       await firestore().collection('categories').add({ ...data, createdAt: firestore.FieldValue.serverTimestamp() });
//     }
//     setModal(false);
//   };

//   const handleDelete = (id) => {
//     Alert.alert('Delete?', 'Kya aap sure hain?', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => firestore().collection('categories').doc(id).delete() },
//     ]);
//   };

//   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Categories</Text>
//         <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
//           <Text style={styles.addBtnText}>+ Add</Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={categories}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.icon}>{item.icon}</Text>
//             <Text style={styles.name}>{item.name}</Text>
//             <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
//               <Text style={{ color: '#2563EB' }}>Edit</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.delBtn}>
//               <Text style={{ color: '#DC2626' }}>Del</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>Koi category nahi hai</Text>}
//       />

//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>{editId ? 'Edit Category' : 'New Category'}</Text>
//             <TextInput style={styles.input} placeholder="Category Name" placeholderTextColor="#9CA3AF" value={catName} onChangeText={setCatName} />
//             <TextInput style={styles.input} placeholder="Icon Emoji (e.g. 🏥)" placeholderTextColor="#9CA3AF" value={catIcon} onChangeText={setCatIcon} />
//             <View style={{ flexDirection: 'row', gap: 10 }}>
//               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setModal(false)}>
//                 <Text style={{ color: '#374151' }}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2563EB' }]} onPress={handleSave}>
//                 <Text style={{ color: '#fff' }}>Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container   : { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   title       : { fontSize: 20, fontWeight: '700', color: '#111827' },
//   addBtn      : { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
//   addBtnText  : { color: '#fff', fontWeight: '600' },
//   row         : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
//   icon        : { fontSize: 24, marginRight: 12 },
//   name        : { flex: 1, fontSize: 15, color: '#111827' },
//   editBtn     : { padding: 8, marginRight: 4 },
//   delBtn      : { padding: 8 },
//   empty       : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
//   modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
//   modalBox    : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
//   modalTitle  : { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
//   input       : { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', marginBottom: 12 },
//   modalBtn    : { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
// });

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
// import { useNavigation } from '@react-navigation/native';

// const EMOJI_OPTIONS = ['🏥', '⚖️', '💼', '🦷', '👁️', '🧠', '❤️', '🦴', '👶', '💊', '🩺', '📋', '🔬', '🩻', '🧬'];

// export default function ManageCategories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [modalVisible, setModal] = useState(false);
//   const [catName, setCatName] = useState('');
//   const [catIcon, setCatIcon] = useState('🏥');
//   const [catDesc, setCatDesc] = useState('');
//   const [editId, setEditId] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const db = getFirestore();
//     const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
//     const unsub = onSnapshot(q, (snap) => {
//       setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//       setLoading(false);
//     });
//     return unsub;
//   }, []);

//   const openAdd = () => {
//     setEditId(null); setCatName(''); setCatIcon('🏥'); setCatDesc(''); setModal(true);
//   };
//   const openEdit = (item) => {
//     setEditId(item.id); setCatName(item.name); setCatIcon(item.icon || '🏥');
//     setCatDesc(item.description || ''); setModal(true);
//   };

//   const handleSave = async () => {
//     if (!catName.trim()) { Alert.alert('Error', 'Category naam daalo'); return; }
//     setSaving(true);
//     const db = getFirestore();
//     const data = { name: catName.trim(), icon: catIcon, description: catDesc.trim() };
//     try {
//       if (editId) {
//         await updateDoc(doc(db, 'categories', editId), data);
//       } else {
//         await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
//       }
//       setModal(false);
//     } catch (e) {
//       Alert.alert('Error', e.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = (id, name) => {
//     Alert.alert('Delete Category?', `"${name}" delete hoga`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive',
//         onPress: async () => {
//           const db = getFirestore();
//           await deleteDoc(doc(db, 'categories', id));
//         },
//       },
//     ]);
//   };


//   // const renderItem = ({ item }) => (
//   //   <View style={styles.card}>
//   //     <View style={styles.cardIconWrap}>
//   //       <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
//   //     </View>
//   //     <View style={{ flex: 1 }}>
//   //       <Text style={styles.cardName}>{item.name}</Text>
//   //       {item.description ? (
//   //         <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
//   //       ) : null}
//   //     </View>
//   //     <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
//   //       <Text style={styles.editBtnText}>Edit</Text>
//   //     </TouchableOpacity>
//   //     <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id, item.name)}>
//   //       <Text style={styles.delBtnText}>🗑️</Text>
//   //     </TouchableOpacity>
//   //   </View>
//   // );


//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => navigation.navigate('SubCategories', {
//         categoryId: item.id,
//         categoryName: item.name,
//         categoryIcon: item.icon || '📁',
//       })}
//     >
//       <View style={styles.cardIconWrap}>
//         <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.cardName}>{item.name}</Text>
//         {item.description ? (
//           <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
//         ) : null}
//       </View>
//       {/* Subcategory count badge */}
//       <View style={styles.subBadge}>
//         <Text style={styles.subBadgeText}>Subcategories →</Text>
//       </View>
//       <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); openEdit(item); }}>
//         <Text style={styles.editBtnText}>Edit</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.delBtn} onPress={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}>
//         <Text style={styles.delBtnText}>🗑️</Text>
//       </TouchableOpacity>
//     </TouchableOpacity>
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
//         <View>
//           <Text style={styles.headerTitle}>Categories</Text>
//           <Text style={styles.headerSub}>{categories.length} categories</Text>
//         </View>
//         <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
//           <Text style={styles.addBtnText}>+ New</Text>
//         </TouchableOpacity>
//       </View>

//       {/* List */}
//       <FlatList
//         data={categories}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//         ListEmptyComponent={
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>📂</Text>
//             <Text style={styles.emptyText}>Koi category nahi hai</Text>
//             <Text style={styles.emptySub}>+ New dabao aur pehli category banao</Text>
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
//               {editId ? '✏️  Edit Category' : '➕  New Category'}
//             </Text>

//             {/* Icon Picker */}
//             <Text style={styles.fieldLabel}>Icon Choose karo</Text>
//             <View style={styles.emojiGrid}>
//               {EMOJI_OPTIONS.map((e) => (
//                 <TouchableOpacity
//                   key={e}
//                   style={[styles.emojiBtn, catIcon === e && styles.emojiBtnActive]}
//                   onPress={() => setCatIcon(e)}
//                 >
//                   <Text style={styles.emojiText}>{e}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Name */}
//             <Text style={styles.fieldLabel}>Category Name *</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="e.g. Doctor, Lawyer, CA..."
//               placeholderTextColor="#9CA3AF"
//               value={catName}
//               onChangeText={setCatName}
//             />

//             {/* Description */}
//             <Text style={styles.fieldLabel}>Description (Optional)</Text>
//             <TextInput
//               style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
//               placeholder="Short description..."
//               placeholderTextColor="#9CA3AF"
//               value={catDesc}
//               onChangeText={setCatDesc}
//               multiline
//             />

//             {/* Preview */}
//             <View style={styles.preview}>
//               <Text style={styles.previewIcon}>{catIcon}</Text>
//               <View>
//                 <Text style={styles.previewName}>{catName || 'Category Name'}</Text>
//                 <Text style={styles.previewDesc}>{catDesc || 'Description'}</Text>
//               </View>
//             </View>

//             {/* Buttons */}
//             <View style={styles.modalBtns}>
//               <TouchableOpacity
//                 style={styles.cancelBtn}
//                 onPress={() => setModal(false)}
//               >
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.saveBtn}
//                 onPress={handleSave}
//                 disabled={saving}
//               >
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
//   container: { flex: 1, backgroundColor: '#F8FAFC' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

//   header: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
//   headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
//   addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 },
//   addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

//   card: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', borderRadius: 16,
//     padding: 14, marginBottom: 10,
//     borderWidth: 1, borderColor: '#F1F5F9',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   cardIconWrap: {
//     width: 50, height: 50, borderRadius: 14,
//     backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 14,
//   },
//   cardIcon: { fontSize: 24 },
//   cardName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
//   cardDesc: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
//   editBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 6 },
//   editBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
//   delBtn: { padding: 6 },
//   delBtnText: { fontSize: 18 },

//   empty: { alignItems: 'center', paddingTop: 80 },
//   emptyIcon: { fontSize: 52, marginBottom: 14 },
//   emptyText: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
//   emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

//   modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
//   modalBox: {
//     backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
//     padding: 24, paddingBottom: 36,
//   },
//   modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
//   modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 18 },

//   fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

//   emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
//   emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
//   emojiBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
//   emojiText: { fontSize: 22 },

//   input: {
//     backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
//     borderRadius: 12, padding: 13, fontSize: 15, color: '#1E293B', marginBottom: 14,
//   },

//   preview: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#F0F9FF', borderRadius: 14, padding: 14, marginBottom: 20,
//     borderWidth: 1, borderColor: '#BAE6FD',
//   },
//   previewIcon: { fontSize: 30, marginRight: 12 },
//   previewName: { fontSize: 15, fontWeight: '700', color: '#0369A1' },
//   previewDesc: { fontSize: 12, color: '#7DD3FC', marginTop: 2 },

//   modalBtns: { flexDirection: 'row', gap: 12 },
//   cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 15, alignItems: 'center' },
//   cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
//   saveBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 14, padding: 15, alignItems: 'center' },
//   saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
// });


import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, orderBy, query,
} from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const EMOJI_OPTIONS = ['🏥', '⚖️', '💼', '🦷', '👁️', '🧠', '❤️', '🦴', '👶', '💊', '🩺', '📋', '🔬', '🩻', '🧬'];

const COLORS = {
  primary: '#0D7B7A',
  accent: '#14B8A6',
  lightTeal: '#A7E9E7',
  background: '#B3E9E6',
  white: '#FFFFFF',
  textPrimary: '#0D7B7A',
  textSecondary: '#80B2B0',
  border: '#D6F4F2',
  lightBg: '#F5FFFE',
  error: '#EF4444',
};

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🏥');
  const [catDesc, setCatDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditId(null); setCatName(''); setCatIcon('🏥'); setCatDesc(''); setModal(true);
  };
  const openEdit = (item) => {
    setEditId(item.id); setCatName(item.name); setCatIcon(item.icon || '🏥');
    setCatDesc(item.description || ''); setModal(true);
  };

  const handleSave = async () => {
    if (!catName.trim()) { Alert.alert('Error', 'Category naam daalo'); return; }
    setSaving(true);
    const db = getFirestore();
    const data = { name: catName.trim(), icon: catIcon, description: catDesc.trim() };
    try {
      if (editId) {
        await updateDoc(doc(db, 'categories', editId), data);
      } else {
        await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
      }
      setModal(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Category?', `"${name}" delete hoga`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const db = getFirestore();
          await deleteDoc(doc(db, 'categories', id));
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SubCategories', {
        categoryId: item.id,
        categoryName: item.name,
        categoryIcon: item.icon || '📁',
      })}
    >
      <View style={styles.cardIconWrap}>
        <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      {/* <View style={styles.subBadge}>
        <Text style={styles.subBadgeText}>Subcategories →</Text>
      </View> */}
      <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); openEdit(item); }}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.delBtn} onPress={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}>
        <Text style={styles.delBtnText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <LinearGradient
      colors={[COLORS.lightTeal, COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSub}>{categories.length} categories</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>Koi category nahi hai</Text>
            <Text style={styles.emptySub}>+ New dabao aur pehli category banao</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>

            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editId ? '✏️  Edit Category' : '➕  New Category'}
            </Text>

            {/* Icon Picker */}
            <Text style={styles.fieldLabel}>Icon Choose karo</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, catIcon === e && styles.emojiBtnActive]}
                  onPress={() => setCatIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Category Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Doctor, Lawyer, CA..."
              placeholderTextColor="#9CA3AF"
              value={catName}
              onChangeText={setCatName}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Short description..."
              placeholderTextColor="#9CA3AF"
              value={catDesc}
              onChangeText={setCatDesc}
              multiline
            />

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewIcon}>{catIcon}</Text>
              <View>
                <Text style={styles.previewName}>{catName || 'Category Name'}</Text>
                <Text style={styles.previewDesc}>{catDesc || 'Description'}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Save'}</Text>
                }
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: COLORS.lightBg, justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardIcon: { fontSize: 24 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  subBadge: { backgroundColor: COLORS.lightBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  subBadgeText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 11 },
  editBtn: { backgroundColor: COLORS.lightBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  delBtn: { padding: 6 },
  delBtnText: { fontSize: 18 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  emptySub: { fontSize: 13, color: COLORS.white, marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 18 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.lightBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  emojiBtnActive: { backgroundColor: '#E0F7F6', borderColor: COLORS.primary },
  emojiText: { fontSize: 22 },

  input: {
    backgroundColor: COLORS.lightBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 13, fontSize: 15, color: COLORS.textPrimary, marginBottom: 14,
  },

  preview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E0F7F6', borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  previewIcon: { fontSize: 30, marginRight: 12 },
  previewName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  previewDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.lightBg, borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
