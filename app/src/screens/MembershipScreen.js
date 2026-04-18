import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
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
      features: ['无限打包', '全部模板', '优先编译队列', 'AI不限次数'],
      highlight: false,
    },
    {
      id: 2,
      name: '永久会员',
      price: 99,
      period: '永久',
      features: ['永久权益', '优先客服', '新功能抢先体验', '所有年度权益'],
      highlight: true,
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
        // TODO: 调起支付
        Alert.alert('订单创建成功', `订单号: ${res.data.order_no}\n金额: ¥${res.data.amount}`);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* 当前状态 */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>当前会员状态</Text>
        <Text style={styles.statusText}>
          {user?.member_type === 2
            ? '永久会员'
            : user?.member_type === 1
            ? '年度会员'
            : '免费用户'}
        </Text>
        {user?.member_expire_at && user.member_type === 1 && (
          <Text style={styles.expireText}>
            有效期至 {new Date(user.member_expire_at).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* 套餐选择 */}
      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          style={[styles.packageCard, pkg.highlight && styles.packageHighlight]}
          onPress={() => purchase(pkg.id)}
        >
          {pkg.highlight && <View style={styles.recommendBadge} />}
          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>¥</Text>
              <Text style={styles.priceNumber}>{pkg.price}</Text>
              <Text style={styles.pricePeriod}>/{pkg.period}</Text>
            </View>
          </View>
          <View style={styles.features}>
            {pkg.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                ✓ {feature}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => purchase(pkg.id)}
          >
            <Text style={styles.buyButtonText}>立即开通</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  expireText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 4,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  packageHighlight: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  recommendBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
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
    fontSize: 18,
    color: '#FF6B00',
    fontWeight: '600',
  },
  priceNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  buyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
