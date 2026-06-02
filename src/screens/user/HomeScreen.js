// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   TextInput, StatusBar, ActivityIndicator, FlatList,
// } from 'react-native';
// import {
//   getFirestore, collection, onSnapshot,
//   query, orderBy,
// } from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// export default function HomeScreen({ navigation }) {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading]       = useState(true);
//   const [search, setSearch]         = useState('');
//   const [userName, setUserName]     = useState('');

//   const uid = auth().currentUser?.uid;

//   useEffect(() => {
//     const db    = getFirestore();
//     const q     = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
//     const unsub = onSnapshot(q, (snap) => {
//       setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//       setLoading(false);
//     });
//     return unsub;
//   }, []);

//   useEffect(() => {
//     if (!uid) return;
//     const db = getFirestore();
//     const { getDoc, doc } = require('@react-native-firebase/firestore');
//     getDoc(doc(db, 'users', uid)).then((d) => {
//       if (d.exists()) setUserName(d.data().name || '');
//     });
//   }, [uid]);

//   const filtered = categories.filter((c) =>
//     c.name?.toLowerCase().includes(search.toLowerCase()),
//   );

//   const BG_COLORS = [
//     '#EFF6FF', '#F0FDF4', '#FFF7ED', '#FDF4FF',
//     '#FFF1F2', '#F0FDFA', '#FFFBEB', '#EEF2FF',
//   ];
//   const getBg = (i) => BG_COLORS[i % BG_COLORS.length];

//   const BORDER_COLORS = [
//     '#BFDBFE', '#BBF7D0', '#FED7AA', '#E9D5FF',
//     '#FECDD3', '#99F6E4', '#FDE68A', '#C7D2FE',
//   ];
//   const getBorder = (i) => BORDER_COLORS[i % BORDER_COLORS.length];

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.greeting}>
//             Namaste {userName ? userName.split(' ')[0] : ''}! 👋
//           </Text>
//           <Text style={styles.tagline}>Kaunsi help chahiye aaj?</Text>
//         </View>
//         <View style={styles.headerAvatar}>
//           <Text style={{ fontSize: 20 }}>👤</Text>
//         </View>
//       </View>

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Text style={styles.searchIcon}>🔍</Text>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Doctor, Lawyer, CA search karo..."
//           placeholderTextColor="#9CA3AF"
//           value={search}
//           onChangeText={setSearch}
//         />
//         {search ? (
//           <TouchableOpacity onPress={() => setSearch('')}>
//             <Text style={{ fontSize: 16, color: '#94A3B8' }}>✕</Text>
//           </TouchableOpacity>
//         ) : null}
//       </View>

//       <ScrollView showsVerticalScrollIndicator={false}>

//         {/* Banner */}
//         <View style={styles.banner}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.bannerTitle}>Expert Help</Text>
//             <Text style={styles.bannerTitle}>at Your Fingertips 🏥</Text>
//             <Text style={styles.bannerSub}>
//               Qualified experts se seedha baat karo
//             </Text>
//           </View>
//           <Text style={styles.bannerEmoji}>🩺</Text>
//         </View>

//         {/* Categories */}
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Categories</Text>
//           <Text style={styles.sectionCount}>{filtered.length} available</Text>
//         </View>

