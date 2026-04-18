import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import EditorScreen from './screens/EditorScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProfileScreen from './screens/ProfileScreen';
import MembershipScreen from './screens/MembershipScreen';
import AISettingsScreen from './screens/AISettingsScreen';
import BuildHistoryScreen from './screens/BuildHistoryScreen';
import ImportScreen from './screens/ImportScreen';

// Store
import { useUserStore } from './services/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="首页" component={HomeScreen} />
      <Tab.Screen name="项目" component={ProjectsScreen} />
      <Tab.Screen name="我的" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  const { token } = useUserStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator>
          {token ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen 
                name="Editor" 
                component={EditorScreen} 
                options={{ title: '编辑器' }} 
              />
              <Stack.Screen 
                name="Import" 
                component={ImportScreen} 
                options={{ title: '导入项目' }} 
              />
              <Stack.Screen 
                name="Membership" 
                component={MembershipScreen} 
                options={{ title: '会员中心' }} 
              />
              <Stack.Screen 
                name="AISettings" 
                component={AISettingsScreen} 
                options={{ title: 'AI配置' }} 
              />
              <Stack.Screen 
                name="BuildHistory" 
                component={BuildHistoryScreen} 
                options={{ title: '构建记录' }} 
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
