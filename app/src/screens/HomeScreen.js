import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../services/store';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();

  const quickActions = [
    { icon: '🤖', title: 'AI生成', desc: '智能生成应用', color: '#667eea', screen: 'Editor', params: { mode: 'ai' } },
    { icon: '📝', title: '模板中心', desc: '快速创建应用', color: '#f093fb', screen: 'Editor', params: { mode: 'template' } },
    { icon: '📥', title: '项目导入', desc: 'ZIP导入项目', color: '#4facfe', screen: 'Import' },
    { icon: '⚙️', title: 'AI配置', desc: '配置AI模型', color: '#43e97b', screen: 'AISettings' },
  ];

  const mainFeatures = [
    { icon: '🚀', title: '一键打包', desc: '云端编译APK' },
    { icon: '🔍', title: 'AI查错', desc: '智能代码诊断' },
    { icon: '📱', title: '全平台支持', desc: 'Android/iOS兼容' },
    { icon: '☁️', title: '云端存储', desc: '项目安全保存' },
  ];

  const menuItems = [
    { icon: '📦', title: '我的项目', screen: 'Projects', color: '#667eea' },
    { icon: '📜', title: '构建记录', screen: 'BuildHistory', color: '#f093fb' },
    { icon: '💳', title: '会员中心', screen: 'Membership', color: '#FFD700' },
    { icon: '❓', title: '帮助教程', screen: null, color: '#4facfe' },
  ];

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
  const remainingBuilds = user?.member_type === 0 ? 5 : '无限';

  return (
    <View style={styles.container}>
      <StatusBar barStyle=light-content backgroundColor=#667eea />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 顶部渐变背景 */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            {/* 用户信息区域 */}
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.nickname?.[0] || '开'}</Text>
                </View>
                <View style={[styles.memberBadge, { backgroundColor: memberInfo.bg }]}>
                  <Text style={[styles.memberBadgeText, { color: memberInfo.color }]}>
                    {memberInfo.text}
                  </Text>
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>你好，开发者</Text>
                <Text style={styles.subtitle}>今天想创建什么应用？</Text>
              </View>
            </View>

            {/* 配额卡片 */}
            <View style={styles.quotaCard}>
              <View style={styles.quotaItem}>
                <Text style={styles.quotaValue}>{remainingBuilds}</Text>
                <Text style={styles.quotaLabel}>剩余打包次数</Text>
              </View>
              <View style={styles.quotaDivider} />
              <View style={styles.quotaItem}>
                <Text style={styles.quotaValue}>0</Text>
                <Text style={styles.quotaLabel}>我的项目</Text>
              </View>
              <View style={styles.quotaDivider} />
              <View style={styles.quotaItem}>
                <Text style={styles.quotaValue}>0</Text>
                <Text style={styles.quotaLabel}>构建记录</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 快捷操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickCard, { backgroundColor: item.color }]}
                onPress={() => navigation.navigate(item.screen, item.params)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickIcon}>{item.icon}</Text>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 核心功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          <View style={styles.featureCard}>
            {mainFeatures.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 会员推广 */}
        {user?.member_type === 0 && (
          <TouchableOpacity 
            style={styles.memberPromo}
            onPress={() => navigation.navigate('Membership')}
            activeOpacity={0.9}
          >
            <View style={styles.memberPromoContent}>
              <View style={styles.memberPromoLeft}>
                <Text style={styles.memberPromoTitle}>💎 升级会员</Text>
                <Text style={styles.memberPromoDesc}>
                  年度会员 ¥9.9/年 | 永久会员 ¥99
                </Text>
                <Text style={styles.memberPromoBenefits}>
                  ✓ 无限打包  ✓ 自带API Key  ✓ 优先排队
                </Text>
              </View>
              <View style={styles.memberPromoArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 菜单入口 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>更多服务</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuCard}
                onPress={() => item.screen && navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 帮助提示 */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>📖 新手引导</Text>
          <Text style={styles.helpText}>
            第一次使用？点击「AI生成」开始创建你的第一个应用！
          </Text>
          <View style={styles.helpSteps}>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>配置AI密钥</Text>
            </View>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>描述你的应用</Text>
            </View>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>一键打包下载</Text>
            </View>
          </View>
        </View>

        {/* 底部留白 */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    backgroundColor: '#667eea',
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  quotaCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  quotaItem: {
    flex: 1,
    alignItems: 'center',
  },
  quotaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 12,
    color: '#999',
  },
  quotaDivider: {
    width: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: (width - 50) / 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    width: '50%',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#999',
  },
  memberPromo: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  memberPromoContent: {
    backgroundColor: '#667eea',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberPromoLeft: {
    flex: 1,
  },
  memberPromoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  memberPromoDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  memberPromoBenefits: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  memberPromoArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#fff',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  helpCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  helpSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
  },
  stepText: {
    fontSize: 13,
    color: '#666',
  },
  bottomSpacer: {
    height: 100,
  },
});
