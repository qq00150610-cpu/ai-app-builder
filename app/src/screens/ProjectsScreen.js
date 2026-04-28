import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { projectAPI } from '../services/api';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (pageNum = 1) => {
    try {
      const res = await projectAPI.getList(pageNum);
      if (res.success) {
        setProjects(pageNum === 1 ? res.data.list : [...projects, ...res.data.list]);
        setPage(pageNum);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
    setLoading(false);
  };

  const deleteProject = async (id) => {
    Alert.alert('确认删除', '确定要删除这个项目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await projectAPI.delete(id);
            setProjects(projects.filter((p) => p.id !== id));
          } catch (error) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('Editor', { projectId: item.id })}
      onLongPress={() => deleteProject(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.itemIcon, { backgroundColor: ['#667eea', '#f093fb', '#4facfe', '#43e97b'][index % 4] }]}>
          <Text style={styles.itemIconText}>📱</Text>
        </View>
        <View style={styles.itemStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>已保存</Text>
        </View>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name || '未命名项目'}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {item.description || '暂无描述'}
        </Text>
      </View>
      <View style={styles.itemFooter}>
        <Text style={styles.itemTime}>
          🕐 {new Date(item.updated_at || Date.now()).toLocaleDateString()}
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('Editor', { projectId: item.id })}
        >
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>我的项目</Text>
        <Text style={styles.projectCount}>{projects.length} 个项目</Text>
      </View>

      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadProjects(1)} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>📱</Text>
            </View>
            <Text style={styles.emptyTitle}>暂无项目</Text>
            <Text style={styles.emptyText}>点击下方按钮创建你的第一个应用</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Editor', { mode: 'ai' })}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>🚀 立即创建</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 悬浮创建按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Editor', { mode: 'ai' })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  projectCount: {
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconText: {
    fontSize: 22,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  itemContent: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  itemTime: {
    fontSize: 11,
    color: '#ccc',
  },
  editButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 85,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    marginTop: -2,
  },
});
