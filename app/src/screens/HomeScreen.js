import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../services/store';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();

  const features = [
    { icon: '🤖', title: 'AI生成', desc: '自然语言生成应用', screen: 'Editor', params: { mode: 'ai' } },
    { icon: '📝', title: '可视化编辑', desc: '拖拽式编辑器', screen: 'Editor', params: { mode: 'edit' } },
    { icon: '📦', title: '模板中心', desc: '快速创建应用', screen: 'Editor', params: { mode: 'template' } },
    { icon: '📥', title: '项目导入', desc: '上传现有项目', screen: 'Import' },
    { icon: '⚙️', title: 'AI配置', desc: '配置你的AI模型', screen: 'AISettings' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 欢迎区域 */}
      <View style={styles.header}>
        <Text style={styles.welcome}>你好，{user?.nickname || '开发者'}</Text>
        <Text style={styles.subtitle}>今天想创建什么应用？</Text>
      </View>

      {/* 快捷入口 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷入口</Text>
        <View style={styles.grid}>
          {features.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen, item.params)}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 会员提示 */}
      {user?.member_type === 0 && (
        <View style={styles.memberCard}>
          <View style={styles.memberContent}>
            <Text style={styles.memberTitle}>升级会员</Text>
            <Text style={styles.memberDesc}>¥9.9/年 无限打包</Text>
          </View>
          <TouchableOpacity
            style={styles.memberButton}
            onPress={() => navigation.navigate('Membership')}
          >
            <Text style={styles.memberButtonText}>立即开通</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 功能介绍 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>核心功能</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>手机端全流程</Text>
              <Text style={styles.featureDesc}>无需电脑，手机即可完成开发打包</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI辅助开发</Text>
              <Text style={styles.featureDesc}>自然语言描述，AI自动生成界面</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>☁️</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>云端编译</Text>
              <Text style={styles.featureDesc}>不占手机资源，一键生成APK</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📥</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>项目导入</Text>
              <Text style={styles.featureDesc}>支持导入现有项目，AI帮你查错优化</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  card: {
    width: '46%',
    margin: '2%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#999',
  },
  memberCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE58F',
  },
  memberContent: {
    flex: 1,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D48806',
    marginBottom: 4,
  },
  memberDesc: {
    fontSize: 14,
    color: '#AD8B00',
  },
  memberButton: {
    backgroundColor: '#FAAD14',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  memberButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  featureList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
  },
});
