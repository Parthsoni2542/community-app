import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen         from '../screens/user/HomeScreen';
import ExpertListScreen   from '../screens/user/ExpertListScreen';
import ExpertDetailScreen from '../screens/user/ExpertDetailScreen';
import ChatScreen         from '../screens/user/ChatScreen';
import ChatHistoryScreen  from '../screens/user/ChatHistoryScreen';
import UserProfile        from '../screens/user/UserProfile';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = {
  primary  : '#0D7B7A',
  inactive : '#94A3B8',
  surface  : '#FFFFFF',
  border   : '#E0F2F1',
  activeBg : '#F0FDFA',
  shadow   : '#0D7B7A',
};

const TAB_HEIGHT_BASE = Platform.OS === 'ios' ? 56 : 60;

// Set lookup is O(1) — faster than Array.includes on every render
const HIDE_TAB_ROUTES = new Set(['Chat', 'ChatFromHistory']);

// ── Stack Navigators ──────────────────────────────────────────────────────────

const HomeStackNav = createStackNavigator();
const HistStackNav = createStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain"     component={HomeScreen}         />
      <HomeStackNav.Screen name="ExpertList"   component={ExpertListScreen}   />
      <HomeStackNav.Screen name="ExpertDetail" component={ExpertDetailScreen} />
      <HomeStackNav.Screen name="Chat"         component={ChatScreen}         />
    </HomeStackNav.Navigator>
  );
}

function HistoryStack() {
  return (
    <HistStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HistStackNav.Screen name="ChatHistory"     component={ChatHistoryScreen} />
      <HistStackNav.Screen name="ChatFromHistory" component={ChatScreen}        />
    </HistStackNav.Navigator>
  );
}

// ── Tab Icon ──────────────────────────────────────────────────────────────────
// Icon map defined outside component — zero allocation cost per render

const TAB_ICONS = {
  Home   : (s, c) => <Icon    name="home"                 size={s} color={c} />,
  History: (s, c) => <MatIcon name="message-text-outline" size={s} color={c} />,
  Profile: (s, c) => <Icon    name="user"                 size={s} color={c} />,
};

const TabIcon = memo(({ routeName, focused }) => {
  const color = focused ? COLORS.primary : COLORS.inactive;
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {TAB_ICONS[routeName]?.(22, color)}
      {focused && <View style={styles.activeDot} />}
    </View>
  );
});

// ── Tab Bar Background ────────────────────────────────────────────────────────
// Single component owns all visual chrome (border, shadow, fill).
// The tabBar shell stays transparent — avoids double-shadow artifacts.

const TabBarBackground = memo(({ height }) => (
  <View style={[styles.tabBarBg, { height }]} />
));

// ── Navigator ─────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function UserNavigator() {
  const insets    = useSafeAreaInsets();
  // Adds home-indicator / Android nav-bar space automatically
  const tabHeight = TAB_HEIGHT_BASE + insets.bottom;

  const screenOptions = useCallback(
    ({ route }) => {
      const focusedRoute = getFocusedRouteNameFromRoute(route) ?? '';
      const hideTab      = HIDE_TAB_ROUTES.has(focusedRoute);

      return {
        headerShown: false,

        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} />
        ),

        tabBarActiveTintColor  : COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,

        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle : [styles.tabItem, { paddingBottom: insets.bottom > 0 ? 0 : 6 }],

        tabBarStyle: [
          styles.tabBar,
          { height: tabHeight },
          hideTab && styles.tabBarHidden,
        ],

        // Single visual layer — no duplicate shadow
        tabBarBackground: () => <TabBarBackground height={tabHeight} />,
      };
    },
    [insets.bottom, tabHeight],
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{ tabBarLabel: 'Consultations' }}
      />
      <Tab.Screen
        name="Profile"
        component={UserProfile}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  tabBarHidden: {
    display: 'none',
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
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.2,
  },

  // Icon container — teal pill background when active
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

  // Small dot below icon — secondary active signal
  activeDot: {
    position       : 'absolute',
    bottom         : 3,
    width          : 4,
    height         : 4,
    borderRadius   : 2,
    backgroundColor: COLORS.primary,
  },
});