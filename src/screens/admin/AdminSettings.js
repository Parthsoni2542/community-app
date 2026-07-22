/**
 * AdminSettings.jsx  (v4 — 2-Step Wizard)
 *
 * Step 1 → Pick a Service (category cards)
 * Step 2 → Pick an Expert from that service
 * Save   → Firestore updates (isPrimary, assignedServiceId, settings/primary)
 */

import React, {
    useEffect, useState, useCallback, useMemo, memo,
} from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator,
    StatusBar, Alert, Platform, Animated,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    getFirestore, collection, query, where,
    onSnapshot, doc, getDoc, setDoc, updateDoc,
    getDocs, serverTimestamp,
} from '@react-native-firebase/firestore';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
    primary: '#0D7B7A',
    primaryLight: '#F0FDFA',
    primaryBorder: '#E0F2F1',
    inactive: '#94A3B8',
    surface: '#FFFFFF',
    background: '#F4FAFA',
    textPrimary: '#0F172A',
    textSub: '#64748B',
    success: '#065F46',
    successBg: '#D1FAE5',
    shadow: '#0D7B7A',
};

const AVATAR_COLORS = ['#0D7B7A', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626', '#0891B2'];
const avatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name = '') => {
    const p = name.trim().split(' ').filter(Boolean);
    return p.length >= 2 ? p[0][0].toUpperCase() + p[1][0].toUpperCase() : (p[0]?.[0] ?? '?').toUpperCase();
};

const CARD_H = 76;
const ITEM_H = CARD_H + 10;

// ── Step indicator ────────────────────────────────────────────────────────────
const StepBar = memo(({ step }) => (
    <View style={s.stepBar}>
        {/* Step 1 */}
        <View style={s.stepItem}>
            <View style={[s.stepCircle, step >= 1 && s.stepCircleActive]}>
                {step > 1
                    ? <Icon name="check" size={12} color={C.surface} />
                    : <Text style={[s.stepNum, step === 1 && s.stepNumActive]}>1</Text>
                }
            </View>
            <Text style={[s.stepLabel, step >= 1 && s.stepLabelActive]}>Service</Text>
        </View>

        {/* Connector */}
        <View style={[s.stepConnector, step >= 2 && s.stepConnectorActive]} />

        {/* Step 2 */}
        <View style={s.stepItem}>
            <View style={[s.stepCircle, step >= 2 && s.stepCircleActive]}>
                <Text style={[s.stepNum, step === 2 && s.stepNumActive]}>2</Text>
            </View>
            <Text style={[s.stepLabel, step >= 2 && s.stepLabelActive]}>Expert</Text>
        </View>
    </View>
));

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
    <View style={s.skeletonCard}>
        <View style={s.skeletonAvatar} />
        <View style={{ flex: 1 }}>
            <View style={s.skeletonLineA} />
            <View style={s.skeletonLineB} />
        </View>
    </View>
));

// ── Service Card (Step 1) ─────────────────────────────────────────────────────
const ServiceCard = memo(({ item, primaryExpert, onPress }) => (
    <TouchableOpacity style={s.serviceCard} onPress={onPress} activeOpacity={0.75}>
        <View style={s.serviceIconWrap}>
            {item.icon ? (
                <Image
                    source={{ uri: item.icon }}
                    style={s.cardImage}
                    resizeMode="cover"
                />
            ) : (
                <MatIcon name="shape-outline" size={24} color={COLORS.primary} />
            )}
            {/* <MatIcon name="shape-outline" size={22} color={C.primary} /> */}
        </View>
        <View style={s.serviceInfo}>
            <Text style={s.serviceName}>{item.name}</Text>

            {primaryExpert ? (
                <View style={s.serviceExpertRow}>
                    {/* <View style={[s.serviceExpertDot, { backgroundColor: avatarColor(primaryExpert.name) }]} /> */}
                    <Text style={s.serviceExpertName} numberOfLines={1}>{primaryExpert.name}</Text>

                    <View style={s.primaryPill}>
                        <MatIcon name="star" size={8} color={C.surface} />
                        <Text style={s.primaryPillText}>Primary</Text>
                    </View>
                </View>
            ) : (
                null
            )}
            
        </View>
        <View style={s.serviceArrow}>
            <Icon name="chevron-right" size={16} color={C.primary} />
        </View>
    </TouchableOpacity>
));

