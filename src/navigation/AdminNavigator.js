import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon    from 'react-native-vector-icons/Feather';

import AdminDashboard      from '../screens/admin/AdminDashboard';
import ManageCategories    from '../screens/admin/ManageCategories';
import ManageSubCategories from '../screens/admin/ManageSubCategories';
import ManageExperts       from '../screens/admin/ManageExperts';
import ManageUsers         from '../screens/admin/ManageUsers';
import ViewAllChats        from '../screens/admin/ViewAllChats';

// ── Constants — identical token set as UserNavigator ─────────────────────────

const COLORS = {
  primary  : '#0D7B7A',
  inactive : '#94A3B8',
  surface  : '#FFFFFF',
  border   : '#E0F2F1',
  activeBg : '#F0FDFA',
  shadow   : '#0D7B7A',
};

const TAB_HEIGHT_BASE = Platform.OS === 'ios' ? 56 : 60;

// ── Stack Navigators ──────────────────────────────────────────────────────────
// Every tab has its own Stack so detail screens can be pushed freely.

const DashStack   = createStackNavigator();
const CatStack    = createStackNavigator();
const ExpertStack = createStackNavigator();
const UsersStack  = createStackNavigator();
const ChatsStack  = createStackNavigator();

function DashboardStack() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
      <DashStack.Screen name="AdminDashboard" component={AdminDashboard} />
    </DashStack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <CatStack.Navigator screenOptions={{ headerShown: false }}>
      <CatStack.Screen name="CategoriesList" component={ManageCategories}    />
      <CatStack.Screen name="SubCategories"  component={ManageSubCategories} />
    </CatStack.Navigator>
  );
}

function ExpertsStack() {
  return (
    <ExpertStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpertStack.Screen name="ExpertsList" component={ManageExperts} />
    </ExpertStack.Navigator>
  );
}

function UsersStackNav() {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name="UsersList" component={ManageUsers} />
    </UsersStack.Navigator>
  );
}

function ChatsStackNav() {
  return (
    <ChatsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatsStack.Screen name="AllChats" component={ViewAllChats} />
    </ChatsStack.Navigator>
  );
}

// ── Tab Icon — same pill + dot pattern as UserNavigator ──────────────────────

const TAB_ICONS = {
  Dashboard : (s, c) => <MatIcon name="view-dashboard-outline" size={s} color={c} />,
  Services: (s, c) => <MatIcon name="shape-outline"          size={s} color={c} />,
  Experts   : (s, c) => <MatIcon name="stethoscope"            size={s} color={c} />,
  Users     : (s, c) => <Icon    name="users"                  size={s} color={c} />,
  Chats     : (s, c) => <MatIcon name="chat-outline"           size={s} color={c} />,
};

const AdminTabIcon = memo(({ routeName, focused }) => {
  const color = focused ? COLORS.primary : COLORS.inactive;
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {TAB_ICONS[routeName]?.(22, color)}
      {/* {focused && <View style={styles.activeDot} />} */}
    </View>
  );
});

// ── Tab Bar Background — same single-shadow pattern as UserNavigator ──────────

const TabBarBackground = memo(({ height }) => (
  <View style={[styles.tabBarBg, { height }]} />
));

// ── Navigator ─────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  const insets    = useSafeAreaInsets();
  const tabHeight = TAB_HEIGHT_BASE + insets.bottom;

  const screenOptions = useCallback(
    ({ route }) => {
      const focusedRoute = getFocusedRouteNameFromRoute(route) ?? '';

      return {
        headerShown: false,

        tabBarIcon: ({ focused }) => (
          <AdminTabIcon routeName={route.name} focused={focused} />
        ),

        tabBarActiveTintColor  : COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,

        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle : [styles.tabItem, { paddingBottom: insets.bottom > 0 ? 0 : 6 }],

        tabBarStyle: [styles.tabBar, { height: tabHeight }],

        // Single visual layer — no duplicate shadow (same as UserNavigator)
        tabBarBackground: () => <TabBarBackground height={tabHeight} />,
      };
    },
    [insets.bottom, tabHeight],
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Services"
        component={CategoriesStack}
        options={{ tabBarLabel: 'Services' }}
      />
      <Tab.Screen
        name="Experts"
        component={ExpertsStack}
        options={{ tabBarLabel: 'Experts' }}
      />
      <Tab.Screen
        name="Users"
        component={UsersStackNav}
        options={{ tabBarLabel: 'Users' }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsStackNav}
        options={{ tabBarLabel: 'Chats' }}
      />
    </Tab.Navigator>
  );
}

// ── Styles — mirror of UserNavigator styles ───────────────────────────────────

const styles = StyleSheet.create({
  // Transparent shell — position only, no visuals here
  tabBar: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: 'transparent',
    borderTopWidth : 0,
    elevation      : 0,
    shadowOpacity  : 0,
  },

  // All visual chrome lives here — single shadow source
  tabBarBg: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: COLORS.surface,
    borderTopWidth : 1,
    borderColor    : COLORS.border,
    // iOS shadow
    shadowColor    : COLORS.shadow,
    shadowOpacity  : 0.12,
    shadowRadius   : 20,
    shadowOffset   : { width: 0, height: -6 },
    // Android elevation
    elevation      : 20,
  },

  tabItem: {
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
  },

  tabLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.2,
  },

  // Teal pill background when active — matches UserNavigator exactly
  iconWrap: {
    width         : 52,
    height        : 36,
    borderRadius  : 14,
    justifyContent: 'center',
    alignItems    : 'center',
  },

  iconWrapActive: {
    backgroundColor: COLORS.activeBg,
  },

  // Small teal dot below icon — same secondary active signal as UserNavigator
  activeDot: {
    position       : 'absolute',
    bottom         : 3,
    width          : 4,
    height         : 4,
    borderRadius   : 2,
    backgroundColor: COLORS.primary,
  },
});