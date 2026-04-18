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
} from 'react-native';
import { authAPI } from '../services/api';
import { useUserStore } from '../services/store';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // phone | code
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { setToken, setUser } = useUserStore();

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendCode(phone);
      setStep('code');
      
      // 倒计时
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
    } catch (error) {
      Alert.alert('错误', error.message || '发送失败');
    }
    setLoading(false);
  };

  const login = async () => {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>AI应用开发平台</Text>
        <Text style={styles.subtitle}>手机端一站式开发工具</Text>

        {step === 'phone' ? (
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
              onPress={login}
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
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 48,
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
});
