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

export default function LoginScreen({ navigation }) {
  const [loginMethod, setLoginMethod] = useState('phone'); // phone | email
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // phone | code
  const [countdown, setCountdown] = useState(0);
  
  // 邮箱登录
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useUserStore();

  // 发送验证码
  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.sendCode(phone);
      if (res.success || res.dev_code) {
        // 开发环境显示验证码
        if (res.dev_code) {
          Alert.alert('开发模式', `验证码: ${res.dev_code}`);
        }
        setStep('code');
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

  // 手机号登录
  const phoneLogin = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(phone, code);
      if (res.success) {
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (error) {
      Alert.alert('错误', error.message || '登录失败');
    }
    setLoading(false);
  };

  // 邮箱登录
  const emailLogin = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('提示', '请输入正确的邮箱格式');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.emailLogin(email, password);
      if (res.success) {
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (error) {
      Alert.alert('错误', error.message || '登录失败');
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
          <Text style={styles.title}>AI应用开发平台</Text>
          <Text style={styles.subtitle}>手机端一站式开发工具</Text>

          {/* 登录方式切换 */}
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'phone' && styles.tabActive]}
              onPress={() => setLoginMethod('phone')}
            >
              <Text style={[styles.tabText, loginMethod === 'phone' && styles.tabTextActive]}>
                手机号登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'email' && styles.tabActive]}
              onPress={() => setLoginMethod('email')}
            >
              <Text style={[styles.tabText, loginMethod === 'email' && styles.tabTextActive]}>
                邮箱登录
              </Text>
            </TouchableOpacity>
          </View>

          {loginMethod === 'phone' ? (
            // 手机号登录
            step === 'phone' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={sendCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? '发送中...' : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.hint}>验证码已发送至 {phone}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入验证码"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={phoneLogin}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? '登录中...' : '登录'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resend}
                  onPress={sendCode}
                  disabled={countdown > 0 || loading}
                >
                  <Text style={countdown > 0 ? styles.resendDisabled : styles.resendText}>
                    {countdown > 0 ? `${countdown}秒后重发` : '重新发送验证码'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep('phone')}
                >
                  <Text style={styles.backText}>返回重新输入手机号</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
            // 邮箱登录
            <>
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={emailLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? '登录中...' : '登录'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* 注册链接 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>立即注册</Text>
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
  methodTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
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
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
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
