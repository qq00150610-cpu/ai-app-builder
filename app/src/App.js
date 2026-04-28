import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
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

// 自定义Tab Bar图标组件
const TabIcon = ({ icon, label, focused, color }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
    <Text style={[styles.tabLabel, { color: focused ? '#667eea' : '#999', fontWeight: focused ? '600' : '400' }]}>
      {label}
    </Text>
  </View>
);

// 浮动创建按钮组件
const CreateButton = ({ onPress }) => (
  <TouchableOpacity 
    style={styles.createButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.createButtonInner}>
      <Text style={styles.createButtonIcon}>+</Text>
    </View>
  </TouchableOpacity>
);

// 需要导入 TouchableOpacity
import { TouchableOpacity } from 'react-native';

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name=首页 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon=🏠 label=首页 focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name=项目 
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon=📁 label=项目 focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name=创建
        component={HomeScreen}
        options={({ navigation }) => ({
          tabBarButton: (props) => (
            <CreateButton onPress={() => navigation.navigate('Editor', { mode: 'ai' })} />
          ),
        })}
      />
      <Tab.Screen 
        name=消息 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon=🔔 label=消息 focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name=我的 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon=👤 label=我的 focused={focused} />
          ),
        }}
      />
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
              <Stack.Screen 
                name=Main 
                component={MainTabs} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name=Editor 
                component={EditorScreen} 
                options={{ 
                  title: '编辑器',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }} 
              />
              <Stack.Screen 
                name=Import 
                component={ImportScreen} 
                options={{ 
                  title: '导入项目',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                }} 
              />
              <Stack.Screen 
                name=Membership 
                component={MembershipScreen} 
                options={{ 
                  title: '会员中心',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                }} 
              />
              <Stack.Screen 
                name=AISettings 
                component={AISettingsScreen} 
                options={{ 
                  title: 'AI配置',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                }} 
              />
              <Stack.Screen 
                name=BuildHistory 
                component={BuildHistoryScreen} 
                options={{ 
                  title: '构建记录',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                }} 
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name=Login 
                component={LoginScreen} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name=Register 
                component={RegisterScreen} 
                options={{ 
                  headerShown: true,
                  title: '注册',
                  headerBackTitle: '返回',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                }} 
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 85,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
  createButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});

export default App;
