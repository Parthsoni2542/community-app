import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, orderBy, query,
} from '@react-native-firebase/firestore';

const EMOJI_OPTIONS = [
  '❤️','🧠','🦴','👁️','🦷','👶','🩺','💊','🔬','🩻',
  '🧬','🫁','🫀','🦻','👃','💉','🩹','🏃','🧘','⚕️',
];

export default function ManageSubCategories({ route, navigation }) {
  const { categoryId, categoryName, categoryIcon } = route.params;

  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [modalVisible, setModal]          = useState(false);
  const [subName, setSubName]             = useState('');
  const [subIcon, setSubIcon]             = useState('❤️');
  const [subDesc, setSubDesc]             = useState('');
  const [editId, setEditId]               = useState(null);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    const db = getFirestore();
    const q  = query(
      collection(db, 'categories', categoryId, 'subcategories'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setSubcategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [categoryId]);

  const openAdd = () => {
    setEditId(null); setSubName(''); setSubIcon('❤️'); setSubDesc(''); setModal(true);
  };
  const openEdit = (item) => {
    setEditId(item.id); setSubName(item.name);
    setSubIcon(item.icon || '❤️'); setSubDesc(item.description || '');
    setModal(true);
  };

  const handleSave = async () => {
    if (!subName.trim()) { Alert.alert('Error', 'Subcategory naam daalo'); return; }
    setSaving(true);
    const db   = getFirestore();
    const data = { name: subName.trim(), icon: subIcon, description: subDesc.trim(), categoryId };
    try {
      if (editId) {
        await updateDoc(
          doc(db, 'categories', categoryId, 'subcategories', editId), data,
        );
      } else {
        await addDoc(
          collection(db, 'categories', categoryId, 'subcategories'),
          { ...data, createdAt: serverTimestamp() },
        );
      }
      setModal(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete?', `"${name}" delete hoga`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const db = getFirestore();
          await deleteDoc(doc(db, 'categories', categoryId, 'subcategories', id));
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardIconWrap}>
        <Text style={styles.cardIcon}>{item.icon || '📁'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id, item.name)}>
        <Text style={styles.delBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTop}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <Text style={styles.headerTitle}>{categoryName}</Text>
          </View>
          <Text style={styles.headerSub}>{subcategories.length} subcategories</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Koi subcategory nahi hai</Text>
            <Text style={styles.emptySub}>+ New dabao aur pehli subcategory banao</Text>
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
              {editId ? '✏️  Edit Subcategory' : '➕  New Subcategory'}
            </Text>

            {/* Parent Category Info */}
            <View style={styles.parentBadge}>
              <Text style={styles.parentIcon}>{categoryIcon}</Text>
              <Text style={styles.parentName}>Under: {categoryName}</Text>
            </View>

            {/* Icon Picker */}
            <Text style={styles.fieldLabel}>Icon Choose karo</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, subIcon === e && styles.emojiBtnActive]}
                  onPress={() => setSubIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Subcategory Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cardiologist, Criminal Lawyer..."
              placeholderTextColor="#9CA3AF"
              value={subName}
              onChangeText={setSubName}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
              placeholder="Short description..."
              placeholderTextColor="#9CA3AF"
              value={subDesc}
              onChangeText={setSubDesc}
              multiline
            />

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewIcon}>{subIcon}</Text>
              <View>
                <Text style={styles.previewName}>{subName || 'Subcategory Name'}</Text>
                <Text style={styles.previewDesc}>{categoryIcon} {categoryName}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Save'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: '#F8FAFC' },
  centered     : { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header       : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn      : { marginRight: 10, padding: 6 },
  backArrow    : { fontSize: 22, color: '#2563EB', fontWeight: '700' },
  headerTop    : { flexDirection: 'row', alignItems: 'center' },
  categoryIcon : { fontSize: 20, marginRight: 6 },
  headerTitle  : { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub    : { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  addBtn       : { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24 },
  addBtnText   : { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  card         : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardIconWrap : {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardIcon     : { fontSize: 22 },
  cardName     : { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardDesc     : { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  editBtn      : { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 6 },
  editBtnText  : { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  delBtn       : { padding: 6 },
  delBtnText   : { fontSize: 18 },

  empty        : { alignItems: 'center', paddingTop: 80 },
  emptyIcon    : { fontSize: 52, marginBottom: 14 },
  emptyText    : { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub     : { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  modalOverlay : { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalBox     : {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  modalHandle  : { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  modalTitle   : { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },

  parentBadge  : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  parentIcon   : { fontSize: 18, marginRight: 8 },
  parentName   : { fontSize: 13, fontWeight: '600', color: '#16A34A' },

  fieldLabel   : { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

  emojiGrid    : { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  emojiBtn     : { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  emojiBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  emojiText    : { fontSize: 20 },

  input        : {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 13, fontSize: 15, color: '#1E293B', marginBottom: 12,
  },

  preview      : {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  previewIcon  : { fontSize: 28, marginRight: 12 },
  previewName  : { fontSize: 14, fontWeight: '700', color: '#166534' },
  previewDesc  : { fontSize: 12, color: '#86EFAC', marginTop: 2 },

  modalBtns    : { flexDirection: 'row', gap: 12 },
  cancelBtn    : { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
  saveBtn      : { flex: 1, backgroundColor: '#2563EB', borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnText  : { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});