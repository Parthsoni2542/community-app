// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Text } from 'react-native';

// import AdminDashboard    from '../screens/admin/AdminDashboard';
// import ManageCategories  from '../screens/admin/ManageCategories';
// import ManageExperts     from '../screens/admin/ManageExperts';
// import ManageUsers       from '../screens/admin/ManageUsers';
// import ViewAllChats      from '../screens/admin/ViewAllChats';

// const Tab = createBottomTabNavigator();

// const icon = (label) => ({ focused }) => (
//   <Text style={{ fontSize: 20 }}>
//     {label === 'Dashboard'   ? '🏠' :
//      label === 'Categories'  ? '📂' :
//      label === 'Experts'     ? '👨‍⚕️' :
//      label === 'Users'       ? '👥' : '💬'}
//   </Text>
// );

// export default function AdminNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor  : '#2563EB',
//         tabBarInactiveTintColor: '#6B7280',
//         tabBarStyle            : { backgroundColor: '#FFFFFF', height: 60 },
//         headerShown            : false,
//       }}
//     >
//       <Tab.Screen name="Dashboard"  component={AdminDashboard}   options={{ tabBarIcon: icon('Dashboard')  }} />
//       <Tab.Screen name="Categories" component={ManageCategories} options={{ tabBarIcon: icon('Categories') }} />
//       <Tab.Screen name="Experts"    component={ManageExperts}    options={{ tabBarIcon: icon('Experts')    }} />
//       <Tab.Screen name="Users"      component={ManageUsers}      options={{ tabBarIcon: icon('Users')      }} />
//       <Tab.Screen name="Chats"      component={ViewAllChats}     options={{ tabBarIcon: icon('Chats')      }} />
//     </Tab.Navigator>
//   );
// }



// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Text } from 'react-native';

// import AdminDashboard    from '../screens/admin/AdminDashboard';
// import ManageCategories  from '../screens/admin/ManageCategories';
// import ManageExperts     from '../screens/admin/ManageExperts';
// import ManageUsers       from '../screens/admin/ManageUsers';
// import ViewAllChats      from '../screens/admin/ViewAllChats';

// const Tab = createBottomTabNavigator();

// const icon = (label) => ({ focused }) => (
//   <Text style={{ fontSize: 20 }}>
//     {label === 'Dashboard'   ? '🏠' :
//      label === 'Categories'  ? '📂' :
//      label === 'Experts'     ? '👨‍⚕️' :
//      label === 'Users'       ? '👥' : '💬'}
//   </Text>
// );

// export default function AdminNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor  : '#2563EB',
//         tabBarInactiveTintColor: '#6B7280',
//         tabBarStyle            : { backgroundColor: '#FFFFFF', height: 60 },
//         headerShown            : false,
//       }}
//     >
//       <Tab.Screen name="Dashboard"  component={AdminDashboard}   options={{ tabBarIcon: icon('Dashboard')  }} />
//       <Tab.Screen name="Categories" component={ManageCategories} options={{ tabBarIcon: icon('Categories') }} />
//       <Tab.Screen name="Experts"    component={ManageExperts}    options={{ tabBarIcon: icon('Experts')    }} />
//       <Tab.Screen name="Users"      component={ManageUsers}      options={{ tabBarIcon: icon('Users')      }} />
//       <Tab.Screen name="Chats"      component={ViewAllChats}     options={{ tabBarIcon: icon('Chats')      }} />
//     </Tab.Navigator>
//   );
// }


import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import AdminDashboard       from '../screens/admin/AdminDashboard';
import ManageCategories     from '../screens/admin/ManageCategories';
import ManageSubCategories  from '../screens/admin/ManageSubCategories';
import ManageExperts        from '../screens/admin/ManageExperts';
import ManageUsers          from '../screens/admin/ManageUsers';
import ViewAllChats         from '../screens/admin/ViewAllChats';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// Categories Stack (Categories + SubCategories)
function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoriesList"   component={ManageCategories}    />
      <Stack.Screen name="SubCategories"    component={ManageSubCategories} />
    </Stack.Navigator>
  );
}

const icon = (label) => () => (
  <Text style={{ fontSize: 20 }}>
    {label === 'Dashboard'  ? '🏠' :
     label === 'Categories' ? '📂' :
     label === 'Experts'    ? '🩺' :
     label === 'Users'      ? '👥' : '💬'}
  </Text>
);

export default function AdminNavigator() {
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
      <Tab.Screen name="Dashboard"  component={AdminDashboard}   options={{ tabBarIcon: icon('Dashboard')  }} />
      <Tab.Screen name="Categories" component={CategoriesStack}  options={{ tabBarIcon: icon('Categories') }} />
      <Tab.Screen name="Experts"    component={ManageExperts}    options={{ tabBarIcon: icon('Experts')    }} />
      <Tab.Screen name="Users"      component={ManageUsers}      options={{ tabBarIcon: icon('Users')      }} />
      <Tab.Screen name="Chats"      component={ViewAllChats}     options={{ tabBarIcon: icon('Chats')      }} />
    </Tab.Navigator>
  );
}