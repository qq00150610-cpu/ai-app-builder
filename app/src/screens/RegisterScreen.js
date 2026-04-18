import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authAPI } from '../services/api';
import { useUserStore } from '../services/store';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 验证邮箱
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { setToken, setUser } = useUserStore();

  // 验证基本信息
  const validateBasicInfo = () => {
    if (!username.trim()) {
      Alert.alert('提示', '请输入用户名');
      return false;
    }
    if (username.length < 2 || username.length > 20) {
      Alert.alert('提示', '用户名长度需在2-20个字符之间');
      return false;
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      Alert.alert('提示', '用户名只能包含字母、数字、下划线和中文');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('提示', '请输入正确的邮箱格式');
      return false;
    }
    if (!password) {
      Alert.alert('提示', '请输入密码');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码长度不能少于6位');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return false;
    }
    return true;
  };

  // 发送验证码
  const sendCode = async () => {
    if (!validateBasicInfo()) return;

    setLoading(true);
    try {
      const res = await authAPI.register({ username, email, password });
      if (res.success || res.dev_code) {
        // 开发环境显示验证码
        if (res.dev_code) {
          Alert.alert('开发模式', `验证码: ${res.dev_code}`);
        }
        setStep(2);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    } catch (error) {
      Alert.alert('错误', error.message || '发送验证码失败');
    }
    setLoading(false);
  };

  // 完成注册
  const completeRegister = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyRegister(email, code);
      if (res.success) {
        // 自动登录
        if (res.data) {
          setToken(res.data.token);
          setUser(res.data.user);
        } else {
          // 如果没有返回登录信息，跳转到登录页
          Alert.alert('注册成功', '请使用邮箱和密码登录', [
            { text: '确定', onPress: () => navigation.navigate('Login') }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('错误', error.message || '注册失败');
    }
    setLoading(false);
  };

  // 重新发送验证码
  const resendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const res = await authAPI.resendCode(email);
      if (res.success || res.dev_code) {
        if (res.dev_code) {
          Alert.alert('开发模式', `验证码: ${res.dev_code}`);
        }
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    } catch (error) {
      Alert.alert('错误', error.message || '发送失败');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>注册账号</Text>
          <Text style={styles.subtitle}>加入AI应用开发平台</Text>

          {step === 1 ? (
            // 基本信息填写
            <>
              <TextInput
                style={styles.input}
                placeholder="用户名（2-20字符）"
                value={username}
                onChangeText={setUsername}
                maxLength={20}
              />
              <TextInput
                style={styles.input}
                placeholder="邮箱地址"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="密码（至少6位）"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="确认密码"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={sendCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '处理中...' : '发送验证邮件'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // 邮箱验证
            <>
              <View style={styles.emailHeader}>
                <Text style={styles.emailLabel}>验证码已发送至</Text>
                <Text style={styles.emailValue}>{email}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="请输入6位验证码"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={completeRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '注册中...' : '完成注册'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resend}
                onPress={resendCode}
                disabled={countdown > 0 || loading}
              >
                <Text style={countdown > 0 ? styles.resendDisabled : styles.resendText}>
                  {countdown > 0 ? `${countdown}秒后重发` : '重新发送验证码'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backText}>修改注册信息</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 登录链接 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>已有账号？</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#999',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emailHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  emailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  resend: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
  },
  resendDisabled: {
    color: '#ccc',
    fontSize: 14,
  },
  backBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
