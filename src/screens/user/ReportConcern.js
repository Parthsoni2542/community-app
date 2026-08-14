/**
 * ReportConcern.jsx
 *
 * Lets any signed-in user report a concern about another member, a message,
 * or general app behaviour — including child safety concerns. Satisfies
 * Google Play's child safety standards requirement for an in-app reporting
 * mechanism.
 *
 * On submit:
 *  - Writes a document to the `reports` collection in Firestore, including
 *    the reporter's uid/name/phone (pulled from their profile), the
 *    category, and the free-text description.
 *  - The admin (communityadvisory7@gmail.com) reviews reports via the
 *    admin panel / Firestore console.
 *
 * Adjust the Firestore collection name / field names to match your existing
 * schema if different.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {
  getFirestore, collection, addDoc, serverTimestamp,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CATEGORIES = [
  { id: 'child_safety',   label: 'Child safety concern' },
  { id: 'harassment',     label: 'Harassment or abuse' },
  { id: 'inappropriate',  label: 'Inappropriate content' },
  { id: 'spam',           label: 'Spam or scam' },
  { id: 'other',          label: 'Other' },
];

export default function ReportConcern({ navigation }) {
  const [category, setCategory]       = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const user = auth().currentUser;

  const handleSubmit = useCallback(async () => {
    if (!category) {
      Alert.alert('Select a category', 'Please choose what this report is about.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Add a description', 'Please briefly describe the concern.');
      return;
    }

    setSubmitting(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'reports'), {
        category,
        description   : description.trim(),
        reporterUid    : user?.uid ?? null,
        reporterName   : user?.displayName ?? null,
        reporterPhone  : user?.phoneNumber ?? null,
        status         : 'open',
        createdAt      : serverTimestamp(),
      });

      Alert.alert(
        'Report submitted',
        'Thank you. Our team will review this and take appropriate action. ' +
        'If this is urgent, you can also email communityadvisory7@gmail.com directly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert(
        'Something went wrong',
        'We could not submit your report. Please try again, or email ' +
        'communityadvisory7@gmail.com directly.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [category, description, user, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4F4E" translucent />

      <LinearGradient
        colors={['#0A4F4E', '#0D7B7A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Report a Concern</Text>
        <Text style={styles.heroSubtitle}>
          Let us know if something doesn't feel right. All reports are
          reviewed by our community team.
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>WHAT IS THIS ABOUT?</Text>
        <View style={styles.categoryList}>
          {CATEGORIES.map((c) => {
            const selected = category === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>DESCRIBE WHAT HAPPENED</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please share as much detail as you can — who was involved, when it happened, and anything else that would help us understand."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={6}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <View style={styles.noteBox}>
          <Icon name="info" size={16} color="#0D7B7A" />
          <Text style={styles.noteText}>
            If a child is in immediate danger, please contact local emergency
            services or child protection authorities directly, in addition to
            filing this report.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitBtnText}>Submit Report</Text>
          }
        </TouchableOpacity>

        <Text style={styles.emailFallback}>
          You can also reach us directly at{'\n'}communityadvisory7@gmail.com
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },

  hero: {
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 19,
  },

  scrollContent: { padding: 20, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: '#64748B',
    letterSpacing: 0.5, marginBottom: 10, marginTop: 4,
  },

  categoryList: { gap: 10, marginBottom: 24 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E0F2F1',
  },
  categoryChipSelected: { borderColor: '#0D7B7A', backgroundColor: '#F0FDFA' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center',
  },
  radioOuterSelected: { borderColor: '#0D7B7A' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0D7B7A' },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  categoryLabelSelected: { color: '#0A4F4E' },

  textArea: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E0F2F1', minHeight: 130,
    fontSize: 14, color: '#1E293B', marginBottom: 16,
  },

  noteBox: {
    flexDirection: 'row', gap: 10, backgroundColor: '#F0FDFA',
    borderRadius: 14, padding: 14, marginBottom: 24, alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 12, color: '#0A4F4E', lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#0D7B7A', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  emailFallback: {
    textAlign: 'center', fontSize: 12, color: '#94A3B8',
    marginTop: 18, lineHeight: 18,
  },
});