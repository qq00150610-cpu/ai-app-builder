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
          Alert.alert('开发模式', '验证码: ' + res.dev_code);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 顶部渐变背景 */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🤖</Text>
            </View>
            <Text style={styles.title}>AI应用开发平台</Text>
            <Text style={styles.subtitle}>手机端一站式开发工具</Text>
          </View>
        </View>

        {/* 登录表单 */}
        <View style={styles.formContainer}>
          {/* 登录方式切换 */}
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'phone' && styles.tabActive]}
              onPress={() => setLoginMethod('phone')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, loginMethod === 'phone' && styles.tabTextActive]}>
                📱 手机号登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'email' && styles.tabActive]}
              onPress={() => setLoginMethod('email')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, loginMethod === 'email' && styles.tabTextActive]}>
                ✉️ 邮箱登录
              </Text>
            </TouchableOpacity>
          </View>

          {loginMethod === 'phone' ? (
            // 手机号登录
            step === 'phone' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>手机号</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=请输入11位手机号
                    keyboardType=phone-pad
                    maxLength={11}
                    value={phone}
                    onChangeText={setPhone}
                    placeholderTextColor=#ccc
                  />
                </View>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={sendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {loading ? '发送中...' : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.hintContainer}>
                  <Text style={styles.hintText}>验证码已发送至 {phone}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>验证码</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=请输入6位验证码
                    keyboardType=number-pad
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    placeholderTextColor=#ccc
                  />
                </View>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={phoneLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {loading ? '登录中...' : '登录'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resend}
                  onPress={sendCode}
                  disabled={countdown > 0 || loading}
                  activeOpacity={0.8}
                >
                  <Text style={countdown > 0 ? styles.resendDisabled : styles.resendText}>
                    {countdown > 0 ? '重新发送 (' + countdown + 's)' : '重新发送验证码'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep('phone')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backText}>← 返回重新输入手机号</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
            // 邮箱登录
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder=请输入邮箱地址
                  keyboardType=email-address
                  autoCapitalize=none
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor=#ccc
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder=请输入密码
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor=#ccc
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={emailLogin}
                disabled={loading}
                activeOpacity={0.8}
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
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.linkText}>立即注册 →</Text>
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
    backgroundColor: '#F8F9FE',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  formContainer: {
    padding: 24,
    paddingTop: 30,
  },
  methodTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  button: {
    height: 52,
    backgroundColor: '#667eea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
  },
  resend: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
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
    color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
  },
  linkText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
