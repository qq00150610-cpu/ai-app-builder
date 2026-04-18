import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadAPI } from '../services/uploadApi';
import { buildAPI } from '../services/api';

export default function ImportScreen({ route, navigation }) {
  const [step, setStep] = useState(1); // 1: 上传, 2: 分析, 3: AI查错, 4: 构建方式选择
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);
  const [buildMode, setBuildMode] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [showFileTree, setShowFileTree] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState({});

  // 步骤1: 选择并上传文件
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadFile(file);
      }
    } catch (error) {
      Alert.alert('错误', '选择文件失败: ' + error.message);
    }
  };

  const uploadFile = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      const response = await uploadAPI.uploadProject(formData);
      
      if (response.success) {
        setUploadResult(response.data);
        setStep(2);
        
        // 自动分析项目
        await analyzeProject(response.data.upload_id);
      } else {
        Alert.alert('上传失败', response.message);
      }
    } catch (error) {
      Alert.alert('上传失败', error.message || '网络错误');
    }
    setLoading(false);
  };

  // 步骤2: 分析项目
  const analyzeProject = async (uploadId) => {
    setLoading(true);
    try {
      const response = await uploadAPI.analyzeProject({
        upload_id: uploadId,
        project_name: projectName,
        description: projectDesc,
      });

      if (response.success) {
        setAnalysisResult(response.data);
      }
    } catch (error) {
      console.error('分析失败:', error);
    }
    setLoading(false);
  };

  // 步骤3: AI查错
  const runAICheck = async () => {
    if (!uploadResult) return;
    
    setLoading(true);
    try {
      const response = await uploadAPI.checkErrors({
        upload_id: uploadResult.upload_id,
        project_type: analysisResult?.project_type || 'unknown',
      });

      if (response.success) {
        setErrorResult(response.data);
        setStep(3);
      }
    } catch (error) {
      Alert.alert('查错失败', error.message || 'AI服务暂时不可用');
    }
    setLoading(false);
  };

  // 步骤4: 选择构建方式并执行
  const handleBuild = async (mode) => {
    if (!projectName.trim()) {
      Alert.alert('提示', '请输入项目名称');
      return;
    }

    setBuildMode(mode);
    setLoading(true);

    try {
      // 创建项目
      const createResponse = await uploadAPI.createProject({
        upload_id: uploadResult.upload_id,
        name: projectName,
        description: projectDesc,
        config: {
          build_mode: mode,
          project_type: analysisResult?.project_type,
        },
      });

      if (createResponse.success) {
        const projectId = createResponse.data.id;

        // 根据构建方式处理
        if (mode === 'direct') {
          // 直接构建
          await submitBuild(projectId);
        } else if (mode === 'ai_optimize') {
          // AI优化后构建 - 先记录优化需求
          Alert.alert('提示', 'AI优化功能开发中，将直接进行构建');
          await submitBuild(projectId);
        } else if (mode === 'ai_fix') {
          // AI修复后构建
          if (errorResult && errorResult.errors?.length > 0) {
            // 获取修复建议
            const fixResponse = await uploadAPI.fixErrors({
              upload_id: uploadResult.upload_id,
              error_ids: errorResult.errors.map((e) => e.id || 0),
              project_type: analysisResult?.project_type,
            });
            
            if (fixResponse.success) {
              Alert.alert('修复建议已生成', '请根据建议手动修复后继续构建');
            }
          }
          await submitBuild(projectId);
        }
      }
    } catch (error) {
      Alert.alert('创建项目失败', error.message);
    }
    
    setLoading(false);
  };

  // 提交构建
  const submitBuild = async (projectId) => {
    try {
      const buildResponse = await buildAPI.submit({
        project_id: projectId,
        app_name: projectName,
        package_name: 'com.aiapp.builder',
      });

      if (buildResponse.success) {
        Alert.alert('成功', '构建任务已提交，请到构建记录查看进度');
        navigation.navigate('BuildHistory');
      }
    } catch (error) {
      Alert.alert('构建失败', error.message);
    }
  };

  // 渲染文件树
  const renderFileTree = (items, depth = 0) => {
    return items.map((item, index) => {
      if (item.type === 'more') {
        return (
          <Text key={index} style={[styles.fileItem, { marginLeft: depth * 16 }]}>
            📁 {item.name}
          </Text>
        );
      }

      if (item.type === 'directory') {
        const isExpanded = expandedDirs[item.path];
        return (
          <View key={index}>
            <TouchableOpacity
              style={[styles.fileItem, { marginLeft: depth * 16 }]}
              onPress={() => setExpandedDirs({
                ...expandedDirs,
                [item.path]: !isExpanded,
              })}
            >
              <Text style={styles.dirIcon}>{isExpanded ? '📂' : '📁'}</Text>
              <Text style={styles.fileName}>{item.name}</Text>
            </TouchableOpacity>
            {isExpanded && item.children && renderFileTree(item.children, depth + 1)}
          </View>
        );
      }

      return (
        <View key={index} style={[styles.fileItem, { marginLeft: depth * 16 }]}>
          <Text style={styles.fileIcon}>
            {getFileIcon(item.extension)}
          </Text>
          <Text style={styles.fileName}>{item.name}</Text>
          {item.isCode && <Text style={styles.codeTag}>代码</Text>}
        </View>
      );
    });
  };

  const getFileIcon = (ext) => {
    const icons = {
      '.js': '📜', '.jsx': '⚛️', '.ts': '📘', '.tsx': '⚛️',
      '.json': '📋', '.xml': '📰', '.yaml': '📝', '.yml': '📝',
      '.html': '🌐', '.css': '🎨', '.md': '📖',
      '.java': '☕', '.kt': '🟉', '.swift': '🍎',
      '.py': '🐍', '.go': '🐹', '.rs': '🦀',
      '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️',
      '.svg': '🖼️', '.zip': '📦',
    };
    return icons[ext] || '📄';
  };

  // 渲染分析结果
  const renderAnalysis = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>项目分析结果</Text>
        
        <View style={styles.analysisRow}>
          <Text style={styles.analysisLabel}>项目类型:</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tag}>{analysisResult.project_type}</Text>
            <Text style={styles.tag}>{analysisResult.language}</Text>
          </View>
        </View>

        {analysisResult.frameworks?.length > 0 && (
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>框架:</Text>
            <View style={styles.tagContainer}>
              {analysisResult.frameworks.map((fw, i) => (
                <Text key={i} style={styles.tag}>{fw}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.analysisRow}>
          <Text style={styles.analysisLabel}>项目特性:</Text>
        </View>
        <View style={styles.featureList}>
          {analysisResult.has_readme && <Text style={styles.feature}>📖 README</Text>}
          {analysisResult.has_git && <Text style={styles.feature}>📚 Git仓库</Text>}
          {analysisResult.package_json && <Text style={styles.feature}>📦 package.json</Text>}
          {analysisResult.requirements && <Text style={styles.feature}>🐍 requirements.txt</Text>}
          {analysisResult.pom && <Text style={styles.feature}>☕ Maven项目</Text>}
          {analysisResult.build_gradle && <Text style={styles.feature}>🤖 Gradle项目</Text>}
        </View>
      </View>
    );
  };

  // 渲染AI查错结果
  const renderErrorResult = () => {
    if (!errorResult) return null;

    const hasIssues = errorResult.errors?.length > 0 || errorResult.warnings?.length > 0;

    return (
      <View style={styles.errorCard}>
        <Text style={styles.analysisTitle}>AI代码审查结果</Text>
        
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {errorResult.summary || '审查完成'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.errorBox]}>
            <Text style={styles.statNum}>{errorResult.errors?.length || 0}</Text>
            <Text style={styles.statLabel}>错误</Text>
          </View>
          <View style={[styles.statBox, styles.warningBox]}>
            <Text style={styles.statNum}>{errorResult.warnings?.length || 0}</Text>
            <Text style={styles.statLabel}>警告</Text>
          </View>
          <View style={[styles.statBox, styles.suggestBox]}>
            <Text style={styles.statNum}>{errorResult.suggestions?.length || 0}</Text>
            <Text style={styles.statLabel}>建议</Text>
          </View>
        </View>

        {errorResult.errors?.map((err, i) => (
          <View key={i} style={styles.errorItem}>
            <Text style={styles.errorIcon}>❌</Text>
            <View style={styles.errorContent}>
              <Text style={styles.errorFile}>{err.file}</Text>
              <Text style={styles.errorMsg}>{err.message}</Text>
              {err.suggestion && (
                <Text style={styles.errorSuggestion}>💡 {err.suggestion}</Text>
              )}
            </View>
          </View>
        ))}

        {errorResult.warnings?.map((warn, i) => (
          <View key={i} style={styles.warningItem}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.errorContent}>
              <Text style={styles.errorFile}>{warn.file || '通用'}</Text>
              <Text style={styles.errorMsg}>{warn.message}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 步骤指示器 */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              step >= s && styles.stepActive,
            ]}>
              <Text style={styles.stepNum}>{s}</Text>
            </View>
            <Text style={[styles.stepText, step >= s && styles.stepTextActive]}>
              {['上传', '分析', '查错', '构建'][s - 1]}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* 步骤1: 上传区域 */}
        {step === 1 && (
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadBox} onPress={pickFile}>
              {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📦</Text>
                  <Text style={styles.uploadTitle}>点击上传项目文件</Text>
                  <Text style={styles.uploadHint}>
                    支持 .zip 压缩包或项目文件夹
                  </Text>
                  <Text style={styles.uploadHint}>
                    最大支持 100MB
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 步骤2: 分析结果 */}
        {step >= 2 && uploadResult && (
          <View style={styles.resultSection}>
            {/* 上传成功提示 */}
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <View style={styles.successContent}>
                <Text style={styles.successTitle}>上传成功</Text>
                <Text style={styles.successText}>
                  {uploadResult.original_name} ({(uploadResult.file_size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              </View>
            </View>

            {/* 查看文件树按钮 */}
            {uploadResult.file_tree && (
              <TouchableOpacity
                style={styles.treeButton}
                onPress={() => setShowFileTree(true)}
              >
                <Text style={styles.treeButtonText}>📂 查看项目文件结构</Text>
              </TouchableOpacity>
            )}

            {/* 分析结果 */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>正在分析项目...</Text>
              </View>
            ) : (
              renderAnalysis()
            )}
          </View>
        )}

        {/* 步骤3: AI查错 */}
        {step >= 3 && (
          <View style={styles.errorSection}>
            {loading && step === 3 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>正在进行AI代码审查...</Text>
              </View>
            ) : (
              renderErrorResult()
            )}
          </View>
        )}

        {/* 步骤4: 构建方式选择 */}
        {step >= 4 && (
          <View style={styles.buildSection}>
            <Text style={styles.sectionTitle}>选择构建方式</Text>

            {/* 项目名称 */}
            <TextInput
              style={styles.input}
              placeholder="项目名称"
              value={projectName}
              onChangeText={setProjectName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="项目描述（可选）"
              multiline
              numberOfLines={2}
              value={projectDesc}
              onChangeText={setProjectDesc}
            />

            {/* 构建选项 */}
            <TouchableOpacity
              style={[styles.buildOption, buildMode === 'direct' && styles.buildOptionActive]}
              onPress={() => setBuildMode('direct')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionIcon}>🚀</Text>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>直接构建</Text>
                  <Text style={styles.optionDesc}>跳过AI分析，直接打包应用</Text>
                </View>
                {buildMode === 'direct' && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buildOption, buildMode === 'ai_optimize' && styles.buildOptionActive]}
              onPress={() => setBuildMode('ai_optimize')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionIcon}>✨</Text>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>AI优化后构建</Text>
                  <Text style={styles.optionDesc}>AI优化代码结构和性能后再构建</Text>
                </View>
                {buildMode === 'ai_optimize' && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buildOption, buildMode === 'ai_fix' && styles.buildOptionActive]}
              onPress={() => setBuildMode('ai_fix')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionIcon}>🔧</Text>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>AI查错修复后构建</Text>
                  <Text style={styles.optionDesc}>修复发现的问题后再构建</Text>
                </View>
                {buildMode === 'ai_fix' && <Text style={styles.checkmark}>✓</Text>}
              </View>
              {errorResult?.errors?.length > 0 && (
                <Text style={styles.errorCount}>
                  发现 {errorResult.errors.length} 个问题待修复
                </Text>
              )}
            </TouchableOpacity>

            {/* 重新查错按钮 */}
            <TouchableOpacity
              style={styles.recheckButton}
              onPress={runAICheck}
            >
              <Text style={styles.recheckText}>🔄 重新AI查错</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 底部操作按钮 */}
      {step >= 4 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.buildButton, (!buildMode || !projectName) && styles.buttonDisabled]}
            onPress={() => handleBuild(buildMode)}
            disabled={!buildMode || !projectName || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buildButtonText}>开始构建</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 文件树弹窗 */}
      <Modal visible={showFileTree} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>项目文件结构</Text>
              <TouchableOpacity onPress={() => setShowFileTree(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.fileTreeContainer}>
              {uploadResult?.file_tree && renderFileTree(uploadResult.file_tree)}
            </ScrollView>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: '#007AFF',
  },
  stepNum: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 12,
    color: '#999',
  },
  stepTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  uploadSection: {
    padding: 16,
  },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  resultSection: {
    padding: 16,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1890FF',
  },
  successText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  treeButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  treeButtonText: {
    fontSize: 15,
    color: '#007AFF',
    textAlign: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  analysisRow: {
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E6F7FF',
    color: '#1890FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 13,
    marginRight: 8,
    marginBottom: 4,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feature: {
    fontSize: 13,
    color: '#666',
    marginRight: 16,
    marginBottom: 8,
  },
  errorSection: {
    padding: 16,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryBox: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  errorBox: {
    backgroundColor: '#FFF1F0',
  },
  warningBox: {
    backgroundColor: '#FFFBE6',
  },
  suggestBox: {
    backgroundColor: '#F6FFED',
  },
  statNum: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFBE6',
    borderRadius: 8,
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorFile: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  errorMsg: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  errorSuggestion: {
    fontSize: 12,
    color: '#1890FF',
    marginTop: 4,
  },
  buildSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buildOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#eee',
  },
  buildOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  errorCount: {
    fontSize: 13,
    color: '#FF4D4F',
    marginTop: 8,
    marginLeft: 40,
  },
  recheckButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  recheckText: {
    fontSize: 15,
    color: '#666',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  buildButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  fileTreeContainer: {
    padding: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dirIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  fileIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
  },
  codeTag: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#1890FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
});
