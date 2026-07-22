import React, {
  useEffect, useState, useCallback, memo, useMemo,
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  getDocs,
  setDoc,
} from '@react-native-firebase/firestore';

// ── Design tokens — unified with ManageCategories / ManageSubCategories ────────

const COLORS = {
  primary: '#0D7B7A',
  primaryLight: '#F0FDFA',
  primaryBorder: '#E0F2F1',
  inactive: '#94A3B8',
  surface: '#FFFFFF',
  background: '#F4FAFA',
  textPrimary: '#0F172A',
  textSub: '#64748B',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  shadow: '#0D7B7A',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  purpleBorder: '#DDD6FE',
  amber: '#92400E',
  amberLight: '#FEF3C7',
};

// Firebase REST endpoint for creating Auth users without signing out the admin
const FIREBASE_API_KEY = 'AIzaSyD7Lr0SGgD6oUfMujCFzEkNC0iaErx0kCY';

// Fixed card height for getItemLayout
const CARD_HEIGHT = 110;
const CARD_MARGIN = 12;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN;

// ── Blank form ─────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  experience: '',
  categoryId: '',
  categoryName: '',
  subcategoryId: '',
  subcategoryName: '',
  degree: '',
  certDetails: '',
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

const SkeletonCard = memo(() => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonLines}>
      <View style={styles.skeletonLineA} />
      <View style={styles.skeletonLineB} />
      <View style={styles.skeletonLineC} />
    </View>
  </View>
));

// ── Tag pill ───────────────────────────────────────────────────────────────────

const Tag = memo(({ label, bgColor, textColor }) => (
  <View style={[styles.tag, { backgroundColor: bgColor }]}>
    <Text style={[styles.tagText, { color: textColor }]}>{label}</Text>
  </View>
));

// ── Expert card ────────────────────────────────────────────────────────────────

