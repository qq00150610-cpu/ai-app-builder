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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Editor', { projectId: item.id })}
      onLongPress={() => deleteProject(item.id)}
    >
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>📱</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name || '未命名项目'}</Text>
        <Text style={styles.itemDesc}>{item.description || '暂无描述'}</Text>
        <Text style={styles.itemTime}>
          更新于 {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.itemArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadProjects(1)} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无项目</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Editor')}
            >
              <Text style={styles.createButtonText}>创建第一个项目</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Editor')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 12,
    color: '#ccc',
  },
  itemArrow: {
    fontSize: 24,
    color: '#ccc',
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
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    marginTop: -2,
  },
});
