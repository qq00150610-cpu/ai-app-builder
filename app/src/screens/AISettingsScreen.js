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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { userAPI, aiAPI } from '../services/api';

export default function AISettingsScreen({ navigation }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [testing, setTesting] = useState(false);
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
    { 
      label: 'OpenAI', 
      value: 'openai', 
      endpoint: 'https://api.openai.com/v1', 
      model: 'gpt-4o-mini',
      help: '支持 GPT-4、GPT-3.5 等模型'
    },
    { 
      label: 'Claude', 
      value: 'claude', 
      endpoint: 'https://api.anthropic.com/v1', 
      model: 'claude-3-haiku-20240307',
      help: 'Anthropic 的 Claude 系列模型'
    },
    { 
      label: 'DeepSeek', 
      value: 'deepseek', 
      endpoint: 'https://api.deepseek.com/v1', 
      model: 'deepseek-chat',
      help: '深度求索的 DeepSeek 系列模型'
    },
    { 
      label: '通义千问', 
      value: 'qwen', 
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
      model: 'qwen-turbo',
      help: '阿里云的通义千问系列模型'
    },
    { 
      label: 'Ollama 本地', 
      value: 'ollama', 
      endpoint: 'http://localhost:11434/api', 
      model: 'llama2',
      help: '本地部署的大语言模型'
    },
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
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
        api_key: '', // 不显示已有key
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
    if (!form.api_key) {
      Alert.alert('提示', '请先输入 API Key');
      return;
    }

    setTesting(true);
    try {
      const res = await aiAPI.testConfig({
        model_type: form.model_type,
        api_endpoint: form.api_endpoint,
        api_key: form.api_key,
        model_name: form.model_name,
      });
      if (res.success) {
        Alert.alert('✅ 连接成功', res.data.response || '配置有效');
      }
    } catch (error) {
      Alert.alert('❌ 连接失败', error.message);
    }
    setTesting(false);
  };

  const saveConfig = async () => {
    if (!form.config_name) {
      Alert.alert('提示', '请输入配置名称');
      return;
    }
    if (!form.api_key && !editingConfig) {
      Alert.alert('提示', '请输入 API Key');
      return;
    }

    try {
      const data = { ...form };
      // 如果没有输入新key，保留原配置
      if (!data.api_key && editingConfig) {
        delete data.api_key;
      }
      
      if (editingConfig) {
        await userAPI.updateAIConfig(editingConfig.id, data);
      } else {
        await userAPI.addAIConfig(data);
      }
      setShowModal(false);
      loadConfigs();
      Alert.alert('成功', '配置已保存');
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

  const setAsDefault = async (config) => {
    try {
      await userAPI.updateAIConfig(config.id, {
        ...config,
        is_default: true,
      });
      loadConfigs();
      Alert.alert('成功', `已将 ${config.config_name} 设为默认`);
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const getModelHelp = (type) => {
    const model = modelTypes.find(m => m.value === type);
    return model?.help || '';
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
          <Text style={styles.sectionTitle}>💡 平台默认AI</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>免费使用</Text>
            <Text style={styles.infoText}>
              • 每日10次AI调用{'\n'}
              • 使用平台API Key{'\n'}
              • 无需配置即可使用
            </Text>
          </View>
        </View>

        {/* 自定义配置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔑 我的AI配置</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
              <Text style={styles.addButtonText}>+ 添加</Text>
            </TouchableOpacity>
          </View>
          
          {configs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无自定义配置</Text>
              <Text style={styles.emptySubtext}>添加你自己的 API Key 享受无限AI调用</Text>
            </View>
          ) : (
            configs.map((config) => (
              <View key={config.id} style={styles.configCard}>
                <View style={styles.configHeader}>
                  <View style={styles.configInfo}>
                    <Text style={styles.configName}>{config.config_name}</Text>
                    <View style={styles.configTags}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{config.model_type.toUpperCase()}</Text>
                      </View>
                      <View style={styles.modelTag}>
                        <Text style={styles.modelTagText}>{config.model_name}</Text>
                      </View>
                    </View>
                  </View>
                  {config.is_default === 1 && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>默认</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.configEndpoint} numberOfLines={1}>
                  {config.api_key || '••••••••••••'}
                </Text>
                
                <View style={styles.configActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => openModal(config)}
                  >
                    <Text style={styles.actionBtnText}>编辑</Text>
                  </TouchableOpacity>
                  {config.is_default !== 1 && (
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => setAsDefault(config)}
                    >
                      <Text style={styles.actionBtnText}>设为默认</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => deleteConfig(config.id)}
                  >
                    <Text style={styles.deleteBtnText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 使用说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 使用说明</Text>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>如何获取 API Key？</Text>
            <Text style={styles.helpText}>
              <Text style={styles.helpLink}>OpenAI:</Text> https://platform.openai.com/api-keys{'\n'}
              <Text style={styles.helpLink}>Claude:</Text> https://console.anthropic.com/settings/keys{'\n'}
              <Text style={styles.helpLink}>DeepSeek:</Text> https://platform.deepseek.com/api_keys{'\n'}
              <Text style={styles.helpLink}>通义千问:</Text> https://dashscope.console.aliyun.com/apiKey{'\n'}
            </Text>
          </View>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>关于 Ollama</Text>
            <Text style={styles.helpText}>
              Ollama 允许你在本地运行大语言模型。{'\n'}
              安装后访问 http://localhost:11434 即可使用。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingConfig ? '编辑配置' : '添加新配置'}
              </Text>

              <Text style={styles.label}>配置名称 *</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：我的OpenAI"
                value={form.config_name}
                onChangeText={(v) => setForm({ ...form, config_name: v })}
              />

              <Text style={styles.label}>选择模型平台 *</Text>
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
              {form.model_type && (
                <Text style={styles.helpHint}>{getModelHelp(form.model_type)}</Text>
              )}

              <Text style={styles.label}>API 地址</Text>
              <TextInput
                style={styles.input}
                placeholder="API 端点地址"
                value={form.api_endpoint}
                onChangeText={(v) => setForm({ ...form, api_endpoint: v })}
                autoCapitalize="none"
              />

              <Text style={styles.label}>API Key *</Text>
              <TextInput
                style={styles.input}
                placeholder={editingConfig ? "输入新Key以更新" : "请输入 API Key"}
                value={form.api_key}
                onChangeText={(v) => setForm({ ...form, api_key: v })}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.label}>模型名称</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：gpt-4o-mini"
                value={form.model_name}
                onChangeText={(v) => setForm({ ...form, model_name: v })}
              />

              <Text style={styles.label}>温度 (0-1)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.7"
                value={form.temperature}
                onChangeText={(v) => setForm({ ...form, temperature: v })}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>最大Token数</Text>
              <TextInput
                style={styles.input}
                placeholder="2048"
                value={form.max_tokens}
                onChangeText={(v) => setForm({ ...form, max_tokens: v })}
                keyboardType="number-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.testButton} 
                  onPress={testConnection}
                  disabled={testing}
                >
                  <Text style={styles.testButtonText}>
                    {testing ? '测试中...' : '测试连接'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={saveConfig}
                >
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>取消</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    marginBottom: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    padding: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#ccc',
  },
  configCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  configInfo: {
    flex: 1,
  },
  configName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  configTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  modelTag: {
    backgroundColor: '#e8f4ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  modelTagText: {
    fontSize: 11,
    color: '#007AFF',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  configEndpoint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10,
  },
  configActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 4,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  actionBtnText: {
    fontSize: 13,
    color: '#666',
  },
  deleteBtn: {
    backgroundColor: '#ffebeb',
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#996600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  helpLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  helpHint: {
    fontSize: 12,
    color: '#999',
    marginTop: -8,
    marginBottom: 12,
    fontStyle: 'italic',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  testButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#34C759',
    alignItems: 'center',
  },
  testButtonText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#999',
    fontSize: 15,
  },
});