// ── Expert Card (Step 2) ──────────────────────────────────────────────────────
const ExpertCard = memo(({ item, isSelected, isPrimary, onSelect }) => (
    <TouchableOpacity
        style={[s.expertCard, isSelected && s.expertCardSelected]}
        onPress={onSelect}
        activeOpacity={0.75}
    >
        <View style={[s.avatar, { backgroundColor: avatarColor(item.name) }]}>
            <Text style={s.avatarText}>{initials(item.name)}</Text>
        </View>
        <View style={s.expertInfo}>
            <View style={s.expertNameRow}>
                <Text style={s.expertName} numberOfLines={1}>{item.name}</Text>
                {isPrimary && (
                    <View style={s.primaryBadge}>
                        <MatIcon name="star" size={9} color={C.surface} />
                        <Text style={s.primaryBadgeText}>Current</Text>
                    </View>
                )}
            </View>
            <Text style={s.expertSub} numberOfLines={1}>
                {item.subcategoryName || item.categoryName || 'Expert'}
            </Text>
        </View>
        {isSelected
            ? <View style={s.radioOn}><Icon name="check" size={13} color={C.surface} /></View>
            : <View style={s.radioOff} />
        }
    </TouchableOpacity>
));

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSettings({ navigation }) {
    const insets = useSafeAreaInsets();
    const headerPT = Platform.OS === 'ios' ? insets.top + 12 : insets.top + 16;

    const [categories, setCategories] = useState([]);
    const [experts, setExperts] = useState([]);
    const [currentPrimary, setCurrentPrimary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);

    // Wizard state
    const [step, setStep] = useState(1);       // 1 | 2
    const [selectedService, setSelectedService] = useState(null);   // { id, name }
    const [selectedExpertId, setSelectedExpertId] = useState(null);

    // ── Firestore ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const db = getFirestore();
        const u1 = onSnapshot(collection(db, 'categories'),
            (s) => setCategories(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
            (e) => console.error(e),
        );
        const u2 = onSnapshot(
            query(collection(db, 'users'), where('role', '==', 'expert')),
            (s) => { setExperts(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); setError(false); },
            (e) => { console.error(e); setLoading(false); setError(true); },
        );
        return () => { u1(); u2(); };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(doc(getFirestore(), 'settings', 'primary'));
                if (snap.exists()) setCurrentPrimary(snap.data());
            } catch (e) { console.error(e); }
        })();
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────────
    // Map: categoryId → primary expert object
    const primaryByService = useMemo(() => {
        const map = {};
        experts.forEach((e) => {
            if (e.isPrimary && e.assignedServiceId) map[e.assignedServiceId] = e;
        });
        return map;
    }, [experts]);

    // Experts for selected service (step 2)
    const serviceExperts = useMemo(() => {
        if (!selectedService) return [];
        return experts.filter(
            (e) => e.categoryId === selectedService.id || e.assignedServiceId === selectedService.id,
        );
    }, [experts, selectedService]);

    const selectedExpert = useMemo(
        () => experts.find((e) => e.id === selectedExpertId),
        [experts, selectedExpertId],
    );

    const isDirty = !!selectedExpertId &&
        selectedExpertId !== primaryByService[selectedService?.id]?.id;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const goToStep2 = useCallback((svc) => {
        setSelectedService(svc);
        setSelectedExpertId(primaryByService[svc.id]?.id ?? null); // pre-select current
        setStep(2);
    }, [primaryByService]);

    const goBack = useCallback(() => {
        setStep(1);
        setSelectedService(null);
        setSelectedExpertId(null);
    }, []);

    const handleSave = useCallback(async () => {
        if (!selectedExpertId || !selectedService) return;
        const expert = experts.find((e) => e.id === selectedExpertId);
        if (!expert) return;

        setSaving(true);
        try {
            const db = getFirestore();

            // Clear old primary for this service
            const prevSnap = await getDocs(query(
                collection(db, 'users'),
                where('role', '==', 'expert'),
                where('isPrimary', '==', true),
                where('assignedServiceId', '==', selectedService.id),
            ));
            await Promise.all(
                prevSnap.docs
                    .filter((d) => d.id !== selectedExpertId)
                    .map((d) => updateDoc(doc(db, 'users', d.id), { isPrimary: false, assignedServiceId: null })),
            );

            await updateDoc(doc(db, 'users', selectedExpertId), {
                isPrimary: true, assignedServiceId: selectedService.id,
            });

            await setDoc(doc(db, 'settings', 'primary'), {
                expertId: expert.id, expertName: expert.name,
                assignedServiceId: selectedService.id,
                serviceName: selectedService.name,
                updatedAt: serverTimestamp(),
            });

            setCurrentPrimary({
                expertId: expert.id, expertName: expert.name,
                assignedServiceId: selectedService.id, serviceName: selectedService.name,
            });

            Alert.alert(
                '✓ Done!',
                `${expert.name} is now the primary expert for "${selectedService.name}".`,
                [{ text: 'Great!', onPress: goBack }],
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [selectedExpertId, selectedService, experts, goBack]);

    // FlatList helpers
    const keyExtractor = useCallback((item) => item.id, []);
    const getItemLayout = useCallback((_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i }), []);

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={s.root}>
                <StatusBar barStyle="dark-content" backgroundColor={C.background} />
                <View style={[s.header, { paddingTop: headerPT }]}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={20} color={C.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Settings</Text>
                </View>
                <View style={s.headerDivider} />
                <View style={{ padding: 16 }}>
                    {[1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)}
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[s.root, s.centered]}>
                <Icon name="wifi-off" size={40} color={C.inactive} />
                <Text style={s.errorTitle}>Failed to Load</Text>
                <Text style={s.errorSub}>Check your connection and try again.</Text>
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 1 — Choose Service
    // ════════════════════════════════════════════════════════════════════════════
    if (step === 1) {
        return (
            <View style={s.root}>
                <StatusBar barStyle="dark-content" backgroundColor={C.background} />

                {/* Header */}
                <View style={[s.header, { paddingTop: headerPT }]}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={20} color={C.textPrimary} />
                    </TouchableOpacity>
                    <View style={s.headerTitleWrap}>
                        <Text style={s.headerTitle}>Settings</Text>
                        <Text style={s.headerSub}>Assign primary expert per service</Text>
                    </View>
                    <View style={s.headerIconWrap}>
                        <Icon name="settings" size={16} color={C.primary} />
                    </View>
                </View>
                <View style={s.headerDivider} />

                {/* Step bar */}
                <StepBar step={1} />

                {/* Current global primary */}
                {/* {currentPrimary?.expertId && (
          <View style={s.globalBanner}>
            <MatIcon name="account-star" size={16} color={C.primary} />
            <View style={s.globalBannerText}>
              <Text style={s.globalBannerLabel}>Global Primary</Text>
              <Text style={s.globalBannerName}>
                {currentPrimary.expertName}
                {currentPrimary.serviceName ? `  ·  ${currentPrimary.serviceName}` : ''}
              </Text>
            </View>
            <View style={s.activePill}>
              <View style={s.activeDot} />
              <Text style={s.activePillText}>Active</Text>
            </View>
          </View>
        )} */}

                {/* Instruction */}
                <View style={s.instructionRow}>
                    <Text style={s.instructionText}>
                        Tap a service to assign its primary expert
                    </Text>
                </View>

                {/* Service list */}
                <FlatList
                    data={categories}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[s.listPad, { paddingBottom: insets.bottom + 30 }]}
                    ListEmptyComponent={
                        <View style={s.emptyBox}>
                            <MatIcon name="shape-outline" size={48} color={C.primaryBorder} />
                            <Text style={s.emptyTitle}>No Services Found</Text>
                            <Text style={s.emptySub}>Add services from the Services tab first.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <ServiceCard
                            item={item}
                            primaryExpert={primaryByService[item.id] ?? null}
                            onPress={() => goToStep2(item)}
                        />
                    )}
                />
            </View>
        );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 2 — Choose Expert
    // ════════════════════════════════════════════════════════════════════════════
    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            {/* Header */}
            <View style={[s.header, { paddingTop: headerPT }]}>
                <TouchableOpacity style={s.backBtn} onPress={goBack}>
                    <Icon name="arrow-left" size={20} color={C.textPrimary} />
                </TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <Text style={s.headerTitle}>{selectedService?.name}</Text>
                    <Text style={s.headerSub}>Select primary expert</Text>
                </View>
            </View>
            <View style={s.headerDivider} />

            {/* Step bar */}
            <StepBar step={2} />

            {/* Expert list */}
            <FlatList
                data={serviceExperts}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    s.listPad,
                    { paddingBottom: insets.bottom + (isDirty ? 140 : 30) },
                ]}
                ListEmptyComponent={
                    <View style={s.emptyBox}>
                        <MatIcon name="account-search-outline" size={48} color={C.primaryBorder} />
                        <Text style={s.emptyTitle}>No Experts Found</Text>
                        <Text style={s.emptySub}>No experts are assigned to this service yet.</Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={s.expertListHeader}>
                        <Icon name="users" size={13} color={C.primary} />
                        <Text style={s.sectionTitle}>
                            {serviceExperts.length} expert{serviceExperts.length !== 1 ? 's' : ''} available
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ExpertCard
                        item={item}
                        isSelected={selectedExpertId === item.id}
                        isPrimary={primaryByService[selectedService?.id]?.id === item.id}
                        onSelect={() => setSelectedExpertId((p) => p === item.id ? null : item.id)}
                    />
                )}
            />

            {/* ── Floating Save CTA ─────────────────────────────────────────── */}
            {isDirty && (
                <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 14 }]}>

                    {/* Who will be set */}
                    <View style={s.ctaPreview}>
                        <View style={[s.ctaAvatar, { backgroundColor: avatarColor(selectedExpert?.name) }]}>
                            <Text style={s.ctaAvatarText}>{initials(selectedExpert?.name)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.ctaPreviewName} numberOfLines={1}>{selectedExpert?.name}</Text>
                            <Text style={s.ctaPreviewSvc} numberOfLines={1}>
                                Primary for  "{selectedService?.name}"
                            </Text>
                        </View>
                        <Icon name="check-circle" size={18} color={C.primary} />
                    </View>

                    {/* Big button */}
                    <TouchableOpacity
                        style={[s.ctaBtn, saving && s.ctaBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.87}
                    >
                        {saving ? (
                            <ActivityIndicator color={C.surface} size="small" />
                        ) : (
                            <View style={s.ctaBtnRow}>
                                <View style={s.ctaBtnIcon}>
                                    <MatIcon name="star-check" size={20} color={C.primary} />
                                </View>
                                <Text style={s.ctaBtnText}>Confirm & Set as Primary</Text>
                                <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.75)" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface,
        paddingHorizontal: 16, paddingBottom: 14,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: C.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12, borderWidth: 1, borderColor: C.primaryBorder,
    },
    headerTitleWrap: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: C.textPrimary },
    headerSub: { fontSize: 11, color: C.inactive, marginTop: 2, fontWeight: '500' },
    headerIconWrap: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: C.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.primaryBorder,
    },
    headerDivider: { height: 1, backgroundColor: C.primaryBorder },

    // Step bar
    stepBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 14,
        backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.primaryBorder,
    },
    stepItem: { alignItems: 'center' },
    stepCircle: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#E2E8F0',
        alignItems: 'center', justifyContent: 'center',
    },
    stepCircleActive: { backgroundColor: C.primary },
    stepNum: { fontSize: 13, fontWeight: '800', color: C.inactive },
    stepNumActive: { color: C.surface },
    stepLabel: {
        fontSize: 10, fontWeight: '700', color: C.inactive,
        marginTop: 4, letterSpacing: 0.3,
    },
    stepLabelActive: { color: C.primary },
    stepConnector: {
        flex: 1, height: 2, marginHorizontal: 10,
        backgroundColor: '#E2E8F0', marginBottom: 14,
    },
    stepConnectorActive: { backgroundColor: C.primary },

    // Global banner
    globalBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.primaryLight,
        marginHorizontal: 16, marginTop: 14,
        borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14,
        borderWidth: 1, borderColor: C.primaryBorder,
    },
    globalBannerText: { flex: 1, marginLeft: 10 },
    globalBannerLabel: {
        fontSize: 9, fontWeight: '700', color: C.inactive,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    globalBannerName: { fontSize: 13, fontWeight: '700', color: C.primary, marginTop: 2 },
    activePill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.successBg,
        paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    },
    activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.success, marginRight: 4 },
    activePillText: { fontSize: 10, fontWeight: '700', color: C.success },

    // Instruction
    instructionRow: {
        paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
    },
    instructionText: {
        fontSize: 12, color: C.textSub, fontWeight: '500',
    },

    // List padding
    listPad: { paddingHorizontal: 16, paddingTop: 4 },

    // ── Service Card ──────────────────────────────────────────────────────────
    serviceCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14,
        marginBottom: 10,
        borderWidth: 1, borderColor: C.primaryBorder,
        shadowColor: C.shadow, shadowOpacity: 0.06,
        shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    serviceIconWrap: {
        width: 44, height: 44, borderRadius: 13,
        backgroundColor: C.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 13, borderWidth: 1, borderColor: C.primaryBorder,
    },
    cardImage: {
        width: 46,
        height: 46,
        borderRadius:70
    },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    serviceExpertRow: { flexDirection: 'row', alignItems: 'center' },
    serviceExpertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    serviceExpertName: {
        fontSize: 12, color: C.textSub, fontWeight: '500', flex: 1, marginRight: 6,
    },
    primaryPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.primary,
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,marginRight:10,
    },
    primaryPillText: { fontSize: 9, fontWeight: '800', color: C.surface, marginLeft: 3 },
    serviceNoExpert: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
    serviceArrow: {
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: C.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.primaryBorder,
    },

    // ── Expert Card ───────────────────────────────────────────────────────────
    expertListHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 8, paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: C.primary,
        marginLeft: 6, letterSpacing: 0.4, textTransform: 'uppercase',
    },
    expertCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 16,
        paddingVertical: 12, paddingHorizontal: 14,
        marginBottom: 10, height: CARD_H,
        borderWidth: 1, borderColor: C.primaryBorder,
        shadowColor: C.shadow, shadowOpacity: 0.05,
        shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    expertCardSelected: {
        backgroundColor: C.primaryLight,
        borderColor: C.primary, borderWidth: 1.5,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    avatarText: { fontSize: 16, fontWeight: '800', color: C.surface },
    expertInfo: { flex: 1 },
    expertNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    expertName: { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 6 },
    primaryBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#D97706',
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    },
    primaryBadgeText: { fontSize: 9, fontWeight: '800', color: C.surface, marginLeft: 3 },
    expertSub: { fontSize: 11, color: C.textSub, fontWeight: '500' },
    radioOn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    },
    radioOff: {
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 2, borderColor: C.primaryBorder,
    },

    // ── Skeleton ──────────────────────────────────────────────────────────────
    skeletonCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 16,
        padding: 14, marginBottom: 10, height: CARD_H,
    },
    skeletonAvatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#D1F4F2', marginRight: 12 },
    skeletonLineA: { height: 13, width: '55%', backgroundColor: '#D1F4F2', borderRadius: 6, marginBottom: 8 },
    skeletonLineB: { height: 10, width: '35%', backgroundColor: '#E8F9F8', borderRadius: 6 },

    // ── Empty / Error ─────────────────────────────────────────────────────────
    emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginTop: 14 },
    emptySub: { fontSize: 13, color: C.inactive, marginTop: 6, textAlign: 'center' },
    errorTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary, marginTop: 14 },
    errorSub: { fontSize: 13, color: C.inactive, marginTop: 6, textAlign: 'center' },

    // ── Floating Save CTA ─────────────────────────────────────────────────────
    ctaWrap: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: C.surface,
        paddingHorizontal: 16, paddingTop: 14,
        borderTopWidth: 1, borderTopColor: C.primaryBorder,
        shadowColor: C.shadow, shadowOpacity: 0.14,
        shadowRadius: 20, shadowOffset: { width: 0, height: -6 },
        elevation: 18,
    },
    ctaPreview: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.primaryLight,
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
        marginBottom: 10,
        borderWidth: 1, borderColor: C.primaryBorder,
    },
    ctaAvatar: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    ctaAvatarText: { fontSize: 13, fontWeight: '800', color: C.surface },
    ctaPreviewName: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
    ctaPreviewSvc: { fontSize: 11, color: C.textSub, marginTop: 1 },

    ctaBtn: {
        borderRadius: 16, backgroundColor: C.primary,
        paddingVertical: 16, paddingHorizontal: 10,
        shadowColor: C.primary, shadowOpacity: 0.45,
        shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
        elevation: 10,
        marginBottom: 60
    },
    ctaBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
    ctaBtnRow: { flexDirection: 'row', alignItems: 'center' },
    ctaBtnIcon: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    ctaBtnText: {
        flex: 1, fontSize: 15, fontWeight: '800',
        color: C.surface, letterSpacing: 0.2,
    },
});