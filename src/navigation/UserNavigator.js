// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { View, Text } from 'react-native';

// // Placeholder — baad mein replace karna
// const UserHome = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//     <Text>User Home</Text>
//   </View>
// );

// const Stack = createStackNavigator();

// export default function UserNavigator() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="UserHome" component={UserHome} />
//     </Stack.Navigator>
//   );
// }


import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Text }                     from 'react-native';

import HomeScreen        from '../screens/user/HomeScreen';
import ExpertListScreen  from '../screens/user/ExpertListScreen';
import ExpertDetailScreen from '../screens/user/ExpertDetailScreen';
import ChatScreen        from '../screens/user/ChatScreen';
import ChatHistoryScreen from '../screens/user/ChatHistoryScreen';
import UserProfile       from '../screens/user/UserProfile';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"         component={HomeScreen}         />
      <Stack.Screen name="ExpertList"   component={ExpertListScreen}   />
      <Stack.Screen name="ExpertDetail" component={ExpertDetailScreen} />
      <Stack.Screen name="Chat"         component={ChatScreen}         />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
      <Stack.Screen name="ChatFromHistory" component={ChatScreen}   />
    </Stack.Navigator>
  );
}

const icon = (label) => () => (
  <Text style={{ fontSize: 22 }}>
    {label === 'Home'    ? '🏠' :
     label === 'History' ? '📋' : '👤'}
  </Text>
);

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor  : '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle            : { backgroundColor: '#FFFFFF', height: 62, borderTopColor: '#F1F5F9' },
        headerShown            : false,
        tabBarLabelStyle       : { fontSize: 11, marginBottom: 4 },
      }}
    >
      <Tab.Screen name="Home"    component={HomeStack}    options={{ tabBarIcon: icon('Home')    }} />
      <Tab.Screen name="History" component={HistoryStack} options={{ tabBarIcon: icon('History') }} />
      <Tab.Screen name="Profile" component={UserProfile}  options={{ tabBarIcon: icon('Profile') }} />
    </Tab.Navigator>
  );
}