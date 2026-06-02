// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { View, Text } from 'react-native';
// import ExpertDashboard from '../screens/expert/ExpertDashboard';


// const Stack = createStackNavigator();

// export default function ExpertNavigator() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="ExpertDashboard" component={ExpertDashboard} />
//     </Stack.Navigator>
//   );
// }


import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Text }                     from 'react-native';

import ExpertDashboard  from '../screens/expert/ExpertDashboard';
import ExpertChats      from '../screens/expert/ExpertChats';
import ExpertReplyChat  from '../screens/expert/ExpertReplyChat';
import ExpertProfile    from '../screens/expert/ExpertProfile';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function ChatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpertChatsList" component={ExpertChats}     />
      <Stack.Screen name="ExpertReplyChat" component={ExpertReplyChat} />
    </Stack.Navigator>
  );
}

const icon = (label) => () => (
  <Text style={{ fontSize: 22 }}>
    {label === 'Dashboard' ? '🏠' :
     label === 'Chats'     ? '💬' : '👤'}
  </Text>
);

export default function ExpertNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor  : '#7C3AED',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle            : { backgroundColor: '#FFFFFF', height: 62, borderTopColor: '#F1F5F9' },
        headerShown            : false,
        tabBarLabelStyle       : { fontSize: 11, marginBottom: 4 },
      }}
    >
      <Tab.Screen name="Dashboard" component={ExpertDashboard} options={{ tabBarIcon: icon('Dashboard') }} />
      <Tab.Screen name="Chats"     component={ChatsStack}      options={{ tabBarIcon: icon('Chats'), tabBarLabel: 'Chats' }} />
      <Tab.Screen name="Profile"   component={ExpertProfile}   options={{ tabBarIcon: icon('Profile') }} />
    </Tab.Navigator>
  );
}