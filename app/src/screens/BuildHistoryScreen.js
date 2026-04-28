import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { buildAPI } from '../services/api';

export default function BuildHistoryScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await buildAPI.getHistory();
      if (res.success) {
        setTasks(res.data);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
    setLoading(false);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      0: { text: '排队中', color: '#999', bg: '#F5F5F5', icon: '⏳' },
      1: { text: '编译中', color: '#007AFF', bg: '#E3F2FD', icon: '⚙️' },
      2: { text: '成功', color: '#34C759', bg: '#E8F5E9', icon: '✅' },
      3: { text: '失败', color: '#FF3B30', bg: '#FFEBEE', icon: '❌' },
      4: { text: '已取消', color: '#999', bg: '#F5F5F5', icon: '🚫' },
    };
    return statusMap[status] || { text: '未知', color: '#999', bg: '#F5F5F5', icon: '❓' };
  };

  const downloadAPK = async (taskId) => {
    try {
      const res = await buildAPI.download(taskId);
      if (res.success && res.data.download_url) {
        Linking.openURL(res.data.download_url);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const refreshStatus = async (taskId) => {
    try {
      const res = await buildAPI.getStatus(taskId);
      if (res.success) {
        setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.projectInfo}>
            <View style={[styles.projectIcon, { backgroundColor: statusInfo.bg }]}>
              <Text style={styles.projectIconText}>{statusInfo.icon}</Text>
            </View>
            <View>
              <Text style={styles.projectName}>{item.project_name || '未知项目'}</Text>
              <Text style={styles.buildId}>构建ID: {item.id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        {item.status === 2 && item.apk_url && (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={() => downloadAPK(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.downloadIcon}>📥</Text>
            <Text style={styles.downloadText}>下载APK</Text>
          </TouchableOpacity>
        )}

        {item.status === 3 && item.error_msg && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❗ 错误信息</Text>
            <Text style={styles.errorMsg}>{item.error_msg}</Text>
          </View>
        )}

        {(item.status === 0 || item.status === 1) && (
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => refreshStatus(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshIcon}>🔄</Text>
            <Text style={styles.refreshText}>刷新状态</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 统计数据
  const stats = {
    total: tasks.length,
    success: tasks.filter(t => t.status === 2).length,
    failed: tasks.filter(t => t.status === 3).length,
  };

  return (
    <View style={styles.container}>
      {/* 统计卡片 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>总构建</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{stats.success}</Text>
          <Text style={styles.statLabel}>成功</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>{stats.failed}</Text>
          <Text style={styles.statLabel}>失败</Text>
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTasks} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>暂无构建记录</Text>
            <Text style={styles.emptyText}>去创建应用并打包吧！</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#f0f0f0',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectIconText: {
    fontSize: 22,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  buildId: {
    fontSize: 12,
    color: '#ccc',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#999',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  refreshText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 6,
  },
  errorMsg: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
