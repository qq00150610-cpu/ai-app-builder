import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { userAPI, aiAPI } from '../services/api';

export default function AISettingsScreen() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form, setForm] = useState({
    config_name: '',
    model_type: 'openai',
    api_endpoint: '',
    api_key: '',
    model_name: '',
    temperature: '0.7',
    max_tokens: '2048',
  });

  const modelTypes = [
    { label: 'OpenAI', value: 'openai', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    { label: 'Claude', value: 'claude', endpoint: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
    { label: 'DeepSeek', value: 'deepseek', endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { label: '通义千问', value: 'qwen', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
    { label: 'Ollama (本地)', value: 'ollama', endpoint: 'http://localhost:11434/api', model: 'llama2' },
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await userAPI.getAIConfigs();
      if (res.success) {
        setConfigs(res.data);
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
    setLoading(false);
  };

  const openModal = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setForm({
        config_name: config.config_name,
        model_type: config.model_type,
        api_endpoint: config.api_endpoint || '',
        api_key: '',
        model_name: config.model_name,
        temperature: String(config.temperature || 0.7),
        max_tokens: String(config.max_tokens || 2048),
      });
    } else {
      setEditingConfig(null);
      setForm({
        config_name: '',
        model_type: 'openai',
        api_endpoint: 'https://api.openai.com/v1',
        api_key: '',
        model_name: 'gpt-4o-mini',
        temperature: '0.7',
        max_tokens: '2048',
      });
    }
    setShowModal(true);
  };

  const selectModelType = (type) => {
    const modelInfo = modelTypes.find((m) => m.value === type);
    setForm({
      ...form,
      model_type: type,
      api_endpoint: modelInfo?.endpoint || '',
      model_name: modelInfo?.model || '',
    });
  };

  const testConnection = async () => {
    try {
      const res = await aiAPI.testConfig({
        model_type: form.model_type,
        api_endpoint: form.api_endpoint,
        api_key: form.api_key,
        model_name: form.model_name,
      });
      if (res.success) {
        Alert.alert('成功', '配置有效');
      }
    } catch (error) {
      Alert.alert('测试失败', error.message);
    }
  };

  const saveConfig = async () => {
    if (!form.config_name || !form.api_key) {
      Alert.alert('提示', '请填写配置名称和API Key');
      return;
    }

    try {
      if (editingConfig) {
        await userAPI.updateAIConfig(editingConfig.id, form);
      } else {
        await userAPI.addAIConfig(form);
      }
      setShowModal(false);
      loadConfigs();
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const deleteConfig = async (id) => {
    Alert.alert('确认删除', '确定要删除这个配置吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await userAPI.deleteAIConfig(id);
            loadConfigs();
          } catch (error) {
            Alert.alert('错误', error.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 平台默认 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>平台默认AI</Text>
          <View style={styles.configItem}>
            <Text style={styles.configName}>平台AI服务</Text>
            <Text style={styles.configDesc}>免费用户每日10次，会员不限</Text>
          </View>
        </View>

        {/* 自定义配置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自定义AI配置</Text>
          {configs.map((config) => (
            <TouchableOpacity
              key={config.id}
              style={styles.configItem}
              onPress={() => openModal(config)}
              onLongPress={() => deleteConfig(config.id)}
            >
              <Text style={styles.configName}>{config.config_name}</Text>
              <Text style={styles.configDesc}>
                {config.model_type} - {config.model_name}
              </Text>
              {config.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>默认</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Text style={styles.addButtonText}>+ 添加AI配置</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingConfig ? '编辑配置' : '添加配置'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="配置名称"
              value={form.config_name}
              onChangeText={(v) => setForm({ ...form, config_name: v })}
            />

            <Text style={styles.label}>模型类型</Text>
            <View style={styles.typeGrid}>
              {modelTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    form.model_type === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => selectModelType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      form.model_type === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="API地址"
              value={form.api_endpoint}
              onChangeText={(v) => setForm({ ...form, api_endpoint: v })}
            />

            <TextInput
              style={styles.input}
              placeholder="API Key"
              secureTextEntry
              value={form.api_key}
              onChangeText={(v) => setForm({ ...form, api_key: v })}
            />

            <TextInput
              style={styles.input}
              placeholder="模型名称"
              value={form.model_name}
              onChangeText={(v) => setForm({ ...form, model_name: v })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.testButton} onPress={testConnection}>
                <Text style={styles.testButtonText}>测试连接</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  configItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  configName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  configDesc: {
    fontSize: 13,
    color: '#999',
  },
  defaultBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: '#fff',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  testButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginRight: 8,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#999',
    fontSize: 15,
  },
});
