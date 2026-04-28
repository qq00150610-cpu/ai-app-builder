import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../services/store';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useUserStore();

  const menuSections = [
    {
      title: '账号服务',
      items: [
        { icon: '💎', title: '会员中心', screen: 'Membership', color: '#FFD700' },
        { icon: '🤖', title: 'AI配置', screen: 'AISettings', color: '#667eea' },
        { icon: '📦', title: '构建记录', screen: 'BuildHistory', color: '#4facfe' },
      ],
    },
    {
      title: '支持与帮助',
      items: [
        { icon: '❓', title: '帮助中心', screen: null, color: '#43e97b' },
        { icon: '📝', title: '用户反馈', screen: null, color: '#f093fb' },
        { icon: '📞', title: '联系客服', screen: null, color: '#ff6b6b' },
      ],
    },
    {
      title: '其他',
      items: [
        { icon: '📜', title: '用户协议', screen: null, color: '#999' },
        { icon: '🔒', title: '隐私政策', screen: null, color: '#999' },
        { icon: 'ℹ️', title: '关于我们', screen: null, color: '#999' },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: () => logout(), style: 'destructive' },
    ]);
  };

  const getMemberInfo = () => {
    if (user?.member_type === 2) {
      return { text: '永久会员', color: '#FFD700', bg: '#FFF8E1' };
    }
    if (user?.member_type === 1) {
      return { text: '年度会员', color: '#667eea', bg: '#EEF2FF' };
    }
    return { text: '免费用户', color: '#999', bg: '#F5F5F5' };
  };

  const memberInfo = getMemberInfo();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息头部 */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.nickname?.[0] || '用'}</Text>
                </View>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.nickname}>{user?.nickname || '未设置昵称'}</Text>
                <Text style={styles.userId}>ID: {user?.id || '10001'}</Text>
                <View style={[styles.memberBadge, { backgroundColor: memberInfo.bg }]}>
                  <Text style={[styles.memberBadgeText, { color: memberInfo.color }]}>
                    {memberInfo.text}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 统计数据 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>我的项目</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>构建次数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.member_type === 0 ? '5' : '∞'}</Text>
            <Text style={styles.statLabel}>剩余打包</Text>
          </View>
        </View>

        {/* 菜单列表 */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.menuIconBg, { backgroundColor: item.color + '20' }]}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* 版本信息 */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>AI应用构建器 v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 All Rights Reserved</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerGradient: {
    backgroundColor: '#667eea',
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTitle: {
    fontSize: 15,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#ddd',
  },
  bottomSpacer: {
    height: 100,
  },
});
