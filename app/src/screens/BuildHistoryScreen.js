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

  const getStatusText = (status) => {
    const statusMap = {
      0: '排队中',
      1: '编译中',
      2: '成功',
      3: '失败',
      4: '已取消',
    };
    return statusMap[status] || '未知';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: '#999',
      1: '#007AFF',
      2: '#34C759',
      3: '#FF3B30',
      4: '#999',
    };
    return colorMap[status] || '#999';
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

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.projectName}>{item.project_name || '未知项目'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.time}>
        {new Date(item.created_at).toLocaleString()}
      </Text>

      {item.status === 2 && item.apk_url && (
        <TouchableOpacity style={styles.downloadButton} onPress={() => downloadAPK(item.id)}>
          <Text style={styles.downloadButtonText}>下载APK</Text>
        </TouchableOpacity>
      )}

      {item.status === 3 && item.error_msg && (
        <Text style={styles.errorMsg}>错误: {item.error_msg}</Text>
      )}

      {(item.status === 0 || item.status === 1) && (
        <TouchableOpacity style={styles.refreshButton} onPress={() => refreshStatus(item.id)}>
          <Text style={styles.refreshButtonText}>刷新状态</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTasks} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无构建记录</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
  time: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#666',
    fontSize: 14,
  },
  errorMsg: {
    fontSize: 13,
    color: '#FF3B30',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
