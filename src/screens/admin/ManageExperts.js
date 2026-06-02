// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, TouchableOpacity,
//   Alert, ActivityIndicator, Switch,
// } from 'react-native';
// import firestore from '@react-native-firebase/firestore';

// export default function ManageExperts() {
//   const [experts, setExperts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = firestore()
//       .collection('users')
//       .where('role', '==', 'expert')
//       .onSnapshot((snap) => {
//         setExperts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//         setLoading(false);
//       });
//     return unsubscribe;
//   }, []);

//   const toggleActive = async (id, current) => {
//     await firestore().collection('users').doc(id).update({ isActive: !current });
//   };

//   const handleDelete = (id) => {
//     Alert.alert('Delete Expert?', 'Yeh expert delete ho jayega', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => firestore().collection('users').doc(id).delete() },
//     ]);
//   };

//   if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Manage Experts</Text>
//       <FlatList
//         data={experts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <View style={styles.avatar}>
//               <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.name}>{item.name}</Text>
//               <Text style={styles.email}>{item.email}</Text>
//               <Text style={styles.cat}>{item.category || 'No Category'}</Text>
//             </View>
//             <Switch
//               value={item.isActive !== false}
//               onValueChange={() => toggleActive(item.id, item.isActive !== false)}
//               trackColor={{ true: '#2563EB' }}
//             />
//             <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 8 }}>
//               <Text style={{ color: '#DC2626', fontSize: 18 }}>🗑️</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>Koi expert nahi hai</Text>}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
//   title    : { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
//   card     : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
//   avatar   : { width: 46, height: 46, borderRadius: 23, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   name     : { fontSize: 15, fontWeight: '600', color: '#111827' },
//   email    : { fontSize: 12, color: '#6B7280' },
//   cat      : { fontSize: 12, color: '#2563EB', marginTop: 2 },
//   empty    : { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
// });


import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { getApp, initializeApp, getApps } from '@react-native-firebase/app';
import {
  getFirestore, collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, orderBy, query,
  getDocs, setDoc,
} from '@react-native-firebase/firestore';