//         {loading ? (
//           <ActivityIndicator color="#2563EB" style={{ marginTop: 30 }} />
//         ) : filtered.length === 0 ? (
//           <View style={styles.empty}>
//             <Text style={styles.emptyIcon}>🔍</Text>
//             <Text style={styles.emptyText}>Koi category nahi mili</Text>
//           </View>
//         ) : (
//           <View style={styles.grid}>
//             {filtered.map((cat, i) => (
//               <TouchableOpacity
//                 key={cat.id}
//                 style={[styles.catCard, {
//                   backgroundColor: getBg(i),
//                   borderColor    : getBorder(i),
//                 }]}
//                 onPress={() => navigation.navigate('ExpertList', {
//                   categoryId  : cat.id,
//                   categoryName: cat.name,
//                   categoryIcon: cat.icon,
//                 })}
//               >
//                 <Text style={styles.catIcon}>{cat.icon || '📁'}</Text>
//                 <Text style={styles.catName}>{cat.name}</Text>
//                 {cat.description ? (
//                   <Text style={styles.catDesc} numberOfLines={2}>
//                     {cat.description}
//                   </Text>
//                 ) : null}
//                 <View style={styles.catArrow}>
//                   <Text style={styles.catArrowText}>Experts dekhein →</Text>
//                 </View>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         <View style={{ height: 30 }} />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container    : { flex: 1, backgroundColor: '#F8FAFC' },
//   header       : {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     backgroundColor: '#FFFFFF', paddingHorizontal: 20,
//     paddingTop: 55, paddingBottom: 16,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   greeting     : { fontSize: 20, fontWeight: '800', color: '#0F172A' },
//   tagline      : { fontSize: 13, color: '#94A3B8', marginTop: 2 },
//   headerAvatar : {
//     width: 42, height: 42, borderRadius: 21,
//     backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
//   },
//   searchWrap   : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
//     borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
//     borderWidth: 1, borderColor: '#E2E8F0',
//     shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
//   },
//   searchIcon   : { fontSize: 16, marginRight: 8 },
//   searchInput  : { flex: 1, fontSize: 14, color: '#1E293B' },
//   banner       : {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#2563EB', marginHorizontal: 16, marginTop: 16,
//     borderRadius: 20, padding: 20,
//   },
//   bannerTitle  : { fontSize: 18, fontWeight: '800', color: '#FFFFFF', lineHeight: 26 },
//   bannerSub    : { fontSize: 13, color: '#BFDBFE', marginTop: 6 },
//   bannerEmoji  : { fontSize: 52 },
//   sectionHeader: {
//     flexDirection: 'row', justifyContent: 'space-between',
//     alignItems: 'center', marginHorizontal: 16, marginTop: 22, marginBottom: 14,
//   },
//   sectionTitle : { fontSize: 18, fontWeight: '800', color: '#0F172A' },
//   sectionCount : { fontSize: 13, color: '#94A3B8' },
//   grid         : { flexDirection: 'column', paddingHorizontal: 12, gap: 10,width:"100%" },
//   catCard      : {
//     width: '90%', borderRadius: 18, padding: 16,
//     borderWidth: 1.5, alignItems: 'flex-start',
//   },
//   catIcon      : { fontSize: 36, marginBottom: 10 },
//   catName      : { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
//   catDesc      : { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 10 },
//   catArrow     : { marginTop: 4 },
//   catArrowText : { fontSize: 12, color: '#2563EB', fontWeight: '600' },
//   empty        : { alignItems: 'center', paddingTop: 60 },
//   emptyIcon    : { fontSize: 48, marginBottom: 12 },
//   emptyText    : { fontSize: 15, color: '#94A3B8' },
// });


import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  getFirestore, collection, onSnapshot,
  query, orderBy,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const COLORS = {
  primary: '#0D7B7A',
  accent: '#14B8A6',
  lightTeal: '#A7E9E7',
  background: '#B3E9E6',
  white: '#FFFFFF',
  textPrimary: '#0D7B7A',
  textSecondary: '#80B2B0',
  border: '#D6F4F2',
};

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    const { getDoc, doc } = require('@react-native-firebase/firestore');
    getDoc(doc(db, 'users', uid)).then((d) => {
      if (d.exists()) setUserName(d.data().name || '');
    });
  }, [uid]);

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const BG_COLORS = [
    '#E0F9F8', '#D6F4F2', '#CCF0EF', '#E8F8F6',
    '#F0FFFE', '#D9F5F3', '#E5F7F5', '#F8FDFC',
  ];
  const getBg = (i) => BG_COLORS[i % BG_COLORS.length];

  const BORDER_COLORS = [
    '#A7E9E7', '#99F6E4', '#7EF2E8', '#81F5F0',
    '#7FEFEA', '#5EEAD4', '#87E8DE', '#5DEAD4',
  ];
  const getBorder = (i) => BORDER_COLORS[i % BORDER_COLORS.length];

  return (
    <LinearGradient
      colors={['#A7E9E7', '#B3E9E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              Namaste {userName ? userName.split(' ')[0] : ''}! 👋
            </Text>
            <Text style={styles.tagline}>Kaunsi help chahiye aaj?</Text>
          </View>
          <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Doctor, Lawyer, CA search karo..."
          placeholderTextColor="#80B2B0"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 16, color: '#80B2B0' }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Expert Help</Text>
            <Text style={styles.bannerTitle}>at Your Fingertips 🏥</Text>
            <Text style={styles.bannerSub}>
              Qualified experts se seedha baat karo
            </Text>
          </View>
          <Text style={styles.bannerEmoji}>🩺</Text>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionCount}>{filtered.length} available</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Koi category nahi mili</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((cat, i) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catCard, {
                  backgroundColor: getBg(i),
                  borderColor: getBorder(i),
                }]}
                onPress={() => navigation.navigate('ExpertList', {
                  categoryId: cat.id,
                  categoryName: cat.name,
                  categoryIcon: cat.icon,
                })}
                activeOpacity={0.75}
              >
                <View style={styles.catCardTop}>
                  <Text style={styles.catIcon}>{cat.icon || '📁'}</Text>
                  <View style={styles.catArrowIcon}>
                    <Text style={styles.catArrowIconText}>→</Text>
                  </View>
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
                {cat.description ? (
                  <Text style={styles.catDesc} numberOfLines={2}>
                    {cat.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:50
  },
  headerCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FFFE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  scrollView: {
    paddingHorizontal: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
    padding: 22,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 28,
  },
  bannerSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '500',
  },
  bannerEmoji: {
    fontSize: 56,
    marginLeft: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  sectionCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
  },
  catCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  catCardTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  catIcon: {
    fontSize: 38,
  },
  catArrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 123, 122, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catArrowIconText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  catName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  catDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
