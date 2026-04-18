import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://your-api-domain.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// 请求拦截器
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    } catch (e) {}
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('user-storage');
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证API
export const authAPI = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  login: (phone, code) => api.post('/auth/login', { phone, code }),
  wechatLogin: (code) => api.post('/auth/wechat-login', { code }),
};

// 用户API
export const userAPI = {
  getInfo: () => api.get('/user/info'),
  updateInfo: (data) => api.put('/user/info', data),
  getMembership: () => api.get('/user/membership'),
  getAIConfigs: () => api.get('/user/ai-configs'),
  addAIConfig: (data) => api.post('/user/ai-configs', data),
  updateAIConfig: (id, data) => api.put(`/user/ai-configs/${id}`, data),
  deleteAIConfig: (id) => api.delete(`/user/ai-configs/${id}`),
};

// 项目API
export const projectAPI = {
  getList: (page = 1, size = 20) => api.get('/project/list', { params: { page, size } }),
  getDetail: (id) => api.get(`/project/${id}`),
  create: (data) => api.post('/project/create', data),
  update: (id, data) => api.put(`/project/${id}`, data),
  delete: (id) => api.delete(`/project/${id}`),
  copy: (id) => api.post(`/project/${id}/copy`),
};

// AI API
export const aiAPI = {
  chat: (messages, configId) => api.post('/ai/chat', { messages, config_id: configId }),
  generatePage: (description, configId) => api.post('/ai/generate-page', { description, config_id: configId }),
  generateComponent: (type, description, configId) => api.post('/ai/generate-component', { type, description, config_id: configId }),
  testConfig: (data) => api.post('/ai/test-config', data),
};

// 构建API
export const buildAPI = {
  submit: (data) => api.post('/build/submit', data),
  getStatus: (taskId) => api.get(`/build/status/${taskId}`),
  getHistory: (page = 1) => api.get('/build/history', { params: { page } }),
  download: (taskId) => api.get(`/build/download/${taskId}`),
  cancel: (taskId) => api.post(`/build/cancel/${taskId}`),
};

// 支付API
export const paymentAPI = {
  getPackages: () => api.get('/payment/packages'),
  createOrder: (packageId, payMethod) => api.post('/payment/create-order', { package_id: packageId, pay_method: payMethod }),
  getOrderStatus: (orderNo) => api.get(`/payment/order/${orderNo}`),
  getOrders: () => api.get('/payment/orders'),
};

// 模板API
export const templateAPI = {
  getList: (category) => api.get('/template/list', { params: { category } }),
  getDetail: (id) => api.get(`/template/${id}`),
  use: (id, name) => api.post(`/template/${id}/use`, { name }),
};

export default api;
