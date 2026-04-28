import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { paymentAPI } from '../services/api';
import { useUserStore } from '../services/store';

export default function MembershipScreen() {
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();

  const packages = [
    {
      id: 1,
      name: '年度会员',
      price: 9.9,
      period: '年',
      originalPrice: 99,
      features: [
        '✅ 无限打包次数',
        '✅ 全部模板使用',
        '✅ 优先编译队列',
        '✅ AI不限次数使用',
        '✅ 专属技术支持',
      ],
      highlight: false,
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 2,
      name: '永久会员',
      price: 99,
      period: '永久',
      originalPrice: 999,
      features: [
        '✅ 永久会员权益',
        '✅ 优先客服响应',
        '✅ 新功能抢先体验',
        '✅ 年度会员全部权益',
        '✅ 专属API额度',
      ],
      highlight: true,
      gradient: ['#f093fb', '#f5576c'],
    },
  ];

  const purchase = async (packageId) => {
    Alert.alert('选择支付方式', '', [
      {
        text: '微信支付',
        onPress: () => createOrder(packageId, 'wechat'),
      },
      {
        text: '支付宝',
        onPress: () => createOrder(packageId, 'alipay'),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const createOrder = async (packageId, payMethod) => {
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder(packageId, payMethod);
      if (res.success) {
        const msg = '订单创建成功\n订单号: ' + res.data.order_no + '\n金额: ¥' + res.data.amount;
        Alert.alert('成功', msg);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
    setLoading(false);
  };

  const getMemberStatus = () => {
    if (user?.member_type === 2) return { text: '永久会员', color: '#FFD700', icon: '👑' };
    if (user?.member_type === 1) return { text: '年度会员', color: '#667eea', icon: '💎' };
    return { text: '免费用户', color: '#999', icon: '🆓' };
  };

  const memberStatus = getMemberStatus();

  const benefits = [
    { icon: '🚀', title: '极速打包', desc: '优先编译队列' },
    { icon: '🤖', title: 'AI无限', desc: '不限次数使用' },
    { icon: '📱', title: '全模板', desc: '解锁全部模板' },
    { icon: '🎯', title: '专属客服', desc: '24小时响应' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 当前状态卡片 */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{memberStatus.icon}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>当前会员状态</Text>
            <Text style={[styles.statusText, { color: memberStatus.color }]}>
              {memberStatus.text}
            </Text>
          </View>
        </View>
        {user?.member_expire_at && user.member_type === 1 && (
          <View style={styles.expireInfo}>
            <Text style={styles.expireLabel}>会员到期时间</Text>
            <Text style={styles.expireDate}>
              {new Date(user.member_expire_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* 会员特权 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>会员专属特权</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((item, index) => (
            <View key={index} style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>{item.icon}</Text>
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 套餐选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择套餐</Text>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[styles.packageCard, pkg.highlight && styles.packageHighlight]}
            onPress={() => purchase(pkg.id)}
            activeOpacity={0.9}
          >
            {pkg.highlight && (
              <View style={styles.recommendBadge}>
                <Text style={styles.recommendText}>推荐</Text>
              </View>
            )}
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceSymbol}>¥</Text>
                <Text style={styles.priceNumber}>{pkg.price}</Text>
                <Text style={styles.pricePeriod}>/{pkg.period}</Text>
              </View>
              <Text style={styles.originalPrice}>
                原价 ¥{pkg.originalPrice}
              </Text>
            </View>
            <View style={styles.features}>
              {pkg.features.map((feature, index) => (
                <Text key={index} style={styles.featureItem}>
                  {feature}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: pkg.gradient[0] }]}
              onPress={() => purchase(pkg.id)}
            >
              <Text style={styles.buyButtonText}>立即开通</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* 常见问题 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>常见问题</Text>
        <View style={styles.faqCard}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>Q: 会员权益何时生效？</Text>
            <Text style={styles.faqA}>A: 支付成功后，权益将立即生效。</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>Q: 可以开具发票吗？</Text>
            <Text style={styles.faqA}>A: 可以，联系客服获取发票。</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>Q: 如何取消自动续费？</Text>
            <Text style={styles.faqA}>A: 在会员中心可随时取消。</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size=large color=#667eea />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  statusCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  expireInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expireLabel: {
    fontSize: 14,
    color: '#666',
  },
  expireDate: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#999',
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  packageHighlight: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  recommendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  packageHeader: {
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 20,
    color: '#FF6B00',
    fontWeight: '600',
  },
  priceNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#ccc',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  buyButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  faqA: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
