// ExpertNavigator.jsx

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon    from 'react-native-vector-icons/Feather';
import MatIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import ExpertDashboard       from '../screens/expert/ExpertDashboard';
import ExpertChats           from '../screens/expert/ExpertChats';
import ExpertReplyChat       from '../screens/expert/ExpertReplyChat';
import ExpertProfile         from '../screens/expert/ExpertProfile';
import SubCategoryListScreen from '../screens/user/SubCategoryListScreen';
import ExpertListScreen      from '../screens/user/ExpertListScreen'; // aapki existing screen
import ExpertDetailScreen from '../screens/user/ExpertDetailScreen';
import BrodcastChatScreen from '../screens/user/BrodcastChatScreen';
import BrodcastExpertReplyChat from '../screens/expert/BrodcastExpertReplyChat';

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

// Tab bar in routes inn screens par hide hogi
const HIDE_TAB_ROUTES = new Set([
  'ExpertReplyChat',
  'SubCategoryList',
  'ExpertList',
  'MainChat'
]);

// ── Stack Navigators ──────────────────────────────────────────────────────────

const ChatsStackNav     = createStackNavigator();
const DashboardStackNav = createStackNavigator();

function ChatsStack() {
  return (
    <ChatsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ChatsStackNav.Screen name="ExpertChatsList" component={ExpertChats}     />
      <ChatsStackNav.Screen name="ExpertReplyChat" component={ExpertReplyChat} />
       <ChatsStackNav.Screen name="MainChat"      component={BrodcastExpertReplyChat}      />

    </ChatsStackNav.Navigator>
  );
}

// Dashboard stack — category browse flow
function DashboardStack() {
  return (
    <DashboardStackNav.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStackNav.Screen name="ExpertHome"      component={ExpertDashboard}       />
      <DashboardStackNav.Screen name="SubCategoryList" component={SubCategoryListScreen} />
      <DashboardStackNav.Screen name="ExpertList"      component={ExpertListScreen}      />
      <DashboardStackNav.Screen name="ExpertDetail"      component={ExpertDetailScreen}      />
      <DashboardStackNav.Screen name="MainChat"      component={BrodcastExpertReplyChat}      />
      
      
    </DashboardStackNav.Navigator>
  );
}

// ── Tab Icons ─────────────────────────────────────────────────────────────────

const TAB_ICONS = {
  Dashboard: (s, c) => <Icon    name="grid"         size={s} color={c} />,
  Chats    : (s, c) => <MatIcon name="chat-outline" size={s} color={c} />,
  Profile  : (s, c) => <Icon    name="user"         size={s} color={c} />,
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

const TabBarBackground = memo(({ height }) => (
  <View style={[styles.tabBarBg, { height }]} />
));

// ── Main Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function ExpertNavigator() {
  const insets    = useSafeAreaInsets();
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
        name="Chats"
        component={ChatsStack}
        options={{ tabBarLabel: 'Chats' }}
      />
      <Tab.Screen
        name="Profile"
        component={ExpertProfile}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  tabBarBg: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    backgroundColor: COLORS.surface,
    borderTopWidth : 1,
    borderColor    : COLORS.border,
    shadowColor    : COLORS.shadow,
    shadowOpacity  : 0.10,
    shadowRadius   : 20,
    shadowOffset   : { width: 0, height: -6 },
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
  activeDot: {
    position       : 'absolute',
    bottom         : 3,
    width          : 4,
    height         : 4,
    borderRadius   : 2,
    backgroundColor: COLORS.primary,
  },
});