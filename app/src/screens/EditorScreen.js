import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { aiAPI, buildAPI, projectAPI } from '../services/api';
import { useProjectStore } from '../services/store';

export default function EditorScreen({ route, navigation }) {
  const { mode = 'edit', projectId } = route.params || {};
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectConfig, setProjectConfig] = useState(null);
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [buildStatus, setBuildStatus] = useState(null);

  // AI生成页面
  const generateWithAI = async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请描述你想要的应用');
      return;
    }

    setLoading(true);
    try {
      const res = await aiAPI.generatePage(prompt);
      if (res.success) {
        setProjectConfig(res.data);
        Alert.alert('成功', '页面生成成功，可以继续编辑或打包');
      }
    } catch (error) {
      Alert.alert('错误', error.message || '生成失败');
    }
    setLoading(false);
  };

  // 提交构建
  const submitBuild = async () => {
    if (!projectConfig) {
      Alert.alert('提示', '请先生成或配置项目');
      return;
    }
    if (!appName.trim()) {
      Alert.alert('提示', '请输入应用名称');
      return;
    }

    setLoading(true);
    try {
      // 先保存项目
      let projId = projectId;
      if (!projId) {
        const createRes = await projectAPI.create({
          name: appName,
          config: projectConfig,
        });
        projId = createRes.data.id;
      } else {
        await projectAPI.update(projectId, {
          name: appName,
          config: projectConfig,
        });
      }

      // 提交构建
      const buildRes = await buildAPI.submit({
        project_id: projId,
        app_name: appName,
        package_name: packageName || 'com.aiapp.builder',
      });

      if (buildRes.success) {
        Alert.alert('成功', '构建任务已提交，请到构建记录查看进度');
        navigation.navigate('BuildHistory');
      }
    } catch (error) {
      Alert.alert('错误', error.message || '提交失败');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* AI生成区域 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI生成</Text>
        <TextInput
          style={styles.textArea}
          placeholder="描述你想要的应用，例如：一个展示公司产品列表的应用，包含产品图片、名称和价格"
          multiline
          numberOfLines={4}
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generateWithAI}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>生成页面</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 配置区域 */}
      {projectConfig && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用配置</Text>
          <TextInput
            style={styles.input}
            placeholder="应用名称"
            value={appName}
            onChangeText={setAppName}
          />
          <TextInput
            style={styles.input}
            placeholder="包名（可选）"
            value={packageName}
            onChangeText={setPackageName}
          />
          
          {/* 简化的配置预览 */}
          <View style={styles.configPreview}>
            <Text style={styles.configTitle}>生成的配置：</Text>
            <Text style={styles.configText}>
              {JSON.stringify(projectConfig, null, 2).substring(0, 200)}...
            </Text>
          </View>
        </View>
      )}

      {/* 打包按钮 */}
      {projectConfig && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.buildButton, loading && styles.buttonDisabled]}
            onPress={submitBuild}
            disabled={loading}
          >
            <Text style={styles.buildButtonText}>打包APK</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  configPreview: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  configText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  buildButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
