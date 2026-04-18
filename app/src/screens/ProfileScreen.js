import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../services/store';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useUserStore();

  const menuItems = [
    { icon: '👑', title: '会员中心', screen: 'Membership' },
    { icon: '🤖', title: 'AI配置', screen: 'AISettings' },
    { icon: '📦', title: '构建记录', screen: 'BuildHistory' },
    { icon: '❓', title: '帮助中心', screen: null },
    { icon: '📞', title: '联系客服', screen: null },
  ];

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: () => logout(), style: 'destructive' },
    ]);
  };

  const getMemberText = () => {
    if (user?.member_type === 2) return '永久会员';
    if (user?.member_type === 1) return '年度会员';
    return '免费用户';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nickname?.[0] || '用'}</Text>
        </View>
        <Text style={styles.nickname}>{user?.nickname || '未设置昵称'}</Text>
        <View style={styles.memberBadge}>
          <Text style={styles.memberBadgeText}>{getMemberText()}</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View style={styles.section}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <Text style={styles.version}>版本 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 13,
    color: '#D48806',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    marginBottom: 20,
  },
});