export default function ManageExperts() {
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '',
    address: '', experience: '',
    categoryId: '', categoryName: '',
    subcategoryId: '', subcategoryName: '',
    degree: '',
  });

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Load experts
  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setExperts(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role === 'expert'),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  // Load categories
  useEffect(() => {
    const db = getFirestore();
    getDocs(collection(db, 'categories')).then((snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.categoryId) { setSubcats([]); return; }
    const db = getFirestore();
    getDocs(
      collection(db, 'categories', form.categoryId, 'subcategories'),
    ).then((snap) => {
      setSubcats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [form.categoryId]);

  const resetForm = () => {
    setForm({
      name: '', mobile: '', email: '', password: '',
      address: '', experience: '',
      categoryId: '', categoryName: '',
      subcategoryId: '', subcategoryName: '',
      degree: '',
    });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setModal(true); };
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      name: item.name || '',
      mobile: item.mobile || '',
      email: item.email || '',
      password: '',
      address: item.address || '',
      experience: item.experience || '',
      categoryId: item.categoryId || '',
      categoryName: item.categoryName || '',
      subcategoryId: item.subcategoryId || '',
      subcategoryName: item.subcategoryName || '',
      degree: item.degree || '',
    });
    setModal(true);
  };

  // const handleSave = async () => {
  //   const { name, mobile, email, password, address,
  //           experience, categoryId, categoryName,
  //           subcategoryId, subcategoryName, degree } = form;

  //   if (!name || !mobile || !email || !categoryId) {
  //     Alert.alert('Error', 'Name, Mobile, Email aur Category required hai');
  //     return;
  //   }
  //   if (!editId && !password) {
  //     Alert.alert('Error', 'Password required hai naye expert ke liye');
  //     return;
  //   }


  //   setSaving(true);
  //   try {
  //     const db  = getFirestore();
  //     let   uid = editId;

  //     // New expert — Firebase Auth mein create karo
  //     if (!editId) {
  //       const res = await auth().createUserWithEmailAndPassword(email, password);
  //       uid = res.user.uid;
  //     }

  //     const data = {
  //       name, mobile, email, address, experience,
  //       categoryId, categoryName,
  //       subcategoryId, subcategoryName,
  //       degree,
  //       role    : 'expert',
  //       isActive: true,
  //     };

  //     if (editId) {
  //       await updateDoc(doc(db, 'users', editId), data);
  //     } else {
  //       await setDoc(doc(db, 'users', uid), {
  //         ...data,
  //         createdAt: serverTimestamp(),
  //       });
  //     }

  //     setModal(false);
  //     resetForm();
  //   } catch (e) {
  //     Alert.alert('Error', e.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const handleSave = async () => {
  //   const {
  //     name, mobile, email, password, address,
  //     experience, categoryId, categoryName,
  //     subcategoryId, subcategoryName, degree,
  //   } = form;

  //   if (!name || !mobile || !email || !categoryId) {
  //     Alert.alert('Error', 'Name, Mobile, Email aur Category required hai');
  //     return;
  //   }
  //   if (!editId && !password) {
  //     Alert.alert('Error', 'Password required hai naye expert ke liye');
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     const db = getFirestore();
  //     let uid = editId;

  //     if (!editId) {
  //       // ✅ Secondary app banao taaki admin logout na ho
  //       const secondaryAppName = 'SecondaryApp';
  //       const existingApps = getApps();
  //       const alreadyExists = existingApps.find(a => a.name === secondaryAppName);

  //       // Secondary app ka config — same as google-services.json
  //       const firebaseConfig = {
  //         apiKey: 'AIzaSyD7Lr0SGgD6oUfMujCFzEkNC0iaErx0kCY',
  //         projectId: 'communityadvisory-76bf6',
  //         storageBucket: 'communityadvisory-76bf6.firebasestorage.app',
  //         messagingSenderId: '187110378547',
  //         appId: '1:187110378547:android:b0de7a4eb73b9b50292746',
  //       };

  //       const secondaryApp = alreadyExists
  //         ? alreadyExists
  //         : initializeApp(firebaseConfig, secondaryAppName);

  //       const secondaryAuth = auth(secondaryApp);

  //       // Naya user create karo secondary app se
  //       const res = await secondaryAuth.createUserWithEmailAndPassword(
  //         email, password,
  //       );
  //       uid = res.user.uid;

  //       // Secondary app se logout karo — admin ka session safe rahega
  //       await secondaryAuth.signOut();
  //     }

  //     const data = {
  //       name, mobile, email, address, experience,
  //       categoryId, categoryName,
  //       subcategoryId, subcategoryName,
  //       degree,
  //       role: 'expert',
  //       isActive: true,
  //     };

  //     if (editId) {
  //       await updateDoc(doc(db, 'users', editId), data);
  //     } else {
  //       await setDoc(doc(db, 'users', uid), {
  //         ...data,
  //         createdAt: serverTimestamp(),
  //       });
  //     }

  //     setModal(false);
  //     resetForm();
  //     Alert.alert('✅ Success', `${name} expert add ho gaya!`);
  //   } catch (e) {
  //     Alert.alert('Error', e.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };


  const handleSave = async () => {
  const {
    name, mobile, email, password, address,
    experience, categoryId, categoryName,
    subcategoryId, subcategoryName, degree,
  } = form;

  if (!name || !mobile || !email || !categoryId) {
    Alert.alert('Error', 'Name, Mobile, Email aur Category required hai');
    return;
  }
  if (!editId && !password) {
    Alert.alert('Error', 'Password required hai naye expert ke liye');
    return;
  }

  setSaving(true);
  try {
    const db  = getFirestore();
    let   uid = editId;

    if (!editId) {
      // ✅ Firebase REST API se user banao — admin logout NAHI hoga
      const API_KEY = 'AIzaSyD7Lr0SGgD6oUfMujCFzEkNC0iaErx0kCY';
      const res     = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            email              : email,
            password           : password,
            returnSecureToken  : true,
          }),
        },
      );

      const data = await res.json();

      // Error check
      if (data.error) {
        Alert.alert('Error', data.error.message);
        setSaving(false);
        return;
      }

      uid = data.localId; // ✅ Naya user ka UID
      console.log('✅ Expert UID:', uid);
    }

    // Firestore mein save karo
    const expertData = {
      name, mobile, email, address, experience,
      categoryId, categoryName,
      subcategoryId, subcategoryName,
      degree         : form.degree       || '',
      certDetails    : form.certDetails  || '',
      role           : 'expert',
      isActive       : true,
    };

    if (editId) {
      await updateDoc(doc(db, 'users', editId), expertData);
    } else {
      await setDoc(doc(db, 'users', uid), {
        ...expertData,
        createdAt: serverTimestamp(),
      });
    }

    setModal(false);
    resetForm();
    Alert.alert('✅ Success', `${name} expert add ho gaya!`);

  } catch (e) {
    Alert.alert('Error', e.message);
  } finally {
    setSaving(false);
  }
};

  const handleDelete = (id, name) => {
    Alert.alert('Delete Expert?', `"${name}" delete hoga`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const db = getFirestore();
          await deleteDoc(doc(db, 'users', id));
        },
      },
    ]);
  };

  const toggleActive = async (id, current) => {
    const db = getFirestore();
    await updateDoc(doc(db, 'users', id), { isActive: !current });
  };

  const renderExpert = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.expertName}>{item.name}</Text>
        <Text style={styles.expertMeta}>📱 {item.mobile || '—'}</Text>
        {item.degree ? (
          <Text style={styles.expertDegree}>🎓 {item.degree}</Text>
        ) : null}
        <View style={styles.tagRow}>
          {item.categoryName ? (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{item.categoryName}</Text>
            </View>
          ) : null}
          {item.subcategoryName ? (
            <View style={styles.subTag}>
              <Text style={styles.subTagText}>{item.subcategoryName}</Text>
            </View>
          ) : null}
          {item.experience ? (
            <View style={styles.expTag}>
              <Text style={styles.expTagText}>⭐ {item.experience} yr</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.statusBtn, {
            backgroundColor: item.isActive !== false ? '#D1FAE5' : '#FEE2E2',
          }]}
          onPress={() => toggleActive(item.id, item.isActive !== false)}
        >
          <Text style={{
            fontSize: 10, fontWeight: '700',
            color: item.isActive !== false ? '#065F46' : '#DC2626',
          }}>
            {item.isActive !== false ? 'Active' : 'Off'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id, item.name)}>
          <Text style={styles.delBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
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
        <View>
          <Text style={styles.headerTitle}>Experts</Text>
          <Text style={styles.headerSub}>{experts.length} registered experts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add Expert</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={experts}
        keyExtractor={(item) => item.id}
        renderItem={renderExpert}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🩺</Text>
            <Text style={styles.emptyText}>Koi expert nahi hai</Text>
            <Text style={styles.emptySub}>+ Add Expert dabao</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={styles.modalBox}>
              <ScrollView showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>
                  {editId ? '✏️  Edit Expert' : '➕  Add New Expert'}
                </Text>

                {/* ── Personal Info ── */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>👤  Personal Info</Text>

                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dr. Rahul Sharma"
                    placeholderTextColor="#9CA3AF"
                    value={form.name}
                    onChangeText={(v) => setField('name', v)}
                  />

                  <Text style={styles.fieldLabel}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={form.mobile}
                    onChangeText={(v) => setField('mobile', v)}
                  />

                  <Text style={styles.fieldLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="doctor@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(v) => setField('email', v)}
                    editable={!editId}
                  />

                  {!editId && (
                    <>
                      <Text style={styles.fieldLabel}>Password *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Min 6 characters"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={form.password}
                        onChangeText={(v) => setField('password', v)}
                      />
                    </>
                  )}

                  <Text style={styles.fieldLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Clinic / Office Address"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={form.address}
                    onChangeText={(v) => setField('address', v)}
                  />

                  <Text style={styles.fieldLabel}>Total Experience (Years)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={form.experience}
                    onChangeText={(v) => setField('experience', v)}
                  />
                </View>

                {/* ── Category ── */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>📂  Category & Specialization</Text>

                  <Text style={styles.fieldLabel}>Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {categories.length === 0 ? (
                        <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                          Pehle categories banao
                        </Text>
                      ) : (
                        categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              styles.chipBtn,
                              form.categoryId === cat.id && styles.chipBtnActive,
                            ]}
                            onPress={() => {
                              setField('categoryId', cat.id);
                              setField('categoryName', cat.name);
                              setField('subcategoryId', '');
                              setField('subcategoryName', '');
                            }}
                          >
                            <Text style={styles.chipIcon}>{cat.icon}</Text>
                            <Text style={[
                              styles.chipText,
                              form.categoryId === cat.id && styles.chipTextActive,
                            ]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  {subcategories.length > 0 && (
                    <>
                      <Text style={styles.fieldLabel}>Subcategory</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 14 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {subcategories.map((sub) => (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.chipBtn,
                                form.subcategoryId === sub.id && styles.chipBtnActive,
                              ]}
                              onPress={() => {
                                setField('subcategoryId', sub.id);
                                setField('subcategoryName', sub.name);
                              }}
                            >
                              <Text style={styles.chipIcon}>{sub.icon}</Text>
                              <Text style={[
                                styles.chipText,
                                form.subcategoryId === sub.id && styles.chipTextActive,
                              ]}>
                                {sub.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </>
                  )}
                </View>

                {/* ── Degree Certificate ── */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>🎓  Degree Certificate</Text>
                  <Text style={styles.fieldLabel}>Degree / Qualification</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MBBS, LLB, CA, MD..."
                    placeholderTextColor="#9CA3AF"
                    value={form.degree}
                    onChangeText={(v) => setField('degree', v)}
                  />
                  <Text style={styles.fieldLabel}>Additional Certifications</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="e.g. AIIMS Delhi - 2015, Bar Council - 2018..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={form.certDetails}
                    onChangeText={(v) => setField('certDetails', v)}
                  />

                  {/* Degree Preview Badge */}
                  {form.degree ? (
                    <View style={styles.degreeBadge}>
                      <Text style={styles.degreeBadgeIcon}>🎓</Text>
                      <View>
                        <Text style={styles.degreeBadgeTitle}>{form.degree}</Text>
                        {form.certDetails ? (
                          <Text style={styles.degreeBadgeSub} numberOfLines={2}>
                            {form.certDetails}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* ── Live Preview ── */}
                {form.name ? (
                  <View style={styles.previewCard}>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>
                        {form.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewName}>{form.name}</Text>
                      <Text style={styles.previewMeta}>
                        {form.categoryName || 'No Category'}
                        {form.subcategoryName ? ` › ${form.subcategoryName}` : ''}
                      </Text>
                      {form.degree ? (
                        <Text style={styles.previewDegree}>🎓 {form.degree}</Text>
                      ) : null}
                      {form.experience ? (
                        <Text style={styles.previewExp}>
                          ⭐ {form.experience} years experience
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {/* Buttons */}
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setModal(false); resetForm(); }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.saveBtnText}>
                        {editId ? 'Update' : 'Add Expert'}
                      </Text>
                    }
                  </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2563EB', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  expertName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  expertMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  expertDegree: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  catTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catTagText: { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },
  subTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subTagText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
  expTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  expTagText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  actions: { alignItems: 'center', gap: 6 },
  statusBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 16 },
  delBtn: { padding: 6 },
  delBtnText: { fontSize: 16 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12, maxHeight: '93%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },

  section: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, marginBottom: 7, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 13, fontSize: 15, color: '#1E293B', marginBottom: 14,
  },

  chipBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  chipTextActive: { color: '#2563EB' },

  degreeBadge: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F5F3FF', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#DDD6FE',
  },
  degreeBadgeIcon: { fontSize: 22, marginRight: 10, marginTop: 2 },
  degreeBadgeTitle: { fontSize: 14, fontWeight: '700', color: '#5B21B6' },
  degreeBadgeSub: { fontSize: 12, color: '#8B5CF6', marginTop: 3 },

  previewCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE',
  },
  previewAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2563EB', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  previewAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  previewName: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  previewMeta: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  previewDegree: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
  previewExp: { fontSize: 12, color: '#92400E', marginTop: 2 },

  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});