const ExpertCard = memo(({ item, onEdit, onDelete, onToggleActive }) => {
  const isActive = item.isActive !== false;

  return (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.expertName} numberOfLines={1}>{item.name}</Text>

        {!!item.mobile && (
          <View style={styles.metaRow}>
            <Icon name="phone" size={11} color={COLORS.textSub} />
            <Text style={styles.metaText}>{item.mobile}</Text>
          </View>
        )}

        {!!item.degree && (
          <View style={styles.metaRow}>
            <MatIcon name="school-outline" size={12} color={COLORS.purple} />
            <Text style={[styles.metaText, { color: COLORS.purple }]}>
              {item.degree}
            </Text>
          </View>
        )}

        {/* Tags row — gap replaced with marginRight */}
        <View style={styles.tagRow}>
          {!!item.categoryName && (
            <Tag
              label={item.categoryName}
              bgColor={COLORS.primaryLight}
              textColor={COLORS.primary}
            />
          )}
          {!!item.subcategoryName && (
            <Tag
              label={item.subcategoryName}
              bgColor="#D1FAE5"
              textColor="#065F46"
            />
          )}
          {!!item.experience && (
            <Tag
              label={`${item.experience} yr`}
              bgColor={COLORS.amberLight}
              textColor={COLORS.amber}
            />
          )}
        </View>
      </View>

      {/* Actions column */}
      <View style={styles.cardActions}>
        {/* Active toggle */}
        <TouchableOpacity
          style={[
            styles.statusBtn,
            { backgroundColor: isActive ? '#D1FAE5' : COLORS.dangerBg },
          ]}
          onPress={onToggleActive}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Text style={[
            styles.statusBtnText,
            { color: isActive ? '#065F46' : COLORS.danger },
          ]}>
            {isActive ? 'Active' : 'Off'}
          </Text>
        </TouchableOpacity>

        {/* Edit */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Icon name="edit-2" size={14} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Icon name="trash-2" size={14} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ── Section wrapper ────────────────────────────────────────────────────────────

const SectionBox = memo(({ iconName, iconLib = 'feather', title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      {iconLib === 'mat'
        ? <MatIcon name={iconName} size={16} color={COLORS.primary} />
        : <Icon name={iconName} size={15} color={COLORS.primary} />
      }
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
));

// ── Field label ────────────────────────────────────────────────────────────────

const FieldLabel = memo(({ label, required, optional }) => (
  <Text style={styles.fieldLabel}>
    {label}
    {required && <Text style={styles.required}> *</Text>}
    {optional && <Text style={styles.optional}> (Optional)</Text>}
  </Text>
));

// ── Category / Subcategory selector ───────────────────────────────────────────
/**
 * Market-standard vertical list selector.
 * Each option is a full-width tappable row with a leading icon,
 * label, and a trailing checkmark when selected.
 * No horizontal scroll. No emoji/image icons from the `icon` field.
 */
const OptionSelector = memo(({ options, selectedId, onSelect, emptyText }) => {
  if (!options.length) {
    return (
      <View style={styles.selectorEmpty}>
        <Icon name="inbox" size={16} color={COLORS.inactive} />
        <Text style={styles.selectorEmptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.selectorList}>
      {options.map((opt, index) => {
        const selected = selectedId === opt.id;
        const isLast = index === options.length - 1;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.selectorRow,
              selected && styles.selectorRowActive,
              !isLast && styles.selectorRowBorder,
            ]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            {/* Leading dot / check */}
            <View style={[
              styles.selectorDot,
              selected && styles.selectorDotActive,
            ]}>
              {selected && (
                <Icon name="check" size={10} color={COLORS.surface} />
              )}
            </View>

            <Text
              style={[
                styles.selectorLabel,
                selected && styles.selectorLabelActive,
              ]}
              numberOfLines={1}
            >
              {opt.name}
            </Text>

            {selected && (
              <Icon name="check-circle" size={16} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function ManageExperts() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);

  // Single field updater — stable reference, no recreation per field
  const setField = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Firestore: experts listener ──────────────────────────────────────────
  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setExperts(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.role === 'expert'),
        );
        setLoading(false);
        setError(false);
      },
      (err) => {
        console.error('Experts snapshot error:', err);
        setLoading(false);
        setError(true);
      },
    );
    return unsub;
  }, []);

  // ── One-shot: load categories for the modal ──────────────────────────────
  useEffect(() => {
    getDocs(collection(getFirestore(), 'categories')).then((snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch((err) => console.error('Categories load error:', err));
  }, []);

  // ── One-shot: load subcategories when category changes ───────────────────
  useEffect(() => {
    if (!form.categoryId) { setSubcategories([]); return; }

    getDocs(
      collection(getFirestore(), 'categories', form.categoryId, 'subcategories'),
    ).then((snap) => {
      setSubcategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch((err) => console.error('Subcategories load error:', err));
  }, [form.categoryId]);

  // ── Form helpers ─────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(BLANK_FORM);
    setEditId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEdit = useCallback((item) => {
    setEditId(item.id);
    setForm({
      name: item.name ?? '',
      mobile: item.mobile ?? '',
      email: item.email ?? '',
      password: '',
      address: item.address ?? '',
      experience: item.experience ?? '',
      categoryId: item.categoryId ?? '',
      categoryName: item.categoryName ?? '',
      subcategoryId: item.subcategoryId ?? '',
      subcategoryName: item.subcategoryName ?? '',
      degree: item.degree ?? '',
      certDetails: item.certDetails ?? '',
    });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  // ── Save (add / update) ──────────────────────────────────────────────────
  // const handleSave = useCallback(async () => {
  //   const {
  //     name, mobile, email, password, address, experience,
  //     categoryId, categoryName, subcategoryId, subcategoryName,
  //     degree, certDetails,
  //   } = form;

  //   if (!name.trim() || !mobile.trim() || !categoryId) {
  //     Alert.alert('Required Fields', 'Please fill in Name, Mobile, Email, and Category.');
  //     return;
  //   }
  //   if (!editId && !mobile.trim()) {
  //     // Alert.alert('Password Required', 'Please set a password for the new expert.');
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     const db  = getFirestore();
  //     let   uid = editId;

  //     // Create Firebase Auth user via REST API — admin session unaffected
  //     if (!editId) {
  //       const res  = await fetch(
  //         `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
  //         {
  //           method : 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body   : JSON.stringify({
  //             email,
  //             password,
  //             returnSecureToken: true,
  //           }),
  //         },
  //       );
  //       const json = await res.json();

  //       if (json.error) {
  //         Alert.alert('Registration Failed', json.error.message);
  //         setSaving(false);
  //         return;
  //       }
  //       uid = json.localId;
  //     }

  //     const expertData = {
  //       name         : name.trim(),
  //       mobile       : mobile.trim(),
  //       email        : email.trim(),
  //       address      : address.trim(),
  //       experience   : experience.trim(),
  //       categoryId,
  //       categoryName,
  //       subcategoryId,
  //       subcategoryName,
  //       degree       : degree.trim(),
  //       certDetails  : certDetails.trim(),
  //       role         : 'expert',
  //       isActive     : true,
  //     };

  //     if (editId) {
  //       await updateDoc(doc(db, 'users', editId), expertData);
  //     } else {
  //       await setDoc(doc(db, 'users', uid), {
  //         ...expertData,
  //         createdAt: serverTimestamp(),
  //       });
  //     }

  //     setModalVisible(false);
  //     resetForm();
  //     Alert.alert('Success', `${name.trim()} has been ${editId ? 'updated' : 'added'} as an expert.`);
  //   } catch (err) {
  //     Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
  //   } finally {
  //     setSaving(false);
  //   }
  // }, [form, editId, resetForm]);


  const handleSave = useCallback(async () => {
    const {
      name, mobile, address, experience,
      categoryId, categoryName, subcategoryId, subcategoryName,
      degree, certDetails, email,
    } = form;

    // ── Validation ──
    if (!name.trim() || !mobile.trim() || !categoryId) {
      Alert.alert('Required Fields', 'Please fill in Name, Mobile, and Category.');
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore();

      const expertData = {
        name: name.trim(),
        mobile: mobile.trim(),
        phone: `+91${mobile.replace(/\D/g, '')}`,  // login ke liye
        email: email.trim() || null,
        address: address.trim(),
        experience: experience.trim(),
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName,
        degree: degree.trim(),
        certDetails: certDetails.trim(),
        role: 'expert',
        isActive: true,
      };

      if (editId) {
        await updateDoc(doc(db, 'users', editId), expertData);
      } else {
        // Auto ID — Firebase Auth OTP verify hone par same phone se match hoga
        const newRef = doc(collection(db, 'users'));
        await setDoc(newRef, {
          ...expertData,
          createdAt: serverTimestamp(),
        });
      }

      setModalVisible(false);
      resetForm();
      Alert.alert('Success', `${name.trim()} has been ${editId ? 'updated' : 'added'} as an expert.`);
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }, [form, editId, resetForm]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id, name) => {
    Alert.alert(
      'Remove Expert',
      `Are you sure you want to remove "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(getFirestore(), 'users', id));
            } catch (err) {
              Alert.alert('Error', 'Failed to remove expert. Please try again.');
            }
          },
        },
      ],
    );
  }, []);

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = useCallback(async (id, current) => {
    try {
      await updateDoc(doc(getFirestore(), 'users', id), { isActive: !current });
    } catch (err) {
      Alert.alert('Error', 'Could not update expert status.');
    }
  }, []);

  // ── Category / subcategory selection ─────────────────────────────────────
  const handleSelectCategory = useCallback((cat) => {
    setForm((prev) => ({
      ...prev,
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: '',
      subcategoryName: '',
    }));
  }, []);

  const handleSelectSubcategory = useCallback((sub) => {
    setForm((prev) => ({
      ...prev,
      subcategoryId: sub.id,
      subcategoryName: sub.name,
    }));
  }, []);

  // ── FlatList helpers ──────────────────────────────────────────────────────
  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }) => (
    <ExpertCard
      item={item}
      onEdit={() => openEdit(item)}
      onDelete={() => handleDelete(item.id, item.name)}
      onToggleActive={() => handleToggleActive(item.id, item.isActive !== false)}
    />
  ), [openEdit, handleDelete, handleToggleActive]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyBox}>
      <MatIcon name="doctor" size={52} color={COLORS.primaryBorder} />
      <Text style={styles.emptyTitle}>No Experts Yet</Text>
      <Text style={styles.emptySub}>Tap "+ Add Expert" to register the first expert.</Text>
    </View>
  ), []);

  // ── Live preview data (memoized) ──────────────────────────────────────────
  const previewVisible = useMemo(() => !!form.name.trim(), [form.name]);

  // ── Header padding ────────────────────────────────────────────────────────
  const headerPaddingTop = Platform.OS === 'ios'
    ? insets.top + 12
    : insets.top + 16;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View>
            <Text style={styles.headerTitle}>Experts</Text>
            <Text style={styles.headerSub}>Loading...</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
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

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View>
          <Text style={styles.headerTitle}>Experts</Text>
          <Text style={styles.headerSub}>
            {experts.length} {experts.length === 1 ? 'expert' : 'experts'} registered
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
          <Icon name="plus" size={16} color={COLORS.surface} />
          <Text style={styles.addBtnText}>Add Expert</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      {/* Expert list */}
      <FlatList
        data={experts}
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
          <View style={[styles.modalBox, { paddingBottom: insets.bottom + 8 }]}>

            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Title row */}
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Icon
                  name={editId ? 'edit-2' : 'user-plus'}
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.modalTitle}>
                {editId ? 'Edit Expert' : 'Add New Expert'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={20} color={COLORS.inactive} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* ── Personal Info ─────────────────────────────────────── */}
              <SectionBox iconName="user" title="Personal Information">

                <FieldLabel label="Full Name" required />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dr. Rahul Sharma"
                  placeholderTextColor={COLORS.inactive}
                  value={form.name}
                  onChangeText={(v) => setField('name', v)}
                  returnKeyType="next"
                  autoCapitalize="words"
                />

                <FieldLabel label="Mobile Number" required />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={COLORS.inactive}
                  keyboardType="phone-pad"
                  value={form.mobile}
                  onChangeText={(v) => setField('mobile', v)}
                  returnKeyType="next"
                />

                <FieldLabel label="Email Address" optional />
                <TextInput
                  style={styles.input}
                  placeholder="expert@example.com (optional)"
                  placeholderTextColor={COLORS.inactive}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => setField('email', v)}
                  editable={!editId}
                  returnKeyType={editId ? 'next' : 'done'}
                />

                {/* {!editId && (
                  <>
                    <FieldLabel label="Password" required />
                    <TextInput
                      style={styles.input}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={COLORS.inactive}
                      secureTextEntry
                      value={form.password}
                      onChangeText={(v) => setField('password', v)}
                    />
                  </>
                )} */}

                <FieldLabel label="Address" optional />
                <TextInput
                  style={styles.inputMulti}
                  placeholder="Clinic / office address"
                  placeholderTextColor={COLORS.inactive}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={form.address}
                  onChangeText={(v) => setField('address', v)}
                />

                <FieldLabel label="Years of Experience" optional />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5"
                  placeholderTextColor={COLORS.inactive}
                  keyboardType="numeric"
                  value={form.experience}
                  onChangeText={(v) => setField('experience', v)}
                />
              </SectionBox>

              {/* ── Category & Specialization ─────────────────────────── */}
              <SectionBox
                iconName="layers"
                title="Services & Specializations"
              >
                <FieldLabel label="Service Category" required />

                {/*
                  Market-standard vertical selector.
                  Full-width rows, checkmark on selection.
                  No horizontal scroll, no icon field rendering.
                */}
                <OptionSelector
                  options={categories}
                  selectedId={form.categoryId}
                  onSelect={handleSelectCategory}
                  emptyText="No Services available. Please create Services first."
                />

                {/* Subcategory — only shown after a category is chosen */}
                {form.categoryId !== '' && (
                  <>
                    <View style={styles.subSectionDivider} />
                    <FieldLabel label="Specialization" optional />
                    <OptionSelector
                      options={subcategories}
                      selectedId={form.subcategoryId}
                      onSelect={handleSelectSubcategory}
                      emptyText="No specializations available for this Services."
                    />
                  </>
                )}
              </SectionBox>

              {/* ── Qualifications ────────────────────────────────────── */}
              <SectionBox
                iconName="school-outline"
                iconLib="mat"
                title="Qualifications"
              >
                <FieldLabel label="Degree / Qualification" optional />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MBBS, LLB, CA, MD..."
                  placeholderTextColor={COLORS.inactive}
                  value={form.degree}
                  onChangeText={(v) => setField('degree', v)}
                />

                <FieldLabel label="Additional Certifications" optional />
                <TextInput
                  style={styles.inputMulti}
                  placeholder="e.g. AIIMS Delhi — 2015, Bar Council — 2018..."
                  placeholderTextColor={COLORS.inactive}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={form.certDetails}
                  onChangeText={(v) => setField('certDetails', v)}
                />

                {/* Degree preview badge */}
                {!!form.degree && (
                  <View style={styles.degreeBadge}>
                    <MatIcon
                      name="school-outline"
                      size={20}
                      color={COLORS.purple}
                      style={{ marginRight: 10, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.degreeBadgeTitle}>{form.degree}</Text>
                      {!!form.certDetails && (
                        <Text style={styles.degreeBadgeSub} numberOfLines={2}>
                          {form.certDetails}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </SectionBox>

              {/* ── Live preview ──────────────────────────────────────── */}
              {previewVisible && (
                <View style={styles.previewCard}>
                  <View style={styles.previewAvatar}>
                    <Text style={styles.previewAvatarText}>
                      {form.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewName} numberOfLines={1}>
                      {form.name}
                    </Text>
                    <Text style={styles.previewMeta} numberOfLines={1}>
                      {form.categoryName || 'No category selected'}
                      {form.subcategoryName ? ` › ${form.subcategoryName}` : ''}
                    </Text>
                    {!!form.degree && (
                      <Text style={styles.previewDegree} numberOfLines={1}>
                        {form.degree}
                      </Text>
                    )}
                    {!!form.experience && (
                      <Text style={styles.previewExp}>
                        {form.experience} years experience
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Spacer so buttons don't sit against the bottom edge */}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Action buttons — outside ScrollView, always visible */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeModal}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Icon
                      name={editId ? 'check' : 'user-plus'}
                      size={16}
                      color={COLORS.surface}
                    />
                    <Text style={styles.saveBtnText}>
                      {editId ? 'Update Expert' : 'Add Expert'}
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

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.inactive,
    marginTop: 2,
    fontWeight: '500',
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  addBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Expert card ───────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: CARD_MARGIN,
    minHeight: CARD_HEIGHT,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.surface,
  },
  cardInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSub,
    marginLeft: 5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 5,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardActions: {
    alignItems: 'center',
    marginLeft: 8,
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  actionBtnDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor: '#FCA5A5',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: CARD_MARGIN,
    height: CARD_HEIGHT,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1F4F2',
    marginRight: 12,
  },
  skeletonLines: { flex: 1 },
  skeletonLineA: {
    height: 14,
    width: '55%',
    backgroundColor: '#D1F4F2',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineB: {
    height: 11,
    width: '40%',
    backgroundColor: '#E8F9F8',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineC: {
    height: 11,
    width: '65%',
    backgroundColor: '#E8F9F8',
    borderRadius: 6,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.inactive,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '94%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.primaryBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // ── Section box ───────────────────────────────────────────────────────────
  section: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },

  // ── Field label ───────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSub,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  required: { color: COLORS.danger },
  optional: {
    color: COLORS.inactive,
    fontWeight: '400',
    textTransform: 'none',
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  inputMulti: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ── Option selector ───────────────────────────────────────────────────────
  selectorList: {
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: COLORS.surface,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
  },
  selectorRowActive: {
    backgroundColor: COLORS.primaryLight,
  },
  selectorRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  selectorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectorDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectorLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  selectorLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectorEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: 4,
  },
  selectorEmptyText: {
    fontSize: 13,
    color: COLORS.inactive,
    marginLeft: 8,
    flex: 1,
  },

  // Sub-section divider between category and specialization
  subSectionDivider: {
    height: 1,
    backgroundColor: COLORS.primaryBorder,
    marginVertical: 14,
  },

  // ── Degree badge ──────────────────────────────────────────────────────────
  degreeBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.purpleLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    marginTop: 2,
  },
  degreeBadgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.purple,
  },
  degreeBadgeSub: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 3,
  },

  // ── Live preview card ─────────────────────────────────────────────────────
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.surface,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  previewMeta: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
  previewDegree: {
    fontSize: 12,
    color: COLORS.purple,
    marginTop: 2,
  },
  previewExp: {
    fontSize: 12,
    color: COLORS.amber,
    marginTop: 2,
  },

  // ── Modal buttons ─────────────────────────────────────────────────────────
  modalBtns: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  cancelBtnText: {
    color: COLORS.textSub,
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
  },
});